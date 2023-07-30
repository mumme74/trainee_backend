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

type user_Type {
    id: IntID!
    fullName: String!
    firstName: String!
    lastName: String!
    email: String!
    picture: picture_Type
    organization: organization_Type!
    roles: [Roles!]!
    updatedAt: Date!
    createdAt: Date!
    updater: user_Type
}

input user_UserCreateType {
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
input user_CreateUsersInput {
  domain: String
  users: [user_UserCreateType!]!
}
`;

export const usersSchemaQueries = `
    user_Users(ids: [IntID!]!): [user_Type!]!
    user_AvailableRoles: [Roles!]!
`;

export const usersSchemaMutations = `
    # Used by teacher to create a student,
    # must have teacher role to do this
    user_CreateStudents(
      bulkUsers: user_CreateUsersInput!
    ): MutationResponse

    # must have admin roles to change this,
    # cant set user to super admin
    user_ChangeRoles(
      id: IntID!,
      roles: [Roles!]!
    ): MutationResponse

    # move user to domain, must have admin priviledges
    #  to move anyone to our domain
    # and then a admin can only move users which have
    # empty domain.
    # super users can do anything
    user_MoveToDomain(
      id: IntID!
      domain: String
      ): MutationResponse

    # must have super admin role to set a user to this priviledge
    user_SetSuperUser(id: IntID!): MutationResponse

    # must be admin to delete a user in same domain, super user to delete any users
    user_DeleteUser(id: IntID!): MutationResponse
`;
