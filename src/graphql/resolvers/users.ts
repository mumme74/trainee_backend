import DataLoader from "dataloader";
import mongoose from "mongoose";

import User, {
  IUserDocument,
  IUserId,
  eRolesAvailable,
  rolesAvailableKeys,
} from "../../models/usersModel";
import {
  IGraphQl_UserCreateStudentInput,
  IGraphQl_UserType,
} from "../schema/users";
import { IGraphQl_MutationResponse } from "../schema/index";
import { AuthRequest } from "../../types";
import { composeErrorResponse, rolesFilter } from "./helpers";
import { UserError } from "../../helpers/errorHelpers";
import { newObjectId } from "../../helpers/dbHelpers";

export const userLoader = new DataLoader(
  async (userIds: readonly string[]): Promise<IUserDocument[]> => {
    const result = await User.find({
      _id: {
        $in: userIds.map((id) => {
          return newObjectId(id);
        }),
      },
    });
    return result;
  },
);

export const lookupUser = async (
  userId: IUserId,
): Promise<IUserDocument | undefined> => {
  return lookupUserByStr(userId.toString());
};

export const lookupUserByStr = async (
  userId: string,
): Promise<IUserDocument | undefined> => {
  if (!userId) return;
  try {
    const user = await userLoader.load(userId);
    if (!user) throw new UserError(`User '${userId}' not found!`);
    return user;
  } catch (err: any) {
    throw err;
  }
};

export const transformUser = (user: IUserDocument): IGraphQl_UserType => {
  const roles = user.roles.map((role) => {
    return eRolesAvailable[role];
  }) as string[];

  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: `${user.firstName} ${user.lastName}`,
    email: user.email,
    picture: user.picture || "",
    domain: user.domain || "",
    roles: roles,
    googleId: user.google?.id || "",
    updatedAt: user.updatedAt,
    createdAt: user.createdAt,
    lastLogin: user.lastLogin,
    updater: async () => {
      const u = await lookupUser(user.updatedBy);
      if (!u) return undefined;
      return transformUser(u);
    },
  };
};

export default {
  // queries
  users: rolesFilter(
    {
      anyOf: [
        eRolesAvailable.admin,
        eRolesAvailable.super,
        eRolesAvailable.teacher,
      ],
    },
    async (
      { ids }: { ids: string[] },
      req: AuthRequest,
    ): Promise<IGraphQl_UserType[]> => {
      try {
        const users = (await userLoader.loadMany(ids)) as IUserDocument[];
        //const objIds = ids.map((id)=>{return newObjectId(id)});
        //const users = await User.find({"_id":{$in: objIds}});
        if (!users) return [];

        const res = users.map((user: IUserDocument) => {
          return transformUser(user);
        });

        // if we are super user retun unfiltered
        if (req.user.roles.indexOf(eRolesAvailable.super) > -1) return res;

        // else return only those belonging to my domain
        return res.filter((u) => u.domain === (req.user.domain || ""));
      } catch (err) {
        throw err;
      }
    },
  ),

  userAvailableRoles: (): string[] => {
    return rolesAvailableKeys;
  },

  // mutations
  userCreateStudent: rolesFilter(
    { anyOf: [eRolesAvailable.admin, eRolesAvailable.super] },
    async (
      { newUser }: { newUser: IGraphQl_UserCreateStudentInput },
      req: AuthRequest,
    ): Promise<IGraphQl_MutationResponse> => {
      try {
        const user = new User({
          userName: newUser.userName,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
          "google.id": newUser.googleId || "",
          domain: newUser.domain || "",
          picture: newUser.picture,
          updatedBy: req.user.id,
          roles: [eRolesAvailable.student],
          method: newUser.googleId ? "google" : "local",
        });

        await user.save();

        return {
          success: true,
          nrAffected: 1,
          ids: [user._id],
          __typename: "OkResponse",
        };
      } catch (err: any) {
        return composeErrorResponse(err);
      }
    },
  ),

  userChangeRoles: rolesFilter(
    { anyOf: [eRolesAvailable.admin, eRolesAvailable.super] },
    async (
      { id, roles }: { id: string; roles: string[] },
      req: AuthRequest,
    ): Promise<IGraphQl_MutationResponse> => {
      try {
        // string role names to available Roles
        // using set here to ensure we only have one of each type
        const newRoles = [
          ...new Set(
            roles.map((role: string) => {
              const idx = rolesAvailableKeys.indexOf(role);
              if (idx < 0) throw new UserError("Role not valid");
              return idx;
            }),
          ),
        ];

        if (
          newRoles.indexOf(eRolesAvailable.super) > -1 &&
          req.user.roles.indexOf(eRolesAvailable.super) < 0
        ) {
          throw new UserError(
            "Can't set super admin role when you are not super admin.\n Insufficient credentials.",
          );
        }

        const res = await User.updateOne(
          { _id: newObjectId(id) },
          {
            roles: newRoles,
            updatedBy: req.user.id,
          },
        );
        if (!res.matchedCount) throw new UserError("Failed to match user");

        return {
          success: true,
          nrAffected: res.matchedCount,
          __typename: "OkResponse",
        };
      } catch (err: any) {
        return composeErrorResponse(err);
      }
    },
  ),

  userMoveToDomain: rolesFilter(
    { anyOf: [eRolesAvailable.admin, eRolesAvailable.super] },
    async (
      { id, domain }: { id: string; domain?: string },
      req: AuthRequest,
    ): Promise<IGraphQl_MutationResponse> => {
      try {
        if (!domain) domain = req.user.domain || "";

        if (req.user.roles.indexOf(eRolesAvailable.super) < 0) {
          // not super admin
          if (domain !== req.user.domain && domain !== "")
            throw new UserError(
              "You dont have priviledges to move user to another domain than your own",
            );
        }

        const res = await User.updateOne(
          { _id: newObjectId(id) },
          { domain: domain },
        );

        if (!res || res.matchedCount < 1)
          throw new UserError("User not found!");

        return {
          success: true,
          nrAffected: res.matchedCount,
          ids: [id],
          __typename: "OkResponse",
        };
      } catch (err: any) {
        return composeErrorResponse(err);
      }
    },
  ),

  userSetSuperUser: rolesFilter(
    { anyOf: eRolesAvailable.super },
    async ({ id }: { id: string }): Promise<IGraphQl_MutationResponse> => {
      try {
        const user = await User.findOne({
          _id: newObjectId(id),
        });
        if (!user) throw new UserError("User not found!");

        user.roles.push(eRolesAvailable.super);
        await user.save();

        return {
          success: true,
          nrAffected: 1,
          ids: [id],
          __typename: "OkResponse",
        };
      } catch (err: any) {
        return composeErrorResponse(err);
      }
    },
  ),

  userDeleteUser: rolesFilter(
    { anyOf: [eRolesAvailable.admin, eRolesAvailable.super] },
    async (
      { id }: { id: string },
      req: AuthRequest,
    ): Promise<IGraphQl_MutationResponse> => {
      try {
        // filter out so we can't delete a user outside of our domain
        const domainFilter =
          req.user.roles.indexOf(eRolesAvailable.super) < 0
            ? { domain: { $eq: req.user.domain || "" } }
            : undefined;
        const res = await User.deleteOne({
          _id: newObjectId(id),
          domain: domainFilter?.domain,
        });

        if (!res || +(res?.deletedCount || 0) < 1)
          throw new UserError("User not found, could not delete.");

        return {
          success: true,
          nrAffected: res?.deletedCount || 0,
          ids: [id],
          __typename: "OkResponse",
        };
      } catch (err: any) {
        return composeErrorResponse(err);
      }
    },
  ),
};
