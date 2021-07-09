import * as core from "express-serve-static-core";
import express from "express";



// database models
export interface IUser {
    readonly id: string,
    method: string,
    userName: string,
    firstName: string,
    lastName: string,
    email: string,
    password?: string,
    picture?:string,
    google: {
      id: string,
      hd?: string,
    }
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
    user: IUser,
    tokenExpiresIn?: number // seconds until it expires
  };

export interface AuthResponse extends express.Response {};