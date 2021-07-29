import { MongoError } from "mongodb";

import type { IGraphQl_ErrorResponse } from "../schema";
import { IUserDocument, rolesAvailable } from "../../models/usersModel";
import type { AuthRequest } from "../../types";
import { UserError } from "../../helpers/customErrors";
import type { IFilterOptions } from "../../helpers/routeHelpers";
import { meetRoles } from "../../helpers/routeHelpers";

/// This file must NOT import anything from resolvers folder

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

    const blockedStr = meetRoles(opt, req);
    if (blockedStr) {
      req.res.status(403);
      throw new UserError(blockedStr);
    } else {
      return cb(args, authReq, info);
    }
  };
};
