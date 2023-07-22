import { GraphQLScalarType, ValueNode, Kind } from "graphql";

import { dateScalar } from "../../../graphql/schema/customTypes";

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
