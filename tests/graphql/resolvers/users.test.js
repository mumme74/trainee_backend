"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// must be imported before any other local import
require("../../testProcess.env");
const testHelpers_1 = require("../../testHelpers");
const graphql_1 = __importDefault(require("../../../src/graphql"));
const user_1 = require("../../../src/models/user");
const role_1 = require("../../../src/models/role");
const testingDatabase_1 = require("../../testingDatabase");
const users_1 = require("../../../src/graphql/resolvers/users");
const processEnv = process.env;
const app = (0, testHelpers_1.jsonApp)();
(0, graphql_1.default)(app);
app.finalize();
const req = new testHelpers_1.JsonReq(app, "/graphql");
beforeAll(testingDatabase_1.initMemoryDb);
afterAll(async () => {
    await (0, testingDatabase_1.closeMemoryDb)();
    process.env = processEnv;
});
let users;
// helpers
async function fillDbWithUSers() {
    users = await user_1.User.bulkBuild([
        {
            ...testHelpers_1.userPrimaryObj,
            userName: "user0",
            firstName: "AdminTeacher",
            email: "user0@testing.com",
            roles: [role_1.eRolesAvailable.admin, role_1.eRolesAvailable.teacher],
        },
        {
            ...testHelpers_1.userPrimaryObj,
            userName: "user1",
            firstName: "Super",
            email: "user1@testing.com",
            roles: [role_1.eRolesAvailable.super],
        },
        {
            ...testHelpers_1.userPrimaryObj,
            userName: "user2",
            firstName: "Teacher",
            email: "user2@testing.com",
            roles: [role_1.eRolesAvailable.teacher],
        },
        {
            ...testHelpers_1.userPrimaryObj,
            userName: "user3",
            firstName: "Student",
            email: "user3@testing.com",
        },
    ]);
    users[2].updatedBy = users[0].id;
    users[0].updatedBy = users[1].id;
    await users[2].save();
    await users[0].save();
}
// -----------------------------------------------
describe("userLoader", () => {
    beforeAll(async () => {
        await fillDbWithUSers();
    });
    afterAll(async () => {
        await user_1.User.truncate();
    });
    test("empty array non existant id", async () => {
        const user = await users_1.userLoader.load(1234567890);
        expect(user).toStrictEqual([]);
    });
    test("succeed when user found", async () => {
        expect(await users_1.userLoader.load(users[2].id)).toMatchObject(users[2]);
    });
    test("fail when one id of many not found", async () => {
        expect(async () => {
            await users_1.userLoader.loadMany([
                users[0].id,
                users[1].id,
                1235467890,
            ]);
        }).toThrowError();
    });
});
//# sourceMappingURL=users.test.js.map