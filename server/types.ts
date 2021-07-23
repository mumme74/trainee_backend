import * as core from "express-serve-static-core";
import express from "express";


import type { IUserCollection } from "./models/user"


export interface IUserInfoResponse {
  id: IUserCollection["id"];
  method: IUserCollection["method"];
  userName: IUserCollection["userName"];
  email: IUserCollection["email"];
  firstName: IUserCollection["firstName"];
  lastName: IUserCollection["lastName"];
  picture: IUserCollection["picture"];
  googleId?: IUserCollection["google"]["id"];
  domain: IUserCollection["domain"];
  updatedBy: IUserCollection["updatedBy"];
  lastLogin: IUserCollection["lastLogin"];
  createdAt: IUserCollection["createdAt"];
  updatedAt: IUserCollection["updatedAt"];
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
      body?: any
    },
    user: IUserCollection,
    tokenExpiresIn?: number // seconds until it expires
  };

export interface AuthResponse extends express.Response {};