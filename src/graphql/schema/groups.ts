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
}

export interface IGraphQl_GroupCreateInput {
  teacherIds: number[];
  studentIds: number[];
  name: string;
  description?: string;
}

export const groupsSchemaTypes = `
enum GroupStringField {
  NAME
  DESCRIPTION
}

enum GroupPeopleType {
  STUDENT
  TEACHER
}

type GroupType {
  id: Int!
  teachers: [UserType]!
  students: [UserType]!
  name: String!
  description: String
  updater: UserType!
  updatedAt: Date!
  createdAt: Date!
}
`;

export const groupsSchemaInputs = `
# used by a teacher or admin to add a new group
input GroupCreateInput {
    teacherIds: [Int]
    studentIds: [Int]
    name: String!
    description: String
}
`;

export const groupSchemaQueries = `
    groups(ids: [Int!]!): [GroupType]!
    groupsForTeacher(
      teacherId: Int!
      nameFilter: String
      desc: Boolean
    ): [GroupType]!
    groupsForStudent(
      studentId: Int!
      nameFilter: String
      desc: Boolean
    ): [GroupType]!
    groupsForOwner(
      ownerId: Int!
      nameFilter: String
      desc: Boolean
    ): [GroupType]!
`;

export const groupSchemaMutations = `
    groupCreate(
      newGroup: GroupCreateInput
    ): MutationResponse!
    groupDelete(id: Int!): MutationResponse!
    groupUpdateString(
      id: Int!
      field: GroupStringField!
      newStr: String!
    ): MutationResponse!
    groupTransferOwnership(
      id: Int!
      newOwnerId: Int!
    ): MutationResponse!
    groupAddPeople(
      id: Int!
      peopleType: GroupPeopleType!
      userIds: [Int!]!
    ): MutationResponse!
    groupRemovePeople(
      id: Int!
      peopleType: GroupPeopleType!
      userIds: [Int!]!
    ): MutationResponse!
`;
