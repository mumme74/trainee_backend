import { Request } from "express";

import { rolesAvailable } from "../models/usersModel";
import type { AuthRequest } from "../types";
import type { IUserDocument } from "../models/usersModel";

export interface IFilterOptions {
  // when user has any of these
  anyOf?: rolesAvailable | rolesAvailable[];
  // when user has all of these
  allOf?: rolesAvailable | rolesAvailable[];
  // exclude when user has any of these
  exclude?: rolesAvailable | rolesAvailable[];
}

/**
 * @brief Run req.user through these filters
 * @param opt the filters that have to be meet to be allowed through
 * @param req the request with user attached to it
 * @returns empty string on succes, or errormessage otherwise
 */
export const meetRoles = (opt: IFilterOptions, req: Request): string => {
  const authReq = req as AuthRequest;

  if (
    opt.anyOf !== undefined &&
    (Array.isArray(opt.anyOf)
      ? opt.anyOf.find((any) => authReq.user.roles.indexOf(any) > -1) ===
        undefined
      : authReq.user.roles.indexOf(opt.anyOf) === -1)
  ) {
    return "Insufficient priviledges";
  }

  if (
    opt.exclude !== undefined &&
    (Array.isArray(opt.exclude)
      ? opt.exclude.find((any) => authReq.user.roles.indexOf(any) > -1) !==
        undefined
      : authReq.user.roles.indexOf(opt.exclude) > -1)
  ) {
    return "You have a priviledge that you shall NOT have";
  }

  if (
    opt.allOf !== undefined &&
    (Array.isArray(opt.allOf)
      ? opt.allOf.filter((any) => authReq.user.roles.indexOf(any) > -1)
          .length !== opt.allOf.length
      : authReq.user.roles.indexOf(opt.allOf) === -1)
  ) {
    return "You do not have all required priviledges";
  }

  return "";
};

/**
 * @brief Determines if user is a admin (and/or super admin)
 * @param user to match against
 * @returns true or false
 */
export const isAdmin = (user: IUserDocument): boolean => {
  return (
    user.roles.indexOf(rolesAvailable.super) > -1 ||
    user.roles.indexOf(rolesAvailable.admin) > -1
  );
};
