import { IGraphQl_UserType } from "./users";

export interface IGraphQl_PictureType {
  id: number;
  owner: ()=>Promise<IGraphQl_UserType>;
  blob: Buffer;
  mime: string;
  title: string;
  createdAt: Date;
};

export const picturesSchemaTypes = `
type PictureType {
  id: Int!
  owner: UserType
  blob: Blob!
  title: String
  mime: String!
  createdAt: Date!
}
`;