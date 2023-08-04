import * as plugin from '../../../src/plugin/types';

const test_plugin: plugin.PluginBase = {
  name : "short_description",
  description: "Short desc",
  prefix: "short",
  resources: [],
  construct: (app: plugin.Express): void => { void(app) }
};

export default test_plugin;
