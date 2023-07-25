"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("@jest-mock/express");
const userHelpers_1 = require("../../src/helpers/userHelpers");
const role_1 = require("../../src/models/role");
const user_1 = require("../../src/models/user");
const { res, next, clearMockRes } = (0, express_1.getMockRes)();
beforeEach(() => {
    clearMockRes();
});
// ----------------------------------------------------------------
describe("meetRoles function", () => {
    const ANY_OF_ERR_STRING = "Insufficient priviledges";
    const ALL_OF_ERR_STRING = "You do not have all required priviledges";
    const EXCLUDE_ERR_STRING = "You have a priviledge that you shall NOT have";
    let req;
    beforeEach(() => {
        const now = new Date();
        req = (0, express_1.getMockReq)();
        req.user = {
            user: user_1.User.build({
                firstName: "Test",
                lastName: "Testson",
                userName: "testUser",
                email: "email@user.com",
                updatedBy: 10,
                updatedAt: now,
                createdAt: now,
                lastLogin: now,
            }),
            roles: [role_1.eRolesAvailable.student],
            userPic: null,
            oauth: null,
        };
    });
    afterEach(async () => {
        await user_1.User.truncate();
    });
    test("fail match anyOf", async () => {
        const res = await (0, userHelpers_1.meetRoles)({ anyOf: role_1.eRolesAvailable.teacher }, req);
        expect(res).toEqual(ANY_OF_ERR_STRING);
    });
    test("succeed match anyOf", async () => {
        req.user.roles.push(role_1.eRolesAvailable.teacher);
        const res = await (0, userHelpers_1.meetRoles)({ anyOf: role_1.eRolesAvailable.teacher }, req);
        expect(res).toEqual("");
    });
    test("succeed match anyOf value=0", async () => {
        const res = await (0, userHelpers_1.meetRoles)({ anyOf: 0 }, req);
        expect(res).toEqual("");
    });
    test("fail match anyOf with array", async () => {
        const res = await (0, userHelpers_1.meetRoles)({ anyOf: [role_1.eRolesAvailable.teacher] }, req);
        expect(res).toEqual(ANY_OF_ERR_STRING);
    });
    test("succeed match anyOf with array", async () => {
        req.user.roles.push(role_1.eRolesAvailable.teacher);
        const res = await (0, userHelpers_1.meetRoles)({ anyOf: [role_1.eRolesAvailable.teacher] }, req);
        expect(res).toEqual("");
    });
    test("succeed match anyOf with 2 alternatives with array", async () => {
        req.user.roles.push(role_1.eRolesAvailable.teacher);
        const res = await (0, userHelpers_1.meetRoles)({ anyOf: [role_1.eRolesAvailable.admin, role_1.eRolesAvailable.teacher] }, req);
        expect(res).toEqual("");
    });
    test("fail match allOf", async () => {
        req.user.roles.push(role_1.eRolesAvailable.teacher);
        const res = await (0, userHelpers_1.meetRoles)({ allOf: role_1.eRolesAvailable.admin }, req);
        expect(res).toEqual(ALL_OF_ERR_STRING);
    });
    test("succeed match allOf", async () => {
        req.user.roles.push(role_1.eRolesAvailable.teacher);
        req.user.roles.push(role_1.eRolesAvailable.admin);
        const res = await (0, userHelpers_1.meetRoles)({ allOf: role_1.eRolesAvailable.teacher }, req);
        expect(res).toEqual("");
    });
    test("succeed match allOf value=0", async () => {
        const res = await (0, userHelpers_1.meetRoles)({ allOf: 0 }, req);
        expect(res).toEqual("");
    });
    test("fail match allOf with array", async () => {
        req.user.roles.push(role_1.eRolesAvailable.teacher);
        const res = await (0, userHelpers_1.meetRoles)({ allOf: [role_1.eRolesAvailable.admin, role_1.eRolesAvailable.teacher] }, req);
        expect(res).toEqual(ALL_OF_ERR_STRING);
    });
    test("succeed match allOf with array", async () => {
        req.user.roles.push(role_1.eRolesAvailable.teacher);
        req.user.roles.push(role_1.eRolesAvailable.admin);
        const res = await (0, userHelpers_1.meetRoles)({ allOf: [role_1.eRolesAvailable.teacher, role_1.eRolesAvailable.admin] }, req);
        expect(res).toEqual("");
    });
    test("fail match exclude", async () => {
        req.user.roles.push(role_1.eRolesAvailable.teacher);
        const res = await (0, userHelpers_1.meetRoles)({ exclude: role_1.eRolesAvailable.teacher }, req);
        expect(res).toEqual(EXCLUDE_ERR_STRING);
    });
    test("succeed match exclude", async () => {
        const res = await (0, userHelpers_1.meetRoles)({ exclude: role_1.eRolesAvailable.teacher }, req);
        expect(res).toEqual("");
    });
    test("fail match exclude value=0", async () => {
        const res = await (0, userHelpers_1.meetRoles)({ exclude: 0 }, req);
        expect(res).toEqual(EXCLUDE_ERR_STRING);
    });
    test("fail match exclude with array", async () => {
        req.user.roles.push(role_1.eRolesAvailable.teacher);
        const res = await (0, userHelpers_1.meetRoles)({ exclude: [role_1.eRolesAvailable.admin, role_1.eRolesAvailable.teacher] }, req);
        expect(res).toEqual(EXCLUDE_ERR_STRING);
    });
    test("succeed match exclude with array", async () => {
        const res = await (0, userHelpers_1.meetRoles)({ exclude: [role_1.eRolesAvailable.teacher, role_1.eRolesAvailable.admin] }, req);
        expect(res).toEqual("");
    });
});
describe("isAdmin function", () => {
    let req;
    beforeEach(() => {
        req = (0, express_1.getMockReq)();
        req.user.roles.push(role_1.eRolesAvailable.student);
    });
    test("fail isAdmin [student]", () => {
        const res = (0, userHelpers_1.isAdmin)(req);
        expect(res).toEqual(false);
    });
    test("fail isAdmin [teacher]", () => {
        req.user.roles = [role_1.eRolesAvailable.teacher];
        const res = (0, userHelpers_1.isAdmin)(req);
        expect(res).toEqual(false);
    });
    test("fail isAdmin [student, teacher]", () => {
        req.user.roles.push(role_1.eRolesAvailable.teacher);
        const res = (0, userHelpers_1.isAdmin)(req);
        expect(res).toEqual(false);
    });
    test("success isAdmin [admin]", () => {
        req.user.roles = [role_1.eRolesAvailable.admin];
        const res = (0, userHelpers_1.isAdmin)(req);
        expect(res).toEqual(true);
    });
    test("success isAdmin [teacher, admin]", () => {
        req.user.roles = [role_1.eRolesAvailable.teacher, role_1.eRolesAvailable.admin];
        const res = (0, userHelpers_1.isAdmin)(req);
        expect(res).toEqual(true);
    });
    test("success isAdmin [super]", () => {
        req.user.roles = [role_1.eRolesAvailable.super];
        const res = (0, userHelpers_1.isAdmin)(req);
        expect(res).toEqual(true);
    });
    test("success isAdmin [super, admin]", () => {
        req.user.roles = [role_1.eRolesAvailable.super, role_1.eRolesAvailable.admin];
        const res = (0, userHelpers_1.isAdmin)(req);
        expect(res).toEqual(true);
    });
    test("success isAdmin [super, admin, teacher]", () => {
        req.user.roles = [
            role_1.eRolesAvailable.super,
            role_1.eRolesAvailable.admin,
            role_1.eRolesAvailable.teacher,
        ];
        const res = (0, userHelpers_1.isAdmin)(req);
        expect(res).toEqual(true);
    });
});
//# sourceMappingURL=userHelpers.test.js.map