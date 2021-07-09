import  JWT  from "jsonwebtoken";
import { OAuth2Client }  from "google-auth-library";
import { Request, Response, NextFunction} from 'express';

import User from "../models/user";

import {IUser, AuthRequest, AuthResponse} from "../types";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


const signToken = (user: IUser, expiresInMinutes: number = 60*8): string => {
  return JWT.sign(
    {
      iss: "node_authentication",
      sub: user.id,
      iat: new Date().getTime(),
      exp: new Date().setDate(new Date().getSeconds() + expiresInMinutes),
    },
    process.env.JWT_SECRET+""
  );
};

const userInfoResponse = (user:IUser) => {
  return {
    userName: user.userName,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    picture: user.picture,
    googleId: user.google.id
  }
}

const loginResponse = (token: string, user:IUser) => {
  return {
    'access_token': token,
    user: userInfoResponse(user)
  }
}



// exports down here
const UsersController = {
  signup: async (req: Request, res: Response, next: NextFunction) => {
    const authReq = (req as AuthRequest)
    const { email, password, userName, firstName, lastName } = authReq.value.body;

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

  login: async (req: Request, res: Response, next: NextFunction) => {
    const authReq = (req as AuthRequest)
    // generate token
    const token = signToken(authReq.user);
    return res.status(200).json(loginResponse(token, authReq.user));
  },

  googleOAuthOk: async (req: Request, res: Response, next: NextFunction) => {
    const authReq = (req as AuthRequest)
    // login succeded from google oauth
    // generate token
    console.log("req.user", authReq.user);

    const token = signToken(authReq.user, authReq.tokenExpiresIn);
    return res.status(200).json(loginResponse(token, authReq.user));
  },

  myInfo: (req: Request, res: Response) => {
    const authReq = (req as AuthRequest)
    return res.status(200).json(userInfoResponse(authReq.user));
  },

  secret: async (req: Request, res: Response, next: NextFunction) => {
    const authReq = (req as AuthRequest)
    console.log("Accessing secret resource");
    return res.json({ secret: "Access granted to secret resource!" });
  },
};

export default UsersController;
