import { IGraphQl_BaseResponse } from ".";
import { IGraphQL_OrganizationType } from "./organizations";
import { IGraphQl_PictureType } from "./pictures";

/// must be in sync with graphQl types
export interface IGraphQl_UserType
  extends IGraphQl_BaseResponse
{
  id: number;
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
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
  phone?: string;
  oauthId: string | null;
  oauthProvider: string | null;
  domain: string;
  picture: string;
}

export interface IGraphQl_UserCreateUsersInput {
  domain: string;
  users: [IGraphQl_UserCreateType];
}

