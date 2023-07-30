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
type picture_Type {
  id: IntID!
  owner: user_Type
  blob: Blob!
  title: String
  mime: String!
  createdAt: Date!
}
`;