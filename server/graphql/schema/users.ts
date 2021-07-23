
/// must be in sync with graphQl types
export interface IGraphQl_UserType {
    id: string;
    googleId: string;
    fullName: string;
    firstName: string;
    lastName: string;
    email: string;
    picture: string;
    domain: string;
    roles: string[];
    updatedAt: typeof Date;
    createdAt: typeof Date;
    updater: ()=>Promise<IGraphQl_UserType|null>;
}

export interface IGraphQl_UserCreateStudentInput {
    googleId: string;
    userName: string;
    firstName: string;
    lastName: string;
    email: string;
    domain: string;
    picture: string;
}

export const usersSchemaTypes = `
type UserType {
    id: ID!
    googleId: ID!
    fullName: String!
    firstName: String!
    lastName: String!
    email: String!
    picture: String!
    domain: String!
    roles: [String!]!
    updatedAt: Date!
    createdAt: Date!
    updater: UserType
}
`;


export const usersSchemaInputs = `
# Used by teacher to create a student
input UserCreateStudentInput {
    googleId: ID
    userName: String!
    firstName: String!
    lastName: String!
    email: String!
    domain: String
    picture: String
}
`

export const usersSchemaQueries = `
    users(ids: [ID!]!): [UserType!]!
    userAvailableRoles: [String!]!
`;

export const usersSchemaMutations = `
    # Used by teacher to create a student, must have teacher role to do this
    userCreateStudent(newUser: UserCreateStudentInput): MutationResponse

    # must have admin roles to change this, cant set user to super admin
    userChangeRoles(id: ID!, roles: [String!]!): MutationResponse

    # move user to domain, must have admin priviledges to move anyone to our domain
    # and then a admin can only move users which have empty domain
    # super users can do anything
    userMoveToDomain(id: ID! domain: String): MutationResponse
    
    # must have super admin role to set a user to this priviledge
    userSetSuperUser(id: ID!): MutationResponse

    # must be admin to delete a user in same domain, super user to delete any users
    userDeleteUser(id: ID!): MutationResponse

`;
