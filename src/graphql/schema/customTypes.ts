import { GraphQLScalarType, Kind } from "graphql";
import { base64ToBytes, bytesToBase64 } from "../../helpers/common";

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
    if (!(value instanceof Uint8Array)) {
      if (typeof value !== 'string')
        throw new Error(`Unhandled type in blob ${typeof value}`)
      value = Uint8Array.from(value, c=>c.charCodeAt(0));
    }
    const res = bytesToBase64(value);
    return res;
  },
  parseValue(value: any) {
    const bytes = base64ToBytes(value);
    return bytes;
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING)
      return Uint8Array.from(atob(ast.value), c=>c.charCodeAt(0))
    return null;
  }
});

const intIDserializer = (value: any) => {
  if (typeof value !== 'number' || Number.isNaN(value))
    throw new Error('IntID must be number type')
  if (value !== Math.round(value))
    throw new Error('IntID must be a integer');
  return +value;
}
export const intId = new GraphQLScalarType({
  name: "IntID",
  description: "ID as a int",
  serialize: intIDserializer,
  parseValue(value: any) {
    return intIDserializer(+value);
  },
  parseLiteral(ast) {
    return ast.kind === Kind.INT ? +ast.value : null;
  }
})
