import dotenv from "dotenv";
dotenv.config({ path: `.env.test` }); // must be done before any other imports

import "../testProcess.env"
import {
  PluginBase,
  eResources,
  express,
  Express,
  ePluginEvents,
  DbModel,
  Model,
  User,
  ModelStatic,
  QueryTypes,
  getRootPath
} from "../../src/plugin/types";
import {
  requirePlugins,
  _clearPlugins,
  getPlugin
} from "../../src/plugin/manager";
import { MockConsole } from "../testHelpers";
import { initTestDb, closeTestDb } from '../testingDatabase'
import { getSequelize, resetDb_onlyForTesting } from "../../src/models";

import path from "path";
import { getGraphQlSchema } from "../../src/graphql/schema";
import { clearGraphQlPlugins, getGraphQlPlugin, initGraphQl } from "../../src/graphql";


const toConsoleAtEnd = true;

const origEnv = {...process.env};

const pluginsPath = path.join(getRootPath(), 'tests/plugin/plugins');

enum eSchTp {
  Mutation = '_mutationType',
  Query = '_queryType',
  Subscription = '_subscriptionType'
}
const schemaFld = (type: eSchTp, key:string): any => {
  const schema = getGraphQlSchema() as any;
  try {
    return schema[type]?._fields[key];
  } catch {
    return false;
  }
}

let mockConsole: MockConsole;

beforeAll(()=>{
  mockConsole = new MockConsole();
});

afterAll(()=>{
  mockConsole.restore();
  if (toConsoleAtEnd) {
    const stdout = mockConsole.stdout,
          stderr = mockConsole.stderr;
    if (stdout.length) console.log(stdout);
    if (stderr.length) console.error(stderr);
  }
  process.env = origEnv;
});

let app: Express;
beforeEach(()=>{
  app = express();

  for (const key of Object.keys(process.env)) {
    if (key.startsWith('PLUGIN.'))
      delete process.env[key];
  }
})

afterEach(()=>{
  _clearPlugins();
  mockConsole.clear();
})

describe('Test plugin loading', ()=>{

  it('Should throw not finding plugin', ()=>{
    process.env['PLUGIN.1'] = 'tests/plugin/plugins/test_nonexists';
    expect(()=>{
      requirePlugins(app);
    }).toThrowError(/^Cannot find module /);
    const stderr = mockConsole.stderr,
          matchStr = `Error loading plugin ${process.env['PLUGIN.1']}`
    expect(stderr?.at(0)?.substr(0, matchStr.length)).toBe(matchStr);
  });

  it('Should throw no default export', ()=>{
    process.env['PLUGIN.1'] = 'tests/plugin/plugins/test_no_default_export';
    expect(()=>{
      requirePlugins(app);
    }).toThrowError(/^Plugin did not default export a PluginBase/);;
  });

  it('Should throw short name', ()=>{
    process.env['PLUGIN.1'] = 'tests/plugin/plugins/test_short_name';
    expect(()=>{
      requirePlugins(app);
    }).toThrowError(/^Must give name to plugin/);;
  });

  it('Should throw short prefix', ()=>{
    process.env['PLUGIN.1'] = 'tests/plugin/plugins/test_short_prefix';
    expect(()=>{
      requirePlugins(app);
    }).toThrowError(/^Plugin prefix must be at least/);;
  });

  it('Should throw short description', ()=>{
    process.env['PLUGIN.1'] = 'tests/plugin/plugins/test_short_description';
    expect(()=>{
      requirePlugins(app);
    }).toThrowError(/^Must have a detailed description/);;
  });

  it('Should call construct on both plugins', ()=>{
    process.env['PLUGIN.1'] = "tests/plugin/plugins/test1";
    process.env['PLUGIN.2'] = "tests/plugin/plugins/test2";
    requirePlugins(app);
    const std = mockConsole.stdout;
    //mockConsole.debug(std);
    expect(std[0]).toBe('construct called on test1\n');
    expect(std[1]).toBe('construct called on test2\n');
  })
});

describe("getPlugin tests", ()=>{
  it('Should find plugin test1 from name', ()=>{
    process.env['PLUGIN.1'] = 'tests/plugin/plugins/test1';
    requirePlugins(app);
    const plug = getPlugin({name:'test1'});
    expect(plug).toMatchObject(
      {name:'test1',prefix:'tst'});
  });

  it('Should return undefined for none existent search', ()=>{
    process.env['PLUGIN.1'] = 'tests/plugin/plugins/test1';
    requirePlugins(app);
    expect(getPlugin({name:'none_existent'})).toBe(undefined);
  });

  it('Should find plugin test1 from path', ()=>{
    process.env['PLUGIN.1'] = 'tests/plugin/plugins/test1';
    requirePlugins(app);
    const plug = getPlugin({path: path.join(pluginsPath, 'test1')});
    expect(plug).toMatchObject(
      {name:'test1',prefix:'tst'});
  });

  it('Should return undefined for none existent path search', ()=>{
    process.env['PLUGIN.1'] = 'tests/plugin/plugins/test1';
    requirePlugins(app);
    const plug = getPlugin({path:'/none/existent/test1'});
    expect(plug).toBe(undefined);
  });
});

describe("Test autoCreate", ()=>{
  afterEach(()=>{
    clearGraphQlPlugins();
  })

  it("Should autoCreate graphQl schema", async ()=>{
    process.env['PLUGIN.1'] =
      'tests/plugin/plugins/graphQlPlugin/test_graphql_plugin';
    requirePlugins(app);
    await app.emit(ePluginEvents.beforeGraphQl);
    const plugin = getGraphQlPlugin('GraphQl_plugin_test');
    expect(mockConsole.stderr[0]).toBe(undefined);
    expect(plugin).toMatchObject({
      name:'GraphQl_plugin_test',
      prefix:'tst',
      sdlFiles: ['schema.graphql'],
      schemaDir: path.join(pluginsPath, 'graphQlPlugin/graphql/schema'),
    });
    expect(Object.keys(plugin?.resolvers??{})).toEqual(
      expect.arrayContaining([
        'tst_topic_QueryTest','tst_topic_MutationTest'
      ])
    );
  });

  it("Should autoCreate graphQl with schema out of folder", async ()=>{
    process.env['PLUGIN.1'] =
      'tests/plugin/plugins/graphQlPlugin/test_graphql_plugin_out_of_folder';
    requirePlugins(app);
    await app.emit(ePluginEvents.beforeGraphQl);
    const plugin = getGraphQlPlugin('GraphQl_plugin_test_out_of_folder');
    expect(mockConsole.stderr[0]).toBe(undefined);
    expect(plugin).toMatchObject({
      name:'GraphQl_plugin_test_out_of_folder',
      prefix:'tstOutOfFolder',
      sdlFiles: ['../../schema.not.in.folder.graphql'],
      schemaDir: path.join(pluginsPath, 'graphQlPlugin/graphql/schema'),
    });
    expect(Object.keys(plugin?.resolvers??{})).toEqual(
      expect.arrayContaining([
        'tstOutOfFolder_topic_MutationTest','tstOutOfFolder_topic_MutationTest'
      ])
    );
  });

  it("Should autoCreate schema and resolver for plugin", async ()=>{
    process.env['PLUGIN.1'] =
      'tests/plugin/plugins/graphQlPlugin/test_graphql_plugin';
    requirePlugins(app);
    await app.emit(ePluginEvents.beforeGraphQl);
    initGraphQl();
    expect(
      schemaFld(eSchTp.Mutation, 'tst_topic_MutationTest')
    ).toBeTruthy();
    expect(
      schemaFld(eSchTp.Query, 'tst_topic_QueryTest')
    ).toBeTruthy();
  });

  it("Should autoCreate a custom type", async ()=>{
    process.env['PLUGIN.1'] =
      'tests/plugin/plugins/graphQlPlugin/test_graphql_plugin_custom_type';
    requirePlugins(app);
    await app.emit(ePluginEvents.beforeGraphQl);
    initGraphQl();
    const plug = getGraphQlPlugin('GraphQl_plugin_test_custom_type');
    expect(Object.keys(plug?.customTypes||{})).toMatchObject(['testType']);
    expect((plug as any)?.customTypes?.testType.name||"")
      .toBe('TestType');
    const schema = getGraphQlSchema();
    expect(Object.keys((schema as any)?._typeMap||{})).toContain('TestType')
  })
});

describe("Test database plugin", ()=>{
  let dbOneModel: ModelStatic<any>,
      dbTwoModel: ModelStatic<any>;

  afterEach(async ()=>{
    await resetDb_onlyForTesting();
  });

  afterAll(async ()=>{
    await closeTestDb(true);
  })

  it('Should autoCreate table from dbModel', async ()=>{
    process.env['PLUGIN.1'] =
      'tests/plugin/plugins/dbPlugin/test_db_plugin';
    requirePlugins(app);
    await app.emit(ePluginEvents.beforeDatabaseStartup);
    expect(mockConsole.stdout[0]).toBe('before beforeDatabase created\n')
    await initTestDb(true)

    const sequelize = getSequelize();
    dbOneModel = sequelize.models.tstDb_DbModelOnes;
    const tables = await sequelize.query(
      "SELECT name FROM sqlite_schema WHERE type='table' "+
      "AND name NOT LIKE 'sqlite_%'", {type: QueryTypes.SELECT}) as any[];
    expect(tables?.map(t=>t.name)).toContain('tstDb_DbModelOnes');
  });

  it("Should test with 2 models", async ()=>{
    process.env['PLUGIN.1'] =
      'tests/plugin/plugins/dbPlugin/test_db_plugin_two_models';
    requirePlugins(app);
    await app.emit(ePluginEvents.beforeDatabaseStartup);
    expect(mockConsole.stdout[0]).toBe('before beforeDatabase created\n')
    await initTestDb(true)

    const sequelize = getSequelize();
    dbOneModel = sequelize.models.tstDb_DbModelOnes;
    dbTwoModel = sequelize.models.tstDb_DbModelTwos;

    const tables = await sequelize.query(
      "SELECT name FROM sqlite_schema WHERE type='table' "+
      "AND name NOT LIKE 'sqlite_%'", {type: QueryTypes.SELECT}) as any[];
    expect(tables?.map(t=>t.name)).toContain('tstDb_DbModelOnes');
    expect(tables?.map(t=>t.name)).toContain('tstDb_DbModelTwos');
  });

  it('Should autoCreate dbModel', async ()=>{
    process.env['PLUGIN.1'] =
      'tests/plugin/plugins/dbPlugin/test_db_plugin';
    requirePlugins(app);
    await app.emit(ePluginEvents.beforeDatabaseStartup);
    await initTestDb(true);

    const sequelize = getSequelize();
    await expect(sequelize.models.tstDb_DbModelOnes?.create)
      .toBeInstanceOf(Function);
    const user = await User.create({
      firstName:'hej',lastName:'nej', email:'nej@dom.se',
      userName:'kalle123£',password:'On#two789'});

    dbOneModel = sequelize.models.tstDb_DbModelOnes;
    const one = await dbOneModel.create({
      userId: user.id,
      desc: 'nej'
    });

    expect(one.userId).toBe(1);
    const res = await sequelize.query(
      'SELECT t1.firstName FROM core_Users t1 INNER JOIN tstDb_DbModelOnes t2 ON (t1.id=t2.userId)',
      {type: QueryTypes.SELECT}) as any[];
    expect(res[0]?.firstName||"").toBe('hej');

    // check belongsTo really CASCADEs to tstDb_DbModelOnes
    await user.destroy({force:true});
    const res2 = await sequelize.query(
      'SELECT id FROM tstDb_DbModelOnes', {type: QueryTypes.SELECT}
    );
    expect(res2.length).toBe(0);
  });

});
