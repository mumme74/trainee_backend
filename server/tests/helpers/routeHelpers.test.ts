import { validateBody, schemas, hasRoles } from "../../helpers/routeHelpers";

import { getMockReq, getMockRes } from "@jest-mock/express";
import { ValidationError } from "joi";
import { AuthRequest } from "../../types";
import User, { rolesAvailable } from "../../models/usersModel";

const { res, next, clearMockRes } = getMockRes();

beforeEach(() => {
  clearMockRes();
});

// helpers
function matchError(errMsg: string) {
  const response = (res.json as jest.Mock).mock.calls[0][0];
  expect(response.success).toEqual(false);
  expect(response.error.message.substr(0, errMsg.length)).toEqual(errMsg);
}

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
    matchError('"password" is not allowed to be empty');
    expect(next).not.toBeCalled();
  });

  test("fail when password all lowercase", () => {
    validate(schema, { ...baseObj, password: "secretpass1" });
    expect(res.status).toBeCalledWith(400);
    matchError('"password" with value');
    expect(next).not.toBeCalled();
  });

  test("fail when password all CAPS", () => {
    validate(schema, { ...baseObj, password: "SECRETPASS1" });
    expect(res.status).toBeCalledWith(400);
    matchError('"password" with value');
    expect(next).not.toBeCalled();
  });

  test("fail when password no special char", () => {
    validate(schema, { ...baseObj, password: "SecretPass1" });
    expect(res.status).toBeCalledWith(400);
    matchError('"password" with value');
    expect(next).not.toBeCalled();
  });

  test("fail when password no number", () => {
    validate(schema, { ...baseObj, password: "SecretPass$" });
    expect(res.status).toBeCalledWith(400);
    matchError('"password" with value');
    expect(next).not.toBeCalled();
  });

  test("fail when password to short", () => {
    validate(schema, { ...baseObj, password: "Secre1$" });
    expect(res.status).toBeCalledWith(400);
    matchError('"password" with value');
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
    matchError('"firstName" is not allowed to be empty');
    expect(next).not.toBeCalled();
  });

  test("fail too long firstname", () => {
    validate(schema, {
      ...userObj,
      firstName: "Thisisaverylongnameforaapersonsolongthatitshouldnotbeallowed",
    });
    expect(res.status).toBeCalledWith(400);
    matchError('"firstName" length must be less than or equal to');
    expect(next).not.toBeCalled();
  });

  test("fail empty lastname", () => {
    validate(schema, { ...userObj, lastName: "" });
    expect(res.status).toBeCalledWith(400);
    matchError('"lastName" is not allowed to be empty');
    expect(next).not.toBeCalled();
  });

  test("fail too long lastname", () => {
    validate(schema, {
      ...userObj,
      lastName: "Thisisaverylongnameforaapersonsolongthatitshouldnotbeallowed",
    });
    expect(res.status).toBeCalledWith(400);
    matchError('"lastName" length must be less than or equal to');
    expect(next).not.toBeCalled();
  });
}

// --------------------------------------------------------

function testUsernameField(userObj: { userName: string }, schema: any) {
  test("fail empty userName", () => {
    validate(schema, { ...userObj, userName: "" });
    expect(res.status).toBeCalledWith(400);
    matchError('"userName" is not allowed to be empty');
    expect(next).not.toBeCalled();
  });

  test("fail to long username", () => {
    validate(schema, {
      ...userObj,
      userName: "Thisisaverylongnameforaapersonsolongthatitshouldnotbeallowed",
    });
    expect(res.status).toBeCalledWith(400);
    matchError('"userName" length must be less than or equal to');
    expect(next).not.toBeCalled();
  });

  test("fail username with '@'", () => {
    validate(schema, { ...userObj, userName: "invalid@test.com" });
    expect(res.status).toBeCalledWith(400);
    matchError('"userName" with value');
    expect(next).not.toBeCalled();
  });
}

// --------------------------------------------------------

function testEmailField(userObj: { email: string }, schema: any) {
  test("fail empty email", () => {
    validate(schema, { ...userObj, email: "" });
    expect(res.status).toBeCalledWith(400);
    matchError('"email" is not allowed to be empty');
    expect(next).not.toBeCalled();
  });

  test("fail invalid email", () => {
    validate(schema, { ...userObj, email: "invalid£mail.com" });
    expect(res.status).toBeCalledWith(400);
    matchError('"email" must be a valid email');
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
    matchError('"login" does not match any of the allowed types');
    expect(next).not.toBeCalled();
  });

  test("fail when login to short", () => {
    validate(schema, { ...loginObj, login: "em" });
    expect(res.status).toBeCalledWith(400);
    matchError('"login" does not match any of the allowed types');
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

  testNameFields(newUser, schemas.newUserSchema);

  testUsernameField(newUser, schemas.newUserSchema);

  testEmailField(newUser, schemas.newUserSchema);

  // this should also test succeed
  testPassword(newUser, schemas.newUserSchema);
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

// ----------------------------------------------------------------

describe("hasRoles function", () => {
  let req: AuthRequest;
  beforeEach(() => {
    req = getMockReq() as AuthRequest;
    req.user = new User({
      firstName: "Test",
      lastName: "Testson",
      userName: "testUser",
      email: "email@user.com",
      method: "local",
      updatedBy: "123456789abc",
      updatedAt: Date,
      createdAt: Date,
      lastLogin: Date,
      roles: [rolesAvailable.student],
    });
  });

  test("fail no match", () => {
    hasRoles([rolesAvailable.teacher])(req, res, next);

    expect(res.status).toBeCalledWith(403);
    expect(res.json).toBeCalledWith(
      expect.objectContaining({
        error: { message: "Insufficient authorization" },
      }),
    );
    expect(next).not.toBeCalled();
  });

  test("succeed match 1", () => {
    req.user.roles.push(rolesAvailable.teacher);
    hasRoles([rolesAvailable.teacher])(req, res, next);

    expect(res.status).not.toBeCalled();
    expect(next).toBeCalled();
  });

  test("succeed match 2", () => {
    req.user.roles.push(rolesAvailable.teacher);
    req.user.roles.push(rolesAvailable.admin);

    hasRoles([rolesAvailable.teacher, rolesAvailable.admin])(req, res, next);

    expect(res.status).not.toBeCalled();
    expect(next).toBeCalled();
  });
});
