import { Request } from "express";

import { Role, eRolesAvailable } from "../models/role";
import type { AuthRequest } from "../types";
import type { User } from "../models/user";

const rolesFromReq = async (req: AuthRequest):
  Promise<eRolesAvailable[]> =>
{
  const roles = req.user.roles;
  if (!roles.length) {
    // cache roles in AuthRequest
    const rls = await Role.findAll({
      where: {userId: req.user.user.id},
      attributes:["role"]
    });

    if (rls.length)
      roles.push(...rls.map(r=>r.role));
  }

  return roles;
}

export interface IFilterOptions {
  // when user has any of these
  anyOf?: eRolesAvailable | eRolesAvailable[];
  // when user has all of these
  allOf?: eRolesAvailable | eRolesAvailable[];
  // exclude when user has any of these
  exclude?: eRolesAvailable | eRolesAvailable[];
}

/**
 * @brief Run req.user through these filters
 * @param opt the filters that have to be meet to be allowed through
 * @param req the request with user attached to it
 * @returns empty string on succes, or errormessage otherwise
 */
export const meetRoles = async (opt: IFilterOptions, req: AuthRequest):
  Promise<string> =>
{
  const roles = await rolesFromReq(req);
  if (!roles.length) return "No roles for current user";

  if (
    opt.anyOf !== undefined &&
    (Array.isArray(opt.anyOf)
      ? opt.anyOf.find(async (any) => roles.indexOf(any) > -1) ===
        undefined
      : roles.indexOf(opt.anyOf) === -1)
  ) {
    return "Insufficient priviledges";
  }

  if (
    opt.exclude !== undefined &&
    (Array.isArray(opt.exclude)
      ? opt.exclude.find((any) => roles.indexOf(any) > -1) !==
        undefined
      : roles.indexOf(opt.exclude) > -1)
  ) {
    return "You have a priviledge that you shall NOT have";
  }

  if (
    opt.allOf !== undefined &&
    (Array.isArray(opt.allOf)
      ? opt.allOf.filter((any) => roles.indexOf(any) > -1)
          .length !== opt.allOf.length
      : roles.indexOf(opt.allOf) === -1)
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
export const isAdmin = async (req: AuthRequest):
  Promise<boolean> =>
{
  const roles = await rolesFromReq(req);
  return roles.length > 0 && (
    roles.indexOf(eRolesAvailable.super) > -1 ||
    roles.indexOf(eRolesAvailable.admin) > -1
  );
};

/**
 * @brief Determines if user is a super admin
 * @param user to match against
 * @returns true or false
 */
export const isSuperAdmin = async (req: AuthRequest):
  Promise<boolean> =>
{
  const roles = await rolesFromReq(req);
  return roles.length > 0 && (
    roles.indexOf(eRolesAvailable.super) > -1
  );
};
