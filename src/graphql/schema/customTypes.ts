import { GraphQLScalarType, Kind } from "graphql";

export const dateScalar = new GraphQLScalarType({
  name: "Date",
  description: "Date custom scalar type",
  serialize(value: any) {
    return value.toISOString(); // Convert outgoing Date to integer for JSON
  },
  parseValue(value: any) {
    return new Date(value); // Convert incoming integer to Date
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.INT) {
      return new Date(parseInt(ast.value, 10)); // Convert hard-coded AST string to integer and then to Date
    }
    return null; // Invalid hard-coded value (not an integer)
  },
});

export const blobType = new GraphQLScalarType({
  name: "Blob",
  description: "Blob custom type",
  serialize(value: any) {
    return value.toString('base64');
  },
  parseValue(value: any) {
    return Buffer.from(value, 'base64');
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING)
      return Buffer.from(ast.value, 'base64')
    return null;
  }
})
