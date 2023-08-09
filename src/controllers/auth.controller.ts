import { OAuth2Client } from "google-auth-library";
import {
  Request,
  Response,
  NextFunction,
  RequestHandler
} from "express";
import { Op } from "sequelize";
import crypto from "crypto";

import { AuthRequest } from "../types";
import { UserError, errorResponse } from "../helpers/errorHelpers";
import * as HttpError from "http-errors";
import { toUtcDate } from "../helpers/dbHelpers";
import * as tokens from "../services/token.service";
import { eAuthenticationMethod } from "../services/token.service";
import { userInfoResponse } from "./user.controller";
import { User } from "../models/core_user";
import {
  Role,
  eRolesAvailable,
  rolesAvailableKeys
} from "../models/core_role";
import { PasswordReset } from "../models/core_password_reset";
import { sendEmail } from "../services/email.service";
import { comparePasswordHash } from "../helpers/password";
import { getSequelize } from "../models";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export interface IAuthController {
  signup: RequestHandler;
  login: RequestHandler;
  logout: RequestHandler;
  refreshLogin: RequestHandler;
  invalidateUserTokens: RequestHandler;
  invalidateAllTokens : RequestHandler;
  requestPasswordReset: RequestHandler;
  setPasswordOnReset: RequestHandler;
  googleOAuthOk: RequestHandler;
};

const AuthController: IAuthController = {
  signup: async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;
    const { email, password, userName, firstName, lastName, phone } =
      authReq.value.body;

    //check if there is a user with same email
    const foundUser = await User.findOne({
      where: {
        [Op.or]: [
          {email},
          {userName}
        ]
      }
    });
    if (foundUser) {
      return res
        .status(403)
        .json(
          errorResponse(
            foundUser.email === email
              ? "email already in use"
              : "userName already in use",
          ),
        );
    }

    // create a new user
    const newUser = await User.create({
      email,
      password,
      userName,
      firstName,
      lastName,
      phone,
    });
    if (!newUser)
      throw new UserError('Failed to create new user');

    const role = await Role.create({
      userId: newUser.id,
      role: eRolesAvailable.student
    });

    // generate new token
    const refreshToken = await generateTokens(
      res,
      newUser.id,
      eAuthenticationMethod.Password,
      [rolesAvailableKeys[role.role]]
    );

    // respond with token
    return res
      .status(200)
      .json(await loginResponse(refreshToken, newUser));
  },

  // if we get here we are authenticated by previous middleware
  login: async (req: Request, res: Response, next: NextFunction) => {
    const authObj = (req as AuthRequest).user;
    // make old logins invalid
    tokens.rejectUserBeforeIat(authObj.user.id)

    // generate tokens
    const refreshToken = await generateTokens(
      res,
      authObj.user.id,
      eAuthenticationMethod.Password,
      await authObj.user.roles()
    );

    return res
      .status(200)
      .json(await loginResponse(refreshToken, authObj.user));
  },

  logout: (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;
    // clear cookies
    res.clearCookie('refresh_token');

    // reject all currently issued tokens for this user
    tokens.rejectUserBeforeIat(authReq.user.user.id);

    res.status(200).json({success:true});
  },

  /**
   * Call this to rotate refresh tokens
   */
  refreshLogin: async (req: Request, res: Response, next: NextFunction) => {
    const oldResetToken = req.cookies.refresh_token;
    if (!oldResetToken || oldResetToken.length < 32)
      throw new HttpError[400]('Bad reset token');

    if (!await tokens.validateReset(oldResetToken))
      throw new HttpError[401]('Invalid or expired refreshToken');

    const {refreshToken, authToken, user} = await
      tokens.rotateResetToken(oldResetToken);

    setResetTokenCookie(res, refreshToken);

    return res
      .status(200)
      .json(await loginResponse(authToken, user));
  },

  /**
   * Invalidate a single user
   * This user must re-login
   */
  invalidateUserTokens: async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.body.userId;
    if (!userId) throw new HttpError[400]('userId not given');
    await tokens.rejectUserBeforeIat(userId, new Date());
    const q = await getSequelize().query('SELECT * from core_InvalidateTokens WHERE userID=?',{replacements:[userId]})
    res.status(200).json({success:true});
  },

  /**
   * Invalidates all issued tokens
   * All users must re-login
   */
  invalidateAllTokens: async (req: Request, res: Response, next: NextFunction) => {
    await tokens.rejectGloballyBeforeIat(new Date());
    res.status(200).json({success:true});
  },

  /**
   * Call this to request a password reset
   */
  requestPasswordReset: async (req: Request, res:Response, next:NextFunction) => {
    const email = req.body.email;
    const user = await User.findOne({where: {email}});
    if (!user) throw new UserError(`User ${email} not found`);

    // check that we don't have an old pwResetToken laying around
    const oldToken = await PasswordReset.findOne({where:{userId:user.id}});
    if (oldToken) await oldToken.destroy();

    // gen new token
    const refreshToken = crypto.randomBytes(128).toString('base64');
    // sequelize hashes this token before save
    const reset = await PasswordReset.create({userId:user.id, refreshToken});

    const uriEnc = encodeURIComponent(refreshToken);

    const link = `${process.env.CORS_HOST}/passwordReset?token=${uriEnc}&id=${reset.id}`;
    const payload = {name:user.fullName(), link};
    const result = await sendEmail(
      user.email, 'Password reset',payload,'password.request.reset.pug');
    if (result !== true) {
      if (HttpError.isHttpError(result))
        return next(result);
      throw new HttpError[502](result+"");
    }

    return res.status(200).json({success:true});
  },

  /**
   * Call when we have password reset token and a new password
   */
  setPasswordOnReset: async (
    req: Request, res:Response, next:NextFunction
  ) => {
    const pwdReset = await PasswordReset.findOne({
      where:{[Op.and]:[
        {id:req.body.id},
        {createdAt: // 5min ago
          {[Op.gt]:(+new Date()) - 60000 * 5}
        }
      ]}
    });
    console.log((+new Date()) - 60000 * 5);

    if (!pwdReset)
      throw new HttpError[400]('Invalid or expired reset token');

    const reqToken = req.body.token;

    // tokens should never match, token must be set
    if (reqToken === pwdReset.refreshToken || !reqToken ||
        !await comparePasswordHash(req.body.token, pwdReset.refreshToken))
    {
      throw new HttpError[401]('Reset tokens mismatch');
    }

    // lookup user
    const user = await User.findByPk(pwdReset.userId);
    if (!user) throw new HttpError[403]('User not found');

    // save new password, destroy reset token
    user.password = req.body.password;
    await user.save();
    pwdReset.destroy();

    // notify user that their password has reset
    const result = await sendEmail(
      user.email, 'Password changed',
      {
        name: user.fullName(),
        host: process.env.CORS_HOST
      }, "password has changed.");
    if (result !== true){
      console.error(
        `Failed to mail ${user.email} when resetting password`);
    }

    return res.status(200).json({success:true});
  },

  googleOAuthOk: async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest,
          authObj = authReq.user;
    // login succeeded from google oauth
    // generate token
    //console.log("req.user", authReq.user);

    // generate tokens
    const token = await generateTokens(
      res,
      authObj.user.id,
      eAuthenticationMethod.GoogleOAuth,
      await authObj.user.roles()
    );

    // TODO refreshToken expire time
     // , authReq.tokenExpiresIn);
    return res
      .status(200)
      .json(await loginResponse(token, authObj.user));
  },
};

export default AuthController;


// --------------------------------------------------------
// private to this module

const loginResponse = async (token: string, user: User) => {
  return {
    success: true,
    access_token: token,
    user: await userInfoResponse(user),
  };
};

const setResetTokenCookie = (res: Response, token: string) => {
  res.cookie('refresh_token', token, {
    maxAge: (+(""+process.env.AUTO_LOGOUT_MINUTES) || 1) * 60 * 1000,
    secure: ['development', 'test'].indexOf(""+process.env.NODE_ENV) < 0,
    httpOnly: true, // client side javascript can't access
  });
}

/**
 * Generate new token pair, sets cookie
 * Don't use on refresh tokens
 * @returns authToken
 */
const generateTokens = async (
  res: Response, userId: number,
  method: eAuthenticationMethod,
  roles: string[],
) => {
  // set reject point to 1s before, to be sure all tokens before are invalid
  tokens.rejectUserBeforeIat(userId, new Date(+new Date() - 1));

  const authToken = await tokens.signAuth({
    userId:userId,
    roles, method,
  });
  const refreshToken = await tokens.signReset({
    userId, method,
    originalIss: ""+process.env.APP_NAME
  });

  setResetTokenCookie(res, refreshToken);

  return authToken;
}
