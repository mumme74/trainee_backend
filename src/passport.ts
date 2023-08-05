import dotenv from "dotenv";
dotenv.config();
import passport from "passport";
import { Request, Response, NextFunction } from "express";
import * as HttpError from "http-errors"
import { Strategy as JwtStrategy } from "passport-jwt";
import { ExtractJwt } from "passport-jwt";
import { Strategy as LocalStrategy} from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-verify-token";
import { VerifiedCallback } from "passport-jwt";

import { User } from "./models/core_user";
import { eRolesAvailable } from "./models/core_role";
import { AuthRequest } from "./types";
import { passAsSuperAdmin, passAsTeacher } from "./helpers/escalateRoles";
import { UserError } from "./helpers/errorHelpers";
import { errorResponse } from "./helpers/errorHelpers";
import { Op } from "sequelize";
import { Role } from "./models/core_role";
import { OAuth } from "./models/core_oauth";
import { Organization } from "./models/core_organization";
import { Picture } from "./models/core_picture";
import { Login, eLoginState } from "./models/core_login";

const userUrl = `${process.env.PROTOCOL}//${process.env.HOST}:${process.env.PORT}/users`;

// JSON web token strategy, sort of a router to correct strategy
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromHeader("authorization"),
      secretOrKey: process.env.JWT_SECRET,
    },
    async (payload: any, done: VerifiedCallback) => {
      try {
        // find the user specified in token
        const user = await User.findByPk(payload.sub);

        // if user doesn't exist, handle it
        if (!user) {
          return done(new HttpError[401]("User does not exist"));
        } else if (user.banned) {
          return done(new HttpError[403]("User is banned"));
        } else {
          // Otherwise, return the user
          return done(null, user, "User found");
        }

      } catch (err: any) {
        return done(err, false, err.message);
      }
    },
  ),
);

// local strategy, login via password
passport.use(
  new LocalStrategy(
    {
      usernameField: "login", // change default behavior and listen to email first
    },
    async (login: string, password: string, done: VerifiedCallback) => {
      try {
        // find the user given  the email
        const user = await User.findOne({
          where: {
            [Op.or]: [
              {email: login},
              {userName:login}
            ]
          }
        });

        //console.log(user, login);

        // if not, handle it
        if (!user) {
          // can't log when there is no user
          done(new HttpError[401]('User does not exist'));

        } else if (await checkLoginSpam(user)) {
          await logLogin(eLoginState.LoginSpam, user);
          return done(new HttpError[429]("Too many attempts, wait 10 minutes"));

        } else if (user.banned) {
          await logLogin(eLoginState.UserBanned, user);
          done(new HttpError[403]("User is banned"));

        } else {
          // check is the password is correct
          const isMatch = await user.isValidPassword(password);

          // if not, handle it
          if (!isMatch) {
            await logLogin(eLoginState.WrongPassword, user);
            done(new HttpError[403]('Password incorrect'))
          } else {
            // update last login
            user.lastLogin = new Date();
            await user.save();

            await logLogin(eLoginState.PasswdLoginOk, user);

            // otherwise return the user
            done(null, {user, roles:[],oauth:null,pic:null}, "User found");
          }
        }

      } catch (err: any) {
        done(err, false, err.message);
      }
    },
  ),
);

// google strategy, login via google oauth2
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      passReqToCallback: true,
    },
    async (
      req: Express.Request,
      parsedToken: any,
      googleId: string,
      done: VerifiedCallback,
    ) => {
      //console.log(parsedToken);
      //console.log(googleId);

      try {
        if (!parsedToken.email_verified)
          throw new UserError("Not a verified email in oath token!");

        // find the user
        const email = parsedToken.email,
              provider = parsedToken.name.toLowerCase();
        let {user, oauth} = await findUserAndOAuth(
          email,provider, parsedToken.sub);

        if (user && await checkLoginSpam(user)) {
          await logLogin(eLoginState.LoginSpam, user, oauth);
          return done(new HttpError[429]("Too many attempts, wait 10 minutes"));
        }

        // checks
        if (!validateAud(parsedToken)) {
          await logLogin(eLoginState.OAuthFailAud, user, oauth);
          throw new UserError("Wrong OAuth clientId!");
        }
        const expiresAt = validateExpiration(parsedToken);
        if (expiresAt === null) {
          logLogin(eLoginState.OAuthTokenExpired, user, oauth);
          throw new UserError(
            "Expiration date was already passed on oauth token");
          }
        (req as AuthRequest).tokenExpiresIn = expiresAt;

        // done with validation,find user

        // if not found create user and oauth entry
        if (!user)
          user = await createNewUserFromOAuth(parsedToken);
        if (!oauth)
          oauth = await createOAuth(user.id, provider, parsedToken.sub);
        // update user avatar?
        const userPic = await checkUserPic(user, parsedToken);

        if (user.banned) {
          logLogin(eLoginState.UserBanned, user, oauth);
          done(new HttpError[403]("User is banned"));
        } else {
          logLogin(eLoginState.OAuthLoginOk, user, oauth);
          done(null, {user, roles:[], oauth, userPic});
        }
      } catch (err: any) {
        console.log(err.message);
        err.statusCode = 401;
        done(err, false, err.message);
      }
    },
  ),
);

export const passportLogin = passport.authenticate("local", {
  session: false,
});

export const passportGoogle = passport.authenticate("google-verify-token", {
  session: false,
});

const errResponseJson = JSON.stringify(errorResponse("Invalid token"))

// this is when we are logged in
export const passportJWT = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  return passport.authenticate(
    "jwt",
    {
      session: false,
      failureFlash: errResponseJson,
    },
    (err: any, user: any, info: any) => {
      if (HttpError.isHttpError(err))
        return next(err);
      else if (err || !user) {
        return next(new HttpError[401](
          err ? err.message: info || "Unauthenticated"));
      } else if (user?.banned) {
        return next(new HttpError[403]("User is banned"));
      }
      if (!req.user && user) {
        req.user = {
          user,roles:[],oauth:null,pic:null
        };
      }
      return next();
    },
  )(req, res, next);
};

const logLogin = (
  state: eLoginState, user: User | null, oauth?: OAuth | null
) => {
  if (user)
    return Login.create({
      state, userId:user.id, oauthId:oauth?.id || null})
}

async function checkLoginSpam(user: User) {
  // check if someone are trying to brute force
  const freshAttempts = await Login.count({
    where:{
      [Op.and]: [
        {userId:user?.id},
        // only count the last 10 minutes
        {createdAt:{
          [Op.gt]: new Date(new Date().getTime() - 10 * 60000)}
        }
      ]
    }
  });

  return freshAttempts > 9;
}

function validateAud(parsedToken: any){
  const audFields: [string] = Array.isArray(parsedToken.aud)
  ? parsedToken.aud
  : [parsedToken.aud];

  return audFields.find((aud) => aud === process.env.GOOGLE_CLIENT_ID);
}

function validateExpiration(parsedToken: any) {
  // we need to make exp from milliseconds since epoch to minutes
  const expiresAt =
    Math.floor(parsedToken.exp / 60) -
    Math.floor(new Date().getTime() / 60000);
  return (expiresAt < 0) ? null : expiresAt;
}

async function findUserAndOAuth(
  email:string,
  provider:string,
  idString:string
): Promise<{user: User|null, oauth: OAuth|null}> {
  let oauth = await OAuth.findOne({
    where: {
      [Op.and]: [
        {provider},{idString}
      ]
    }
  });

  let user = await User.findOne({
    where: {email}
  });

  return {oauth, user};
}

async function createNewUserFromOAuth(parsedToken: any):
  Promise<User>
{
  const organization = await Organization.findOne({
    where: { domain: parsedToken.hd }
  });

  const email = parsedToken.email;

  const user = await User.create({
    firstName: parsedToken.given_name,
    lastName: parsedToken.family_name,
    userName: email.substr(0, email.indexOf("@")),
    email: email,
    organizationId: organization?.id || null,
  });
  if (!user)
    throw new UserError('Failed to save new user from oauth');

  await addRolesToNewUser(user);

  return user;
}

async function createOAuth(
  userId: number,
  provider: string,
  idString: string
) {
  return await OAuth.create({
    userId,
    provider,
    idString,
  });
}

async function checkUserPic(user: User, parsedToken:any):
  Promise<Picture|null>
{
  let userPic = await user.getPicture();
  if (userPic?.mime==='remote') {
    if (userPic.blob.toString() !== parsedToken.picture){
      if (!parsedToken.picture)
        userPic.destroy();
      else
        userPic.blob = Buffer.from(parsedToken.picture);
      userPic.save();
    }
  } else if (!userPic) {
    userPic = await Picture.create({
      blob: Buffer.from(parsedToken.picture),
      mime: 'remote'
    });
    if (userPic) {
      user.pictureId = userPic.id;
      await user.save();
    }
  }
  return userPic;
}

async function addRolesToNewUser(user: User) {
  const roles = [eRolesAvailable.student];

  // check if user is a teacher
  if (await passAsTeacher(user)) {
    const roles = [eRolesAvailable.teacher];
    // a super admin?
    if (passAsSuperAdmin(user))
      roles.push(eRolesAvailable.super);
  }

  for (const role of roles){
    const record = await Role.create({
      userId: user.id, role
    });
    if (!record)
      throw new UserError(
        "Could not save roles when creating user");
  }
}
