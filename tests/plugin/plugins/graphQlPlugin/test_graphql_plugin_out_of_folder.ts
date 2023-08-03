import * as plugin from '../../../../src/plugin/types';

const evts = plugin.ePluginEvents;

const resolvers: plugin.ResolverObj = {
  tstOutOfFolder_topic_QueryTest: (
    args: plugin.ResolverArgs,
    req?: plugin.AuthRequest,
    info?: any
  ):
    plugin.IGraphQl_BaseResponse =>
  {
    return plugin.composeOkResponse([2]);
  },
  tstOutOfFolder_topic_MutationTest: (
    args: plugin.ResolverArgs,
    req?: plugin.AuthRequest,
    info?: any
  ):
    plugin.IGraphQl_BaseResponse =>
  {
    return plugin.composeOkResponse([1])
  }
};

const test1_plugin: plugin.PluginBase = {
  name : "GraphQl_plugin_test_out_of_folder",
  description: "Testing plugin schema out of folder",
  prefix: "tstOutOfFolder",
  resources: [plugin.eResources.graphql],
  autocreate: {
    graphQl:{
      schemas:['../../schema.not.in.folder.graphql'],
      resolvers
    }
  },
  construct: (app: plugin.Express): void => {
    app.on(evts.beforeGraphQl, beforeGraphQl);
  }
};

export default test1_plugin;

// ------------------------------------------------------------------
// private to this module

async function beforeGraphQl() {
  console.log('test1 before beforeGraphQl created')
}