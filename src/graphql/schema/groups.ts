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
enum group_StringField {
  NAME
  DESCRIPTION
}

enum group_PeopleType {
  STUDENT
  TEACHER
}

type group_Type {
  id: IntID!
  teachers: [user_Type]!
  students: [user_Type]!
  name: String!
  description: String
  owner: user_Type!
  updater: user_Type
  updatedAt: Date!
  createdAt: Date!
}
`;

export const groupsSchemaInputs = `
# used by a teacher or admin to add a new group
input group_CreateInput {
    teacherIds: [IntID]
    studentIds: [IntID]
    name: String!
    description: String
}
`;

export const groupSchemaQueries = `
    group_Groups(ids: [IntID!]): [group_Type]!

    group_GroupsForTeacher(
      teacherId: IntID!
      nameFilter: String
      desc: Boolean
    ): [group_Type]!

    group_GroupsForStudent(
      studentId: IntID!
      nameFilter: String
      desc: Boolean
    ): [group_Type]!

    group_GroupsForOwner(
      ownerId: IntID!
      nameFilter: String
      desc: Boolean
    ): [group_Type]!
`;

export const groupSchemaMutations = `
    group_Create(
      newGroup: group_CreateInput
    ): MutationResponse!

    group_Delete(id: IntID!): MutationResponse!
    group_UpdateString(
      id: IntID!
      field: group_StringField!
      newStr: String!
    ): MutationResponse!

    group_TransferOwnership(
      id: IntID!
      newOwnerId: IntID!
    ): MutationResponse!

    group_AddPeople(
      id: IntID!
      peopleType: group_PeopleType!
      userIds: [IntID!]!
    ): MutationResponse!

    group_RemovePeople(
      id: IntID!
      peopleType: group_PeopleType!
      userIds: [IntID!]!
    ): MutationResponse!
`;
