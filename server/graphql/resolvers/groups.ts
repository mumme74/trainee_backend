import DataLoader from "dataloader";
import mongoose from "mongoose";

import { composeErrorResponse, rolesFilter, isAdmin } from "./helpers";
import type { IFilterOptions } from "./helpers";

import { transformUser, lookupUser, userLoader } from "./resolvers.common";
import Group, { IGroupDocument } from "../../models/groupsModel";
import { UserError } from "../../helpers/customErrors";
import {
  IGraphQl_GroupType,
  IGraphQl_GroupCreateInput,
} from "../schema/groups";
import type { IGraphQl_MutationResponse } from "../schema";
import { AuthRequest } from "../../types";
import { IUserDocument, rolesAvailable } from "../../models/usersModel";
import type { IGraphQl_UserType } from "../schema/users";

export const groupLoader = new DataLoader(
  async (groupIds: readonly string[]): Promise<IGroupDocument[]> => {
    const result = await Group.find({
      _id: { $in: groupIds.map((id) => new mongoose.Types.ObjectId(id)) },
    });

    return result;
  },
);

export const lookupGroup = async (
  groupId: string,
): Promise<IGroupDocument | undefined> => {
  if (!groupId) return;
  try {
    const group = await groupLoader.load(groupId);
    if (!group) throw new UserError("Group not found!");
    return group;
  } catch (err) {
    throw err;
  }
};

export const transformGroup = (group: IGroupDocument): IGraphQl_GroupType => {
  async function getUsers(userIds: string[]): Promise<IGraphQl_UserType[]> {
    try {
      const users = (await userLoader.loadMany(userIds)) as IUserDocument[];
      if (!users) return [];
      return users.map((u) => {
        return transformUser(u);
      });
    } catch (err) {
      throw err;
    }
  }

  return {
    id: group.id,
    teachers: async () => {
      return await getUsers(group.teacherIds);
    },
    students: async () => {
      return await getUsers(group.studentIds);
    },
    name: group.name,
    description: group.description,
    updatedAt: group.updatedAt,
    createdAt: group.createdAt,
    updater: async () => {
      const u = await lookupUser(group.updatedBy);
      if (!u) return undefined;
      return transformUser(u);
    },
  };
};

// helper functions

const groupsFor = async (
  userId: string,
  idField: string,
  nameFilter?: string,
): Promise<IGraphQl_GroupType[]> => {
  try {
    const name = nameFilter ? new RegExp(`${nameFilter}`) : undefined;
    const groups = (await Group.find({
      [idField]: new mongoose.Types.ObjectId(userId),
      name,
    })) as IGroupDocument[];

    if (!groups) return [];

    return groups.map((grp) => {
      return transformGroup(grp);
    });
  } catch (err) {
    throw err;
  }
};

const updateStr = async (
  id: string,
  fieldName: string,
  newStr: string,
  req: AuthRequest,
): Promise<IGraphQl_MutationResponse> => {
  try {
    if (!isAdmin(req.user)) {
      // ensure we only can update our own class
      const group = await lookupGroup(id);
      if (!group) throw new UserError("Could not find group!");
      if (!group.teacherIds.find((id) => id === req.user.id))
        throw new UserError("Can't update a group you're not teacher in");
    }

    const res = await Group.updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      {
        [fieldName]: newStr,
        updatedBy: new mongoose.Types.ObjectId(req.user.id),
      },
    );

    if (!res || res.n !== 1) throw new UserError("Could not update!");

    return {
      success: true,
      nrAffected: res.n,
      ids: [id],
      __typename: "OkResponse",
    };
  } catch (err) {
    return composeErrorResponse(err);
  }
};

const addIds = (currentIds: string[], updateIds: string[]): string[] => {
  updateIds.forEach((id) => {
    const idx = currentIds.indexOf(id);
    if (idx < 0) currentIds.push(id);
  });

  return currentIds;
};

const removeIds = (currentIds: string[], updateIds: string[]): string[] => {
  updateIds.forEach((id) => {
    const idx = currentIds.indexOf(id);
    if (idx > -1) currentIds.splice(idx, 1);
  });

  return currentIds;
};

const updateIds = async (
  id: string,
  userIds: string[],
  fieldName: string,
  req: AuthRequest,
  workerFunc: (currentIds: string[], updateIds: string[]) => string[],
): Promise<IGraphQl_MutationResponse> => {
  try {
    const group = await Group.findById(id);
    if (!group) throw new UserError("Could not find group!");
    if (!isAdmin(req.user)) {
      // ensure we only can update our own class
      if (!group.teacherIds.find((id: any) => id.toString() === req.user.id))
        throw new UserError("Can't update a group you're not teacher in");
    }

    const cnt = group[fieldName].length;
    group[fieldName] = workerFunc(group[fieldName], userIds);
    group.updatedBy = new mongoose.Types.ObjectId(req.user.id);
    group.markModified("updatedBy"); // need to explicitly mark as modified,
    // same user can modify again, does not trigger isModified

    const res = await group.save();
    if (!res || res.isModified(fieldName))
      throw new UserError("Error when updating");

    return {
      nrAffected: cnt !== group[fieldName].length ? 1 : 0,
      success: true,
      ids: [id],
      __typename: "OkResponse",
    };
  } catch (err) {
    return composeErrorResponse(err);
  }
};

const allowAdminSuperTeacher: IFilterOptions = {
  anyOf: [rolesAvailable.admin, rolesAvailable.super, rolesAvailable.teacher],
};
const allowAdminSuper: IFilterOptions = {
  anyOf: [rolesAvailable.admin, rolesAvailable.super],
};

//------------------------------------------

// queries
export default {
  // queries
  //groups(ids: [ID!]!): [GroupType]!
  groups: async ({ ids }: { ids: string[] }): Promise<IGraphQl_GroupType[]> => {
    try {
      const groups = (await groupLoader.loadMany(ids)) as IGroupDocument[];
      if (!groups) throw new UserError("Group not found!");
      return groups.map((grp) => {
        return transformGroup(grp);
      });
    } catch (err) {
      throw err;
    }
  },

  //groupsForTeacher(teacherId: ID! nameFilter: string): [GroupType]!
  groupsForTeacher: rolesFilter(
    allowAdminSuperTeacher,
    async ({
      teacherId,
      nameFilter,
    }: {
      teacherId: string;
      nameFilter?: string;
    }): Promise<IGraphQl_GroupType[]> => {
      return await groupsFor(teacherId, "teacherIds", nameFilter);
    },
  ),

  //groupsForStudent(studentId: ID! nameFilter: string): [GroupType]!
  groupsForStudent: async ({
    studentId,
    nameFilter,
  }: {
    studentId: string;
    nameFilter?: string;
  }): Promise<IGraphQl_GroupType[]> => {
    return await groupsFor(studentId, "studentIds", nameFilter);
  },

  // groupCreate(newGroup: GroupCreateInput): MutationResponse
  groupCreate: rolesFilter(
    allowAdminSuperTeacher,
    async (
      {
        newGroup,
      }: {
        newGroup: IGraphQl_GroupCreateInput;
      },
      req: AuthRequest,
    ): Promise<IGraphQl_MutationResponse> => {
      try {
        if (!isAdmin(req.user)) {
          if (newGroup.teacherIds?.find((id) => id !== req.user.id))
            throw new UserError(
              "A Teacher can't set other teachers to this group!\n Must have admin role for that!",
            );
          if (!Array.isArray(newGroup.teacherIds)) newGroup.teacherIds = [];
          if (!newGroup.teacherIds.find((id) => id === req.user.id))
            newGroup.teacherIds.push(req.user.id);
        }
        const group = new Group({
          teacherIds: newGroup.teacherIds,
          studentIds: newGroup.studentIds,
          name: newGroup.name,
          description: newGroup.description,
          updatedBy: new mongoose.Types.ObjectId(req.user.id),
        });

        const res = await group.save();
        if (!res || res.isNew) throw new UserError("Could not save group");

        return {
          success: true,
          nrAffected: 1,
          ids: [group._doc._id],
          __typename: "OkResponse",
        };
      } catch (err) {
        return composeErrorResponse(err);
      }
    },
  ),

  // groupDelete(id: ID!): MutationResponse
  groupDelete: rolesFilter(
    allowAdminSuperTeacher,
    async (
      { id }: { id: string },
      req: AuthRequest,
    ): Promise<IGraphQl_MutationResponse> => {
      try {
        const group = await lookupGroup(id);
        if (!group) throw new UserError("Group not found!");
        if (!isAdmin(req.user)) {
          // can only delete a class where we are the sole teacher attched to the group
          if (group.teacherIds.find((id) => id !== req.user.id))
            throw new UserError(
              "You can only delete a group you alone handle as a teacher!",
            );
        }

        const res = await Group.deleteOne({
          _id: new mongoose.Types.ObjectId(id),
        });
        if (!res || res.n !== 1) throw new UserError("Could not delete group");

        return {
          __typename: "OkResponse",
          success: true,
          nrAffected: res.n,
          ids: [id],
        };
      } catch (err) {
        return composeErrorResponse(err);
      }
    },
  ),

  // groupChangeName(id: ID! name: String!): MutationResponse
  groupChangeName: rolesFilter(
    allowAdminSuperTeacher,
    async (
      { id, name }: { id: string; name: string },
      req: AuthRequest,
    ): Promise<IGraphQl_MutationResponse> => {
      return updateStr(id, "name", name, req);
    },
  ),

  // groupChangeDescription(id: ID! description: String!) : MutationResponse
  groupChangeDescription: rolesFilter(
    allowAdminSuperTeacher,
    async (
      { id, description }: { id: string; description: string },
      req: AuthRequest,
    ): Promise<IGraphQl_MutationResponse> => {
      return updateStr(id, "description", description, req);
    },
  ),

  // groupAddStudents(id: ID! studentIds: [ID!]!): MutationResponse
  groupAddStudents: rolesFilter(
    allowAdminSuperTeacher,
    async (
      { id, studentIds }: { id: string; studentIds: string[] },
      req: AuthRequest,
    ): Promise<IGraphQl_MutationResponse> => {
      return updateIds(id, studentIds, "studentIds", req, addIds);
    },
  ),

  // groupRemoveStudents(id: ID! studentId: [ID!]!): MutationResponse
  groupRemoveStudents: rolesFilter(
    allowAdminSuperTeacher,
    async (
      { id, studentIds }: { id: string; studentIds: string[] },
      req: AuthRequest,
    ): Promise<IGraphQl_MutationResponse> => {
      return updateIds(id, studentIds, "studentIds", req, removeIds);
    },
  ),

  // groupAddTeachers(id: ID! teacherIds: [ID!]!): MutationResponse
  groupAddTeachers: rolesFilter(
    allowAdminSuper,
    async (
      { id, teacherIds }: { id: string; teacherIds: string[] },
      req: AuthRequest,
    ): Promise<IGraphQl_MutationResponse> => {
      return updateIds(id, teacherIds, "teacherIds", req, addIds);
    },
  ),

  // groupRemoveTeachers(id: ID! teacherIds: [ID!]!) : MutationResponse
  groupRemoveTeachers: rolesFilter(
    allowAdminSuper,
    async (
      { id, teacherIds }: { id: string; teacherIds: string[] },
      req: AuthRequest,
    ): Promise<IGraphQl_MutationResponse> => {
      return updateIds(id, teacherIds, "teacherIds", req, removeIds);
    },
  ),
};
