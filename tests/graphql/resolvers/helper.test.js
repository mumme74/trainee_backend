"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("@jest-mock/express");
require("../../testProcess.env");
const usersModel_1 = __importStar(require("../../../src/models/old_mongo/usersModel"));
const testingDatabase_1 = require("../../testingDatabase");
const testHelpers_1 = require("../../testHelpers");
const helpers_1 = require("../../../src/graphql/resolvers/helpers");
const errorHelpers_1 = require("../../../src/helpers/errorHelpers");
const common_1 = require("../../common");
const { res, next, clearMockRes } = (0, express_1.getMockRes)();
const processEnv = process.env;
beforeAll(async () => {
    await (0, testingDatabase_1.initMemoryDb)();
});
afterAll(async () => {
    await (0, testingDatabase_1.closeMemoryDb)();
});
beforeEach(() => {
    clearMockRes();
    process.env = processEnv;
});
// ------------------------------------------------------
// ------------------------------------------------------
describe("composeErrorResponse", () => {
    function matchObj(err) {
        return {
            success: false,
            error: typeof err === "string" ? { message: err } : err,
            __typename: "ErrorResponse",
        };
    }
    test("with string", () => {
        const err = (0, helpers_1.composeErrorResponse)("This is a errStr");
        expect(err).toEqual(matchObj("This is a errStr"));
    });
    test("with Error", () => {
        const e = (0, common_1.throwErr)(Error("This is a Error obj"));
        const err = (0, helpers_1.composeErrorResponse)(e);
        expect(err).toEqual(matchObj("This is a Error obj"));
    });
    test("with Error, has type and stack", () => {
        process.env = { ...processEnv, NODE_ENV: "development" };
        const e = (0, common_1.throwErr)(new Error("This is a Error obj"));
        const err = (0, helpers_1.composeErrorResponse)(e);
        expect(err).toMatchObject(matchObj({
            message: "This is a Error obj",
            type: "Error: This is a Error obj",
        }));
        expect(Array.isArray(err.error.stack)).toEqual(true);
        const stack = err.error.stack || [null];
        expect(typeof stack[0]).toEqual("string");
    });
    test("with UserError, no type, nor stack", () => {
        process.env = { ...processEnv, NODE_ENV: "development" };
        const e = (0, common_1.throwErr)(new errorHelpers_1.UserError("This is a UserError obj"));
        const err = (0, helpers_1.composeErrorResponse)(e);
        expect(err).toEqual(matchObj({ message: "This is a UserError obj" }));
    });
    test("with MongoError, no type, nor stack", () => {
        process.env = { ...processEnv, NODE_ENV: "development" };
        const e = (0, common_1.throwErr)(new errorHelpers_1.UserError("This is a MongoError obj"));
        const err = (0, helpers_1.composeErrorResponse)(e);
        expect(err).toEqual(matchObj({ message: "This is a MongoError obj" }));
    });
});
describe("rolesFilter", () => {
    const callback = jest.fn((args, req, info) => {
        return "ret";
    });
    const arg = { args: "arg" };
    const info = "info";
    const ANY_OF_ERR_STRING = "Insufficient priviledges";
    const ALL_OF_ERR_STRING = "You do not have all required priviledges";
    const EXCLUDE_ERR_STRING = "You have a priviledge that you shall NOT have";
    let user;
    beforeEach(async () => {
        user = new usersModel_1.default(testHelpers_1.userPrimaryObj);
        await user.save();
    });
    afterEach(async () => {
        await user.deleteOne();
        callback.mockClear();
    });
    test("fail no match anyOf", () => {
        const req = (0, express_1.getMockReq)({ user: user, res: res });
        const opt = { anyOf: usersModel_1.eRolesAvailable.teacher };
        const filter = (0, helpers_1.rolesFilter)(opt, callback);
        expect(() => {
            filter(arg, req, info);
        }).toThrowError(new errorHelpers_1.UserError(ANY_OF_ERR_STRING));
        expect(req.res?.status).toHaveBeenCalledWith(403);
        expect(callback).not.toBeCalled();
    });
    test("succeed match anyOf", () => {
        const req = (0, express_1.getMockReq)({ user: user, res: res });
        const opt = { anyOf: usersModel_1.eRolesAvailable.student };
        const filter = (0, helpers_1.rolesFilter)(opt, callback);
        const ret = filter(arg, req, info);
        expect(callback).toHaveBeenCalledWith(arg, req, info);
        expect(ret).toEqual("ret");
        expect(req.res?.status).not.toHaveBeenCalled();
    });
    test("fail no match anyOf array", () => {
        const req = (0, express_1.getMockReq)({ user: user, res: res });
        const opt = { anyOf: [usersModel_1.eRolesAvailable.teacher, usersModel_1.eRolesAvailable.admin] };
        const filter = (0, helpers_1.rolesFilter)(opt, callback);
        expect(() => {
            filter(arg, req, info);
        }).toThrowError(new errorHelpers_1.UserError(ANY_OF_ERR_STRING));
        expect(req.res?.status).toHaveBeenCalledWith(403);
        expect(callback).not.toBeCalled();
    });
    test("succeed match anyOf array", () => {
        const req = (0, express_1.getMockReq)({ user: user, res: res });
        const opt = { anyOf: [usersModel_1.eRolesAvailable.student, usersModel_1.eRolesAvailable.teacher] };
        const filter = (0, helpers_1.rolesFilter)(opt, callback);
        const ret = filter(arg, req, info);
        expect(callback).toHaveBeenCalledWith(arg, req, info);
        expect(ret).toEqual("ret");
        expect(req.res?.status).not.toHaveBeenCalled();
    });
    test("fail no match allOf", () => {
        const req = (0, express_1.getMockReq)({ user: user, res: res });
        const opt = { allOf: usersModel_1.eRolesAvailable.teacher };
        const filter = (0, helpers_1.rolesFilter)(opt, callback);
        expect(() => {
            filter(arg, req, info);
        }).toThrowError(new errorHelpers_1.UserError(ALL_OF_ERR_STRING));
        expect(req.res?.status).toHaveBeenCalledWith(403);
        expect(callback).not.toBeCalled();
    });
    test("succeed match allOf", () => {
        const req = (0, express_1.getMockReq)({ user: user, res: res });
        const opt = { allOf: usersModel_1.eRolesAvailable.student };
        const filter = (0, helpers_1.rolesFilter)(opt, callback);
        const ret = filter(arg, req, info);
        expect(callback).toHaveBeenCalledWith(arg, req, info);
        expect(ret).toEqual("ret");
        expect(req.res?.status).not.toHaveBeenCalled();
    });
    test("fail no match allOf array", () => {
        const req = (0, express_1.getMockReq)({ user: user, res: res });
        const opt = { allOf: [usersModel_1.eRolesAvailable.teacher, usersModel_1.eRolesAvailable.admin] };
        const filter = (0, helpers_1.rolesFilter)(opt, callback);
        expect(() => {
            filter(arg, req, info);
        }).toThrowError(new errorHelpers_1.UserError(ALL_OF_ERR_STRING));
        expect(req.res?.status).toHaveBeenCalledWith(403);
        expect(callback).not.toBeCalled();
    });
    test("succeed match allOf array", async () => {
        user.roles.push(usersModel_1.eRolesAvailable.teacher);
        await user.save();
        const req = (0, express_1.getMockReq)({ user: user, res: res });
        const opt = { allOf: [usersModel_1.eRolesAvailable.student, usersModel_1.eRolesAvailable.teacher] };
        const filter = (0, helpers_1.rolesFilter)(opt, callback);
        const ret = filter(arg, req, info);
        expect(callback).toHaveBeenCalledWith(arg, req, info);
        expect(ret).toEqual("ret");
        expect(req.res?.status).not.toHaveBeenCalled();
    });
    test("fail no match exclude", () => {
        const req = (0, express_1.getMockReq)({ user: user, res: res });
        const opt = { exclude: usersModel_1.eRolesAvailable.student };
        const filter = (0, helpers_1.rolesFilter)(opt, callback);
        expect(() => {
            filter(arg, req, info);
        }).toThrowError(new errorHelpers_1.UserError(EXCLUDE_ERR_STRING));
        expect(req.res?.status).toHaveBeenCalledWith(403);
        expect(callback).not.toBeCalled();
    });
    test("succeed match exclude", () => {
        const req = (0, express_1.getMockReq)({ user: user, res: res });
        const opt = { exclude: usersModel_1.eRolesAvailable.teacher };
        const filter = (0, helpers_1.rolesFilter)(opt, callback);
        const ret = filter(arg, req, info);
        expect(callback).toHaveBeenCalledWith(arg, req, info);
        expect(ret).toEqual("ret");
        expect(req.res?.status).not.toHaveBeenCalled();
    });
    test("fail no match exclude array", () => {
        const req = (0, express_1.getMockReq)({ user: user, res: res });
        const opt = { exclude: [usersModel_1.eRolesAvailable.student, usersModel_1.eRolesAvailable.teacher] };
        const filter = (0, helpers_1.rolesFilter)(opt, callback);
        expect(() => {
            filter(arg, req, info);
        }).toThrowError(new errorHelpers_1.UserError(EXCLUDE_ERR_STRING));
        expect(req.res?.status).toHaveBeenCalledWith(403);
        expect(callback).not.toBeCalled();
    });
    test("succeed match exclude array", () => {
        const req = (0, express_1.getMockReq)({ user: user, res: res });
        const opt = {
            exclude: [
                usersModel_1.eRolesAvailable.teacher,
                usersModel_1.eRolesAvailable.super,
                usersModel_1.eRolesAvailable.admin,
            ],
        };
        const filter = (0, helpers_1.rolesFilter)(opt, callback);
        const ret = filter(arg, req, info);
        expect(callback).toHaveBeenCalledWith(arg, req, info);
        expect(ret).toEqual("ret");
        expect(req.res?.status).not.toHaveBeenCalled();
    });
});
//# sourceMappingURL=helper.test.js.map