import { GraphQLScalarType, ValueNode, Kind } from "graphql";

import {
  dateScalar, blobType
} from "../../../src/graphql/schema/customTypes";

describe("dateScalar", () => {
  test("serialize", () => {
    const now = new Date();
    const res = dateScalar.serialize(now);
    expect(res).toEqual(now.toISOString());
  });

  test("parseValue", () => {
    const now = new Date();
    const res = dateScalar.parseValue(now.getTime());
    expect(now).toEqual(res);
  });

  test("parseLiteral int", () => {
    const now = new Date();
    const ast: ValueNode = {
      kind: Kind.INT,
      value: now.getTime().toString(),
    };
    const res = dateScalar.parseLiteral(ast, null);
    expect(res).toEqual(now);
  });

  test("parseLiteral string", () => {
    const now = new Date();
    const ast: ValueNode = {
      kind: Kind.STRING,
      value: now.getTime().toString(),
    };
    const res = dateScalar.parseLiteral(ast, null);
    expect(res).toEqual(null);
  });
});

describe("blobType", ()=>{
  const contentStr = "hej du glade\n\0 \r\b",
        blobStr = "aGVqIGR1IGdsYWRlCgAgDQg=",
        binU8 = Uint8Array.from([0,1,2,3,4,5,6,7,8,9,10]),
        binU8String = "AAECAwQFBgcICQo=";
  test("Should succeed serialize string", ()=>{
    const blob = blobType.serialize(contentStr);
    expect(blob).toBe(blobStr);
  });
  test("Should succeed serialize binary", ()=>{
    const blob = blobType.serialize(binU8);
    expect(blob).toBe(binU8String);
  });
  test("Should succeed parseValue to string", ()=>{
    const u8 = blobType.parseValue(blobStr) || new Uint8Array();
    expect(new TextDecoder().decode(u8)).toBe(contentStr);
  });
  test("Should succeed parseValue binary", ()=>{
    const u8arr = blobType.parseValue(binU8String);
    expect(u8arr).toStrictEqual(binU8);
  });
  test("Should succeed parseLiteral", ()=>{});
})