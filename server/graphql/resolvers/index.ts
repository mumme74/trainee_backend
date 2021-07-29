import usersController from "./users";
import groupsController from "./groups";

import { composeErrorResponse } from "./helpers";
import { errorResponse, IErrorResponse } from "../../helpers/errorHelpers";
import {
  IGraphQl_ErrorResponse,
  IGraphQl_MutationResponse,
  IGraphQl_OkResponse,
} from "../schema";

// this is only for testing
const testResolvers =
  process.env.NODE_ENV !== "test"
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
            ids: ["12345676789abcd"],
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
            ids: ["12345676789abcd"],
            __typename: "OkResponse",
          };
        },
      };

// must match schema
export const graphQlResolvers = {
  ...usersController,
  ...groupsController,

  ...testResolvers,
};
