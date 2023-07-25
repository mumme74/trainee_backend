"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// must be imported before any other local import
require("../testProcess.env");
const testHelpers_1 = require("../testHelpers");
const graphql_1 = __importDefault(require("../../src/graphql"));
const usersModel_1 = __importDefault(require("../../src/models/old_mongo/usersModel"));
const testingDatabase_1 = require("../testingDatabase");
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
// helpers
// -----------------------------------------------
describe("graphql endpoint auth and grapiql checks", () => {
    let user;
    beforeEach(async () => {
        user = new usersModel_1.default(testHelpers_1.userPrimaryObj);
        await user.save();
    });
    afterEach(async () => {
        process.env = processEnv;
        await usersModel_1.default.deleteMany();
        req.setToken("");
    });
    test("fail no token", (done) => {
        req
            .post({})
            .expect(401)
            .expect((response) => {
            (0, testHelpers_1.matchErrorSupertest)(response, "No auth token");
        })
            .end(done);
    });
    test("fail when token not yet valid", (done) => {
        req.setToken((0, testHelpers_1.signToken)({ userId: user.id, notBefore: 5 }));
        req
            .post({})
            .expect(401)
            .expect((response) => {
            (0, testHelpers_1.matchErrorSupertest)(response, "jwt not active");
        })
            .end(done);
    });
    test("fail when token expired", (done) => {
        req.setToken((0, testHelpers_1.signToken)({ userId: user.id, expiresInMinutes: 0 }));
        req
            .post({})
            .expect(401)
            .expect((response) => {
            (0, testHelpers_1.matchErrorSupertest)(response, "jwt expired");
        })
            .end(done);
    });
    test("fail when user banned", (done) => {
        user.banned = true;
        user
            .save()
            .then(() => {
            req.setToken((0, testHelpers_1.signToken)({ userId: user.id }));
            req
                .post({})
                .expect(403)
                .expect((response) => {
                (0, testHelpers_1.matchErrorSupertest)(response, "Unauthenticated");
            })
                .end(done);
        })
            .catch(done);
    });
    test("fail when user deleted", (done) => {
        req.setToken((0, testHelpers_1.signToken)({ userId: "$absd1234567890" }));
        req
            .post({})
            .expect(401)
            .expect((response) => {
            (0, testHelpers_1.matchErrorSupertest)(response, "Unauthenticated");
        })
            .end(done);
    });
    test("succeed get graphiql when token is valid", (done) => {
        process.env = { ...processEnv, NODE_ENV: "development" };
        const app = (0, testHelpers_1.jsonApp)();
        (0, graphql_1.default)(app);
        app.finalize();
        const req = new testHelpers_1.JsonReq(app, "/graphql", [["Accept", "text/html"]], /html/);
        req.setToken((0, testHelpers_1.signToken)({ userId: user.id }));
        req
            .get()
            .expect(200)
            .expect((response) => {
            expect(/<!DOCTYPE html/g.test(response.text)).toEqual(true);
        })
            .end(done);
    });
    test("fail graphiql when not development", (done) => {
        process.env = { ...processEnv, NODE_ENV: "production" };
        const app = (0, testHelpers_1.jsonApp)();
        (0, graphql_1.default)(app);
        app.finalize();
        const req = new testHelpers_1.JsonReq(app, "/graphql", [["Accept", "text/html"]]);
        req.setToken((0, testHelpers_1.signToken)({ userId: user.id }));
        req.get().expect(400).end(done);
    });
});
describe("error response", () => {
    let user;
    beforeAll(async () => {
        user = new usersModel_1.default(testHelpers_1.userPrimaryObj);
        await user.save();
        req.setToken((0, testHelpers_1.signToken)({ userId: user.id }));
    });
    afterAll(async () => {
        await usersModel_1.default.deleteMany();
        req.setToken("");
    });
    test("testError", (done) => {
        req
            .post({
            query: `query { testError {message type stack}}`,
            variables: null,
        })
            .expect(200)
            .expect(({ text }) => {
            const obj = JSON.parse(text);
            expect(obj.data.testError).toEqual({
                message: "This is a test error",
                type: null,
                stack: null,
            });
        })
            .end(done);
    });
    test("testErrorResponse", (done) => {
        req
            .post({
            query: `query { testErrorResponse {success error {message type stack}}}`,
            variables: null,
        })
            .expect(200)
            .expect(({ text }) => {
            const obj = JSON.parse(text);
            expect(obj.data.testErrorResponse).toEqual({
                success: false,
                error: {
                    message: "This is a test ErrorResponse",
                    type: null,
                    stack: null,
                },
            });
        })
            .end(done);
    });
    test("testOkResponse", (done) => {
        req
            .post({
            query: `query { testOkResponse {success nrAffected, ids }}`,
            variables: null,
        })
            .expect(200)
            .expect(({ text }) => {
            const obj = JSON.parse(text);
            expect(obj.data.testOkResponse).toEqual({
                success: true,
                nrAffected: 0,
                ids: ["12345676789abcd"],
            });
        })
            .end(done);
    });
    test("testMutationResponseOk", (done) => {
        req
            .post({
            query: `query {
                  testMutationResponseOk {
                    ... on ErrorResponse {
                      success error { message, type, stack}
                    }
                    ... on OkResponse {
                       success nrAffected, ids
                    }
                  }
                }`,
            variables: null,
        })
            .expect(200)
            .expect(({ text }) => {
            const obj = JSON.parse(text);
            expect(obj.data.testMutationResponseOk).toEqual({
                success: true,
                nrAffected: 0,
                ids: ["12345676789abcd"],
            });
        })
            .end(done);
    });
    test("testMutationResponseErr", (done) => {
        req
            .post({
            query: `query {
                  testMutationResponseErr {
                    ... on ErrorResponse {
                      success error { message, type, stack}
                    }
                    ... on OkResponse {
                       success nrAffected, ids
                    }
                  }
                }`,
            variables: null,
        })
            .expect(200)
            .expect(({ text }) => {
            const obj = JSON.parse(text);
            expect(obj.data.testMutationResponseErr).toEqual({
                success: false,
                error: {
                    message: "This is a test ErrorResponse",
                    type: null,
                    stack: null,
                },
            });
        })
            .end(done);
    });
});
//# sourceMappingURL=index.test.js.map