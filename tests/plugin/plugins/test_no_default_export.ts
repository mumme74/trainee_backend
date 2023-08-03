import * as plugin from '../../../src/plugin/types';

const test_plugin: plugin.PluginBase = {
  name : "test_no_export_plugin",
  description: "Should throw, no export",
  prefix: "tst",
  resources: [],
  construct: (app: plugin.Express): void => { void(app) }
};

