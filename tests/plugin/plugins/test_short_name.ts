import * as plugin from '../../../src/plugin/types';

const test_plugin: plugin.PluginBase = {
  name : "sh",
  description: "Should throw, to short name",
  prefix: "tst",
  resources: [],
  construct: (app: plugin.Express): void => { void(app) }
};

export default test_plugin;
