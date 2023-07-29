import { rolesAvailableKeys } from "../../models/core_role";
import { IGraphQL_OrganizationType } from "./organizations";
import { IGraphQl_PictureType } from "./pictures";

/// must be in sync with graphQl types
export interface IGraphQl_UserType {
  id: number;
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  picture?: ()=> Promise<IGraphQl_PictureType | undefined>;
  organization?: ()=> Promise<IGraphQL_OrganizationType | undefined>;
  roles: ()=> Promise<string[]>;
  lastLogin: Date;
  updatedAt: Date;
  createdAt: Date;
  updater?: () => Promise<IGraphQl_UserType | undefined>;
}

export interface IGraphQl_UserCreateType {
  firstName: string;
  lastName: string;
  userName: string;
  roles: string[];
  email: string;
  oauthId: string | null;
  oauthProvider: string | null;
  domain: string;
  picture: string;
}

export interface IGraphQl_UserCreateUsersInput {
  domain: string;
  users: [IGraphQl_UserCreateType];
}

export const usersSchemaTypes = `
enum Roles {
  ${rolesAvailableKeys.join('\n  ')}
}

type UserType {
    id: IntID!
    fullName: String!
    firstName: String!
    lastName: String!
    email: String!
    picture: PictureType
    organization: OrganizationType!
    roles: [Roles!]!
    updatedAt: Date!
    createdAt: Date!
    updater: UserType
}

input UserCreateType {
  firstName: String!
  lastName: String!
  userName: String!
  email: String!
  roles: [Roles!]
  oauthId: String
  oauthProvider: String
  domain: String
  picture: String
}
`;

export const usersSchemaInputs = `
# Used by teacher to create a student
input UserCreateUsersInput {
  domain: String
  users: [UserCreateType!]!
}
`;

export const usersSchemaQueries = `
    users(ids: [IntID!]!): [UserType!]!
    userAvailableRoles: [String!]!
`;

export const usersSchemaMutations = `
    # Used by teacher to create a student, must have teacher role to do this
    userCreateStudent(newUser: UserCreateUsersInput): MutationResponse

    # must have admin roles to change this, cant set user to super admin
    userChangeRoles(id: IntID!, roles: [String!]!): MutationResponse

    # move user to domain, must have admin priviledges to move anyone to our domain
    # and then a admin can only move users which have empty domain
    # super users can do anything
    userMoveToDomain(id: IntID! domain: String): MutationResponse

    # must have super admin role to set a user to this priviledge
    userSetSuperUser(id: IntID!): MutationResponse

    # must be admin to delete a user in same domain, super user to delete any users
    userDeleteUser(id: IntID!): MutationResponse

`;
