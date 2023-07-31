import { IGraphQl_UserType } from "./users";

/// must be in sync with graphQl types
export interface IGraphQl_GroupType {
  id: number;
  teachers: () => Promise<IGraphQl_UserType[]>;
  students: () => Promise<IGraphQl_UserType[]>;
  name: string;
  description?: string;
  updatedAt: Date;
  createdAt: Date;
  updater?: () => Promise<IGraphQl_UserType | undefined>;
  owner?: () => Promise<IGraphQl_UserType | undefined>;
}

export interface IGraphQl_GroupCreateInput {
  teacherIds: number[];
  studentIds: number[];
  name: string;
  description?: string;
}
