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
// must be imported before imported dependencies
require("../testProcess.env");
const usersModel_1 = __importStar(require("../../src/models/old_mongo/usersModel"));
const users_1 = __importDefault(require("../../src/routes/users"));
const testingDatabase_1 = require("../testingDatabase");
const testHelpers_1 = require("../testHelpers");
function respond(req, res, next) {
    return res.status(200).json(req.body);
}
const mockController = {
    signup: jest.fn(respond),
    login: jest.fn(respond),
    googleOAuthOk: jest.fn(respond),
    myInfo: jest.fn(respond),
    saveMyUserInfo: jest.fn(respond),
    changeMyPassword: jest.fn(respond),
    deleteMyself: jest.fn(respond),
    rolesAvailable: jest.fn(respond),
    secret: jest.fn(respond),
};
const app = (0, testHelpers_1.jsonApp)();
const router = (0, users_1.default)(app, mockController);
app.finalize();
beforeAll(async () => {
    await (0, testingDatabase_1.initMemoryDb)();
});
afterAll(async () => {
    await (0, testingDatabase_1.closeMemoryDb)();
});
beforeEach(() => {
    for (const mockFn of Object.values(mockController)) {
        mockFn.mockClear();
    }
});
// helper functions
// -----------------------------------------------------
describe("signup", () => {
    const req = new testHelpers_1.JsonReq(app, "/users/signup");
    const userObj = {
        email: "user@testing.com",
        userName: "tester",
        firstName: "Test",
        lastName: "Testsson",
        password: "SectretPass1$",
    };
    test("fail signup email invalid", (done) => {
        req
            .post({ ...userObj, email: "test@failmail" })
            .expect(400)
            .expect((response) => {
            (0, testHelpers_1.matchErrorSupertest)(response, '"email" must be a valid email');
            expect(mockController.signup).not.toBeCalled();
        })
            .end(done);
    });
    test("fail signup userName invalid", (done) => {
        req
            .post({ ...userObj, userName: "hej@" })
            .expect(400)
            .expect((res) => {
            expect(mockController.signup).not.toBeCalled();
            (0, testHelpers_1.matchErrorSupertest)(res, '"userName" with value "hej@" fails to match the required pattern:');
        })
            .end(done);
    });
    test("fail signup firstName invalid", (done) => {
        req
            .post({ ...userObj, firstName: "F" })
            .expect(400)
            .expect((res) => {
            expect(mockController.signup).not.toBeCalled();
            (0, testHelpers_1.matchErrorSupertest)(res, '"firstName" length must be at least');
        })
            .end(done);
    });
    test("fail signup lastName invalid", (done) => {
        req
            .post({ ...userObj, lastName: "F" })
            .expect(400)
            .expect((res) => {
            expect(mockController.signup).not.toBeCalled();
            (0, testHelpers_1.matchErrorSupertest)(res, '"lastName" length must be at least');
        })
            .end(done);
    });
    test("fail signup password invalid", (done) => {
        req
            .post({ ...userObj, password: "notvalid" })
            .expect(400)
            .expect((res) => {
            expect(mockController.signup).not.toBeCalled();
            (0, testHelpers_1.matchErrorSupertest)(res, '"password" with value "notvalid" fails to match the required pattern:');
        })
            .end(done);
    });
    test("succeed signup", (done) => {
        req
            .post({ ...userObj })
            .expect(200)
            .expect((response) => {
            expect(response.body).toEqual(userObj);
        })
            .end(done);
    });
});
describe("login", () => {
    const req = new testHelpers_1.JsonReq(app, "/users/login");
    const loginObj = {
        login: testHelpers_1.userPrimaryObj.userName,
        password: testHelpers_1.userPrimaryObj.password,
    };
    let user;
    beforeAll(async () => {
        user = new usersModel_1.default(testHelpers_1.userPrimaryObj);
        await user.save();
    });
    afterAll(async () => {
        await user.deleteOne();
    });
    test("fail login name empty", (done) => {
        req
            .post({ ...loginObj, login: "" })
            .expect(400)
            .expect((res) => {
            expect(mockController.login).not.toBeCalled();
            (0, testHelpers_1.matchErrorSupertest)(res, '"login" does not match any of the allowed types');
        })
            .end(done);
    });
    test("fail login email invalid", (done) => {
        req
            .post({ ...loginObj, login: "test@failmail" })
            .expect(400)
            .expect((res) => {
            expect(mockController.login).not.toBeCalled();
            (0, testHelpers_1.matchErrorSupertest)(res, '"login" does not match any of the allowed types');
        })
            .end(done);
    });
    test("fail login name to short", (done) => {
        req
            .post({ ...loginObj, login: "he" })
            .expect(400)
            .expect((res) => {
            expect(mockController.login).not.toBeCalled();
            (0, testHelpers_1.matchErrorSupertest)(res, '"login" does not match any of the allowed types');
        })
            .end(done);
    });
    test("fail login with password invalid", (done) => {
        req
            .post({ ...loginObj, password: "Secretpass1" })
            .expect(400)
            .expect((res) => {
            expect(mockController.login).not.toBeCalled();
            (0, testHelpers_1.matchErrorSupertest)(res, '"password" with value "Secretpass1" fails to match the required pattern');
        })
            .end(done);
    });
    test("succeed login with email", (done) => {
        req
            .post({ ...loginObj, login: testHelpers_1.userPrimaryObj.email })
            .expect(200)
            .expect((response) => {
            expect(mockController.login).toBeCalled();
            const request = mockController.login.mock.calls[0][0];
            (0, testHelpers_1.compareUser)(request.user, user);
        })
            .end(done);
    });
    test("succeed login with userName", (done) => {
        req
            .post({ ...loginObj })
            .expect(200)
            .expect((response) => {
            expect(mockController.login).toBeCalled();
            const request = mockController.login.mock.calls[0][0];
            (0, testHelpers_1.compareUser)(request.user, user);
        })
            .end(done);
    });
});
describe("oauth google", () => {
    // not sure how to test this?
});
describe("myinfo", () => {
    const req = new testHelpers_1.JsonReq(app, "/users/myinfo");
    let token;
    let user;
    beforeEach(async () => {
        user = new usersModel_1.default(testHelpers_1.userPrimaryObj);
        await user.save();
    });
    afterEach(async () => {
        await usersModel_1.default.deleteMany();
    });
    afterEach(() => {
        req.setToken("");
    });
    test("fail no token", (done) => {
        req
            .get()
            .expect(401)
            .expect((res) => {
            expect(mockController.myInfo).not.toBeCalled();
            (0, testHelpers_1.matchErrorSupertest)(res, "No auth token");
        })
            .end(done);
    });
    test("fail expired token", (done) => {
        req.setToken((0, testHelpers_1.signToken)({
            userId: user.id.toString(),
            expiresInMinutes: 0,
        }));
        req
            .get()
            .expect(401)
            .expect((res) => {
            expect(mockController.myInfo).not.toBeCalled();
            (0, testHelpers_1.matchErrorSupertest)(res, "jwt expired");
        })
            .end(done);
    });
    test("fail not yet valid token", (done) => {
        req.setToken((0, testHelpers_1.signToken)({
            userId: user.id.toString(),
            expiresInMinutes: 10,
            notBefore: 5,
        }));
        req
            .get()
            .expect(401)
            .expect((res) => {
            expect(mockController.myInfo).not.toBeCalled();
            (0, testHelpers_1.matchErrorSupertest)(res, "jwt not active");
        })
            .end(done);
    });
    test("fail tampered token", (done) => {
        const tokenPaths = (0, testHelpers_1.signToken)({
            userId: user.id.toString(),
        }).split(".");
        tokenPaths[1] = (() => {
            const data = JSON.parse(Buffer.from(tokenPaths[1], "base64").toString("utf-8"));
            data.sub = "0123456789abcd";
            return Buffer.from(JSON.stringify(data)).toString("base64");
        })();
        req.setToken(tokenPaths.join("."));
        req
            .get()
            .expect(401)
            .expect((res) => {
            //console.log(res);
            expect(mockController.myInfo).not.toBeCalled();
            (0, testHelpers_1.matchErrorSupertest)(res, "invalid token");
        })
            .end(done);
    });
    test("fail banned user", (done) => {
        user.banned = true;
        user
            .save()
            .then(() => {
            req.setToken((0, testHelpers_1.signToken)({ userId: user.id.toString() }));
            req
                .get()
                .expect(403)
                .expect((res) => {
                expect(mockController.myInfo).not.toBeCalled();
                (0, testHelpers_1.matchErrorSupertest)(res, "Unauthenticated");
            })
                .end(done);
        })
            .catch(done);
    });
    test("fail token belongs to deleted user", (done) => {
        usersModel_1.default.deleteMany()
            .then(() => {
            req.setToken((0, testHelpers_1.signToken)({ userId: user.id.toString() }));
            req
                .get()
                .expect(401)
                .expect((res) => {
                expect(mockController.myInfo).not.toBeCalled();
                (0, testHelpers_1.matchErrorSupertest)(res, "Unauthenticated");
            })
                .end(done);
        })
            .catch(done);
    });
    test("succeed with valid token", (done) => {
        req.setToken((0, testHelpers_1.signToken)({ userId: user.id.toString() }));
        req
            .get()
            .expect(200)
            .expect((res) => {
            expect(mockController.myInfo).toBeCalled();
            const r = mockController.myInfo.mock.calls[0][0];
            (0, testHelpers_1.compareUser)(r.user, user);
        })
            .end(done);
    });
});
describe("savemyuserinfo", () => {
    const req = new testHelpers_1.JsonReq(app, "/users/savemyuserinfo");
    let token;
    let user;
    const userObj = {
        firstName: testHelpers_1.userPrimaryObj.firstName,
        lastName: testHelpers_1.userPrimaryObj.lastName,
        email: testHelpers_1.userPrimaryObj.email,
        picture: testHelpers_1.userPrimaryObj.picture,
    };
    beforeAll(async () => {
        user = new usersModel_1.default(testHelpers_1.userPrimaryObj);
        await user.save();
    });
    afterAll(async () => {
        await usersModel_1.default.deleteMany();
    });
    afterEach(() => {
        req.setToken("");
    });
    test("fail when GET", (done) => {
        req.get().expect(404).end(done);
    });
    test("fail no token", (done) => {
        req
            .post({ ...userObj })
            .expect(401)
            .expect((res) => {
            expect(mockController.saveMyUserInfo).not.toBeCalled();
            (0, testHelpers_1.matchErrorSupertest)(res, "No auth token");
        })
            .end(done);
    });
    test("fail invalid email", (done) => {
        req.setToken((0, testHelpers_1.signToken)({ userId: user.id.toString() }));
        req
            .post({ ...userObj, email: "no@invalid" })
            .expect(400)
            .expect((res) => {
            expect(mockController.saveMyUserInfo).not.toBeCalled();
            (0, testHelpers_1.matchErrorSupertest)(res, '"email" must be a valid email');
        })
            .end(done);
    });
    test("fail invalid firstName", (done) => {
        req.setToken((0, testHelpers_1.signToken)({ userId: user.id.toString() }));
        req
            .post({ ...userObj, firstName: "n" })
            .expect(400)
            .expect((res) => {
            expect(mockController.saveMyUserInfo).not.toBeCalled();
            (0, testHelpers_1.matchErrorSupertest)(res, '"firstName" length must be at least');
        })
            .end(done);
    });
    test("fail invalid lastName", (done) => {
        req.setToken((0, testHelpers_1.signToken)({ userId: user.id.toString() }));
        req
            .post({ ...userObj, lastName: "n" })
            .expect(400)
            .expect((res) => {
            expect(mockController.saveMyUserInfo).not.toBeCalled();
            (0, testHelpers_1.matchErrorSupertest)(res, '"lastName" length must be at least');
        })
            .end(done);
    });
    test("fail invalid picture", (done) => {
        req.setToken((0, testHelpers_1.signToken)({ userId: user.id.toString() }));
        req
            .post({ ...userObj, picture: "invalid" })
            .expect(400)
            .expect((res) => {
            expect(mockController.saveMyUserInfo).not.toBeCalled();
            (0, testHelpers_1.matchErrorSupertest)(res, '"picture" must be a valid uri');
        })
            .end(done);
    });
    test("succeed with save userInfo", (done) => {
        req.setToken((0, testHelpers_1.signToken)({ userId: user.id.toString() }));
        req
            .post({ ...userObj })
            .expect(200)
            .expect((res) => {
            expect(mockController.saveMyUserInfo).toBeCalled();
            const r = mockController.saveMyUserInfo.mock.calls[0][0];
            (0, testHelpers_1.compareUser)(r.user, user);
        })
            .end(done);
    });
});
describe("changemypassword", () => {
    const req = new testHelpers_1.JsonReq(app, "/users/changemypassword");
    let token;
    let user;
    const userObj = {
        password: "SecretPass1$",
    };
    beforeAll(async () => {
        user = new usersModel_1.default(testHelpers_1.userPrimaryObj);
        await user.save();
    });
    afterAll(async () => {
        await usersModel_1.default.deleteMany();
    });
    afterEach(() => {
        req.setToken("");
    });
    test("fail when GET", (done) => {
        req.get().expect(404).end(done);
    });
    test("fail no token", (done) => {
        req
            .post({ ...userObj })
            .expect(401)
            .expect((res) => {
            expect(mockController.changeMyPassword).not.toBeCalled();
            (0, testHelpers_1.matchErrorSupertest)(res, "No auth token");
        })
            .end(done);
    });
    test("fail invalid password", (done) => {
        req.setToken((0, testHelpers_1.signToken)({ userId: user.id.toString() }));
        req
            .post({ ...userObj, password: "Secretpass1" })
            .expect(400)
            .expect((res) => {
            expect(mockController.changeMyPassword).not.toBeCalled();
            (0, testHelpers_1.matchErrorSupertest)(res, '"password" with value "Secretpass1" fails to match the required pattern');
        })
            .end(done);
    });
    test("succeed with change password", (done) => {
        req.setToken((0, testHelpers_1.signToken)({ userId: user.id.toString() }));
        req
            .post({ ...userObj })
            .expect(200)
            .expect((res) => {
            expect(mockController.changeMyPassword).toBeCalled();
            const r = mockController.changeMyPassword.mock
                .calls[0][0];
            (0, testHelpers_1.compareUser)(r.user, user);
        })
            .end(done);
    });
});
describe("deletemyself", () => {
    const req = new testHelpers_1.JsonReq(app, "/users/deletemyself");
    let token;
    let user;
    const userObj = {
        userName: testHelpers_1.userPrimaryObj.userName,
        firstName: testHelpers_1.userPrimaryObj.firstName,
        lastName: testHelpers_1.userPrimaryObj.lastName,
        email: testHelpers_1.userPrimaryObj.email,
        password: testHelpers_1.userPrimaryObj.password,
    };
    beforeAll(async () => {
        user = new usersModel_1.default(testHelpers_1.userPrimaryObj);
        await user.save();
    });
    afterAll(async () => {
        await usersModel_1.default.deleteMany();
    });
    afterEach(() => {
        req.setToken("");
    });
    test("fail when GET", (done) => {
        req.get().expect(404).end(done);
    });
    test("fail no token", (done) => {
        req
            .post({ ...userObj })
            .expect(401)
            .expect((res) => {
            expect(mockController.deleteMyself).not.toBeCalled();
            (0, testHelpers_1.matchErrorSupertest)(res, "No auth token");
        })
            .end(done);
    });
    test("fail invalid userName", (done) => {
        req.setToken((0, testHelpers_1.signToken)({ userId: user.id.toString() }));
        req
            .post({ ...userObj, userName: "no@" })
            .expect(400)
            .expect((res) => {
            expect(mockController.deleteMyself).not.toBeCalled();
            (0, testHelpers_1.matchErrorSupertest)(res, '"userName" with value "no@" fails to match the required pattern');
        })
            .end(done);
    });
    test("fail invalid email", (done) => {
        req.setToken((0, testHelpers_1.signToken)({ userId: user.id.toString() }));
        req
            .post({ ...userObj, email: "no@invalid" })
            .expect(400)
            .expect((res) => {
            expect(mockController.deleteMyself).not.toBeCalled();
            (0, testHelpers_1.matchErrorSupertest)(res, '"email" must be a valid email');
        })
            .end(done);
    });
    test("fail invalid firstName", (done) => {
        req.setToken((0, testHelpers_1.signToken)({ userId: user.id.toString() }));
        req
            .post({ ...userObj, firstName: "n" })
            .expect(400)
            .expect((res) => {
            expect(mockController.deleteMyself).not.toBeCalled();
            (0, testHelpers_1.matchErrorSupertest)(res, '"firstName" length must be at least');
        })
            .end(done);
    });
    test("fail invalid lastName", (done) => {
        req.setToken((0, testHelpers_1.signToken)({ userId: user.id.toString() }));
        req
            .post({ ...userObj, lastName: "n" })
            .expect(400)
            .expect((res) => {
            expect(mockController.deleteMyself).not.toBeCalled();
            (0, testHelpers_1.matchErrorSupertest)(res, '"lastName" length must be at least');
        })
            .end(done);
    });
    test("fail invalid password", (done) => {
        req.setToken((0, testHelpers_1.signToken)({ userId: user.id.toString() }));
        req
            .post({ ...userObj, password: "SecretPass1" })
            .expect(400)
            .expect((res) => {
            expect(mockController.deleteMyself).not.toBeCalled();
            (0, testHelpers_1.matchErrorSupertest)(res, '"password" does not match any of the allowed types');
        })
            .end(done);
    });
    test("succeed with save userInfo", (done) => {
        req.setToken((0, testHelpers_1.signToken)({ userId: user.id.toString() }));
        req
            .post({ ...userObj })
            .expect(200)
            .expect((res) => {
            expect(mockController.deleteMyself).toBeCalled();
            const r = mockController.deleteMyself.mock.calls[0][0];
            (0, testHelpers_1.compareUser)(r.user, user);
        })
            .end(done);
    });
    test("succeed with save userInfo and empty password", (done) => {
        req.setToken((0, testHelpers_1.signToken)({ userId: user.id.toString() }));
        req
            .post({ ...userObj, password: "" })
            .expect(200)
            .expect((res) => {
            expect(mockController.deleteMyself).toBeCalled();
            const r = mockController.deleteMyself.mock.calls[0][0];
            (0, testHelpers_1.compareUser)(r.user, user);
        })
            .end(done);
    });
});
describe("avaliableroles", () => {
    const req = new testHelpers_1.JsonReq(app, "/users/availableroles");
    let token;
    let user;
    beforeAll(async () => {
        user = new usersModel_1.default(testHelpers_1.userPrimaryObj);
        await user.save();
    });
    afterAll(async () => {
        await usersModel_1.default.deleteMany();
    });
    afterEach(() => {
        req.setToken("");
    });
    test("fail when Post", (done) => {
        req.post({}).expect(404).end(done);
    });
    test("fail no token", (done) => {
        req
            .get()
            .expect(401)
            .expect((res) => {
            expect(mockController.rolesAvailable).not.toBeCalled();
            (0, testHelpers_1.matchErrorSupertest)(res, "No auth token");
        })
            .end(done);
    });
    test("fail with role student", (done) => {
        user.roles = [usersModel_1.eRolesAvailable.student];
        user
            .save()
            .then(() => {
            req.setToken((0, testHelpers_1.signToken)({ userId: user.id.toString() }));
            req
                .get()
                .expect(403)
                .expect((res) => {
                expect(mockController.rolesAvailable).not.toBeCalled();
                (0, testHelpers_1.matchErrorSupertest)(res, "Insufficient priviledges");
            })
                .end(done);
        })
            .catch(done);
    });
    test("fail with role teacher", (done) => {
        user.roles.push(usersModel_1.eRolesAvailable.teacher);
        user
            .save()
            .then(() => {
            req.setToken((0, testHelpers_1.signToken)({ userId: user.id.toString() }));
            req
                .get()
                .expect(403)
                .expect((res) => {
                expect(mockController.rolesAvailable).not.toBeCalled();
                (0, testHelpers_1.matchErrorSupertest)(res, "Insufficient priviledges");
            })
                .end(done);
        })
            .catch(done);
    });
    test("succeed with role admin", (done) => {
        user.roles.push(usersModel_1.eRolesAvailable.admin);
        user
            .save()
            .then(() => {
            req.setToken((0, testHelpers_1.signToken)({ userId: user.id.toString() }));
            req
                .get()
                .expect(200)
                .expect((res) => {
                expect(mockController.rolesAvailable).toBeCalled();
                const r = mockController.rolesAvailable.mock
                    .calls[0][0];
                (0, testHelpers_1.compareUser)(r.user, user);
            })
                .end(done);
        })
            .catch(done);
    });
    test("succeed with role super admin", (done) => {
        user.roles.push(usersModel_1.eRolesAvailable.super);
        user
            .save()
            .then(() => {
            req.setToken((0, testHelpers_1.signToken)({ userId: user.id.toString() }));
            req
                .get()
                .expect(200)
                .expect((res) => {
                expect(mockController.rolesAvailable).toBeCalled();
                const r = mockController.rolesAvailable.mock
                    .calls[0][0];
                (0, testHelpers_1.compareUser)(r.user, user);
            })
                .end(done);
        })
            .catch(done);
    });
});
describe("secret", () => {
    const req = new testHelpers_1.JsonReq(app, "/users/secret");
    let token;
    let user;
    beforeAll(async () => {
        user = new usersModel_1.default(testHelpers_1.userPrimaryObj);
        await user.save();
    });
    afterAll(async () => {
        await usersModel_1.default.deleteMany();
    });
    afterEach(() => {
        req.setToken("");
    });
    test("fail when POST", (done) => {
        req.post({}).expect(404).end(done);
    });
    test("fail no token", (done) => {
        req
            .get()
            .expect(401)
            .expect((res) => {
            expect(mockController.secret).not.toBeCalled();
            (0, testHelpers_1.matchErrorSupertest)(res, "No auth token");
        })
            .end(done);
    });
    test("succeed with token", (done) => {
        req.setToken((0, testHelpers_1.signToken)({ userId: user.id.toString() }));
        req
            .get()
            .expect(200)
            .expect((res) => {
            expect(mockController.secret).toBeCalled();
            const r = mockController.secret.mock.calls[0][0];
            (0, testHelpers_1.compareUser)(r.user, user);
        })
            .end(done);
    });
});
//# sourceMappingURL=users.test.js.map