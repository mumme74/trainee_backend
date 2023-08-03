import * as plugin from '../../../src/plugin/types';

const test_plugin: plugin.PluginBase = {
  name : "short_prefix",
  description: "Should throw, to short name",
  prefix: "sh",
  resources: [],
  construct: (app: plugin.Express): void => { void(app) }
};

export default test_plugin;
