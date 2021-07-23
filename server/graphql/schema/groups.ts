import { IGraphQl_UserType } from "./users";

/// must be in sync with graphQl types
export interface IGraphQl_GroupType {
  id: string;
  teachers: () => Promise<IGraphQl_UserType[]>;
  students: () => Promise<IGraphQl_UserType[]>;
  name: string;
  description?: string;
  updatedAt: typeof Date;
  createdAt: typeof Date;
  updater?: () => Promise<IGraphQl_UserType | undefined>;
}

export interface IGraphQl_GroupCreateInput {
  teacherIds: string[];
  studentIds: string[];
  name: string;
  description?: string;
}

export const groupsSchemaTypes = `
type GroupType {
    id: ID!
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
    teacherIds: [ID]
    studentIds: [ID]
    name: String!
    description: String
}
`;

export const groupSchemaQueries = `
    groups(ids: [ID!]!): [GroupType]!
    groupsForTeacher(teacherId: ID! nameFilter: String): [GroupType]!
    groupsForStudent(studentId: ID! nameFilter: String): [GroupType]!
`;

export const groupSchemaMutations = `
    groupCreate(newGroup: GroupCreateInput): MutationResponse
    groupDelete(id: ID!): MutationResponse
    groupChangeName(id: ID! name: String!): MutationResponse
    groupChangeDescription(id: ID! description: String!) : MutationResponse
    groupAddStudents(id: ID! studentIds: [ID!]!): MutationResponse
    groupRemoveStudents(id: ID! studentIds: [ID!]!): MutationResponse
    groupAddTeachers(id: ID! teacherIds: [ID!]!): MutationResponse
    groupRemoveTeachers(id: ID! teacherIds: [ID!]!) : MutationResponse
`;
