import type { CallbackHandler } from "supertest";

// must be imported before any other local import
import "../testProcess.env";

import {
  jsonApp,
  matchErrorSupertest,
  signToken,
  JsonReq,
  userPrimaryObj,
} from "../testHelpers";

import graphqlRoute from "../../graphql";
import type { IUserDocument } from "../../models/usersModel";
import User from "../../models/usersModel";
import { closeMemoryDb, initMemoryDb } from "../testingDatabase";

const processEnv = process.env;

const app = jsonApp();
graphqlRoute(app);
app.finalize();

const req = new JsonReq(app, "/graphql");

beforeAll(initMemoryDb);

afterAll(async () => {
  await closeMemoryDb();
  process.env = processEnv;
});

// helpers

// -----------------------------------------------

describe("graphql endpoint auth and grapiql checks", () => {
  let user: IUserDocument;
  beforeEach(async () => {
    user = new User(userPrimaryObj);
    await user.save();
  });

  afterEach(async () => {
    process.env = processEnv;
    await User.deleteMany();
    req.setToken("");
  });

  test("fail no token", (done: CallbackHandler) => {
    req
      .post({})
      .expect(401)
      .expect((response) => {
        matchErrorSupertest(response, "No auth token");
      })
      .end(done);
  });

  test("fail when token not yet valid", (done: CallbackHandler) => {
    req.setToken(signToken({ userId: user.id, notBefore: 5 }));
    req
      .post({})
      .expect(401)
      .expect((response) => {
        matchErrorSupertest(response, "jwt not active");
      })
      .end(done);
  });

  test("fail when token expired", (done: CallbackHandler) => {
    req.setToken(signToken({ userId: user.id, expiresInMinutes: 0 }));
    req
      .post({})
      .expect(401)
      .expect((response) => {
        matchErrorSupertest(response, "jwt expired");
      })
      .end(done);
  });

  test("fail when user banned", (done: any) => {
    user.banned = true;
    user
      .save()
      .then(() => {
        req.setToken(signToken({ userId: user.id }));
        req
          .post({})
          .expect(403)
          .expect((response) => {
            matchErrorSupertest(response, "Unauthenticated");
          })
          .end(done);
      })
      .catch(done);
  });

  test("fail when user deleted", (done: any) => {
    req.setToken(signToken({ userId: "$absd1234567890" }));
    req
      .post({})
      .expect(401)
      .expect((response) => {
        matchErrorSupertest(response, "Unauthenticated");
      })
      .end(done);
  });

  test("succeed get graphiql when token is valid", (done: CallbackHandler) => {
    process.env = { ...processEnv, NODE_ENV: "development" };
    const app = jsonApp();
    graphqlRoute(app);
    app.finalize();
    const req = new JsonReq(app, "/graphql", [["Accept", "text/html"]], /html/);
    req.setToken(signToken({ userId: user.id }));
    req
      .get()
      .expect(200)
      .expect((response) => {
        expect(/<!DOCTYPE html/g.test(response.text)).toEqual(true);
      })
      .end(done);
  });

  test("fail graphiql when not development", (done: CallbackHandler) => {
    process.env = { ...processEnv, NODE_ENV: "production" };
    const app = jsonApp();
    graphqlRoute(app);
    app.finalize();
    const req = new JsonReq(app, "/graphql", [["Accept", "text/html"]]);
    req.setToken(signToken({ userId: user.id }));
    req.get().expect(400).end(done);
  });
});

describe("error response", () => {
  let user: IUserDocument;
  beforeAll(async () => {
    user = new User(userPrimaryObj);
    await user.save();
    req.setToken(signToken({ userId: user.id }));
  });

  afterAll(async () => {
    await User.deleteMany();
    req.setToken("");
  });

  test("testError", (done: CallbackHandler) => {
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

  test("testErrorResponse", (done: CallbackHandler) => {
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

  test("testOkResponse", (done: CallbackHandler) => {
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

  test("testMutationResponseOk", (done: CallbackHandler) => {
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

  test("testMutationResponseErr", (done: CallbackHandler) => {
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
