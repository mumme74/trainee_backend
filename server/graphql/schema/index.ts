import { buildSchema } from "graphql";
import type { IErrorResponse } from "../../helpers/errorHelpers";
import "./customTypes";

import {
  usersSchemaTypes,
  usersSchemaInputs,
  usersSchemaMutations,
  usersSchemaQueries,
} from "./users";

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
  ids?: string[];
}

export type IGraphQl_MutationResponse =
  | IGraphQl_OkResponse
  | IGraphQl_ErrorResponse;

// our API schema types
const schemaStr = `
    scalar Date

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
        ids: [ID!]
    }

    # standard response if anything goes ok or error
    union MutationResponse =  OkResponse | ErrorResponse

    ${usersSchemaTypes}
    ${groupsSchemaTypes}

    ${usersSchemaInputs}
    ${groupsSchemaInputs}

    type RootQuery {
        ${usersSchemaQueries}
        ${groupSchemaQueries}
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
//console.log(schemaStr)

const graphQlSchema = buildSchema(schemaStr);
export default graphQlSchema;
