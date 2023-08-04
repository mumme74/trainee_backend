import * as plugin from '../../../../src/plugin/types';
import { DbModelOne } from './models/test.model.one';

const evts = plugin.ePluginEvents;


const test1_plugin: plugin.PluginBase = {
  name : "Database_plugin_test",
  description: "Testing plugin Db one",
  prefix: "tstDb",
  resources: [plugin.eResources.database],
  autoCreate: {dbModels:[DbModelOne]},
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