import {
  InitOptions,
  ModelStatic,
  Sequelize,
  SyncOptions,
  QueryInterface,
  Model
} from "sequelize";
import * as fsAwait from "node:fs/promises";
import fs from 'node:fs';

import { getClassName, getUserSetting, setUserSetting } from "../helpers/common";
import path from "node:path";
import { PluginBase } from "../plugin/types";

/**
 * All DB models plugins should use must implement this
 */
export interface DbModel extends ModelStatic<any> {
  bootstrap: (options: InitOptions)=>Promise<void>;
  bootstrapAfterHook: (sequelize: Sequelize)=>Promise<void>;
}

export declare type DbPlugin = {
  name: string,
  modelPrefix: string,
  dirPath: string,
  description?: string,
  isLocked?: boolean
  owner?:PluginBase
}

declare type mdlEntry = {
  plugin: DbPlugin,
  model: DbModel,
  modelName: string
}

// all models in application, initialize in this order
const dbPlugins: DbPlugin[] = [];
const modelClasses: mdlEntry[] = [];
let isDefined = false;

/**
 * Register a new plugin to database
 *
 * All models for this plugin gets prefixed by modelPrefix.
 *
 * Example: model 'Result' in plugin 'Reading' becomes
 *          Reading_Results as modelName (and tableName in database)
 *
 * @param {string} name The name of the plugin
 * @param {string} modelPrefix Prefix with this
 * @param {string} dirPath The dir where all of this plugins model files are located
 * @param {string} [description] Optional description for plugin
 * @returns {DbPlugin} The plugin thats been created
 */
export function registerDbPlugin(
  name:string,
  modelPrefix: string,
  dirPath: string,
  description?:string
): DbPlugin {
  if (isDefined)
    throw new Error(
      `Can't register plugin ${name} after defineDb is called`);
  const exists = dbPlugins.find(p=>p.name === name);
  if (exists)
      throw new Error(`Plugin ${name} already registered`);
  const plug = {name,modelPrefix,dirPath,description}
  dbPlugins.push(plug);
  return plug;
}

/**
 * Lock plugin so we can't add more models to it
 * Used to lock down a plugin so another plugin does not interfere
 * With this plugin's models
 * @param {string | DbPlugin} plugin The plugin to close
 */
export function lockDbPlugin(plugin: string | DbPlugin) {
  const plug = typeof plugin === 'string' ?
    findDbPlugin(plugin) : plugin;
  plug.isLocked = true;
}

/**
 * Register a DB model to the application
 * All Models must be registered before defineDb is called
 * @param {DbModel} model The model to register so bootstrap is called on it
 * @param {string} modelName The tableName stored in database
 * @param {DbPlugin | string} plugin The plugin to associate model with
 */
export function registerDbModel(
  model: DbModel,
  plugin: string | DbPlugin,
  modelName?: string,
)  {
  modelName = modelName || getClassName(model);

  if (isDefined)
    throw new Error(
      `Could not register ${model}, database is already defined`);

  const plug = typeof plugin === 'string' ?
    findDbPlugin(plugin) : plugin;
  if (plug.isLocked)
    throw new Error(
      `Can't add ${modelName} because DbPlugin ${plugin} is closed`)

  const p2 = modelClasses.find(e=>e.model=== model)
  if (p2)
    throw new Error(
      `Model ${modelName} is already registered to plugin ${p2.plugin.name}`)

  modelClasses.push({
    model, plugin: plug,
    modelName
  });
}

/**
 * Workaround multiple unique indexes being created every
 * time Sequelize re-syncs, see bug https://github.com/sequelize/sequelize/issues/12889
 * Should only affect sequelize < 7.0
 * @param {QueryInterface} queryInterface The query interface to run queries on
 * @param {DbModel} model The model to clean indexes from
 * @param {SyncOptions} options The options sequelize is initialized with
 * @returns {Promise<void>}
 */
async function cleanUpUniqueIndex(
  queryInterface: QueryInterface,
  model:ModelStatic<any>,
  options: SyncOptions
): Promise<void> {
  if (options.alter === false) return;
  const existingIndexes = await queryInterface
    .showIndex(model.tableName, options) as Array<{[key:string]:any}>;
  // filter in only unique indexes with duplicates of name
  // such as name_2, name_3, but keep name
  const duplicateIdxMap = existingIndexes
    .filter(idx=>idx.name!=='PRIMARY' && idx.unique)
    .reduce((p, v)=>{
      const name = v.name.replace(/^(.*)_\d*/,"$1");
      if (!p[name]) p[name] = [];
      else p[name].push(v.name);
      return p;
    },{});
  for (const idx of Object.values(duplicateIdxMap)) {
    for (const duplicate of idx) {
      await queryInterface.removeIndex(model.tableName, duplicate, options);
    }
  }
}

/**
 * Initializes db and the models
 *
 * Reads from .env.production or .env.dev file
 * Builds the connectionsString to sequelize and
 * calls defineDb
 * @returns {Promise<Sequelize>} The sequelize singleton
 */
export async function initDb() {
  const dbHost = process.env.DB_HOST || "localhost";
  const dbUser = process.env.DB_USER;
  const dbPass = process.env.DB_PASS;
  const dbPort = process.env.DB_PORT || 3306;
  const dbName = process.env.DB_NAME||"";

  const connectionString = `mysql://${dbUser}:${dbPass}@${dbHost}:${dbPort}/${dbName}`;
  return await defineDb(connectionString, {
    logging: process.env.NODE_ENV !== 'production' ?
      console.log : console.log
  });
}

/**
 * Creates Sequelize and defines the models
 * @param {string} connectionString  Connection string to Sequelize
 * @returns {Promise<Sequelize>} The sequelize singleton
 */
export async function defineDb(
  connectionString: string,
  opt: {[key:string]:any} = {}
) {
  if (isDefined)
    throw new Error("defineDb called when DB is already defined");

  // if true it drops database
  const force = typeof opt.sync?.force !== 'undefined' ?
    opt.sync.force : false,
  // if true if alters (recreates the database on startup)
  alter = typeof opt.sync?.alter !== 'undefined' ?
    opt.sync.alter : await shouldAlterDb();

  sequelize = new Sequelize(connectionString, opt);

  // init models
  for (const entry of modelClasses)
    await entry.model.bootstrap(
      genInitOptions(sequelize, entry, alter));

  // set up associations
  for (const mdlEntry of modelClasses)
    await mdlEntry.model.bootstrapAfterHook(sequelize);

  if (alter || force) {
    await sequelize.sync({
      force, alter,
      hooks: alter
    });
    setUserSetting('lastDbAlter', new Date().getTime());
  }

  isDefined = true;

  console.log('Started database');
  return sequelize
}

export const getSequelize = ():Sequelize => sequelize;
export function closeDb() {
  sequelize.close();
}

// ----------------------------------------------------------------
// only for testing
export const resetDb_onlyForTesting = process.env.NODE_ENV === 'test' ?
  async () => {
    try {
      await sequelize?.drop();
    } catch (e) {
      console.error(e);
    }
    isDefined = false;
    dbPlugins.splice(0);
    modelClasses.splice(0);
    registerCore();
  } :
  () => { throw new Error('resetDb_onlyForTesting() Only used for testing'); }

/**
 * only exported for testing purpose
 * Treat as private to this module
 **/
export const findDbPlugin = process.env.NODE_ENV === 'test' ?
  (name: string) => {
    const plug = dbPlugins.find(p=>p.name===name);
    if (!plug)
      throw new Error(`DbPlugin ${name} not found`);
    return plug;
  } :
  ()=>{ throw new Error('findDbPlugin(..) only for testing')}

/**
 * only exported for testing purpose
 * Treat as private to this module
 **/
export const findDbModelEntry = process.env.NODE_ENV === 'test' ?
  (model: DbModel, plugin: string) => {
    const plug = findDbPlugin(plugin);
    const mdl = modelClasses.find(e=>e.plugin===plug && e.model === model);
    return mdl;
  } :
  ()=>{ throw new Error('findDbModelEntry(...) Only for testing')}


// ----------------------------------------------------------------
// private to this module from here on

let sequelize: Sequelize;

const shouldAlterDb = async ()=>{
  let lastDbAlter = await getUserSetting('lastDbAlter') || 0,
      lastModifiedMs = lastDbAlter;

  for (const plug of dbPlugins) {
    const files = await fsAwait.readdir(plug.dirPath)
    for (const file of files.filter(
      f=>f.startsWith(plug.modelPrefix) && !f.endsWith('.map')))
    {
      const stat = await fsAwait.stat(path.join(plug.dirPath, file));
      lastModifiedMs = Math.max(lastModifiedMs, stat.mtimeMs);
    }
  }

  return lastDbAlter < lastModifiedMs;
}

const genModelName = (entry: mdlEntry) => {
  return `${entry.plugin.modelPrefix}_${entry.modelName}s`;
}

const genInitOptions = (
  sequelize: Sequelize,
  entry: mdlEntry,
  alter: boolean
): InitOptions => {
  return {
    sequelize,
    modelName: genModelName(entry),
    hooks: {
      // workaround for sequelize creating duplicate indexes for unique
      // fields bug https://github.com/sequelize/sequelize/issues/12889
      // should affect affects sequelize < 7.0
      afterSync: async (options: SyncOptions) => {
        await cleanUpUniqueIndex(
          sequelize.getQueryInterface(), entry.model, options);
      }
    }
  }
}

function registerCore() {
  const plug = registerDbPlugin(
    "Core",
    "core",
    __dirname,
    `All models for the core system`);

  // read sync to make sure core is initialized before any other plugins
  const files = fs.readdirSync(plug.dirPath);
  const exports = files
    .filter(f=>f.startsWith(plug.modelPrefix) && !f.endsWith('.map'))
    .map(mdlFile=>{
      //console.log(`init core model ${mdlFile}`)
      return require(`./${mdlFile.replace(/\.[jt]s?$/, "")}`);
    });

  for (const exp of exports) {
    for (const [name, vlu] of Object.entries(exp)) {
      if ((vlu as any).prototype instanceof  Model)
        registerDbModel(vlu as DbModel, plug, name)
    }

  }
}
registerCore();

