import usersController from "./users";

// must match schema
export const graphQlResolvers = {
  ...usersController,
};
