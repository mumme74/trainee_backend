import JWT from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import {
  Request,
  Response,
  NextFunction,
  RequestHandler
} from "express";


import { comparePasswordHash } from "../helpers/password";
import {
  eRolesAvailable,
  rolesAvailableKeys
} from "../models/old_mongo/usersModel";
import { User } from "../models/user";
import { Role } from "../models/role";
import { Op } from "sequelize";

import type { IUserInfoResponse, AuthRequest } from "../types";
import { UserError, errorResponse } from "../helpers/errorHelpers";

interface IUsersController {
  signup: RequestHandler;
  login: RequestHandler;
  googleOAuthOk: RequestHandler;
  myInfo: RequestHandler;
  saveMyUserInfo: RequestHandler;
  changeMyPassword: RequestHandler;
  deleteMyself: RequestHandler;
  rolesAvailable: RequestHandler;
  secret: RequestHandler;
}
export type { IUsersController };

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const USER_NOT_FOUND = "User not found!";

const signToken = async (
  user: User,
  method: string,
  expiresInMinutes: number = 60 * 8
): Promise<string> => {
  return JWT.sign(
    {
      iss: process.env.APP_NAME,
      sub: user.id,
      iat: Math.floor(new Date().getTime() / 1000), // need to be seconds not milliseconds
      exp: Math.floor(
        new Date(new Date().getTime() + expiresInMinutes * 60000).getTime() /
          1000,
      ),
      roles: await user.roles(),
      method
    },
    process.env.JWT_SECRET + "",
  );
};

const userInfoResponse = async (user: User): Promise<IUserInfoResponse> => {
  return {
    id: user.id,
    userName: user.userName,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    pictureId: user.pictureId,
    domain: await user.domain(),
    updatedBy: user.updatedBy,
    lastLogin: user.lastLogin,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

const loginResponse = async (token: string, user: User) => {
  return {
    success: true,
    access_token: token,
    user: await userInfoResponse(user),
  };
};

// exports down here
const UsersController: IUsersController = {
  signup: async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;
    const { email, password, userName, firstName, lastName } =
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
      roles: [eRolesAvailable.student],
    });
    if (!newUser)
      throw new UserError('Failed to create new user');

    const role = await Role.create({
      userId: newUser.id,
      role: eRolesAvailable.student
    });

    // generate new token
    const token = await signToken(newUser, 'local');

    // respond with token
    return res.status(200).json(await loginResponse(token, newUser));
  },

  // if we get here we are authenticated by previous middleware
  login: async (req: Request, res: Response, next: NextFunction) => {
    const authObj = (req as AuthRequest).user;
    // generate token
    const token = await signToken(authObj.user, 'local');
    return res.status(200).json(await loginResponse(token, authObj.user));
  },

  googleOAuthOk: async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest,
          authObj = authReq.user;
    // login succeded from google oauth
    // generate token
    //console.log("req.user", authReq.user);

    const token = await signToken(authObj.user, 'google', authReq.tokenExpiresIn);
    return res.status(200).json(await loginResponse(token, authObj.user));
  },

  myInfo: async (req: Request, res: Response, next: NextFunction) => {
    const authObj = (req as AuthRequest).user;
    return res.status(200).json(await userInfoResponse(authObj.user));
  },

  saveMyUserInfo: async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest,
          authObj = authReq.user;
    let user = await User.findByPk(authObj.user.id);
    if (!user)
      return res.status(404).json(errorResponse(USER_NOT_FOUND));

    user.firstName = authReq.body.firstName;
    user.lastName = authReq.body.lastName;
    user.email = authReq.body.email;
    user.updatedBy = authReq.body.id;
    user = await user.save();

    if (user)
      return res.status(500).json(errorResponse('Error saving user to database'));

    return res.status(200).json(await userInfoResponse(user));
  },

  changeMyPassword: async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest,
          authObj = authReq.user
    // we can't use findAndUpdate here as that doesn't hash the password
    let user = await User.findByPk(authObj.user.id);
    if (!user)
      return res.status(404).json(errorResponse(USER_NOT_FOUND));

    user.password = authReq.body.password;
    user.updatedBy = authObj.user.id;
    user = await user.save();
    if (!user)
      return res.status(500).json(errorResponse('Error saving password to database'))
    return res.status(200).json({ success: true });
  },

  secret: async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;
    //console.log("Accessing secret resource");
    return res.json({ secret: "Access granted to secret resource!" });
  },

  // we must send our firstName, lastName and email and password just as it is stored in the database
  deleteMyself: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthRequest,
            authObj = authReq.user,
            user = authObj.user;
      console.log("Trying to delete user " + user.email);

      const passWdMatch = await comparePasswordHash(
        authReq.body.password + "",
        user.password + "",
      );

      if (passWdMatch) {
        const result = await User.destroy({
          where: {
            [Op.and]: [
              {id: user.id},
              {email: user.email},
              {userName: user.userName},
              {firstName: user.firstName},
              {lastName: user.lastName}
            ]
          }
        });
        if (result === 1) {
          console.log("Deleting user " + user.email);
          return res.status(200).json({ success: true });
        }
      }
      console.log("Failed to delete");
      return res.status(400).json(errorResponse("Missmatched info!"));
    } catch (err: any) {
      console.log("Failed to delete, error occured");
      return res.status(500).json(errorResponse(err));
    }
  },

  rolesAvailable: (req: Request, res: Response, next: NextFunction) => {
    return res.status(200).json({ roles: rolesAvailableKeys });
  },
};

export default UsersController;
