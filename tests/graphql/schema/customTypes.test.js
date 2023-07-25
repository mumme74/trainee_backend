"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const customTypes_1 = require("../../../src/graphql/schema/customTypes");
describe("dateScalar", () => {
    test("serialize", () => {
        const now = new Date();
        const res = customTypes_1.dateScalar.serialize(now);
        expect(res).toEqual(now.toISOString());
    });
    test("parseValue", () => {
        const now = new Date();
        const res = customTypes_1.dateScalar.parseValue(now.getTime());
        expect(now).toEqual(res);
    });
    test("parseLiteral int", () => {
        const now = new Date();
        const ast = {
            kind: graphql_1.Kind.INT,
            value: now.getTime().toString(),
        };
        const res = customTypes_1.dateScalar.parseLiteral(ast, null);
        expect(res).toEqual(now);
    });
    test("parseLiteral string", () => {
        const now = new Date();
        const ast = {
            kind: graphql_1.Kind.STRING,
            value: now.getTime().toString(),
        };
        const res = customTypes_1.dateScalar.parseLiteral(ast, null);
        expect(res).toEqual(null);
    });
});
//# sourceMappingURL=customTypes.test.js.map