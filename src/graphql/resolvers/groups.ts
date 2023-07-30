import ModelDataLoader from "../modelDataLoader";
import { Sequelize, Op, QueryTypes, Model, Transaction, ModelStatic } from "sequelize";

import { composeErrorResponse, rolesFilter, tryCatch } from "../helpers";
import { isAdmin, isSuperAdmin } from "../../helpers/userHelpers";

import { transformUser, userLoader } from "./resolvers.common";
import { Group } from "../../models/core_group";
import { UserError } from "../../helpers/errorHelpers";
import {
  IGraphQl_GroupType,
  IGraphQl_GroupCreateInput,
} from "../schema/groups";
import type { IGraphQl_MutationResponse } from "../schema";
import { AuthRequest } from "../../types";
import type { IGraphQl_UserType } from "../schema/users";
import { GroupTeacher } from "../../models/core_group_teacher";
import { User } from "../../models/core_user";
import { GroupStudent } from "../../models/core_group_student";
import { eRolesAvailable } from "../../models/core_role";
import { boolean, number, string } from "joi";
import { groupTeacherByGroupLoader, groupTeacherLoader } from "./groupTeachers";
import { groupStudentByGroupLoader, groupStudentLoader } from "./groupStudents";
import { organizationLoader } from "./organizations";


// ----------------------------------------------------------------
// our controller functions

// queries
export default {
  // queries
  //groups(ids: [ID!]!): [GroupType]!
  core_group_Groups: tryCatch('groups',
    async ({ ids }: { ids: number[] }): Promise<IGraphQl_GroupType[]> =>
    {
      const groups = (await groupLoader.loadMany(ids))
                       .filter(g=>g instanceof Group) as Group[];
      if (!groups) throw new UserError("Group[s] not found!");
      return groups.map(grp=>transformGroup(grp));
    }
  ),

  //groupsForTeacher(teacherId: ID! nameFilter: string desc: boolean): [GroupType]!
  core_group_GroupsForTeacher: tryCatch('groupsForTeacher', rolesFilter({anyOf:[
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
  core_group_GroupsForStudent: tryCatch('groupsForStudent', async ({
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

  core_group_GroupsForOwner: tryCatch('groupsForOwner', async ({
    ownerId,
    filter = "",
    desc = false
  }: {
    ownerId: number,
    filter?: string,
    desc?: boolean
  }): Promise<IGraphQl_GroupType[]> => {
    const where = filter.length > 2 ? {
      [Op.and]:[
        {ownerId},
        {name:{[Op.like]:`${filter}%`}}
      ]
    } : {ownerId}

    const groups = await Group.findAll({where});
    return groups.map(g=>transformGroup(g));
  }),

  // groupCreate(newGroup: GroupCreateInput): MutationResponse
  core_group_Create: tryCatch('groupCreate', rolesFilter({anyOf:[
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
      return createGroup(newGroup, req);
    }
  )),

  // groupDelete(id: ID!): MutationResponse
  core_group_Delete: tryCatch('groupDelete', rolesFilter({anyOf:[
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
  core_group_TransferOwnership: tryCatch('groupTransferOwnership',
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
  core_group_UpdateString: tryCatch('groupUpdateString',
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
  core_group_AddPeople: tryCatch('groupAddPeople',
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
  core_group_RemovePeople: tryCatch('groupRemovePeople',
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

// ------------------------------------------------------
// exported stuff here

export const groupLoader = new ModelDataLoader<Group>(Group);

export const transformGroup = (group: Group):
  IGraphQl_GroupType =>
{
  return {
    id: group.id,
    teachers: async () => {
      const ids = (await GroupTeacher.findAll({
        where: {groupId:group.id},
      })).map(t=>t.teacherId);
      const users = (await userLoader.loadMany(ids))
                      .filter(u=>u instanceof User) as User[];
      return users.map(u=>transformUser(u));
    },
    students: async () => {
      const ids = (await GroupStudent.findAll({
        where: {groupId:group.id},
      })).map(t=>t.studentId);
      const users = (await userLoader.loadMany(ids))
                      .filter(u=>u instanceof User) as User[];
      return users.map(u=>transformUser(u));
    },
    name: group.name,
    description: group.description,
    updatedAt: group.updatedAt,
    createdAt: group.createdAt,
    updater: async () => {
      if (!group.updatedBy) return;
      const user = await userLoader.load(group.updatedBy);
      return transformUser(user);
    },
    owner: async ()=> {
      if (!group.ownerId) return;
      const user = await userLoader.load(group.ownerId);
      return transformUser(user);
    }
  };
};

// -------------------------------------------------
// module private stuff below here

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
  const fld = lookInTeacher ? 'teacherId' : 'studentId';
  if (filter.length > 2) replacements.push(filter)
  const grps = (await (Group.sequelize as Sequelize).query(`
    SELECT grp.id FROM core_Groups as grp
    INNER JOIN core_Group${t2name} as t2
    ON grp.id=t2.groupId
    WHERE t2.${fld}=?
    ${filter.length>2 ? " AND grp.name LIKE '?%'" : "" }
    ORDER BY grp.name ${descending ? "DESC" : "ASC"} `,
  {
    replacements,
    type: QueryTypes.SELECT
  })) as {id:number}[];

  const groupIds = grps.map(g=>g.id);
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

const createGroup = async (
  newGroup: IGraphQl_GroupCreateInput,
  req: AuthRequest
):
  Promise<IGraphQl_MutationResponse> =>
{
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

  const group = await (Group.sequelize as Sequelize).transaction(
    async (transaction: Transaction)=>
    {
      const group = await Group.create({
        name, description, ownerId:user.id
      }, {transaction});
      if (!group) throw new Error('Could not create new group, database error')

      for (const teacherId of teacherIds) {
        const person = await GroupTeacher.create({
          teacherId, groupId: group.id, createdBy: user.id,
        }, {transaction});
        if (!person) throw new Error('Could not add teacher to new group');
      }

      for (const studentId of studentIds) {
        const person = await GroupStudent.create({
          studentId, groupId: group.id, createdBy: user.id,
        }, {transaction});
        if (!person) throw new Error('Could not add student to new group');
      }

      return group;
    }
  );

  return {
    success: true,
    nrAffected: 1,
    ids: [group.id],
    __typename: "OkResponse",
  };
}

const deleteGroup = async (id: number, req: AuthRequest):
  Promise<IGraphQl_MutationResponse> =>
{
  const user = req.user.user,
        group = await groupLoader.load(id);
  if (!group) throw new UserError("Group not found!");
  do {
    if (await isSuperAdmin(req)) break;
    if (await isAdmin(req)) {
      if (group.ownerId === null) break;
      const owner = await userLoader.load(group.ownerId);

      if (owner.organizationId !== user.organizationId)
        throw new UserError(
          "You can't delete a group from another organization");

    } else if (req.user.roles.indexOf(eRolesAvailable.teacher)) {
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

    } else
      throw new UserError("You can't delete a group as student");

  } while(false);

  await group.destroy();
  const res = await group.save();
  if (!res)
    throw new UserError(`Could not delete group ${group.name}`);

  groupLoader.clear(group.id);

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
    await addRemovePeopleValidate(id, req, peopleType);

  const user = req.user.user,
        fld = isTeacher ? 'teacherId' : 'studentId',
        model = isTeacher ? GroupTeacher : GroupStudent;

  // don't add twice
  const prev = (await (model as ModelStatic<any>).findAll({
    where:{[Op.and]:{
      [fld]:{[Op.in]:userIds}},
      groupId:id
    }
  })).map(p=>p[fld]);
  userIds = userIds.filter(u=>prev.indexOf(u)===-1);

  // Load all or fail (throws)
  const users = await userLoader.loadAll(userIds);

  await (Group.sequelize as Sequelize).transaction(
    async (transaction: Transaction) => {
      for (const u of users) {
        const res = await (model as ModelStatic<any>).create(
          {[fld]:u.id, groupId:id, createdBy:user.id },
          {transaction}
        )
        if (!res)
          throw new Error(`Failed to save person ${u.fullName}`);
    }
  });

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
  const model = isTeacher ? GroupTeacher : GroupStudent,
        field = isTeacher ? 'teacherId' : 'studentId';
  const nr = await (Group.sequelize as Sequelize).transaction(
    async (t:Transaction)=>{
      return await (model as ModelStatic<any>).destroy({
        where: {[field]:{[Op.in]:userIds}},
        transaction:t
      });
    }
  );

  return {
    nrAffected: nr,
    success: true,
    ids: userIds,
    __typename: 'OkResponse'
  }
}
