import * as core from "express-serve-static-core";
import express from "express";

import type { IUserDocument } from "./models/usersModel";

export interface IUserInfoResponse {
  id: IUserDocument["id"];
  method: IUserDocument["method"];
  userName: IUserDocument["userName"];
  email: IUserDocument["email"];
  firstName: IUserDocument["firstName"];
  lastName: IUserDocument["lastName"];
  picture: IUserDocument["picture"];
  googleId?: string; //IUserDocument["google"]["id"];
  domain: IUserDocument["domain"];
  updatedBy: IUserDocument["updatedBy"];
  lastLogin: IUserDocument["lastLogin"];
  banned?: IUserDocument["banned"];
  createdAt: IUserDocument["createdAt"];
  updatedAt: IUserDocument["updatedAt"];
}

// extended express types
/*
export interface Query extends core.Query { }

export interface Params extends core.ParamsDictionary { }

export interface AuthRequest<ReqBody = any, ReqQuery = Query, URLParams extends Params = core.ParamsDictionary>
  extends express.Request<URLParams, any, ReqBody, ReqQuery> {
    value: {
      body?: any
    },
    user: IUser,
    tokenExpiresIn?: number // seconds until it expires
};*/

export interface AuthRequest extends express.Request {
  value: {
    body?: any;
  };
  user: IUserDocument;
  tokenExpiresIn?: number; // seconds until it expires
}

export type AuthResponse = express.Response;
