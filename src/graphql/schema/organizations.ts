import { IGraphQl_UserType } from "./users";
import { IGraphQl_PictureType } from "./pictures";
import { IGraphQl_BaseResponse } from ".";

export interface IGraphQL_OrganizationType
 extends IGraphQl_BaseResponse
{
  id: number;
  name: string;
  domain: string;
  picture: ()=>Promise<IGraphQl_PictureType | undefined>;
  description: string;
  updatedBy: ()=>Promise<IGraphQl_UserType | undefined>;
  createdAt: Date;
  updatedAt: Date;
};
