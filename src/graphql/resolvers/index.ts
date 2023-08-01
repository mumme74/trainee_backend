import usersController from "./users";
import groupsController from "./groups";

import { composeErrorResponse } from "../helpers";
import { errorResponse, IErrorResponse } from "../../helpers/errorHelpers";
import {
  IGraphQl_BaseResponse,
  IGraphQl_ErrorResponse,
  IGraphQl_MutationResponse,
  IGraphQl_OkResponse,
} from "../schema";
import { AuthRequest } from "../../types";


// this is only for testing
const testResolvers =
  process.env.NODE_ENV === "production"
    ? {}
    : {
        testError: () => {
          return errorResponse("This is a test error").error;
        },
        testErrorResponse: (): IGraphQl_ErrorResponse => {
          return composeErrorResponse("This is a test ErrorResponse");
        },
        testOkResponse: (): IGraphQl_OkResponse => {
          return {
            success: true,
            nrAffected: 0,
            ids: [9],
            __typename: "OkResponse",
          };
        },
        testMutationResponseErr: (): IGraphQl_MutationResponse => {
          return composeErrorResponse("This is a test ErrorResponse");
        },
        testMutationResponseOk: (): IGraphQl_MutationResponse => {
          return {
            success: true,
            nrAffected: 0,
            ids: [10],
            __typename: "OkResponse",
          };
        },
      };


export type ResolverFn =
  (args?:{[key:string]:any}, context?:AuthRequest, info?: any)=>
    IGraphQl_BaseResponse | Promise<IGraphQl_BaseResponse>;

export type ResolverObj = {[key:string]: ResolverFn};
// these are part of the system
export const graphQlGlobalResolvers = {
  ...testResolvers
};

// must match schema definitions
export const graphQlCoreResolvers = {
  ...usersController,
  ...groupsController,
};
