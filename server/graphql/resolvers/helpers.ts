import { MongoError } from "mongodb";

import type { IGraphQl_ErrorResponse } from "../schema";
import type { AuthRequest } from "../../types";
import { UserError } from "../../helpers/errorHelpers";
import type { IFilterOptions } from "../../helpers/userHelpers";
import { meetRoles } from "../../helpers/userHelpers";
import { errorResponse } from "../../helpers/errorHelpers";

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
