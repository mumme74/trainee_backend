import { IGraphQl_UserType } from "./users";
import { IGraphQl_PictureType } from "./pictures";

export interface IGraphQL_OrganizationType {
  id: number;
  name: string;
  domain: string;
  picture: ()=>Promise<IGraphQl_PictureType>;
  description: string;
  updatedBy: ()=>Promise<IGraphQl_UserType>;
  createdAt: Date;
  updatedAt: Date;
};

export const organizationSchemaTypes = `
type OrganizationType {
  id: Int!
  name: String!
  domain: String!
  picture: PictureType
  description: String!
  updatedBy: UserType
  createdAt: Date!
  updataedAt: Date!
}
`;