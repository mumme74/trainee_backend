import {
  InitOptions,
  ModelStatic,
  Sequelize,
  SyncOptions,
  QueryInterface
} from "sequelize";
import fs from "fs";

import { getClassName } from "../helpers/common";

/**
 * All DB models plugins should use must implement this
 */
export interface DbModel extends ModelStatic<any> {
  bootstrap: (options: InitOptions)=>Promise<void>;
  bootstrapAfterHook: (sequelize: Sequelize)=>Promise<void>;
}

export declare type dbPlugin = {
  name: string,
  modelPrefix: string,
  description?: string,
  closed?: boolean
}

declare type mdlEntry = {
  plugin: dbPlugin,
  model: DbModel,
  modelName: string
}

// all models in application, initialize in this order
const dbPlugins: dbPlugin[] = [];
const modelClasses: mdlEntry[] = [];
let isDefined = false;

/**
 * only exported for testing purpose
 * Treat as private to this module
 **/
export const findDbPlugin = (name: string) => {
  const plug = dbPlugins.find(p=>p.name===name);
  if (!plug)
    throw new Error(`DbPlugin ${name} not found`);
  return plug;
}

/**
 * only exported for testing purpose
 * Treat as private to this module
 **/
export const findDbModelEntry = (model: DbModel, plugin: string) => {
  const plug = findDbPlugin(plugin);
  const mdl = modelClasses.find(e=>e.plugin===plug && e.model === model);
  return mdl;
}

/**
 * Register a new plugin to database
 *
 * All models for this plugin gets prefixed by modelPrefix.
 *
 * Example: model 'Result' in plugin 'Reading' becomes
 *          Reading_Results as modelName (and tablename in database)
 *
 * @param {string} name The name of the plugin
 * @param {string} modelPrefix Prefix with this
 * @param {string} [description] Optional description for plugin
 * @returns {dbPlugin} The plugin thats been created
 */
export function registerDbPlugin(
  name:string,
  modelPrefix: string,
  description?:string
): void {
  if (isDefined)
    throw new Error(
      `Can't register plugin ${name} after defineDb is called`);
  const exists = dbPlugins.find(p=>p.name === name);
  if (exists)
      throw new Error(`Plugin ${name} already registered`);
  const plug = {name,modelPrefix,description}
  dbPlugins.push(plug);
}

/**
 * Close plugin so we can't add more models to it
 * Used to lock down a plugin so another plugin does not interfere
 * With this plugin's models
 * @param {string} name The name of the plugin to close
 */
export function closeDbPlugin(name: string) {
  const plug = findDbPlugin(name);
  plug.closed = true;
}

/**
 * Register a DB model to the application
 * All Models must be registered before defineDb is called
 * @param {DbModel} model The model to register so bootstrap is called on it
 * @param {string} modelName The tablename stored in database
 * @param {dbPlugin | string} plugin The plugin to associate model with
 */
export function registerDbModel(
  model: DbModel,
  plugin: string,
  modelName?: string,
)  {
  modelName = modelName || getClassName(model);

  if (isDefined)
    throw new Error(
      `Could not register ${model}, database is already defined`);

  const plug = findDbPlugin(plugin);
  if (plug.closed)
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
 * Workaround multiple unique indexes beeing created every
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
  if (!options.alter) return;
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
    logging: process.env.NODE_ENV !== 'production'
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

  const force = opt.sync?.force || false, // if true it drops database
  alter = opt.sync?.alter;

  const sequelize = new Sequelize(connectionString, opt);

  // init models
  for (const entry of modelClasses)
    await entry.model.bootstrap(
      genInitOptions(sequelize, entry, alter));

  // set up associations
  for (const mdlEntry of modelClasses)
    await mdlEntry.model.bootstrapAfterHook(sequelize);

  await sequelize.sync({
    force, alter,
    hooks: alter
  });

  isDefined = true;

  console.log('Started database');
  return sequelize
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
        if (alter) return;
        await cleanUpUniqueIndex(
          sequelize.getQueryInterface(), entry.model, options);
      }
    }
  }
}

(()=>{
  registerDbPlugin(
    "Core",
    "core",
    `All models for the core system`);

  // read sync to make sure core is initialized before any plugins
  const files = fs.readdirSync(__dirname);
  files
    .filter(f=>f.startsWith('core_') && !f.endsWith('.map'))
    .forEach(mdlFile=>{
      //console.log(`init core model ${mdlFile}`)
      require(`./${mdlFile.replace(/\.[jt]s?$/, "")}`);
    })
})();

