import { getMockReq, getMockRes } from "@jest-mock/express";

import {
  validateBody,
  schemas,
  hasRoles
} from "../../src/helpers/routeHelpers";
import { AuthRequest } from "../../src/types";
import { User } from "../../src/models/user";
import { eRolesAvailable } from "../../src/models/role";
import {
  matchErrorMockCall,
  matchError,
  createTestUser,
  destroyTestUser
} from "../testHelpers";
import { closeTestDb, initTestDb } from "../testingDatabase";

const { res, next, clearMockRes } = getMockRes();

beforeAll(initTestDb);
afterAll(closeTestDb);

beforeEach(() => {
  clearMockRes();
});

// helpers
function validate(schema: any, payload: any) {
  const req = getMockReq({
    body: payload,
  });
  validateBody(schema)(req, res, next);
  return req;
}

// ---------------------------------------------------------

function testPassword(baseObj: { password: string }, schema: any) {
  test("fail when password empty", () => {
    validate(schema, { ...baseObj, password: "" });
    expect(res.status).toBeCalledWith(400);
    matchErrorMockCall(res, '"password" is not allowed to be empty');
    expect(next).not.toBeCalled();
  });

  test("fail when password all lowercase", () => {
    validate(schema, { ...baseObj, password: "secretpass1" });
    expect(res.status).toBeCalledWith(400);
    matchErrorMockCall(res, '"password" with value');
    expect(next).not.toBeCalled();
  });

  test("fail when password all CAPS", () => {
    validate(schema, { ...baseObj, password: "SECRETPASS1" });
    expect(res.status).toBeCalledWith(400);
    matchErrorMockCall(res, '"password" with value');
    expect(next).not.toBeCalled();
  });

  test("fail when password no special char", () => {
    validate(schema, { ...baseObj, password: "SecretPass1" });
    expect(res.status).toBeCalledWith(400);
    matchErrorMockCall(res, '"password" with value');
    expect(next).not.toBeCalled();
  });

  test("fail when password no number", () => {
    validate(schema, { ...baseObj, password: "SecretPass$" });
    expect(res.status).toBeCalledWith(400);
    matchErrorMockCall(res, '"password" with value');
    expect(next).not.toBeCalled();
  });

  test("fail when password to short", () => {
    validate(schema, { ...baseObj, password: "Secre1$" });
    expect(res.status).toBeCalledWith(400);
    matchErrorMockCall(res, '"password" with value');
    expect(next).not.toBeCalled();
  });

  test("succeed", () => {
    const payload = { ...baseObj, password: "SecretPass1$" };
    const req = validate(schema, payload);
    expect(res.status).not.toBeCalled();
    expect((req as AuthRequest).value?.body).toEqual(payload);
    expect(next).toBeCalled();
  });
}

// ----------------------------------------------------

function testNameFields(
  userObj: { firstName: string; lastName: string },
  schema: any,
) {
  test("fail empty firstname", () => {
    validate(schema, { ...userObj, firstName: "" });
    expect(res.status).toBeCalledWith(400);
    matchErrorMockCall(res, '"firstName" is not allowed to be empty');
    expect(next).not.toBeCalled();
  });

  test("fail too long firstname", () => {
    validate(schema, {
      ...userObj,
      firstName: "Thisisaverylongnameforaapersonsolongthatitshouldnotbeallowed",
    });
    expect(res.status).toBeCalledWith(400);
    matchErrorMockCall(res, '"firstName" length must be less than or equal to');
    expect(next).not.toBeCalled();
  });

  test("fail empty lastname", () => {
    validate(schema, { ...userObj, lastName: "" });
    expect(res.status).toBeCalledWith(400);
    matchErrorMockCall(res, '"lastName" is not allowed to be empty');
    expect(next).not.toBeCalled();
  });

  test("fail too long lastname", () => {
    validate(schema, {
      ...userObj,
      lastName: "Thisisaverylongnameforaapersonsolongthatitshouldnotbeallowed",
    });
    expect(res.status).toBeCalledWith(400);
    matchErrorMockCall(res, '"lastName" length must be less than or equal to');
    expect(next).not.toBeCalled();
  });
}

// --------------------------------------------------------

function testUsernameField(userObj: { userName: string }, schema: any) {
  test("fail empty userName", () => {
    validate(schema, { ...userObj, userName: "" });
    expect(res.status).toBeCalledWith(400);
    matchErrorMockCall(res, '"userName" is not allowed to be empty');
    expect(next).not.toBeCalled();
  });

  test("fail to long username", () => {
    validate(schema, {
      ...userObj,
      userName: "Thisisaverylongnameforaapersonsolongthatitshouldnotbeallowed",
    });
    expect(res.status).toBeCalledWith(400);
    matchErrorMockCall(res, '"userName" length must be less than or equal to');
    expect(next).not.toBeCalled();
  });

  test("fail username with '@'", () => {
    validate(schema, { ...userObj, userName: "invalid@test.com" });
    expect(res.status).toBeCalledWith(400);
    matchErrorMockCall(res, '"userName" with value');
    expect(next).not.toBeCalled();
  });
}

// --------------------------------------------------------

function testEmailField(userObj: { email: string }, schema: any) {
  test("fail empty email", () => {
    validate(schema, { ...userObj, email: "" });
    expect(res.status).toBeCalledWith(400);
    matchErrorMockCall(res, '"email" is not allowed to be empty');
    expect(next).not.toBeCalled();
  });

  test("fail invalid email", () => {
    validate(schema, { ...userObj, email: "invalid£mail.com" });
    expect(res.status).toBeCalledWith(400);
    matchErrorMockCall(res, '"email" must be a valid email');
    expect(next).not.toBeCalled();
  });
}

// ----------------------------------------------------------

function testEmptyRequestBody(schema: any) {
  test("fail empty request.body", async () => {
    validate(schema, undefined);
    expect(res.status).toBeCalledWith(400);
    matchErrorMockCall(res, "Empty request body");
    expect(next).not.toBeCalled();
  });
}

// ---------------------------------------------------------

describe("loginSchema", () => {
  const loginObj = { login: "user@login.com", password: "secretPass1$" };
  const schema = schemas.loginSchema;

  test("fail when login empty", () => {
    validate(schema, { ...loginObj, login: "" });
    expect(res.status).toBeCalledWith(400);
    matchErrorMockCall(res, '"login" does not match any of the allowed types');
    expect(next).not.toBeCalled();
  });

  test("fail when login to short", () => {
    validate(schema, { ...loginObj, login: "em" });
    expect(res.status).toBeCalledWith(400);
    matchErrorMockCall(res, '"login" does not match any of the allowed types');
    expect(next).not.toBeCalled();
  });

  // this also tests succeed
  testPassword(loginObj, schemas.loginSchema);
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
  const schema = schemas.newUserSchema;

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
  const schema = schemas.saveMyUserInfoSchema;

  testEmptyRequestBody(schema);

  testNameFields(saveObj, schema);

  testEmailField(saveObj, schema);

  test("picture empty succeed", () => {
    const payload = { ...saveObj, picture: "" };
    const req = validate(schema, payload);
    expect(res.status).not.toBeCalled();
    expect((req as AuthRequest).value?.body).toEqual(payload);
    expect(next).toBeCalled();
  });

  // --------------------------------------------------------------

  test("picture not empty succeed", () => {
    const payload = { ...saveObj };
    const req = validate(schema, payload);
    expect(res.status).not.toBeCalled();
    expect((req as AuthRequest).value?.body).toEqual(payload);
    expect(next).toBeCalled();
  });
});

// ---------------------------------------------------------------

describe("password schema", () => {
  testEmptyRequestBody(schemas.passwordSchema);
  testPassword({ password: "SecretPass1$" }, schemas.passwordSchema);
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
  const schema = schemas.deleteMySelfSchema;

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
    expect((req as AuthRequest).value?.body).toEqual(payload);
    expect(next).toBeCalled();
  });

  test("password set succeed", () => {
    const payload = { ...userObj };
    const req = validate(schema, payload);
    expect(res.status).not.toBeCalled();
    expect((req as AuthRequest).value?.body).toEqual(payload);
    expect(next).toBeCalled();
  });
});

describe("hasRoles function", () => {
  let req: AuthRequest, user: User;
  beforeEach(async () => {
    user = await createTestUser({
      firstName: "Test",
      lastName: "Testson",
      userName: "testUser",
      email: "email@user.com",
      updatedBy: 123456789,
    });
    req = getMockReq() as AuthRequest;
    req.user = {
      user,
      roles: [],
      userPic: null,
      oauth: null
    }
  });
  afterEach(destroyTestUser)

  test("fail match anyOf", async () => {
    await hasRoles({ anyOf: [eRolesAvailable.teacher] })(req, res, next);

    expect(res.status).toBeCalledWith(403);
    const data = (res.json as jest.Mock).mock.calls[0][0];
    matchError(data, "Insufficient priviledges");
    expect(next).not.toBeCalled();
  });

  test("succeed match anyOf", async () => {
    req.user.roles.push(eRolesAvailable.teacher);
    await hasRoles({ anyOf: [eRolesAvailable.teacher] })(req, res, next);

    expect(res.status).not.toBeCalled();
    expect(next).toBeCalled();
  });
});
