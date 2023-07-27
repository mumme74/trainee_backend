import ModelDataLoader from "../modelDataLoader";
import { Sequelize, Op, QueryTypes, Model } from "sequelize";

import { composeErrorResponse, rolesFilter, tryCatch } from "../helpers";
import { isAdmin, isSuperAdmin } from "../../helpers/userHelpers";

import { transformUser, userLoader } from "./resolvers.common";
import { Group } from "../../models/group";
import { UserError } from "../../helpers/errorHelpers";
import {
  IGraphQl_GroupType,
  IGraphQl_GroupCreateInput,
} from "../schema/groups";
import type { IGraphQl_MutationResponse } from "../schema";
import { AuthRequest } from "../../types";
import type { IGraphQl_UserType } from "../schema/users";
import { GroupTeacher } from "../../models/groupTeacher";
import { User } from "../../models/user";
import { GroupStudent } from "../../models/groupStudent";
import { eRolesAvailable } from "../../models/role";
import { boolean, number, string } from "joi";
import { groupTeacherLoader } from "./groupTeachers";
import { groupStudentLoader } from "./groupStudents";

export const groupLoader = new ModelDataLoader<Group>(Group);

export const transformGroup = (group: Group):
  IGraphQl_GroupType =>
{
  return {
    id: group.id,
    teachers: async () => {
      const ids = (await GroupTeacher.findAll({
        where: {groupId:group.id},
        attributes:["id"]
      })).map(t=>t.id);
      const users = (await userLoader.loadMany(ids))
                      .filter(u=>u instanceof User) as User[];
      return users.map(u=>transformUser(u));
    },
    students: async () => {
      const ids = (await GroupStudent.findAll({
        where: {groupId:group.id},
        attributes:["id"]
      })).map(t=>t.id);
      const users = (await userLoader.loadMany(ids))
                      .filter(u=>u instanceof User) as User[];
      return users.map(u=>transformUser(u));
    },
    name: group.name,
    description: group.description,
    updatedAt: group.updatedAt,
    createdAt: group.createdAt,
    updater: async () => {
      const user = await userLoader.load(group.updatedBy);
      return transformUser(user);
    },
  };
};

// helper functions
/**
 * Find all groups user is teacher for
 * @param {number} userId The user.id
 * @param {string} [filter] A filter to match the name of group
 * @param {boolean} [lookInTeacher] Look for teacher, default look for student
 * @param {boolean} [descending] Sort Descending instaed of ascending based of group name
 * @returns Promise<IGraphQl_GroupType[]>
 */
const groupsFor = async (
  userId: number,
  filter: string = "",
  lookInTeacher: boolean = false,
  descending: boolean = false
): Promise<IGraphQl_GroupType[]> => {

  const replacements: (number|string)[] = [userId];
  const t2name = lookInTeacher ? 'Teachers' : 'Students';
  if (filter.length > 2) replacements.push(filter)
  const groupIds = (await (Group.sequelize as Sequelize).query(`
    SELECT grp.id FROM core_Groups as grp
    INNER JOIN core_Group${t2name} as t2
    ON grp.id=t2.groupId
    WHERE t2.userId=?
    ${filter.length>2 ? " AND grp.name LIKE '?%'" : "" }
    ORDER BY grp.name ${descending ? "DESC" : "ASC"} `,
  {
    replacements,
    type: QueryTypes.SELECT
  })).map(g=>+g);

  const groups = (await groupLoader.loadMany(groupIds))
                  .filter(g=>g instanceof Group) as Group[];

  return groups.map(g=>transformGroup(g));
};

const updateStr = async (
  id: number,
  fieldName: string,
  newStr: string,
  req: AuthRequest,
): Promise<IGraphQl_MutationResponse> => {
  const user = req.user.user,
        group = await groupLoader.load(id);

  if (!await isAdmin(req)) {
    // ensure we only can update our own class
    if (!group) throw new UserError("Could not find group!");
    // as owner you can edit the group
    if (group.ownerId !== user.id) {
      // you can only edit a group you are associated to
      if (!await GroupTeacher.findOne({where:{groupId:id}}))
        throw new UserError("Can't update a group you're not teacher in");
    }
  }

  group.setDataValue(fieldName.toLowerCase(), newStr);
  const res = group.save();
  if (!res)
    throw new UserError(`Failed to update string on ${fieldName}`);

  return {
    success: true,
    nrAffected: 1,
    ids: [id],
    __typename: "OkResponse",
  };
};

const deleteGroup = async (id: number, req: AuthRequest):
  Promise<IGraphQl_MutationResponse> =>
{
  const user = req.user.user,
        group = await groupLoader.load(id);
  if (!group) throw new UserError("Group not found!");
  if (!await isAdmin(req)) {
    if (group.ownerId !== user.id)
      throw new UserError("You can't delete a group you don't own")

    // can only delete a class where we are the sole teacher attched to the group
    const res = await GroupTeacher.findAll({
      where:{
        [Op.and]:[
          {groupId:id},
          {userId:{[Op.not]:user.id}}
        ]
      }
    });

    if (!res) throw new UserError(
        "You can only delete a group you alone handle as a teacher!");
  }

  group.destroy();
  const res = group.save();
  if (!res)
    throw new UserError(`Could not delete group ${group.name}`);

  return {
    __typename: "OkResponse",
    success: true,
    nrAffected: 1,
    ids: [id],
  };
}

const transferOwnership = async (
  id:number, newOwnerId:number, req:AuthRequest
):
  Promise<IGraphQl_MutationResponse> =>
{
  const user = req.user.user,
        group = await groupLoader.load(id),
        newOwner = await userLoader.load(newOwnerId);
  if (!group) throw new UserError('Group not found');
  if (!newOwner) throw new UserError('The newOwner does not exist');

  if (!await isAdmin(req)) {
    // must own the group
    if (group.ownerId !== user.id)
      throw new UserError(`You are not the owner of ${group.name}`);
  }

  if (newOwner.organizationId !== user.organizationId &&
      !await isSuperAdmin(req))
  {
    throw new UserError('The new owner belongs to another organization');
  }

  group.ownerId = newOwnerId;
  const res = group.save();

  if (!res)
    throw new UserError(`Failed to save ${group.name} after update`);
  return {
    __typename: "OkResponse",
    success: true,
    nrAffected: 1,
    ids: [id]
  }

}

const addRemovePeopleValidate = async (
  id: number,
  req: AuthRequest,
  peopleType: string
) => {
  const user = req.user.user,
        group = await groupLoader.load(id),
        isTeacher = peopleType === 'TEACHER';

  if (!group) throw new UserError("Group not found");
  if (user.id !== group.ownerId) {
    // make sure we are associated with this group
    const option = {where: {[Op.and]:[{groupId:id},{userId:user.id}]}},
        person = isTeacher ?
          await GroupTeacher.findOne(option) :
            await GroupStudent.findOne(option);
    if (!person) {
      if (!await isAdmin(req)) // normal teacher
        throw new UserError("You are not associated to group");

      if (!await isSuperAdmin(req)) { // plain admin, same organization policy
        const owner = await userLoader.load(group.ownerId);
        if (!owner || owner.organizationId !== user.organizationId)
          throw new UserError('Not enough privileges for operation');
      }
    }
  }

  return isTeacher;
}

const addPeople = async (
  id: number, peopleType: string,
  userIds: number[], req: AuthRequest
): Promise<IGraphQl_MutationResponse> =>
{
  // validate throws if invalid
  const isTeacher =
    await addRemovePeopleValidate(id, req,peopleType);

  // Load all or fail
  const users = await userLoader.loadAll(userIds);

  const t = await (Group.sequelize as Sequelize).transaction()
  for (const person of users) {
    const obj = { userId:person.id, groupId: id }
    const instans = await (isTeacher ?
                            GroupTeacher.create(obj) :
                              GroupStudent.create(obj));
    if (!instans) {
      t.rollback();
      throw new Error(`Failed to save person ${person.fullName}`)
    }
  }
  await t.commit();

  return {
    nrAffected: users.length,
    success: true,
    ids: userIds,
    __typename: 'OkResponse'
  }
}

const removePeople = async (
  id: number, peopleType: string,
  userIds: number[], req: AuthRequest
): Promise<IGraphQl_MutationResponse> =>
{
  // validate throws if invalid
  const isTeacher =
    await addRemovePeopleValidate(id, req,peopleType);

  // Promise to remove people from group
  const loader = isTeacher ?
    groupTeacherLoader : groupStudentLoader;
  const people = await loader.loadAll(userIds);

  const t = await (Group.sequelize as Sequelize).transaction()
  for (const person of people) {
    try {
      await person.destroy();
    } catch(err) {
      await t.rollback();
      throw err;
    }
  }
  await t.commit();

  return {
    nrAffected: people.length,
    success: true,
    ids: userIds,
    __typename: 'OkResponse'
  }
}

//------------------------------------------

// queries
export default {
  // queries
  //groups(ids: [ID!]!): [GroupType]!
  groups: tryCatch('groups', async ({ ids }: { ids: number[] }): Promise<IGraphQl_GroupType[]> => {
    try {
      const groups = (await groupLoader.loadMany(ids))
                      .filter(g=>g instanceof Group) as Group[];
      if (!groups) throw new UserError("Group[s] not found!");
      return groups.map(grp=>transformGroup(grp));

    } catch (err) {
      throw err;
    }
  }),

  //groupsForTeacher(teacherId: ID! nameFilter: string desc: boolean): [GroupType]!
  groupsForTeacher: tryCatch('groupsForTeacher', rolesFilter({anyOf:[
      eRolesAvailable.teacher,
      eRolesAvailable.admin,
      eRolesAvailable.super
    ]},
    async ({
      teacherId,
      nameFilter,
      desc
    }: {
      teacherId: number;
      nameFilter?: string;
      desc?: boolean
    }): Promise<IGraphQl_GroupType[]> => {
      return await groupsFor(teacherId, nameFilter, true, desc);
    },
  )),

  //groupsForStudent(studentId: ID! nameFilter: string): [GroupType]!
  groupsForStudent: tryCatch('groupsFroStudent', async ({
    studentId,
    nameFilter = "",
    desc = false
  }: {
    studentId: number;
    nameFilter?: string;
    desc?: boolean
  }): Promise<IGraphQl_GroupType[]> => {
    return await groupsFor(studentId, nameFilter, false, desc);
  }),

  groupsAsOwner: tryCatch('groupsAsOwner', async ({
    ownerId,
    filter = "",
    desc = false
  }: {
    ownerId: number,
    filter?: string,
    desc?: boolean
  }): Promise<IGraphQl_GroupType[]> => {
    try {
      const where = filter.length > 2 ? {
        [Op.and]:[
          {ownerId},
          {name:{[Op.like]:`${filter}%`}}
        ]
      } : {ownerId}

      const groups = await Group.findAll({where});
      return groups.map(g=>transformGroup(g));

    } catch (err) {
      throw err;
    }
  }),

  // groupCreate(newGroup: GroupCreateInput): MutationResponse
  groupCreate: tryCatch('groupCreate', rolesFilter({anyOf:[
      eRolesAvailable.teacher,
      eRolesAvailable.admin,
      eRolesAvailable.super
    ]},
    async ({
        newGroup,
      }: {
        newGroup: IGraphQl_GroupCreateInput;
      },
      req: AuthRequest,
    ): Promise<IGraphQl_MutationResponse> => {
      const user = req.user.user;
      const {
        teacherIds = [], studentIds = [],
        name, description
      } = newGroup;

      if (!await isAdmin(req)) {
        if (teacherIds.find((id) => id !== user.id))
          throw new UserError(
            "A Teacher can't set other teachers to this group!\n Must have admin role for that!",
          );
      }

      if (req.user.roles.indexOf(eRolesAvailable.teacher)>-1 &&
          (!teacherIds.find((id) => id === user.id)))
      {
        teacherIds.push(user.id);
      }

      let group;
      const t = await (Group.sequelize as Sequelize).transaction();
      try {
        group = await Group.create({
          name, description, ownerId:user.id
        });
        if (!group) throw new Error('Could not create new group, database error')

        for (const userId of teacherIds) {
          const person = GroupTeacher.create({
            userId, groupId: group.id
          });
          if (!person) throw new Error('Could not add teacher to new group');
        }

        for (const userId of studentIds) {
          const person = GroupStudent.create({
            userId, groupId: group.id
          });
          if (!person) throw new Error('Could not add student to new group');
        }
      } catch(err) {
        await t.rollback();
        throw err;
      }

      await t.commit();

      return {
        success: true,
        nrAffected: 1,
        ids: [group.id],
        __typename: "OkResponse",
      };
    },
  )),

  // groupDelete(id: ID!): MutationResponse
  groupDelete: tryCatch('groupDelete', rolesFilter({anyOf:[
      eRolesAvailable.teacher,
      eRolesAvailable.admin,
      eRolesAvailable.super
    ]},
    async (
      { id }: { id: number },
      req: AuthRequest,
    ): Promise<IGraphQl_MutationResponse> => {
      return deleteGroup(id, req);
    },
  )),

  // groupTransferOwnership(id: Int! newOwnerId: Int!): MutationResponse!
  groupTransferOwnership: tryCatch('groupTransferOwnership',
    rolesFilter({anyOf:[
      eRolesAvailable.teacher,
      eRolesAvailable.admin,
      eRolesAvailable.super
    ]},
    async ({id, newOwnerId}: {id: number; newOwnerId: number}, req: AuthRequest):
      Promise<IGraphQl_MutationResponse> =>
    {
      return transferOwnership(id, newOwnerId, req);
    }
  )),

  // groupUpdateString(id: ID! field: GroupStringField name: String!): MutationResponse
  groupUpdateString: tryCatch('groupUpdateString',
    rolesFilter({anyOf:[
      eRolesAvailable.teacher,
      eRolesAvailable.admin,
      eRolesAvailable.super
    ]},
    async (
      {
        id, field, newStr
      }: {
         id: number; field: string; newStr: string;
      },
      req: AuthRequest,
    ): Promise<IGraphQl_MutationResponse> => {
      return updateStr(id, field, newStr, req);
    },
  )),

  // groupAddStudents(id: ID! peopleType: GroupPeopleType! userIds: [ID!]!): MutationResponse
  groupAddPeople: tryCatch('groupAddPeople',
    rolesFilter({anyOf:[
      eRolesAvailable.teacher,
      eRolesAvailable.admin,
      eRolesAvailable.super
    ]},
    async (
      {
        id, peopleType, userIds
      }: {
        id: number; peopleType: string; userIds: number[]
      },
      req: AuthRequest,
    ): Promise<IGraphQl_MutationResponse> => {
      return addPeople(id, peopleType, userIds, req);
    },
  )),

  // groupRemovePeople(id: ID! peopleType: GroupPeopleType!  studentId: [ID!]!): MutationResponse
  groupRemovePeople: tryCatch('groupRemovePeople',
    rolesFilter({anyOf:[
      eRolesAvailable.teacher,
      eRolesAvailable.admin,
      eRolesAvailable.super
    ]},
    async ({
        id, peopleType, userIds
      }: {
        id: number; peopleType: string; userIds: number[]
      },
      req: AuthRequest,
    ): Promise<IGraphQl_MutationResponse> => {
      return removePeople(id, peopleType, userIds, req);
    },
  )),
};
