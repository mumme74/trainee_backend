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
enum core_user_Roles {
  ${rolesAvailableKeys.join('\n  ')}
}

type core_user_Type {
    id: IntID!
    fullName: String!
    firstName: String!
    lastName: String!
    email: String!
    picture: core_picture_Type
    organization: core_organization_Type!
    roles: [core_user_Roles!]!
    updatedAt: Date!
    createdAt: Date!
    updater: core_user_Type
}

input core_user_UserCreateType {
  firstName: String!
  lastName: String!
  userName: String!
  email: String!
  roles: [core_user_Roles!]
  oauthId: String
  oauthProvider: String
  domain: String
  picture: String
}
`;

export const usersSchemaInputs = `
# Used by teacher to create a student
input core_user_CreateUsersInput {
  domain: String
  users: [core_user_UserCreateType!]!
}
`;

export const usersSchemaQueries = `
  core_user_Users(ids: [IntID!]!): [core_user_Type!]!
  core_user_AvailableRoles: [core_user_Roles!]!
`;

export const usersSchemaMutations = `
    # Used by teacher to create a student,
    # must have teacher role to do this
    core_user_CreateStudents(
      bulkUsers: core_user_CreateUsersInput!
    ): MutationResponse

    # must have admin roles to change this,
    # cant set user to super admin
    core_user_ChangeRoles(
      id: IntID!,
      roles: [core_user_Roles!]!
    ): MutationResponse

    # move user to domain, must have admin priviledges
    #  to move anyone to our domain
    # and then a admin can only move users which have
    # empty domain.
    # super users can do anything
    core_user_MoveToDomain(
      id: IntID!
      domain: String
      ): MutationResponse

    # must have super admin role to set a user to this priviledge
    core_user_SetSuperUser(id: IntID!): MutationResponse

    # must be admin to delete a user in same domain, super user to delete any users
    core_user_DeleteUser(id: IntID!): MutationResponse
`;
