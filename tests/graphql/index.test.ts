import type { CallbackHandler } from "supertest";

// must be imported before any other local import
import "../testProcess.env";

import {
  jsonApp,
  matchErrorSupertest,
  signToken,
  JsonReq,
  userPrimaryObj,
  createTestUser,
  destroyTestUser,
  TstRequest,
  TstResponse,
} from "../testHelpers";

import { graphQlRoute } from "../../src/graphql/routes";
import { User } from "../../src/models/core_user";
import { closeTestDb, initTestDb } from "../testingDatabase";
import { initGraphQlSchema } from "../../src/graphql/schema";
import { MockConsole } from "../testHelpers";

import request from "supertest";
import supertest from "supertest";
import { initGraphQl } from "../../src/graphql";

const processEnv = process.env;

const app = jsonApp();
graphQlRoute(app);
app.finalize();

const mockConsole = new MockConsole();

initGraphQl();

const req = new JsonReq(app, "/graphql");

beforeAll(initTestDb);

afterAll(async () => {
  mockConsole.restore();
  await closeTestDb();
  process.env = processEnv;
});

let user: User;
beforeEach(async () => {
  user = await createTestUser();
});

afterEach(destroyTestUser);

// helpers

// -----------------------------------------------

describe("graphql endpoint auth", () => {

  afterEach(async () => {
    process.env = processEnv;
    req.setToken("");
  });

  test("succeed HTTP OPTIONS", (done: CallbackHandler)=>{
    req.options()
      .expect(200)
      .expect((res:TstResponse) => {
        expect(res.unauthorized).toBe(false)
        expect(res.headers['content-length']).toBe('0');
        expect(res.headers['access-control-allow-headers'])
          .toBe('Content-Type, Authorization');
        expect(res.headers['access-control-allow-methods'])
          .toBe('POST,GET,OPTIONS');
      })
      .end(done);
  });

  test("fail no token", (done: CallbackHandler) => {
    req
      .post({})
      .expect(401)
      .expect((res:TstResponse) => {
        expect(res.unauthorized).toBe(true)
        return matchErrorSupertest(res, "No auth token");
      })
      .end(done);
  });

  test("fail when token not yet valid", (done: CallbackHandler) => {
    req.setToken(
      signToken({ userId: user.id, notBefore: 5 }),
      signToken({userId:user.id, secret: process.env.JWT_REFRESH_SECRET})
    );
    req
      .post({})
      .expect(401)
      .expect((res:TstResponse) => {
        expect(res.unauthorized).toBe(true)
        return matchErrorSupertest(res, "jwt not active");
      })
      .end(done);
  });

  test("fail when token expired", async () => {
    await req.setToken(
      signToken({ userId: user.id, expiresInMinutes: 0 }),
      signToken({userId:user.id, secret: process.env.JWT_REFRESH_SECRET})
    );
    req
      .post({})
      .expect(401)
      .expect((res:TstResponse) => {
        expect(res.unauthorized).toBe(true)
        return matchErrorSupertest(res, "jwt expired");
      });
  });

  test("fail when user banned", async () => {
    user.banned = true;
    await user.save();
    await req.mkTokenPairs(user)
          .post({})
          .expect(403)
          .expect((res:TstResponse) => {
            expect(res.forbidden).toBe(true)
            return matchErrorSupertest(res, "User is banned");
          })
  });

  test("fail when user deleted", async () => {
    await req.setToken(
        signToken({ userId: 1234567890 }),
        signToken({userId:user.id, secret: process.env.JWT_REFRESH_SECRET})
      )
      .post({})
      .expect(401)
      .expect((res:TstResponse) => {
        expect(res.unauthorized).toBe(true)
        return matchErrorSupertest(res, "User does not exist");
      })
  });
});

describe("GraphiQl", ()=>{

  afterEach(async () => {
    process.env = processEnv;
    req.setToken("");
  });

  test("succeed get graphiql html when development", async () => {
    process.env = { ...processEnv, NODE_ENV: "development" };
    const app = jsonApp();
    graphQlRoute(app);
    app.finalize();
    await request(app).get('/graphiql')
      .expect(200)
      .expect("Content-Type", /text\/html/)
      .expect((response)=>{
        expect(response.unauthorized).toBe(false)
        expect(/(?:<!--.*-->)?<!DOCTYPE html/gi.test(response.text)).toEqual(true);
      });
  });

  test("fail graphiql when not development", async () => {
    process.env = { ...processEnv, NODE_ENV: "production" };
    const app = jsonApp();
    graphQlRoute(app);
    app.finalize();
    await request(app).get('/graphiql')
      .expect(404)
      .expect("Content-Type", /application\/json/)
      .expect((response)=>{
        expect(response.unauthorized).toBe(false)
        expect(response.status).toEqual(404);
        expect(response.body).toMatchObject({
          error:{message:'Not found /graphiql'},
          success:false
        })
      });
  });
});

describe("Error responses", () => {
  beforeEach(() => {
    req.setToken(signToken({ userId: user.id }));
  });

  afterEach(() => {
    req.setToken("");
  });

  test("testError", async () => {
    await req.mkTokenPairs(user)
      .post({
        query: `query { testError {message type stack}}`,
        variables: null,
      })
      .expect(200)
      .expect((res:TstResponse) => {
        const obj = JSON.parse(res.text);
        return expect(obj.data.testError).toEqual({
          message: "This is a test error",
          type: null,
          stack: null,
        });
      });
  });

  test("testErrorResponse", async () => {
    await req.mkTokenPairs(user)
      .post({
        query: `query { testErrorResponse {success error {message type stack}}}`,
        variables: null,
      })
      .expect(200)
      .expect((res:TstResponse) => {
        const obj = JSON.parse(res.text);
        return expect(obj.data.testErrorResponse).toEqual({
          success: false,
          error: {
            message: "This is a test ErrorResponse",
            type: null,
            stack: null,
          },
        });
      });
  });

  test("testOkResponse", async () => {
    await req.mkTokenPairs(user)
      .post({
        query: `query { testOkResponse {success nrAffected, ids }}`,
        variables: null,
      })
      .expect(200)
      .expect((res:TstResponse) => {
        const obj = JSON.parse(res.text);
        return expect(obj.data.testOkResponse).toEqual({
          success: true,
          nrAffected: 0,
          ids: [9],
        });
      });
  });

  test("testMutationResponseOk", async () => {
    await req.mkTokenPairs(user)
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
      .expect((res:TstResponse) => {
        const obj = JSON.parse(res.text);
        return expect(obj.data.testMutationResponseOk).toEqual({
          success: true,
          nrAffected: 0,
          ids: [10],
        });
      })
  });

  test("testMutationResponseErr", async () => {
    await req.mkTokenPairs(user)
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
      .expect((res:TstResponse) => {
        const obj = JSON.parse(res.text);
        return expect(obj.data.testMutationResponseErr).toEqual({
          success: false,
          error: {
            message: "This is a test ErrorResponse",
            type: null,
            stack: null,
          },
        });
      });
  });
});
