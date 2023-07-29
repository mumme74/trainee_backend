import { getClassName } from "../../src/helpers/common";

describe("geClassName", ()=>{
  class TestCls { }
  it("Should return name from class definition", ()=>{
    expect(getClassName(TestCls)).toBe('TestCls');
  });
  it("Should return name from class instance", ()=>{
    const inst = new TestCls();
    expect(getClassName(inst)).toBe('TestCls');
  });
  it("Should return name built in class", ()=>{
    const o = {p:"hej"};
    expect(getClassName(o)).toBe('Object');
  });
})