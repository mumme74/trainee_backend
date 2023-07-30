import { buildSchema } from "graphql";
import type { IErrorResponse } from "../../helpers/errorHelpers";
import "./customTypes";

import {
  usersSchemaTypes,
  usersSchemaInputs,
  usersSchemaMutations,
  usersSchemaQueries,
} from "./users";

import { picturesSchemaTypes } from "./pictures";
import { organizationSchemaTypes } from "./organizations";

import {
  groupsSchemaTypes,
  groupsSchemaInputs,
  groupSchemaQueries,
  groupSchemaMutations,
} from "./groups";

/// these must be in sync with GraphQl schema
export interface IGraphQl_Response {
  success: boolean;
  __typename: string;
}

export interface IGraphQl_ErrorResponse
  extends IGraphQl_Response,
    IErrorResponse {
  success: false;
}

export interface IGraphQl_OkResponse extends IGraphQl_Response {
  success: true;
  nrAffected: number;
  ids?: number[];
}

export type IGraphQl_MutationResponse =
  | IGraphQl_OkResponse
  | IGraphQl_ErrorResponse;

const testingErrorResponseQueries = `
  # should only be active when we run tests
  testError: Error
  testErrorResponse: ErrorResponse
  testOkResponse: OkResponse
  testMutationResponseErr: MutationResponse
  testMutationResponseOk: MutationResponse
`;

// our API schema types
const schemaStr = `
    scalar Date
    scalar Blob
    scalar IntID

    type Error {
      message: String!
      stack: [String]
      type: String
    }

    # standard response if anything goes wrong in server
    type ErrorResponse {
        success: Boolean! # false
        error: Error
    }

    type OkResponse {
        success: Boolean! # true
        nrAffected: Int!
        ids: [IntID!]
    }

    # standard response if anything goes ok or error
    union MutationResponse =  OkResponse | ErrorResponse

    ${usersSchemaTypes}
    ${picturesSchemaTypes}
    ${groupsSchemaTypes}
    ${organizationSchemaTypes}

    ${usersSchemaInputs}
    ${groupsSchemaInputs}

    type RootQuery {
        ${usersSchemaQueries}
        ${groupSchemaQueries}
        ${testingErrorResponseQueries}
    }

    type RootMutation {
        ${usersSchemaMutations}
        ${groupSchemaMutations}
    }

    schema {
        query: RootQuery
        mutation: RootMutation
    }
`;
// console.log(schemaStr)

const graphQlSchema = buildSchema(schemaStr);
export default graphQlSchema;
