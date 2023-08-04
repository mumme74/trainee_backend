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
} from "../testHelpers";

import { graphQlRoute } from "../../src/graphql/routes";
import { User } from "../../src/models/core_user";
import { closeTestDb, initTestDb } from "../testingDatabase";
import { initGraphQlSchema } from "../../src/graphql/schema";

import request from "supertest";
import supertest from "supertest";
import { initGraphQl } from "../../src/graphql";

const processEnv = process.env;

const app = jsonApp();
graphQlRoute(app);
app.finalize();


initGraphQl();

const req = new JsonReq(app, "/graphql");

beforeAll(initTestDb);

afterAll(async () => {
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
      .expect((response) => {
        expect(response.unauthorized).toBe(false)
        expect(response.headers['content-length']).toBe('0');
        expect(response.headers['access-control-allow-headers'])
          .toBe('Content-Type, Authorization');
        expect(response.headers['access-control-allow-methods'])
          .toBe('POST,GET,OPTIONS');
      })
      .end(done);
  });

  test("fail no token", (done: CallbackHandler) => {
    req
      .post({})
      .expect(401)
      .expect((response) => {
        expect(response.unauthorized).toBe(true)
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
        expect(response.unauthorized).toBe(true)
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
        expect(response.unauthorized).toBe(true)
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
            expect(response.forbidden).toBe(true)
            matchErrorSupertest(response, "User is banned");
          })
          .end(done);
      })
      .catch(done);
  });

  test("fail when user deleted", (done: any) => {
    req.setToken(signToken({ userId: 1234567890 }));
    req
      .post({})
      .expect(401)
      .expect((response) => {
        expect(response.unauthorized).toBe(true)
        matchErrorSupertest(response, "Unauthenticated");
      })
      .end(done);
  });
});

describe("GraphiQl", ()=>{

  afterEach(async () => {
    process.env = processEnv;
    req.setToken("");
  });

  test("succeed get graphiql html when development", (done: CallbackHandler) => {
    process.env = { ...processEnv, NODE_ENV: "development" };
    const app = jsonApp();
    graphQlRoute(app);
    app.finalize();
    request(app).get('/graphiql')
      .expect(200)
      .expect("Content-Type", /text\/html/)
      .expect((response)=>{
        expect(response.unauthorized).toBe(false)
        expect(/(?:<!--.*-->)?<!DOCTYPE html/gi.test(response.text)).toEqual(true);
      })
      .end(done);
  });

  test("fail graphiql when not development", (done: CallbackHandler) => {
    process.env = { ...processEnv, NODE_ENV: "production" };
    const app = jsonApp();
    graphQlRoute(app);
    app.finalize();
    request(app).get('/graphiql')
    .expect(404)
    .expect("Content-Type", /application\/json/)
    .expect((response)=>{
      expect(response.unauthorized).toBe(false)
      expect(response.status).toEqual(404);
      expect(response.body).toMatchObject({
        error:{message:'Not found /graphiql'},
        success:false
      })
    })
    .end(done);
  });
});

describe("Error responses", () => {
  beforeEach(() => {
    req.setToken(signToken({ userId: user.id }));
  });

  afterEach(() => {
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
          ids: [9],
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
          ids: [10],
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
