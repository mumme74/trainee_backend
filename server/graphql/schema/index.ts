import { buildSchema } from "graphql";
import "./customTypes";
import {
    usersSchemaTypes, 
    usersSchemaInputs,
    usersSchemaMutations, 
    usersSchemaQueries } from './users'

/// these must be in sync with GraphQl schema
export interface IGraphQl_Response {
    success: boolean;
    __typename: string;
}

export interface IGraphQl_ErrorResponse extends IGraphQl_Response {
    success: false;
    message: string;
    stack?: string[];
};

export interface IGraphQl_OkResponse extends IGraphQl_Response {
    success: true;
    nrAffected: number;
    ids?: string[];
}

export type IGraphQl_MutationResponse = 
    IGraphQl_OkResponse | IGraphQl_ErrorResponse;

// our API schema types
const schemaStr = `
    scalar Date

    # standard response if anything goes wrong in server
    type ErrorResponse {
        success: Boolean! # false
        message: String!
        stack: [String]
    }

    type OkResponse {
        success: Boolean! # true
        nrAffected: Int!
        ids: [ID!]
    }

    # standard response if anything goes ok or error
    union MutationResponse =  OkResponse | ErrorResponse

    ${usersSchemaTypes}

    ${usersSchemaInputs}

    type RootQuery {
        ${usersSchemaQueries}
    }

    type RootMutation {
        ${usersSchemaMutations}
    }

    schema {
        query: RootQuery
        mutation: RootMutation
    }
  `;
//console.log(schemaStr)

const graphQlSchema = buildSchema(schemaStr);
export default graphQlSchema;
