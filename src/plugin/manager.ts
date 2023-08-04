// controls the plugin loading
import { PluginBase, ePluginEvents} from './types';
import { GraphQlPlugin, registerGraphQlPlugin } from '../graphql';
import { getClassName, getRootPath } from '../helpers/common';
import {
  registerDbModel,
  registerDbPlugin,
} from '../models/index';

import path from 'path';
import fs from 'fs'
import { GraphQLScalarType } from 'graphql';
import { Express } from 'express';

/**
 * load all plugins specified in .env file
 * pattern:
 *   PLUGIN.1=path/to/plugin/one
 *   PLUGIN.2=path/to/plugin/two
 */
export function requirePlugins(app: Express): void {
  const pluginPaths = Object.entries(process.env)
        .filter(row=>/PLUGIN\.\d+/.test(row[0] as string))
        .map(p=>(""+p[1]).trim());

  const tryOn = (obj:PluginObj, fn:(obj:PluginObj)=>Promise<void>)=>{
    return async ()=>{
      try {
        await fn(obj);
      } catch(e: any) {
        console.error(`Error in plugin: ${obj.name}, ${e.message||e}\n${e.stack}`);
      }
    }
  }

  for (const pluginPath of pluginPaths) {
    try {
      const pat = path.join(getRootPath(), pluginPath)
      const plugin = require(pat)?.default;
      if (!plugin)
        throw new Error(`Plugin did not default export a PluginBase, ${pluginPath}`);
      if (plugin.name?.length < 3)
        throw new Error(
          `Must give name to plugin, at least 3chars long ${pluginPath}`);
      if (plugin.prefix?.length < 3)
        throw new Error(
          `Plugin prefix must be at least 3chars in ${plugin.name}`);
      if (plugin.description?.length < 10)
        throw new Error(
          `Must have a detailed description to ${plugin.name}`);

      const pluginObj = {name:plugin.name, plugin, path:pat};
      allPlugins.set(plugin.name, pluginObj);
      app.on(ePluginEvents.beforeDatabaseStartup,
        tryOn(pluginObj, autoCreateDbModels));
      app.on(ePluginEvents.beforeGraphQl,
        tryOn(pluginObj, autoCreateGraphQl));

      plugin.construct(app);

    } catch (err: any) {
      const e = err as Error;
      console.error(
      `Error loading plugin ${pluginPath} `+
      `error: ${e.message || e}`);
      throw e;
    }
  }
}

/**
 * Get plugin matching name or path from loaded plugins
 * @param {Object} argObj object with either Name or Path to plugin
 * @param {string} argObj.name Get plugin with this name
 * @param {string} argObj.path Get the plugin with path
 * @returns {PluginBase | undefined} The plugin found
 */
export function getPlugin(
  {name, path}: {name?:string, path?: string}
): PluginBase | undefined {
  if (name)
    return allPlugins.get(name)?.plugin;
  if (path)
    for (const plugObj of allPlugins.values())
      if (plugObj.path === path) return plugObj.plugin;
}

// -------------------------------------------------------------
// private stuff to this module

type PluginObj = {
  name: string,
  plugin: PluginBase,
  path: string,
}

const allPlugins: Map<string, PluginObj> = new Map();

/// only exported for testing
export const _clearPlugins = process.env.NODE_ENV === 'test' ?
 ()=>{allPlugins.clear()} :
 ()=>{ throw '_clearPlugins() only for testing'}

async function autoCreateDbModels(pluginObj: PluginObj) {
  const plugin = pluginObj.plugin;
  if (!plugin.autoCreate?.dbModels) return;
  const modelsDir = path.join(
    path.dirname(pluginObj.path), 'models');
  const dbPlug = registerDbPlugin(plugin.name, plugin.prefix, modelsDir);

  for (const model of plugin.autoCreate?.dbModels) {
    registerDbModel(
      model, dbPlug, getClassName(model));
  }
}

async function autoCreateGraphQl(pluginObj: PluginObj) {
  const plugin = pluginObj.plugin;
  if (!plugin.autoCreate?.graphQl) return;

  const pluginDir = path.dirname(pluginObj.path);
  const schemasDir = path.join(pluginDir, 'graphql/schema');

  const schemas = (!plugin.autoCreate?.graphQl.schemas) ?
    fs.readdirSync(schemasDir).filter(f=>f.endsWith('.graphql')) :
    [...plugin.autoCreate.graphQl.schemas];

  let customTypes:GraphQLScalarType<unknown, unknown>[] | undefined;
  if (plugin.autoCreate.graphQl.customTypesFile) {
    const typePath = path.join(
      pluginDir,
      'graphql/types',
      plugin.autoCreate.graphQl.customTypesFile);

    try {
      customTypes = require(typePath);
    } catch (e) {
      console.error(`Error loading custom type: '${typePath}'`);
      throw e;
    }
  }

  const gqlPlugin: GraphQlPlugin = {
    name: plugin.name,
    prefix: plugin.prefix,
    schemaDir: schemasDir,
    sdlFiles: schemas,
    resolvers: plugin.autoCreate.graphQl.resolvers,
    customTypes
  };

  registerGraphQlPlugin(gqlPlugin)
}
