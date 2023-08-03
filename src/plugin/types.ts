//  Only types should exist in this file

import { Sequelize } from "sequelize";
import {
  ResolverObj,
  ResolverArgs,
  ResolverFn,
} from "../graphql/resolvers";
import { DbModel } from "./types";

export {
  DbModel,
  registerDbModel,
  registerDbPlugin,
  DbPlugin
} from "../models";
export * from 'sequelize';

import express, { Express } from 'express';
export { express, Express };


export {
  GraphQlPlugin,
  registerGraphQlPlugin
 } from "../graphql";
 export {
  IGraphQl_BaseResponse,
  IGraphQl_ErrorResponse,
  IGraphQl_MutationResponse,
  IGraphQl_OkResponse,
} from "../graphql/schema";
 export {
  ResolverObj,
  ResolverArgs,
  ResolverFn
 }
export {
  composeErrorResponse,
  composeOkResponse
} from "../graphql/helpers";


 export {
  eRolesAvailable,
  rolesAvailableKeys,
  rolesAvailableNrs,
 } from '../models/core_role';

 export { passportJWT } from "../passport";
 export { validateBody, hasRoles } from "../helpers/routeHelpers";
 export * from '../helpers/errorHelpers';
 export * from '../helpers/escapeInputs';
 export * from '../helpers/sanitize';
 export * from '../helpers/common';
 export * from '../types'


 // expose db models
 export { User } from '../models/core_user';
 export { Group } from '../models/core_group';

/**
 * The resources a plugin can use from the system
 */
export enum eResources {
  "database", "routes", "graphql", "graphql-ws"
}

/**
 * The signals a plugin can recieve from system
 */
export enum ePluginEvents {
  beforeDatabaseStartup = "beforeDatabaseStartup",
  routesCreate = "routesCreate",
  beforeGraphQl = "beforeGraphQl"
}

/**
 * This is the base of all plugins.
 * Declare them in plugin dir.
 * Expose path to this file in an .env file, like .env,production
 * Key in production
 */
export declare interface PluginBase {
  /**
   * The name os this plugin.
   * Must be unique, can't have different plugins with same name. */
  readonly name: string;
  /** A complete description of what this plugin does. */
  readonly description: string;
  /**
   * Prefix used as namespace in Db, graphQl schema and other places.
   * Must be unique, can't have different plugins with same prefix */
  readonly prefix: string;
  /**
   * Which resources this plugin uses
   * this relies on plugins beeing truthful */
  readonly resources: eResources[];
  /** Auto initializes these resources. */
  autocreate?: {
    /** if set: autoinitialize these databasemodels */
    dbModels?:DbModel[],
    /** if set: autoinitialize these paths i GraphQl system */
    graphQl?:{
      /**
       * if set: inject only these schema files (filenames only)
       *
       * if not: Use all *.graphql files in 'graphql/schema/' subfolder
       *
       * All types in schema must be prefixed by plugin prefix and subject
       * ie: read_result_SetResultsForUser
       *
       * Path to schema files: all files in 'graphql/schema/' subolder
       * with *.graphql file ending
       */
      schemas?: string[],
      /** The resolvers for our schema */
      resolvers: ResolverObj,
      /**
       * Optional: Custom types script,
       * should be located in 'graphql/types' subfolder
       */
      customTypesFile?: string,
    }
  };

  /**
   * Constructor function, gets called when plugin is required
   * @param {Express} app The global server app
   *
   * Plugins can subscribe to events in app here
   * example: app.on('listening', onStartup...)
   *
   * Plugin specific events in addition to Express
   * is defined in ePluginEvents
   */
  construct: (app: Express) => void;
}
