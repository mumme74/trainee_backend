import { getMockReq, getMockRes } from "@jest-mock/express";

import "../testProcess.env";
import type { IUserDocument } from "../../models/usersModel";
import User, { eRolesAvailable } from "../../models/usersModel";
import UsersController from "../../controllers/users";
import { initMemoryDb, closeMemoryDb } from "../testingDatabase";
import { userPrimaryObj, matchErrorMockCall } from "../testHelpers";

beforeAll(async () => {
  await initMemoryDb();
});

afterAll(async () => {
  await closeMemoryDb();
});

const { res, next, clearMockRes } = getMockRes();

let user: IUserDocument;
beforeEach(() => {
  user = new User(userPrimaryObj);
  clearMockRes();
});

afterEach(async () => {
  await User.deleteMany();
});

// --------------------------------------------------------
// helpers
async function checkUserInDB(matchUserObj: any, password?: string) {
  const newUser = await User.findOne({ email: matchUserObj.email });
  expect(newUser).not.toEqual(undefined);
  expect(newUser).toMatchObject({
    ...matchUserObj,
    method: "local",
  });
  //must be done outside of toMatchObject
  expect([...(newUser?.roles || [])]).toEqual([eRolesAvailable.student]);
  if (password)
    await expect(newUser?.isValidPassword(password)).resolves.toEqual(true);

  return newUser?.id;
}

function checkToken(response: any, userId: string, expiresInMinutes: number) {
  expect(response.access_token).toBeDefined();
  // decode token
  const tokenPayload = JSON.parse(
    Buffer.from(response.access_token.split(".")[1], "base64").toString(),
  );
  expect(tokenPayload.iss).toEqual(process.env.APP_NAME);
  expect(tokenPayload.sub).toEqual(userId);
  // check issue time
  expect(Math.floor(new Date(tokenPayload.iat / 10).getTime())).toEqual(
    Math.floor(new Date().getTime() / 10000),
  );
  // check expiration +- 10seconds
  expect(
    Math.floor(new Date(tokenPayload.exp * 1000).getTime() / 10000),
  ).toEqual(
    Math.floor((new Date().getTime() + expiresInMinutes * 60000) / 10000), // min * 60000 msec
  );
}

// --------------------------------------------------------

describe("signup", () => {
  const password = userPrimaryObj.password;
  const userObj = {
    email: userPrimaryObj.email,
    userName: userPrimaryObj.userName,
    firstName: userPrimaryObj.firstName,
    lastName: userPrimaryObj.lastName,
  };
  test("fail email in use", async () => {
    await user.save();
    const req = getMockReq({
      value: {
        body: { ...userObj, password, userName: "nonexistant" },
      },
    });

    await UsersController.signup(req, res, next);

    expect(res.status).toBeCalledWith(403);
    expect(res.json).toBeCalledWith(
      expect.objectContaining({
        success: false,
        error: { message: "email already in use" },
      }),
    );
  });

  test("fail userName already in use", async () => {
    await user.save();
    const req = getMockReq({
      value: {
        body: { ...userObj, password, email: "nonexistant@mail.com" },
      },
    });

    await UsersController.signup(req, res, next);

    expect(res.status).toBeCalledWith(403);
    matchErrorMockCall(res, "userName already in use");
  });

  test("save new user", async () => {
    const reqPayload = { value: { body: { ...userObj, password } } };
    const req = getMockReq(reqPayload);

    await UsersController.signup(req, res, next);
    expect(res.status).toBeCalledWith(200);
    const response = (res.json as jest.Mock).mock.calls[0][0];
    expect(response).toMatchObject({
      user: {
        firstName: userObj.firstName,
        lastName: userObj.lastName,
        email: userObj.email,
        userName: userObj.userName,
        domain: "",
        method: "local",
        picture: "",
      },
    });

    const id = await checkUserInDB({ ...userObj }, password);

    checkToken(response, id, 8 * 60);
  });
});

// -------------------------------------------------------

describe("login", () => {
  // if we get here we are authenticated by previous middleware
  // meaning: we must be in database.
  test("login response", async () => {
    // we dont need request body here as that is handled in passport
    const req = getMockReq({ user });
    await UsersController.login(req, res, next);
    expect(res.status).toBeCalledWith(200);
    const response = (res.json as jest.Mock).mock.calls[0][0];
    expect(response).toMatchObject({
      user: {
        id: user.id,
        method: user.method,
        userName: user.userName,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        picture: user.picture,
        googleId: user?.google?.id,
        domain: user.domain,
        updatedBy: user.updatedBy,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });

    checkToken(response, user.id, 8 * 60);
  });
});

// ----------------------------------------------------------

describe("googleOAuthOK", () => {
  test("login via OAUTH from google", async () => {
    const tokenExpiresIn = 60;
    const req = getMockReq({ user, tokenExpiresIn });
    await UsersController.googleOAuthOk(req, res, next);
    expect(res.status).toBeCalledWith(200);
    const response = (res.json as jest.Mock).mock.calls[0][0];
    expect(response).toMatchObject({
      user: {
        id: user.id,
        method: user.method,
        userName: user.userName,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        picture: user.picture,
        googleId: user?.google?.id,
        domain: user.domain,
        updatedBy: user.updatedBy,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });

    checkToken(response, user.id, tokenExpiresIn);
  });
});

// -----------------------------------------------------------

describe("myInfo", () => {
  test("test my info", () => {
    const req = getMockReq({ user });
    UsersController.myInfo(req, res, next);
    expect(res.status).toBeCalledWith(200);
    const response = (res.json as jest.Mock).mock.calls[0][0];
    expect(response).toMatchObject({
      id: user.id,
      method: user.method,
      userName: user.userName,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      picture: user.picture,
      googleId: user?.google?.id,
      domain: user.domain,
      updatedBy: user.updatedBy,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  });
});

// ------------------------------------------------------------

describe("saveMyUserInfo", () => {
  test("fail when save non existing user", async () => {
    const req = getMockReq({ user });
    await UsersController.saveMyUserInfo(req, res, next);
    expect(res.status).toBeCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: { message: "User not found!" },
      }),
    );
  });

  test("succeed save existing user", async () => {
    await user.save();
    const updatedInfo = {
      firstName: "FirstName",
      lastName: "LastName",
      email: "another@noclue.nu",
      picture: "https://serverpath.com",
    };
    const req = getMockReq({ user, body: updatedInfo });
    await UsersController.saveMyUserInfo(req, res, next);
    expect(res.status).toBeCalledWith(200);
    const response = (res.json as jest.Mock).mock.calls[0][0];
    expect(response).toMatchObject({
      id: user.id,
      method: user.method,
      userName: user.userName,
      email: updatedInfo.email,
      firstName: updatedInfo.firstName,
      lastName: updatedInfo.lastName,
      picture: updatedInfo.picture,
      googleId: user?.google?.id,
      domain: user.domain,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
    });

    expect(response.updatedBy.toString()).toEqual(user.id.toString());
  });
});

// ------------------------------------------------------------

describe("changeMyPassword", () => {
  const newPassword = "This@IsANewPassword";

  test("fail user not found", async () => {
    const req = getMockReq({
      user,
      body: { _id: user.id, password: newPassword },
    });
    await UsersController.changeMyPassword(req, res, next);
    expect(res.status).toBeCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: { message: "User not found!" },
      }),
    );
  });

  test("succeed change password", async () => {
    await user.save();
    const req = getMockReq({
      user,
      body: { _id: user.id, password: newPassword },
    });
    await UsersController.changeMyPassword(req, res, next);
    expect(res.status).toBeCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true }),
    );

    const u = await User.findById(user.id);
    expect(u?.updatedBy.toString()).toEqual(user.id.toString());
    await expect(u?.isValidPassword(newPassword)).resolves.toEqual(true);
  });
});

describe("deleteMyself", () => {
  const password = userPrimaryObj.password;

  const userObj = {
    userName: userPrimaryObj.userName,
    email: userPrimaryObj.email,
    firstName: userPrimaryObj.firstName,
    lastName: userPrimaryObj.lastName,
    password,
  };

  async function testMissmatch(userObj: any) {
    await user.save();
    const req = getMockReq({
      user,
      body: { ...userObj },
    });
    await UsersController.deleteMyself(req, res, next);
    expect(res.status).toBeCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: { message: "Missmatched info!" },
      }),
    );
  }

  test("fail wrong passwd", async () => {
    await testMissmatch({ ...userObj, password: "MissmatchPasswd1€" });
  });

  test("fail missmatch email", async () => {
    await testMissmatch({ ...userObj, email: "nomatch@somedomain.com" });
  });

  test("fail missmatch userName", async () => {
    await testMissmatch({ ...userObj, userName: "nomatch" });
  });

  test("fail missmatch firstName", async () => {
    await testMissmatch({ ...userObj, firstName: "NoName" });
  });

  test("fail missmatch lastName", async () => {
    await testMissmatch({ ...userObj, lastName: "noLastName" });
  });

  test("succeed deleteMySelf", async () => {
    await user.save();
    const req = getMockReq({
      user,
      body: { ...userObj },
    });
    await UsersController.deleteMyself(req, res, next);
    expect(res.status).toBeCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true }),
    );
  });
});
