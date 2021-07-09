require("dotenv").config();
const passport = require("passport");
const JwtStrategy = require("passport-jwt").Strategy;
const { ExtractJwt } = require("passport-jwt");
const LocalStrategy = require("passport-local").Strategy;
const GoogleStrategy = require("passport-google-verify-token").Strategy;

const User = require("./models/user");

const port = process.env.PORT;
const host = process.env.HOST;
const protocol = process.env.PROTOCOL;
const userUrl = `${protocol}//${host}:${port}/users`;

// JSON web token strategy
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromHeader("authorization"),
      secretOrKey: process.env.JWT_SECRET,
    },
    async (payload, done) => {
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
        done(error, false, err.message);
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
    async (login, password, done) => {
      try {
        // find the user given  the email
        const user = await User.findOne({
          $or: [{ email: login }, { userName: login }],
        });

        console.log(user, login);

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
    },
    async (parsedToken, googleId, done) => {
      //console.log(parsedToken);
      //console.log(googleId);

      try {
        const auds = Array.isArray(parsedToken.aud) ? parsedToken.aud : [parsedToken.aud];
        if (!auds.find((aud) => aud === process.env.GOOGLE_CLIENT_ID))
          throw new Error("Wrong google OAuth clientId!");

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
          { returnOriginal: false, upsert: true }
        );

        return done(null, newUser);
      } catch (err) {
        console.log(err.message);
        return done(err, false, err.message);
      }
    }
  )
);
