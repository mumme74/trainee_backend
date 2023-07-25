"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("@jest-mock/express");
const routeHelpers_1 = require("../../src/helpers/routeHelpers");
const user_1 = require("../../src/models/user");
const role_1 = require("../../src/models/role");
const testHelpers_1 = require("../testHelpers");
const { res, next, clearMockRes } = (0, express_1.getMockRes)();
beforeEach(() => {
    clearMockRes();
});
// helpers
function validate(schema, payload) {
    const req = (0, express_1.getMockReq)({
        body: payload,
    });
    (0, routeHelpers_1.validateBody)(schema)(req, res, next);
    return req;
}
// ---------------------------------------------------------
function testPassword(baseObj, schema) {
    test("fail when password empty", () => {
        validate(schema, { ...baseObj, password: "" });
        expect(res.status).toBeCalledWith(400);
        (0, testHelpers_1.matchErrorMockCall)(res, '"password" is not allowed to be empty');
        expect(next).not.toBeCalled();
    });
    test("fail when password all lowercase", () => {
        validate(schema, { ...baseObj, password: "secretpass1" });
        expect(res.status).toBeCalledWith(400);
        (0, testHelpers_1.matchErrorMockCall)(res, '"password" with value');
        expect(next).not.toBeCalled();
    });
    test("fail when password all CAPS", () => {
        validate(schema, { ...baseObj, password: "SECRETPASS1" });
        expect(res.status).toBeCalledWith(400);
        (0, testHelpers_1.matchErrorMockCall)(res, '"password" with value');
        expect(next).not.toBeCalled();
    });
    test("fail when password no special char", () => {
        validate(schema, { ...baseObj, password: "SecretPass1" });
        expect(res.status).toBeCalledWith(400);
        (0, testHelpers_1.matchErrorMockCall)(res, '"password" with value');
        expect(next).not.toBeCalled();
    });
    test("fail when password no number", () => {
        validate(schema, { ...baseObj, password: "SecretPass$" });
        expect(res.status).toBeCalledWith(400);
        (0, testHelpers_1.matchErrorMockCall)(res, '"password" with value');
        expect(next).not.toBeCalled();
    });
    test("fail when password to short", () => {
        validate(schema, { ...baseObj, password: "Secre1$" });
        expect(res.status).toBeCalledWith(400);
        (0, testHelpers_1.matchErrorMockCall)(res, '"password" with value');
        expect(next).not.toBeCalled();
    });
    test("succeed", () => {
        const payload = { ...baseObj, password: "SecretPass1$" };
        const req = validate(schema, payload);
        expect(res.status).not.toBeCalled();
        expect(req.value?.body).toEqual(payload);
        expect(next).toBeCalled();
    });
}
// ----------------------------------------------------
function testNameFields(userObj, schema) {
    test("fail empty firstname", () => {
        validate(schema, { ...userObj, firstName: "" });
        expect(res.status).toBeCalledWith(400);
        (0, testHelpers_1.matchErrorMockCall)(res, '"firstName" is not allowed to be empty');
        expect(next).not.toBeCalled();
    });
    test("fail too long firstname", () => {
        validate(schema, {
            ...userObj,
            firstName: "Thisisaverylongnameforaapersonsolongthatitshouldnotbeallowed",
        });
        expect(res.status).toBeCalledWith(400);
        (0, testHelpers_1.matchErrorMockCall)(res, '"firstName" length must be less than or equal to');
        expect(next).not.toBeCalled();
    });
    test("fail empty lastname", () => {
        validate(schema, { ...userObj, lastName: "" });
        expect(res.status).toBeCalledWith(400);
        (0, testHelpers_1.matchErrorMockCall)(res, '"lastName" is not allowed to be empty');
        expect(next).not.toBeCalled();
    });
    test("fail too long lastname", () => {
        validate(schema, {
            ...userObj,
            lastName: "Thisisaverylongnameforaapersonsolongthatitshouldnotbeallowed",
        });
        expect(res.status).toBeCalledWith(400);
        (0, testHelpers_1.matchErrorMockCall)(res, '"lastName" length must be less than or equal to');
        expect(next).not.toBeCalled();
    });
}
// --------------------------------------------------------
function testUsernameField(userObj, schema) {
    test("fail empty userName", () => {
        validate(schema, { ...userObj, userName: "" });
        expect(res.status).toBeCalledWith(400);
        (0, testHelpers_1.matchErrorMockCall)(res, '"userName" is not allowed to be empty');
        expect(next).not.toBeCalled();
    });
    test("fail to long username", () => {
        validate(schema, {
            ...userObj,
            userName: "Thisisaverylongnameforaapersonsolongthatitshouldnotbeallowed",
        });
        expect(res.status).toBeCalledWith(400);
        (0, testHelpers_1.matchErrorMockCall)(res, '"userName" length must be less than or equal to');
        expect(next).not.toBeCalled();
    });
    test("fail username with '@'", () => {
        validate(schema, { ...userObj, userName: "invalid@test.com" });
        expect(res.status).toBeCalledWith(400);
        (0, testHelpers_1.matchErrorMockCall)(res, '"userName" with value');
        expect(next).not.toBeCalled();
    });
}
// --------------------------------------------------------
function testEmailField(userObj, schema) {
    test("fail empty email", () => {
        validate(schema, { ...userObj, email: "" });
        expect(res.status).toBeCalledWith(400);
        (0, testHelpers_1.matchErrorMockCall)(res, '"email" is not allowed to be empty');
        expect(next).not.toBeCalled();
    });
    test("fail invalid email", () => {
        validate(schema, { ...userObj, email: "invalid£mail.com" });
        expect(res.status).toBeCalledWith(400);
        (0, testHelpers_1.matchErrorMockCall)(res, '"email" must be a valid email');
        expect(next).not.toBeCalled();
    });
}
// ----------------------------------------------------------
function testEmptyRequestBody(schema) {
    test("fail empty request.body", async () => {
        validate(schema, undefined);
        expect(res.status).toBeCalledWith(400);
        (0, testHelpers_1.matchErrorMockCall)(res, "Empty request body");
        expect(next).not.toBeCalled();
    });
}
// ---------------------------------------------------------
describe("loginSchema", () => {
    const loginObj = { login: "user@login.com", password: "secretPass1$" };
    const schema = routeHelpers_1.schemas.loginSchema;
    test("fail when login empty", () => {
        validate(schema, { ...loginObj, login: "" });
        expect(res.status).toBeCalledWith(400);
        (0, testHelpers_1.matchErrorMockCall)(res, '"login" does not match any of the allowed types');
        expect(next).not.toBeCalled();
    });
    test("fail when login to short", () => {
        validate(schema, { ...loginObj, login: "em" });
        expect(res.status).toBeCalledWith(400);
        (0, testHelpers_1.matchErrorMockCall)(res, '"login" does not match any of the allowed types');
        expect(next).not.toBeCalled();
    });
    // this also tests succeed
    testPassword(loginObj, routeHelpers_1.schemas.loginSchema);
});
// -----------------------------------------------------------
describe("newUserSchema", () => {
    const newUser = {
        firstName: "Test",
        lastName: "Testson",
        userName: "tester",
        email: "tester@test.com",
        password: "SecretPass1$",
    };
    const schema = routeHelpers_1.schemas.newUserSchema;
    testEmptyRequestBody(schema);
    testNameFields(newUser, schema);
    testUsernameField(newUser, schema);
    testEmailField(newUser, schema);
    // this should also test succeed
    testPassword(newUser, schema);
});
// ---------------------------------------------------------
describe("saveMyUserInfoSchema", () => {
    const saveObj = {
        firstName: "Test",
        lastName: "Testson",
        email: "user@testson.com",
        picture: "https://somserver.url.com/and/the/picture.png",
    };
    const schema = routeHelpers_1.schemas.saveMyUserInfoSchema;
    testEmptyRequestBody(schema);
    testNameFields(saveObj, schema);
    testEmailField(saveObj, schema);
    test("picture empty succeed", () => {
        const payload = { ...saveObj, picture: "" };
        const req = validate(schema, payload);
        expect(res.status).not.toBeCalled();
        expect(req.value?.body).toEqual(payload);
        expect(next).toBeCalled();
    });
    // --------------------------------------------------------------
    test("picture not empty succeed", () => {
        const payload = { ...saveObj };
        const req = validate(schema, payload);
        expect(res.status).not.toBeCalled();
        expect(req.value?.body).toEqual(payload);
        expect(next).toBeCalled();
    });
});
// ---------------------------------------------------------------
describe("password schema", () => {
    testEmptyRequestBody(routeHelpers_1.schemas.passwordSchema);
    testPassword({ password: "SecretPass1$" }, routeHelpers_1.schemas.passwordSchema);
});
// ---------------------------------------------------------------
describe("deleteMySelf schema", () => {
    const userObj = {
        firstName: "Test",
        lastName: "Testson",
        userName: "tester",
        email: "user@tester.com",
        password: "SecretPass1$",
    };
    const schema = routeHelpers_1.schemas.deleteMySelfSchema;
    testEmptyRequestBody(schema);
    testNameFields(userObj, schema);
    testUsernameField(userObj, schema);
    testEmailField(userObj, schema);
    // must be able to send in empty password here if that is what i stored in DB
    //testPassword(userObj, schemas.deleteMySelfSchema);
    test("password empty succeed", () => {
        const payload = { ...userObj, password: "" };
        const req = validate(schema, payload);
        expect(res.status).not.toBeCalled();
        expect(req.value?.body).toEqual(payload);
        expect(next).toBeCalled();
    });
    test("password set succeed", () => {
        const payload = { ...userObj };
        const req = validate(schema, payload);
        expect(res.status).not.toBeCalled();
        expect(req.value?.body).toEqual(payload);
        expect(next).toBeCalled();
    });
});
describe("hasRoles function", () => {
    let req;
    beforeEach(() => {
        req = (0, express_1.getMockReq)();
        req.user = {
            user: user_1.User.build({
                id: 1,
                firstName: "Test",
                lastName: "Testson",
                userName: "testUser",
                email: "email@user.com",
                updatedBy: "123456789abc",
                updatedAt: Date,
                createdAt: Date,
                lastLogin: Date,
            }),
            roles: [role_1.eRolesAvailable.student],
            userPic: null,
            oauth: null
        };
    });
    test("fail match anyOf", async () => {
        await (0, routeHelpers_1.hasRoles)({ anyOf: [role_1.eRolesAvailable.teacher] })(req, res, next);
        expect(res.status).toBeCalledWith(403);
        const data = res.json.mock.calls[0][0];
        (0, testHelpers_1.matchError)(data, "Insufficient priviledges");
        expect(next).not.toBeCalled();
    });
    test("succeed match anyOf", async () => {
        req.user.roles.push(role_1.eRolesAvailable.teacher);
        await (0, routeHelpers_1.hasRoles)({ anyOf: [role_1.eRolesAvailable.teacher] })(req, res, next);
        expect(res.status).not.toBeCalled();
        expect(next).toBeCalled();
    });
});
//# sourceMappingURL=routeHelpers.test.js.map