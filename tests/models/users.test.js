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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_memory_server_1 = require("mongodb-memory-server");
const mongoose_1 = __importDefault(require("mongoose"));
const usersModel_1 = __importStar(require("../../src/models/old_mongo/usersModel"));
let mongod;
beforeAll(async () => {
    // This will create an new instance of "MongoMemoryServer" and automatically start it
    mongod = await mongodb_memory_server_1.MongoMemoryServer.create();
    const uri = mongod.getUri();
    //connect to DB
    await mongoose_1.default.connect(uri, {});
});
afterAll(async () => {
    await mongoose_1.default.disconnect();
    // The Server can be stopped again with
    return await mongod.stop();
});
let user;
beforeEach(() => {
    user = new usersModel_1.default({
        firstName: "Test",
        lastName: "Testson",
        userName: "tester",
        method: "google",
        email: "user@testing.com",
        password: passwordClearText,
        google: { id: "123456789abc" },
        domain: "testing.com",
        roles: [usersModel_1.eRolesAvailable.student],
        updatedBy: "123456789abc",
    });
});
afterEach(async () => {
    await usersModel_1.default.deleteMany();
});
const passwordClearText = "SecretPass1$";
const secretSecondPassWd = "SecretsecondPass1%";
const passwordClearTextHashed = "$2b$10$IJf6HO.IKzfJnemg1moky.lQBWksIkwgPL8rvoVjsVwL0xfKXH.yO";
describe("User model save hash password", () => {
    test("Hash when new document", async () => {
        expect(user.password).toEqual(passwordClearText);
        await user.save();
        expect(user.password).not.toEqual(passwordClearText);
    });
    test("Hash when updated", async () => {
        expect(user.password).toEqual(passwordClearText);
        await user.save();
        expect(user.password).not.toEqual(passwordClearText);
        const hashedPw = user.password;
        user.password = secretSecondPassWd;
        await user.save();
        expect(user.password).not.toEqual(secretSecondPassWd);
    });
    test("Don't hash when password not updated", async () => {
        expect(user.password).toEqual(passwordClearText);
        await user.save();
        const passwd = user.password;
        user.firstName = "random";
        await user.save();
        expect(user.password).toEqual(passwd);
    });
});
describe("compare passwords", () => {
    test("isValidPassword mismatch", async () => {
        user.password = secretSecondPassWd;
        await user.save();
        await expect(user.isValidPassword(passwordClearText)).resolves.toEqual(false);
    });
    test("isValidPassword match", async () => {
        await user.save();
        await expect(user.isValidPassword(passwordClearText)).resolves.toEqual(true);
    });
    test("fail compare check", async () => {
        await expect((0, usersModel_1.comparePasswordHash)(secretSecondPassWd, passwordClearTextHashed)).resolves.toEqual(false);
    });
    test("succeed compare check", async () => {
        await expect((0, usersModel_1.comparePasswordHash)(passwordClearText, passwordClearTextHashed)).resolves.toEqual(true);
    });
    test("succeed compare empty passwords", async () => {
        await expect((0, usersModel_1.comparePasswordHash)("", "")).resolves.toEqual(true);
    });
});
//# sourceMappingURL=users.test.js.map