import { IGraphQl_BaseResponse } from ".";
import { IGraphQl_UserType } from "./users";

export interface IGraphQl_PictureType
  extends IGraphQl_BaseResponse
{
  id: number;
  owner: ()=>Promise<IGraphQl_UserType | undefined>;
  blob: Buffer;
  mime: string;
  title: string;
  createdAt: Date;
};
