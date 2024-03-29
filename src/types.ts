import * as core from "express-serve-static-core";
import express from "express";
import { User } from "./models/core_user";
import { OAuth } from "./models/core_oauth";
import { Picture } from "./models/core_picture";
import { eRolesAvailable } from "./models/core_role";

/**
 * Response to client, current user's info
 */
export interface IUserInfoResponse {
  id:        User["id"];
  userName:  User["userName"];
  email:     User["email"];
  phone:     User["phone"];
  firstName: User["firstName"];
  lastName:  User["lastName"];
  pictureId: User["pictureId"];
  domain:    string | null;
  updatedBy: User["updatedBy"];
  lastLogin: User["lastLogin"];
  banned?:   User["banned"];
  createdAt: User["createdAt"];
  updatedAt: User["updatedAt"];
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

export interface AuthObject {
  user:    User,
  roles:   eRolesAvailable[],
  oauth:   OAuth | null,
  userPic: Picture | null;
}

/**
 * A authenticated request has this info
 */
export interface AuthRequest extends express.Request {
  value: {
    body?: any;
  };
  user: AuthObject;
  tokenExpiresIn?: number; // seconds until it expires
}

export type AuthResponse = express.Response;
