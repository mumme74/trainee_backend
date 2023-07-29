import { Request } from "express";

import { Role, eRolesAvailable, rolesAvailableKeys, rolesAvailableNrs } from "../models/core_role";
import type { AuthRequest } from "../types";
import type { User } from "../models/core_user";
import { isNumberObject, isStringObject } from "util/types";

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

    if (rls.length)  // use set to remove duplicates
      roles.push(...new Set(rls.map(r=>r.role)));
  }

  return roles;
}

export interface IFilterOptions {
  // when user has any of these
  anyOf?: eRolesAvailable | eRolesAvailable[];
  // when user has all of these
  allOf?: eRolesAvailable[];
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

  const hasProp = (prop: any) =>
    !isNaN(prop) || Array.isArray(prop) || typeof prop === 'string';

  const hasRole = (prop: any) => {
    if (Array.isArray(prop))
      return prop.find(any=>roles.indexOf(any) > -1) !== undefined;
    const role = isNaN(prop) ? rolesAvailableNrs[prop] : prop;
    return roles.indexOf(role) > -1
  }

  if (hasProp(opt.anyOf) && !hasRole(opt.anyOf))
    return "Insufficient priviledges";

  if (hasProp(opt.exclude) && hasRole(opt.exclude))
    return "You have a priviledge that you shall NOT have";

  if (hasProp(opt.allOf) && opt.allOf?.find(r=>roles.indexOf(r)===-1))
    return "You do not have all required priviledges";

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
