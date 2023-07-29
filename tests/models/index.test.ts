import { InitOptions, Model, Sequelize } from "sequelize";
import {
  registerDbPlugin,
  registerDbModel,
  closeDbPlugin,
  defineDb,
  initDb,
  findDbPlugin,
  findDbModelEntry,
} from "../../src/models";

import {
  initTestDb,
  closeTestDb
} from "../testingDatabase";

// test db plugin functionallity


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
  it('Should register without descrition', ()=>{
    registerDbPlugin('Test 1', "t1");
    const plug = findDbPlugin('Test 1') || {};
    expect(plug.name).toBe('Test 1');
    expect(plug.modelPrefix).toBe('t1');
    expect(plug.description).toBe(undefined);
    expect(plug.closed).toBeFalsy()
  })
  it('Should register with descrition', ()=>{
    registerDbPlugin('Test 2', "t2", 'desc t2');
    const plug = findDbPlugin('Test 2') || {};
    expect(plug.name).toBe('Test 2');
    expect(plug.modelPrefix).toBe('t2');
    expect(plug.description).toBe('desc t2');
  })
  it('Should throw register twice', ()=>{
    registerDbPlugin('Test 3', "t3");
    expect(()=>{
      registerDbPlugin('Test 3', "t_3");
    }).toThrow()
  });
});

describe("Test registerDbModel", ()=>{

  it("Should register with name from Declaration", ()=>{
    class TestCls1 extends TestMdlBase {}
    registerDbPlugin('testMdl1', 'tst1')
    registerDbModel(TestCls1, 'testMdl1');
    const mdl = findDbModelEntry(TestCls1, 'testMdl1');
    expect(mdl?.model).toBe(TestCls1);
    expect(mdl?.plugin).toBe(findDbPlugin('testMdl1'));
    expect(mdl?.modelName).toBe('TestCls1');
  });
  it("Should register with custom name", ()=>{
    class TestCls2 extends TestMdlBase {}
    registerDbPlugin('testMdl2', 'tst2')
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
    registerDbPlugin('testMdl4','tst4');
    registerDbModel(TestCls4, 'testMdl4');
    expect(()=>{
      registerDbModel(TestCls4, 'testMdl4')
    }).toThrow();
  });
  it("Should fail to register twice to separate plugins", ()=>{
    class TestCls5 extends TestMdlBase {}
    registerDbPlugin('testMdl5','tst5');
    registerDbPlugin('testPlug5', 'tst5')
    registerDbModel(TestCls5, 'testMdl5');
    expect(()=>{
      registerDbModel(TestCls5, 'testPlug5')
    }).toThrow();
  });
  it("Should fail to register to closed plugin", ()=>{
    class TestCls6 extends TestMdlBase {}
    registerDbPlugin('testMdl6','tst6');
    closeDbPlugin('testMdl5');
    expect(()=>{
      registerDbModel(TestCls6, 'testMdl5')
    }).toThrow();
  });
  it("Should succed to register to another unclosed plugin", ()=>{
    class TestCls7 extends TestMdlBase {}
    registerDbPlugin('testMdl7','tst7');
    registerDbPlugin('testPlug7', 'tst7');
    closeDbPlugin('testMdl7')
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
    registerDbPlugin('testB1', 'b1');
    registerDbModel(TestB1, 'testB1');
    await runDefineDb();
    expect(bootstrapCalled).toBe(true);
    expect(bootstrapAfterHookCalled).toBe(true);
    expect(mdlName).toBe('b1_TestB1s');
  });
  it("Should throw registerPlugin after definedb called", async ()=>{
    if (!sequelize) {
      registerDbPlugin('testB2', 'b2');
      await runDefineDb();
    }
    expect(()=>{
      registerDbPlugin('testB3', 'b3');
    }).toThrow()
  });
  it("Should throw registerModel after definedb called", async ()=>{
    class TestB4 extends TestMdlBase {}
    if (!sequelize) {
      registerDbPlugin('testB4', 'b4');
      await runDefineDb();
    }
    expect(()=>{
      registerDbModel(TestB4, 'b4');
    }).toThrow();
  });
});

