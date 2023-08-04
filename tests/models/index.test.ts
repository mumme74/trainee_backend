import { InitOptions, Model, Sequelize } from "sequelize";
import {
  registerDbPlugin,
  registerDbModel,
  lockDbPlugin,
  defineDb,
  initDb,
  findDbPlugin,
  findDbModelEntry,
} from "../../src/models";

import {
  initTestDb,
  closeTestDb
} from "../testingDatabase";

// test db plugin functionality


let mdlName: string | undefined,
    bootstrapCalled: boolean,
    bootstrapAfterHookCalled: boolean;

class TestMdlBase extends Model {
  static async bootstrap(options:InitOptions) {
    mdlName = options.modelName;
    bootstrapCalled = true;
  }
  static async bootstrapAfterHook(sequelize: Sequelize) {
    bootstrapAfterHookCalled = true;
  }
}

describe('Test registerDbPlugin', ()=>{
  it('Should register without description', ()=>{
    registerDbPlugin('Test 1', "t1", __dirname);
    const plug = findDbPlugin('Test 1') || {};
    expect(plug.name).toBe('Test 1');
    expect(plug.modelPrefix).toBe('t1');
    expect(plug.description).toBe(undefined);
    expect(plug.isLocked).toBeFalsy()
  })
  it('Should register with description', ()=>{
    registerDbPlugin('Test 2', "t2", __dirname, 'desc t2');
    const plug = findDbPlugin('Test 2') || {};
    expect(plug.name).toBe('Test 2');
    expect(plug.modelPrefix).toBe('t2');
    expect(plug.description).toBe('desc t2');
  })
  it('Should throw register twice', ()=>{
    registerDbPlugin('Test 3', "t3", __dirname);
    expect(()=>{
      registerDbPlugin('Test 3', "t_3", __dirname);
    }).toThrow()
  });
});

describe("Test registerDbModel", ()=>{

  it("Should register with name from Declaration", ()=>{
    class TestCls1 extends TestMdlBase {}
    registerDbPlugin('testMdl1', 'tst1', __dirname)
    registerDbModel(TestCls1, 'testMdl1');
    const mdl = findDbModelEntry(TestCls1, 'testMdl1');
    expect(mdl?.model).toBe(TestCls1);
    expect(mdl?.plugin).toBe(findDbPlugin('testMdl1'));
    expect(mdl?.modelName).toBe('TestCls1');
  });
  it("Should register with custom name", ()=>{
    class TestCls2 extends TestMdlBase {}
    registerDbPlugin('testMdl2', 'tst2', __dirname)
    registerDbModel(TestCls2, 'testMdl2', 'customName');
    const mdl = findDbModelEntry(TestCls2, 'testMdl2');
    expect(mdl?.model).toBe(TestCls2);
    expect(mdl?.plugin).toBe(findDbPlugin('testMdl2'));
    expect(mdl?.modelName).toBe('customName');
  });
  it("Should fail register to non existing plugin", ()=>{
    class TestCls3 extends TestMdlBase {}
    expect(()=>{
      registerDbModel(TestCls3, 'nonexisting')
    }).toThrow();
  });
  it("Should fail to register twice to same plugin", ()=>{
    class TestCls4 extends TestMdlBase {}
    registerDbPlugin('testMdl4','tst4', __dirname);
    registerDbModel(TestCls4, 'testMdl4');
    expect(()=>{
      registerDbModel(TestCls4, 'testMdl4')
    }).toThrow();
  });
  it("Should fail to register twice to separate plugins", ()=>{
    class TestCls5 extends TestMdlBase {}
    registerDbPlugin('testMdl5','tst5', __dirname);
    registerDbPlugin('testPlug5', 'tst5', __dirname)
    registerDbModel(TestCls5, 'testMdl5');
    expect(()=>{
      registerDbModel(TestCls5, 'testPlug5')
    }).toThrow();
  });
  it("Should fail to register to closed plugin", ()=>{
    class TestCls6 extends TestMdlBase {}
    registerDbPlugin('testMdl6','tst6', __dirname);
    lockDbPlugin('testMdl5');
    expect(()=>{
      registerDbModel(TestCls6, 'testMdl5')
    }).toThrow();
  });
  it("Should succeed to register to another unclosed plugin", ()=>{
    class TestCls7 extends TestMdlBase {}
    registerDbPlugin('testMdl7','tst7', __dirname);
    registerDbPlugin('testPlug7', 'tst7', __dirname);
    lockDbPlugin('testMdl7')
    expect(()=>{
      registerDbModel(TestCls7, 'testPlug7')
    }).not.toThrow();
  })
});

describe("Test bootstrap mehods called", ()=>{
  let sequelize: Sequelize | undefined;
  const runDefineDb = async ()=>{
    sequelize = await defineDb("sqlite::memory", {
      logging:false,
      sync:{force:true, alter:false}
    });
  }

  afterAll(()=>{
    if (sequelize) sequelize.close();
  })

  it("Should call bootstrap", async ()=>{
    class TestB1 extends TestMdlBase {}
    registerDbPlugin('testB1', 'b1', __dirname);
    registerDbModel(TestB1, 'testB1');
    await runDefineDb();
    expect(bootstrapCalled).toBe(true);
    expect(bootstrapAfterHookCalled).toBe(true);
    expect(mdlName).toBe('b1_TestB1s');
  });
  it("Should throw registerPlugin after defineBb called", async ()=>{
    if (!sequelize) {
      registerDbPlugin('testB2', 'b2', __dirname);
      await runDefineDb();
    }
    expect(()=>{
      registerDbPlugin('testB3', 'b3', __dirname);
    }).toThrow()
  });
  it("Should throw registerModel after defineDb called", async ()=>{
    class TestB4 extends TestMdlBase {}
    if (!sequelize) {
      registerDbPlugin('testB4', 'b4', __dirname);
      await runDefineDb();
    }
    expect(()=>{
      registerDbModel(TestB4, 'b4');
    }).toThrow();
  });
});

