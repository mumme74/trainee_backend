import { GraphQLScalarType, Kind } from "graphql";

export const testType = new GraphQLScalarType({
  name: "TestType",
  description: "Test plugin with a customtype",
  serialize(value:any) {
    return "TestType:"+value;
  },
  parseValue(value:any) {
    return "TestType:"+value;
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING)
      return "TestType:"+ast.value;
    return null;
  }
});