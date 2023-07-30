import { IGraphQl_UserType } from "./users";

export interface IGraphQl_PictureType {
  id: number;
  owner: ()=>Promise<IGraphQl_UserType | undefined>;
  blob: Buffer;
  mime: string;
  title: string;
  createdAt: Date;
};

export const picturesSchemaTypes = `
type core_picture_Type {
  id: IntID!
  owner: core_user_Type
  blob: Blob!
  title: String
  mime: String!
  createdAt: Date!
}
`;