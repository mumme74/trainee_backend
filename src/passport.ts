import dotenv from "dotenv";
dotenv.config();
import passport from "passport";
import { Request, Response, NextFunction } from "express";
import { Strategy as JwtStrategy } from "passport-jwt";
import { ExtractJwt } from "passport-jwt";
import { Strategy as LocalStrategy} from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-verify-token";
import { VerifiedCallback } from "passport-jwt";

import { User } from "./models/user";
import { eRolesAvailable } from "./models/role";
import { AuthRequest } from "./types";
import { passAsSuperAdmin, passAsTeacher } from "./helpers/escalateRoles";
import { UserError } from "./helpers/errorHelpers";
import { errorResponse } from "./helpers/errorHelpers";
import { Op } from "sequelize";
import { Role } from "./models/role";
import { OAuth } from "./models/oauth";
import { Organization } from "./models/organization";
import { Picture } from "./models/picture";

const userUrl = `${process.env.PROTOCOL}//${process.env.HOST}:${process.env.PORT}/users`;

// JSON web token strategy
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
          return done(401, false, "User does not exist");
        } else if (user.banned) {
          return done(403, false, "User is banned");
        }

        // Otherwise, return the user
        done(null, {user, roles:[], oauth:null, userPic:null}, "User found");
      } catch (err: any) {
        done(err, false, err.message);
      }
    },
  ),
);

// local stategy
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
          return done(401, false, "User does not exist");
        } else if (user.banned) {
          return done(403, false, "User is banned");
        }

        // check is the password is correct
        const isMatch = await user.isValidPassword(password);

        // if not, handle it
        if (!isMatch)
          return done(403, false, "Password incorrect");

        // update last login
        user.lastLogin = new Date();
        await user.save();

        // otherwise return the user
        done(null, {user, roles:[], oauth:null, userPic:null}, "User found");
      } catch (err: any) {
        done(err, false, err.message);
      }
    },
  ),
);

// google stategy
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
        // checks, throws if error
        validateAud(parsedToken);
        const expiresAt = validateExpiration(parsedToken);
        (req as AuthRequest).tokenExpiresIn = expiresAt;

        if (!parsedToken.email_verified)
          throw new UserError("Not a verified email in oath token!");

        // done with validation,find user
        const email = parsedToken.email,
              provider = parsedToken.name.toLowerCase();

        let {user, oauth} = await findUserAndOAuth(
          email,provider, parsedToken.sub);

        // if not found create user and oauth entry
        if (!user)
          user = await createNewUserFromOAuth(parsedToken);
        if (!oauth)
          oauth = await createOAuth(user.id, provider, parsedToken.sub);
        // update user avatar?
        const userPic = await checkUserPic(user, parsedToken);

        if (user.banned)
          return done(403, false, "User is banned");

        return done(null, {user, roles:[], oauth, userPic});
      } catch (err: any) {
        console.log(err.message);
        return done(err, false, err.message);
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

export const passportJWT = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  return passport.authenticate(
    "jwt",
    {
      session: false,
      failureFlash: JSON.stringify(errorResponse("Invalid token")),
    },
    (err: any, user: any, info: any) => {
      if (err || !user) {
        return res
          .status(!isNaN(err) && err ? err : 401)
          .json(errorResponse(info?.message || "Unauthenticated"));
      }
      if (!req.user && user) req.user = user;
      return next();
    },
  )(req, res, next);
};

function validateAud(parsedToken: any){
  const auds: [string] = Array.isArray(parsedToken.aud)
  ? parsedToken.aud
  : [parsedToken.aud];

  if (!auds.find((aud) => aud === process.env.GOOGLE_CLIENT_ID))
    throw new UserError("Wrong OAuth clientId!");
}

function validateExpiration(parsedToken: any) {
  // we need to make exp from millisconds since epoch to minutes
  const expiresAt =
    Math.floor(parsedToken.exp / 60) -
    Math.floor(new Date().getTime() / 60000);
  if (expiresAt < 0)
    throw new UserError(
      "Expiration date was already passed on oauth token",
    );
  return expiresAt;
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
