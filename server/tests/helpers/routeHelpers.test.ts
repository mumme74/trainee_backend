import { validateBody, schemas, hasRoles } from "../../helpers/routeHelpers";

import { getMockReq, getMockRes } from "@jest-mock/express";
import { ValidationError } from "joi";
import { AuthRequest } from "../../types";
import { rolesAvailable } from "../../models/usersModel";
import type { IUserDocument } from "../../models/usersModel";

const { res, next, clearMockRes } = getMockRes();

beforeEach(() => {
  clearMockRes();
});

// ---------------------------------------------------------

function testPassword(baseObj: { password: string }, schema: any) {
  test("fail when password empty", () => {
    const req = getMockReq({ body: { ...baseObj, password: "" } });
    validateBody(schema)(req, res, next);

    expect(res.status).toBeCalledWith(400);
    expect(res.json).toBeCalledWith(expect.any(ValidationError));
    expect(next).not.toBeCalled();
  });

  test("fail when password all lowercase", () => {
    const req = getMockReq({
      body: {
        ...baseObj,
        password: "secretpass1$",
      },
    });
    validateBody(schema)(req, res, next);

    expect(res.status).toBeCalledWith(400);
    expect(res.json).toBeCalledWith(expect.any(ValidationError));
    expect(next).not.toBeCalled();
  });

  test("fail when password all CAPS", () => {
    const req = getMockReq({
      body: { ...baseObj, password: "SECRETPASS1$" },
    });
    validateBody(schema)(req, res, next);

    expect(res.status).toBeCalledWith(400);
    expect(res.json).toBeCalledWith(expect.any(ValidationError));
    expect(next).not.toBeCalled();
  });

  test("fail when password no special char", () => {
    const req = getMockReq({
      body: { ...baseObj, password: "SecretPass1" },
    });
    validateBody(schema)(req, res, next);

    expect(res.status).toBeCalledWith(400);
    expect(res.json).toBeCalledWith(expect.any(ValidationError));
    expect(next).not.toBeCalled();
  });

  test("fail when password no number", () => {
    const req = getMockReq({
      body: { ...baseObj, password: "SecretPass$" },
    });
    validateBody(schema)(req, res, next);

    expect(res.status).toBeCalledWith(400);
    expect(res.json).toBeCalledWith(expect.any(ValidationError));
    expect(next).not.toBeCalled();
  });

  test("fail when password to short", () => {
    const req = getMockReq({
      body: { ...baseObj, password: "Secre1$" },
    });
    validateBody(schema)(req, res, next);

    expect(res.status).toBeCalledWith(400);
    expect(res.json).toBeCalledWith(expect.any(ValidationError));
    expect(next).not.toBeCalled();
  });

  test("succeed", () => {
    const payload = {
      body: { ...baseObj, password: "SecretPass1$" },
    };
    const req = getMockReq(payload);
    validateBody(schema)(req, res, next);

    expect(res.status).not.toBeCalled();
    expect((req as AuthRequest).value?.body).toEqual(payload.body);
    expect(next).toBeCalled();
  });
}

// ----------------------------------------------------

function testNameFields(
  userObj: { firstName: string; lastName: string },
  schema: any,
) {
  test("fail empty firstname", () => {
    const req = getMockReq({
      body: { ...userObj, firstName: "" },
    });
    validateBody(schema)(req, res, next);

    expect(res.status).toBeCalledWith(400);
    expect(res.json).toBeCalledWith(expect.any(ValidationError));
    expect(next).not.toBeCalled();
  });

  test("fail too long firstname", () => {
    const req = getMockReq({
      body: {
        ...userObj,
        firstName:
          "Thisisaverylongnameforaapersonsolongthatitshouldnotbeallowed",
      },
    });
    validateBody(schema)(req, res, next);

    expect(res.status).toBeCalledWith(400);
    expect(res.json).toBeCalledWith(expect.any(ValidationError));
    expect(next).not.toBeCalled();
  });

  test("fail empty lastname", () => {
    const req = getMockReq({
      body: { ...userObj, lastName: "" },
    });
    validateBody(schema)(req, res, next);

    expect(res.status).toBeCalledWith(400);
    expect(res.json).toBeCalledWith(expect.any(ValidationError));
    expect(next).not.toBeCalled();
  });

  test("fail too long lastname", () => {
    const req = getMockReq({
      body: {
        ...userObj,
        lastName:
          "Thisisaverylongnameforaapersonsolongthatitshouldnotbeallowed",
      },
    });
    validateBody(schema)(req, res, next);

    expect(res.status).toBeCalledWith(400);
    expect(res.json).toBeCalledWith(expect.any(ValidationError));
    expect(next).not.toBeCalled();
  });
}

// --------------------------------------------------------

function testUsernameField(userObj: { userName: string }, schema: any) {
  test("fail empty userName", () => {
    const req = getMockReq({
      body: {
        ...userObj,
        userName:
          "Thisisaverylongnameforaapersonsolongthatitshouldnotbeallowed",
      },
    });
    validateBody(schema)(req, res, next);

    expect(res.status).toBeCalledWith(400);
    expect(res.json).toBeCalledWith(expect.any(ValidationError));
    expect(next).not.toBeCalled();
  });

  test("fail to long username", () => {
    const req = getMockReq({
      body: {
        ...userObj,
        userName:
          "Thisisaverylongnameforaapersonsolongthatitshouldnotbeallowed",
      },
    });
    validateBody(schema)(req, res, next);

    expect(res.status).toBeCalledWith(400);
    expect(res.json).toBeCalledWith(expect.any(ValidationError));
    expect(next).not.toBeCalled();
  });

  test("fail username with '@'", () => {
    const req = getMockReq({
      body: {
        ...userObj,
        userName: "invalid@test.com",
      },
    });
    validateBody(schema)(req, res, next);

    expect(res.status).toBeCalledWith(400);
    expect(res.json).toBeCalledWith(expect.any(ValidationError));
    expect(next).not.toBeCalled();
  });
}

// --------------------------------------------------------

function testEmailField(userObj: { email: string }, schema: any) {
  test("fail empty email", () => {
    const req = getMockReq({
      body: {
        ...userObj,
        email: "",
      },
    });
    validateBody(schema)(req, res, next);

    expect(res.status).toBeCalledWith(400);
    expect(res.json).toBeCalledWith(expect.any(ValidationError));
    expect(next).not.toBeCalled();
  });

  test("fail invalid email", () => {
    const req = getMockReq({
      body: {
        ...userObj,
        email: "invalid£mail.com",
      },
    });
    validateBody(schema)(req, res, next);

    expect(res.status).toBeCalledWith(400);
    expect(res.json).toBeCalledWith(expect.any(ValidationError));
    expect(next).not.toBeCalled();
  });
}

// ---------------------------------------------------------

describe("loginSchema", () => {
  const loginObj = { login: "user@login.com", password: "secretPass1$" };

  test("fail when login empty", () => {
    const req = getMockReq({ body: { ...loginObj, login: "" } });
    validateBody(schemas.loginSchema)(req, res, next);

    expect(res.status).toBeCalledWith(400);
    expect(res.json).toBeCalledWith(expect.any(ValidationError));
    expect(next).not.toBeCalled();
  });

  test("fail when login to short", () => {
    const req = getMockReq({ body: { ...loginObj, login: "em" } });
    validateBody(schemas.loginSchema)(req, res, next);

    expect(res.status).toBeCalledWith(400);
    expect(res.json).toBeCalledWith(expect.any(ValidationError));
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

  testNameFields(saveObj, schemas.saveMyUserInfoSchema);

  testEmailField(saveObj, schemas.saveMyUserInfoSchema);

  test("picture empty succeed", () => {
    const payload = {
      body: { ...saveObj, picture: "" },
    };
    const req = getMockReq(payload);
    validateBody(schemas.saveMyUserInfoSchema)(req, res, next);

    expect(res.status).not.toBeCalled();
    expect((req as AuthRequest).value?.body).toEqual(payload.body);
    expect(next).toBeCalled();
  });

  // --------------------------------------------------------------

  test("picture not empty succeed", () => {
    const payload = {
      body: { ...saveObj },
    };
    const req = getMockReq(payload);
    validateBody(schemas.saveMyUserInfoSchema)(req, res, next);

    expect(res.status).not.toBeCalled();
    expect((req as AuthRequest).value?.body).toEqual(payload.body);
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

  testNameFields(userObj, schemas.deleteMySelfSchema);

  testUsernameField(userObj, schemas.deleteMySelfSchema);

  testEmailField(userObj, schemas.deleteMySelfSchema);

  // must be able to send in empty password here if that is what i stored in DB

  //testPassword(userObj, schemas.deleteMySelfSchema);
  test("password empty succeed", () => {
    const payload = {
      body: { ...userObj, password: "" },
    };
    const req = getMockReq(payload);
    validateBody(schemas.deleteMySelfSchema)(req, res, next);

    expect(res.status).not.toBeCalled();
    expect((req as AuthRequest).value?.body).toEqual(payload.body);
    expect(next).toBeCalled();
  });

  test("password set succeed", () => {
    const payload = {
      body: { ...userObj },
    };
    const req = getMockReq(payload);
    validateBody(schemas.deleteMySelfSchema)(req, res, next);

    expect(res.status).not.toBeCalled();
    expect((req as AuthRequest).value?.body).toEqual(payload.body);
    expect(next).toBeCalled();
  });
});

// ----------------------------------------------------------------

describe("hasRoles function", () => {
  const userObj: IUserDocument = {
    id: "123456789abc",
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
  };

  test("fail no match", () => {
    const req = getMockReq() as AuthRequest;
    req.user = { ...userObj };
    hasRoles([rolesAvailable.teacher])(req, res, next);

    expect(res.status).toBeCalledWith(403);
    expect(res.json).toBeCalledWith(
      expect.objectContaining({
        error: { message: "Insufficient authorization" },
      }),
    );
    expect(next).not.toBeCalled();
  });

  test("succeed math 1", () => {
    const req = getMockReq() as AuthRequest;
    req.user = { ...userObj, roles: [rolesAvailable.teacher] };
    hasRoles([rolesAvailable.teacher])(req, res, next);

    expect(res.status).not.toBeCalled();
    expect(next).toBeCalled();
  });

  test("succeed match 2", () => {
    const req = getMockReq();
    req.user = {
      ...userObj,
      roles: [rolesAvailable.teacher, rolesAvailable.admin],
    };
    hasRoles([rolesAvailable.teacher])(req, res, next);

    expect(res.status).not.toBeCalled();
    expect(next).toBeCalled();
  });
});
