import { MongoError } from "mongodb";

import type { IGraphQl_ErrorResponse } from "../schema";
import { IUserDocument, rolesAvailable } from "../../models/usersModel";
import type { AuthRequest } from "../../types";
import { UserError } from "../../helpers/customErrors";

/// This file must NOT import anything from resolvers folder

export interface IFilterOptions {
  // when user has any of these
  anyOf?: rolesAvailable | rolesAvailable[];
  // when user has all of these
  allOf?: rolesAvailable | rolesAvailable[];
  // exclude when user has any of these
  exclude?: rolesAvailable | rolesAvailable[];
}

export const composeErrorResponse = (err: Error): IGraphQl_ErrorResponse => {
  const stack =
    process.env.NODE_ENV === "development" &&
    err.stack &&
    !(err instanceof UserError || err instanceof MongoError)
      ? err.stack.split("\n")
      : undefined;
  return {
    success: false,
    message: err.message,
    __typename: "ErrorResponse",
    stack,
  };
};

export const isAdmin = (user: IUserDocument) => {
  return (
    user.roles.indexOf(rolesAvailable.super) > -1 ||
    user.roles.indexOf(rolesAvailable.admin) > -1
  );
};

export const rolesFilter = (opt: IFilterOptions, cb: Function) => {
  return function (args: any, req: any, info: any) {
    const authReq = req as AuthRequest;

    try {
      if (
        opt.anyOf &&
        !(Array.isArray(opt.anyOf)
          ? opt.anyOf.find((any) => authReq.user.roles.indexOf(any) > -1) !==
            undefined
          : opt.anyOf in authReq.user.roles)
      ) {
        req.res.status(403);
        throw new UserError("Insufficient priviledges");
      }

      if (
        opt.exclude &&
        (Array.isArray(opt.exclude)
          ? opt.exclude.find((any) => authReq.user.roles.indexOf(any) > -1) !==
            undefined
          : opt.exclude in authReq.user.roles)
      ) {
        req.res.status(403);
        throw new UserError(
          "You had a priviledge that you should not have to do this",
        );
      }

      if (
        opt.allOf &&
        (Array.isArray(opt.allOf)
          ? opt.allOf.map((any) => authReq.user.roles.indexOf(any) > -1)
              .length === opt.allOf.length
          : opt.allOf in authReq.user.roles && authReq.user.roles.length === 1)
      ) {
        req.res.status(403);
        throw new UserError(
          "You had a priviledge that you should not have to do this",
        );
      }

      return cb(args, authReq, info);
    } catch (err) {
      throw err;
    }
  };
};
