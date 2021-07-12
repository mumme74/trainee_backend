import dotenv from "dotenv"
dotenv.config();
import passport from "passport";
import {Strategy as JwtStrategy } from "passport-jwt";
import { ExtractJwt } from "passport-jwt";
import {Strategy as LocalStrategy } from "passport-local";
import {Strategy as GoogleStrategy } from "passport-google-verify-token";

import User from "./models/user";
import { AuthRequest } from "./types";

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
          return done(null, false, "User does not exist");
        }

        // Otherwise, return the user
        done(null, user, "User found");
      } catch (err) {
        done(err, false, err.message);
      }
    }
  )
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
          return done(null, false, "User does not exist");
        }

        // check is the password is correct
        const isMatch = await user.isValidPassword(password);

        // if not, handle it
        if (!isMatch) {
          return done(null, false, "Password incorrect");
        }

        // otherwise return the user
        done(null, user, "User found");
      } catch (err) {
        done(err, false, err.message);
      }
    }
  )
);

// google stategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      passReqToCallback: true,
    },
    async (req: Express.Request, parsedToken: any , googleId: string, done: Function) => {
      //console.log(parsedToken);
      //console.log(googleId);

      try {
        const auds: [string] = Array.isArray(parsedToken.aud) ? parsedToken.aud : [parsedToken.aud];
        if (!auds.find((aud) => aud === process.env.GOOGLE_CLIENT_ID))
          throw new Error("Wrong google OAuth clientId!");

        // we need to make exp from millisconds since epoch to minutes
        const expiresAt = Math.floor(parsedToken.exp / 60) - Math.floor(new Date().getTime() / 60000);
        if (expiresAt < 0)
         throw new Error("Expiration date was already passed on google token");

        (req as AuthRequest).tokenExpiresIn = expiresAt;

        // find, update or create a new one
        const email = parsedToken.email_verified ? parsedToken.email : null;
        if (!email) throw new Error("Not a verified google email!");
        const newUser = await User.findOneAndUpdate(
          { "google.id": googleId },
          {
            method: "google",
            firstName: parsedToken.given_name,
            lastName: parsedToken.family_name,
            userName: email.substr(0, email.indexOf("@")),
            email: email,
            picture: parsedToken.picture,
            google: {
              id: parsedToken.sub,
              hd: parsedToken.hd,
            },
          },
          { returnOriginal: false, new: true, upsert: true }
        );

        return done(null, newUser);
      } catch (err) {
        console.log(err.message);
        return done(err, false, err.message);
      }
    }
  )
);
