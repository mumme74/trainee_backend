import { IGraphQl_UserType } from "./users";

export interface IGraphQl_PictureType {
  id: number;
  owner: ()=>Promise<IGraphQl_UserType | undefined>;
  blob: Buffer;
  mime: string;
  title: string;
  createdAt: Date;
};
