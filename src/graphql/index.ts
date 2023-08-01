import {
  DocumentNode,
  GraphQLScalarType,
  GraphQLSchema,
} from "graphql";

import fs from "fs";
import path from "path";

import {
  getGraphQlSchema,
  initGraphQlSchema
} from './schema';
import {
  ResolverObj,
  graphQlCoreResolvers,
  graphQlGlobalResolvers
} from "./resolvers";

// graph plugin stuff here
/**
 * The type to add to registerGraphQlPlugin
 */
export type GraphQlPlugin = {
  name: string,
  description?: string,
  prefix: string,
  rootDir: string,
  sdlFiles: string[],
  resolvers: object,
  customTypes?: GraphQLScalarType[],
}


// holds all SDL plugins registered to system
const graphQlPlugins: GraphQlPlugin[] = [];

/**
 * Registers a Sdl plugin to system
 * Muust be called before initGraphQlSchema is called
 * @param plugin
 */
export function registerGraphQlPlugin(plugin: GraphQlPlugin) {
  if (!plugin.name)
    throw new Error('SdlPlug must have a name');
  if (!plugin.rootDir)
    throw new Error('Sdlplugin must have a rootDir');
  if (getGraphQlSchema())
    throw new Error(
      "Cant add SdlPlugin after initGraphqlSchema() is called");
  if (!plugin.sdlFiles.length) {
    plugin.sdlFiles.push(
      ...fs.readdirSync(plugin.rootDir).filter(f=>f.endsWith('.graphql')));
  }
  graphQlPlugins.push(plugin);
}

const allResolvers: ResolverObj = {};

// merge all resolvers from different plugins
const mergePluginResolvers = ()=>{
  for (const plug of graphQlPlugins) {
    for (let [name, fn] of Object.entries(plug.resolvers)) {
      if (plug.prefix && !name.startsWith(`${plug.prefix}_`))
        throw new Error(
          `Resolver ${name} does not have ${plug.prefix}_ prefix, ` +
          `loaded from plugin ${plug.name}`);

      if (allResolvers[name] !== undefined)
          throw new Error(
            `Resolver ${name} added twice, importing `+
            `${plug.name} resolvers`);

      fn.plugin = plug;
      allResolvers[name] = fn;
    }
  }
}

export const getAllResolvers = (): ResolverObj => {
  return allResolvers;
}

let isInitialized = false;
export function initGraphQl() {
  if (isInitialized) return;
  initGraphQlSchema(graphQlPlugins, process.env.NODE_ENV==='development');
  mergePluginResolvers();
  isInitialized = true;
}

// -----------------------------------------------
// register system stuff down here

// read global graphql files
const globalSdlFiles = fs.readdirSync(path.join(__dirname, 'schema'))
  .filter(f=>f.endsWith('.graphql'));
if (process.env.NODE_ENV === 'production') {
  let idx: number;
  while ((idx = globalSdlFiles.findIndex(p=>p.startsWith('testing')))
         && idx > -1 )
  {
    globalSdlFiles.splice(idx, 1);
  }
}
const globalPlugin: GraphQlPlugin = {
  name: 'Global',
  description: 'The global graphql plugin',
  prefix: '',
  rootDir: path.join(__dirname, 'schema'),
  sdlFiles: [...globalSdlFiles],
  resolvers: graphQlGlobalResolvers,
}
registerGraphQlPlugin(globalPlugin);


// read core graphql files
const coreSdlFiles = fs.readdirSync(path.join(__dirname, 'schema/core'))
         .filter(f=>f.endsWith('.graphql'));

const corePlugin: GraphQlPlugin = {
  name: 'Core',
  description: 'The core to the system, user, group handling and such',
  prefix: 'core',
  rootDir: path.join(__dirname, 'schema/core'),
  sdlFiles: coreSdlFiles,
  resolvers: graphQlCoreResolvers,
}
registerGraphQlPlugin(corePlugin);
