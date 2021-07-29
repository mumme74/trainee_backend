import dotenv from "dotenv";
dotenv.config();
import passport from "passport";
import { Request, Response, NextFunction } from "express";
import { Strategy as JwtStrategy } from "passport-jwt";
import { ExtractJwt } from "passport-jwt";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-verify-token";

import User, { rolesAvailable } from "./models/usersModel";
import { AuthRequest } from "./types";
import { passAsSuperAdmin, passAsTeacher } from "./helpers/escalateRoles";
import { UserError } from "./helpers/errorHelpers";
import { errorResponse } from "./helpers/errorHelpers";

const userUrl = `${process.env.PROTOCOL}//${process.env.HOST}:${process.env.PORT}/users`;

// JSON web token strategy
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromHeader("authorization"),
      secretOrKey: process.env.JWT_SECRET,
    },
    async (payload: any, done: Function) => {
      try {
        // find the user specified in token
        const user = await User.findById(payload.sub);

        // if user doesn't exist, handle it
        if (!user) {
          return done(401, false, "User does not exist");
        } else if (user.banned) {
          return done(403, false, "User is banned");
        }

        // Otherwise, return the user
        done(null, user, "User found");
      } catch (err) {
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
    async (login: string, password: string, done: Function) => {
      try {
        // find the user given  the email
        const user = await User.findOne({
          $or: [{ email: login }, { userName: login }],
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
        if (!isMatch) {
          return done(403, false, "Password incorrect");
        }

        // update last login
        user.lastLogin = new Date();
        await user.save();

        // otherwise return the user
        done(null, user, "User found");
      } catch (err) {
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
      done: Function,
    ) => {
      //console.log(parsedToken);
      //console.log(googleId);

      try {
        const auds: [string] = Array.isArray(parsedToken.aud)
          ? parsedToken.aud
          : [parsedToken.aud];
        if (!auds.find((aud) => aud === process.env.GOOGLE_CLIENT_ID))
          throw new UserError("Wrong google OAuth clientId!");

        // we need to make exp from millisconds since epoch to minutes
        const expiresAt =
          Math.floor(parsedToken.exp / 60) -
          Math.floor(new Date().getTime() / 60000);
        if (expiresAt < 0)
          throw new UserError(
            "Expiration date was already passed on google token",
          );

        (req as AuthRequest).tokenExpiresIn = expiresAt;

        // find, update or create a new one
        const email = parsedToken.email_verified ? parsedToken.email : null;
        if (!email) throw new UserError("Not a verified google email!");
        const user = await User.findOneAndUpdate(
          { "google.id": googleId },
          {
            method: "google",
            firstName: parsedToken.given_name,
            lastName: parsedToken.family_name,
            userName: email.substr(0, email.indexOf("@")),
            email: email,
            picture: parsedToken.picture,
            domain: parsedToken.hd,
            google: {
              id: parsedToken.sub,
            },
            lastLogin: new Date(),
          },
          { returnOriginal: false, new: true, upsert: true },
        );

        if (user.banned) {
          return done(403, false, "User is banned");
        }

        // a new record would probably have the same time in create and update timestamps
        if (
          Math.floor(user.createdAt.getTime() / 1000) ===
          Math.floor(user.updatedAt.getTime() / 1000)
        ) {
          // check if user is a teacher
          if (passAsTeacher(user)) {
            user.roles.push(rolesAvailable.teacher);
            // a super admin?
            if (passAsSuperAdmin(user)) {
              user.roles.push(rolesAvailable.super);
            }
            const res = await User.updateOne(
              { _id: user._id },
              { roles: user.roles },
            );
            if (!res || res.n !== 1 || res.ok !== 1 || res.nModified !== 1)
              throw new UserError(
                "Could not save escalated roles when creating user",
              );
          }
        }

        return done(null, user);
      } catch (err) {
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
