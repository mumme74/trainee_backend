"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_1 = require("mongodb");
const errorHelpers_1 = require("../../src/helpers/errorHelpers");
const common_1 = require("../common");
const processEnv = process.env;
afterEach(() => {
    process.env = processEnv;
});
describe("UserError", () => {
    test("sanity checks for Usererror", () => {
        const err = new errorHelpers_1.UserError("test");
        expect(err instanceof Error).toEqual(true);
        expect(err.toString()).toEqual("UserError: test");
        expect(err.message).toEqual("test");
    });
});
describe("errorReponse", () => {
    function matchObj(err) {
        return {
            success: false,
            error: typeof err === "string" ? { message: err } : err,
        };
    }
    test("with string", () => {
        const res = (0, errorHelpers_1.errorResponse)("testStr");
        expect(res).toEqual(matchObj("testStr"));
        expect(Object.keys(res.error).length).toEqual(1);
    });
    test("with Error, should have no stack or type", () => {
        const err = (0, common_1.throwErr)(new Error("test"));
        const res = (0, errorHelpers_1.errorResponse)(err);
        expect(res).toEqual(matchObj("test"));
        expect(Object.keys(res.error).length).toEqual(1);
    });
    test("with Error, dev mode, should have stack and type", () => {
        const err = (0, common_1.throwErr)(new Error("test"));
        process.env = { ...processEnv, NODE_ENV: "development" };
        const res = (0, errorHelpers_1.errorResponse)(err);
        expect(res).toEqual(matchObj({
            message: "test",
            stack: err.stack?.split("\n") || [],
            type: "Error: test",
        }));
        expect(Object.keys(res.error).length).toEqual(3);
    });
    test("with UserError, dev mode, should have no stack nor type", () => {
        const err = (0, common_1.throwErr)(new errorHelpers_1.UserError("test"));
        const res = (0, errorHelpers_1.errorResponse)(err);
        expect(res).toEqual(matchObj("test"));
        expect(Object.keys(res.error).length).toEqual(1);
    });
    test("with MongoError, dev mode, should have no stack nor type", () => {
        const err = (0, common_1.throwErr)(new mongodb_1.MongoError("test"));
        const res = (0, errorHelpers_1.errorResponse)(err);
        expect(res).toEqual(matchObj("test"));
        expect(Object.keys(res.error).length).toEqual(1);
    });
});
//# sourceMappingURL=errorHelpers.test.js.map