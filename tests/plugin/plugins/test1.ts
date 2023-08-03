import * as plugin from '../../../src/plugin/types';

const evts = plugin.ePluginEvents;


const test1_plugin: plugin.PluginBase = {
  name : "test1",
  description: "Testing plugin one",
  prefix: "tst",
  resources: [],
  construct: (app: plugin.Express): void => {
    console.log('construct called on test1');
    // from plugin
    app.on(evts.beforeDatabaseStartup, beforeDbStartup);
    app.on(evts.beforeGraphQl, beforeGraphQl);
    app.on(evts.routesCreate, routesCreate);
    // from Express
    app.on('listening', onListening);
    app.on('close', onClose);
  }
};

export default test1_plugin;

// ------------------------------------------------------------------
// private to this module

async function beforeDbStartup() {
  console.log('test1 before Db models are created')
}
async function beforeGraphQl() {
  console.log('test1 before beforeGraphQl created')
}
async function routesCreate() {
  console.log('test1 during routes are created')
}
async function onListening() {
  console.log('test1 when server is ready')
}
async function onClose() {
  console.log('test1 when server is powering down, (normally, not interrupted)')
}