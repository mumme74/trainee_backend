import usersController from "./users";
import groupsController from "./groups";

// must match schema
export const graphQlResolvers = {
  ...usersController,
  ...groupsController,
};
