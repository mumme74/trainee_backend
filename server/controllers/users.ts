import JWT from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { Request, Response, NextFunction, RequestHandler } from "express";

import User, {
  comparePasswordHash,
  IUserDocument,
  rolesAvailable,
  rolesAvailableKeys,
} from "../models/usersModel";
import mongoose from "mongoose";

import type { IUserInfoResponse, AuthRequest, AuthResponse } from "../types";
import { errorResponse } from "../helpers/errorHelpers";

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
const ObjectId = mongoose.Types.ObjectId;

const USER_NOT_FOUND = "User not found!";

const signToken = (
  user: IUserDocument,
  expiresInMinutes: number = 60 * 8,
): string => {
  return JWT.sign(
    {
      iss: process.env.APP_NAME,
      sub: user.id,
      iat: Math.floor(new Date().getTime() / 1000), // need to be seconds not milliseconds
      exp: Math.floor(
        new Date(new Date().getTime() + expiresInMinutes * 60000).getTime() /
          1000,
      ),
      roles: user.roles.map((role) => {
        return rolesAvailableKeys[role];
      }),
    },
    process.env.JWT_SECRET + "",
  );
};

const userInfoResponse = (user: IUserDocument): IUserInfoResponse => {
  return {
    id: user.id,
    method: user.method,
    userName: user.userName,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    picture: user.picture,
    googleId: user?.google?.id,
    domain: user.domain,
    updatedBy: user.updatedBy,
    lastLogin: user.lastLogin,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

const loginResponse = (token: string, user: IUserDocument) => {
  return {
    success: true,
    access_token: token,
    user: userInfoResponse(user),
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
      $or: [{ email: email }, { userName: userName }],
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
    const newUser = new User({
      method: "local",
      email,
      password,
      userName,
      firstName,
      lastName,
      domain: "",
      roles: [rolesAvailable.student],
    });
    await newUser.save();

    // generate new token
    const token = signToken(newUser);

    // respond with token
    return res.status(200).json(loginResponse(token, newUser));
  },

  // if we get here we are authenticated by previous middleware
  login: async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;
    // generate token
    const token = signToken(authReq.user);
    return res.status(200).json(loginResponse(token, authReq.user));
  },

  googleOAuthOk: async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;
    // login succeded from google oauth
    // generate token
    //console.log("req.user", authReq.user);

    const token = signToken(authReq.user, authReq.tokenExpiresIn);
    return res.status(200).json(loginResponse(token, authReq.user));
  },

  myInfo: (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;
    return res.status(200).json(userInfoResponse(authReq.user));
  },

  saveMyUserInfo: async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;
    const user = await User.findOneAndUpdate(
      { _id: new ObjectId(authReq.user.id) },
      {
        firstName: authReq.body.firstName,
        lastName: authReq.body.lastName,
        email: authReq.body.email,
        picture: authReq.body.picture,
        updatedBy: authReq.user.id,
      },
      { returnOriginal: false, new: true },
    );
    if (!user) {
      return res.status(404).json(errorResponse(USER_NOT_FOUND));
    }
    return res.status(200).json(userInfoResponse(user));
  },

  changeMyPassword: async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;
    // we can't use findAndUpdate here as that doesn't hash the password
    const user = await User.findById(authReq.user.id);
    if (!user) return res.status(404).json(errorResponse(USER_NOT_FOUND));

    user.password = authReq.body.password;
    user.updatedBy = authReq.user.id;
    await user.save();
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
      const authReq = req as AuthRequest;
      console.log("Trying to delete user " + authReq.user.email);

      const passWdMatch = await comparePasswordHash(
        authReq.body.password + "",
        authReq.user.password + "",
      );

      if (passWdMatch) {
        const result = await User.deleteOne({
          _id: new ObjectId(authReq.user.id),
          email: authReq.body.email,
          userName: authReq.body.userName,
          firstName: authReq.body.firstName,
          lastName: authReq.body.lastName,
        });
        if (result.n === 1 && result.ok === 1 && result.deletedCount === 1) {
          console.log("Deleting user " + authReq.user.email);
          return res.status(200).json({ success: true });
        }
      }
      console.log("Failed to delete");
      return res.status(400).json(errorResponse("Missmatched info!"));
    } catch (e) {
      console.log("Failed to delete, error occured");
      return res.status(500).json(errorResponse(e));
    }
  },

  rolesAvailable: (req: Request, res: Response, next: NextFunction) => {
    return res.status(200).json({ roles: rolesAvailableKeys });
  },
};

export default UsersController;
