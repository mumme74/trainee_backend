import * as plugin from '../../../../src/plugin/types';

const evts = plugin.ePluginEvents;

const resolvers: plugin.ResolverObj = {
  tstWType_topic_QueryTest: (
    args: plugin.ResolverArgs,
    req?: plugin.AuthRequest,
    info?: any
  ):
    plugin.IGraphQl_BaseResponse =>
  {
    return plugin.composeOkResponse([2]);
  },
  tstWType_topic_MutationTest: (
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
  name : "GraphQl_plugin_test_custom_type",
  description: "Testing plugin with custom type",
  prefix: "tstWType",
  resources: [plugin.eResources.graphql],
  autoCreate: {
    graphQl:{
      schemas:['../schema.custom.type.graphql'],
      resolvers,
      customTypesFile:'testCustomType'
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