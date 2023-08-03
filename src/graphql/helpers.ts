import type { IGraphQl_ErrorResponse, IGraphQl_OkResponse } from "./schema";
import type { AuthRequest } from "../types";
import { UserError } from "../helpers/errorHelpers";
import type { IFilterOptions } from "../helpers/userHelpers";
import { meetRoles } from "../helpers/userHelpers";
import { errorResponse } from "../helpers/errorHelpers";

/// This file must NOT import anything from resolvers folder

export const composeErrorResponse = (
  err: Error | string,
): IGraphQl_ErrorResponse => {
  const res = errorResponse(err);
  return {
    ...res,
    __typename: "ErrorResponse",
  };
};

export const composeOkResponse = (
  ids: number[], nrAffected?: number
): IGraphQl_OkResponse =>
{
  return {
    success: true,
    nrAffected: nrAffected ?? ids.length,
    ids,
    __typename: 'OkResponse'
  }
}

export const tryCatch = (controllerName: string, cb: Function) => {
  return (args: any, req: any, info: any) => {
    try {
      return cb(args, req, info);
    } catch(err:any) {
      console.log(`Catch error from graphQl controller ${controllerName}`);
      composeErrorResponse(err);
    }
  }
}

export const rolesFilter = (opt: IFilterOptions, cb: Function) => {
  return async (args: any, req: any, info: any) => {
    const authReq = req as AuthRequest;

    const blockedStr = await meetRoles(opt, req);
    if (blockedStr) {
      req.res.status(403);
      throw new UserError(blockedStr);
    } else {
      return cb(args, authReq, info);
    }
  };
};
