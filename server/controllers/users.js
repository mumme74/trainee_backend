const JWT = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/user");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


const signToken = (user, expiresInMinutes = 60*8) => {
  return JWT.sign(
    {
      iss: "node_authentication",
      sub: user.id,
      iat: new Date().getTime(),
      exp: new Date().setDate(new Date().getSeconds() + expiresInMinutes),
    },
    process.env.JWT_SECRET
  );
};

const userInfoResponse = (user) => {
  return {
    userName: user.userName,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    picture: user.picture,
    googleId: user.google.id
  }
}

const loginResponse = (token, user) => {
  return {
    'access_token': token,
    user: userInfoResponse(user)
  }
}

module.exports = {
  signup: async (req, res, next) => {
    const { email, password, userName, firstName, lastName } = req.value.body;

    //check if there is a user with same email
    const foundUser = await User.findOne({ email: email });
    if (foundUser) {
      return res.status(403).json({ error: "email already in use" });
    }

    // create a new user
    const newUser = new User({
      method: "local",
      email,
      password,
      userName,
      firstName,
      lastName,
    });
    await newUser.save();

    // generate new token
    const token = signToken(newUser);

    // respond with token
    return res.status(200).json(loginResponse(token, newUser));
  },

  login: async (req, res, next) => {
    // generate token
    const token = signToken(req.user);
    return res.status(200).json(loginResponse(token, req.user));
  },

  googleOAuthOk: async (req, res, next) => {
    // login succeded from google oauth
    // generate token
    console.log("req.user", req.user);

    const token = signToken(req.user, req.expires);
    return res.status(200).json(loginResponse(token, req.user));
  },

  googleOAuthFail: async (req, res, next) => {
    console.log("Google OAuth failure called");
    res.json({ isloggedIn: false, fail: true });
  },

  googleOAuthAuthenticate: async (req, res, next) => {
    const { token } = req.body;
    if (!token) {
      return res.status(400).send('Bad Request')
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    console.log(payload);

    // check aud that it matches our clientid
    const auds = Array.isArray(payload.aud) ? aud : [aud];

    if (!auds.find(aud=>aud===process.env.GOOGLE_CLIENT_ID)) {
      return res.status(401).send('Unauthorized')
    }

    if (!payload.email_verified) {
      return res.status(403).send('Email not verified')
    }



    const user = null;

    // const { name, email, picture } = payload;
    // const user = await db.user.upsert({
    //   where: { email: email },
    //   update: { name, picture },
    //   create: { name, email, picture },
    // });
    res.status(201);
    res.json(user);
  },

  facebookOAuth: async (req, res, next) => {
    console.log("Facebook callback called");

    const token = signToken(req.user);
    return res.status(200).json({ access_token: token });
  },

  myInfo: (req, res) => {
    return res.status(200).json(userInfoResponse(req.user));
  },

  secret: async (req, res, next) => {
    console.log("Accessing secret resource");
    return res.json({ secret: "Access granted to secret resource!" });
  },
};
