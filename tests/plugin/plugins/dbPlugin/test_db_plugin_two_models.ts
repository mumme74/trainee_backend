import * as plugin from '../../../../src/plugin/types';
import { DbModelOne } from './models/test.model.one';
import { DbModelTwo } from './models/test.model.two';

const evts = plugin.ePluginEvents;


const test1_plugin: plugin.PluginBase = {
  name : "Database_plugin_test_two_models",
  description: "Testing plugin Db with 2 tables",
  prefix: "tstDb",
  resources: [plugin.eResources.database],
  autocreate: {dbModels:[DbModelOne, DbModelTwo]},
  construct: (app: plugin.Express): void => {
    app.on(evts.beforeDatabaseStartup, beforeDatabase);
  }
};

export default test1_plugin;

// ------------------------------------------------------------------
// private to this module

async function beforeDatabase() {
  console.log('before beforeDatabase created')
}