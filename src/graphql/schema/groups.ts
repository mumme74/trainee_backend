import { IGraphQl_UserType } from "./users";

/// must be in sync with graphQl types
export interface IGraphQl_GroupType {
  id: number;
  teachers: () => Promise<IGraphQl_UserType[]>;
  students: () => Promise<IGraphQl_UserType[]>;
  name: string;
  description?: string;
  updatedAt: Date;
  createdAt: Date;
  updater?: () => Promise<IGraphQl_UserType | undefined>;
  owner?: () => Promise<IGraphQl_UserType | undefined>;
}

export interface IGraphQl_GroupCreateInput {
  teacherIds: number[];
  studentIds: number[];
  name: string;
  description?: string;
}

export const groupsSchemaTypes = `
enum core_group_StringField {
  NAME
  DESCRIPTION
}

enum core_group_PeopleType {
  STUDENT
  TEACHER
}

type core_group_Type {
  id: IntID!
  teachers: [core_user_Type]!
  students: [core_user_Type]!
  name: String!
  description: String
  owner: core_user_Type!
  updater: core_user_Type
  updatedAt: Date!
  createdAt: Date!
}
`;

export const groupsSchemaInputs = `
# used by a teacher or admin to add a new group
input core_group_CreateInput {
    teacherIds: [IntID]
    studentIds: [IntID]
    name: String!
    description: String
}
`;

export const groupSchemaQueries = `
    core_group_Groups(ids: [IntID!]): [core_group_Type]!

    core_group_GroupsForTeacher(
      teacherId: IntID!
      nameFilter: String
      desc: Boolean
    ): [core_group_Type]!

    core_group_GroupsForStudent(
      studentId: IntID!
      nameFilter: String
      desc: Boolean
    ): [core_group_Type]!

    core_group_GroupsForOwner(
      ownerId: IntID!
      nameFilter: String
      desc: Boolean
    ): [core_group_Type]!
`;

export const groupSchemaMutations = `
    core_group_Create(
      newGroup: core_group_CreateInput
    ): MutationResponse!

    core_group_Delete(id: IntID!): MutationResponse!
    core_group_UpdateString(
      id: IntID!
      field: core_group_StringField!
      newStr: String!
    ): MutationResponse!

    core_group_TransferOwnership(
      id: IntID!
      newOwnerId: IntID!
    ): MutationResponse!

    core_group_AddPeople(
      id: IntID!
      peopleType: core_group_PeopleType!
      userIds: [IntID!]!
    ): MutationResponse!

    core_group_RemovePeople(
      id: IntID!
      peopleType: core_group_PeopleType!
      userIds: [IntID!]!
    ): MutationResponse!
`;
