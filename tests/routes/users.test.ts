import { getMockRes } from "@jest-mock/express";
import { NextFunction, Request, Response } from "express";
import request from "supertest";
import type { CallbackHandler } from "supertest";

// must be imported before imported dependencies
import "../testProcess.env";

import type { IUsersController } from "../../src/controllers/users";
import UsersController from "../../src/controllers/users";
import { User } from "../../src/models/core_user";
import { Role, eRolesAvailable } from "../../src/models/core_role";
import { Login, eLoginState } from "../../src/models/core_login";
import userRoutes from "../../src/routes/users";
import { initTestDb, closeTestDb } from "../testingDatabase";
import {
  JsonReq,
  matchErrorSupertest,
  signToken,
  jsonApp,
  userPrimaryObj,
  organizationDefaultObj,
  oauthDefaultObj,
  compareUser,
  pictureDefaultObj,
  createTestUser,
  destroyTestUser,
  MockConsole,
} from "../testHelpers";
import { literal } from "sequelize";

const mockConsole = new MockConsole();

function respond(req: Request, res: Response, next: NextFunction) {
  return res.status(200).json(req.body);
}

const mockController: IUsersController = {
  signup: jest.fn(respond),
  login: jest.fn(respond),
  requestPasswordReset: jest.fn(UsersController.requestPasswordReset),
  setPasswordOnReset: jest.fn(UsersController.setPasswordOnReset),
  googleOAuthOk: jest.fn(respond),
  myInfo: jest.fn(respond),
  saveMyUserInfo: jest.fn(respond),
  changeMyPassword: jest.fn(respond),
  deleteMyself: jest.fn(respond),
  rolesAvailable: jest.fn(respond),
  secret: jest.fn(respond),
};

const app = jsonApp();
const router = userRoutes(app, mockController);
app.finalize();

beforeAll(async () => {
  await initTestDb();
});

afterAll(async () => {
  mockConsole.restore();
  await closeTestDb();
});

beforeEach(async () => {
  for (const mockFn of Object.values(mockController)) {
    await mockFn.mockClear();
  }
});

// helper functions
let user: User;
async function createUser() {
  user = await createTestUser()
}

async function destroyUser() {
  await destroyTestUser();
}

// -----------------------------------------------------

describe("signup", () => {
  const req = new JsonReq(app, "/users/signup");
  const userObj = {
    email: "user@testing.com",
    userName: "tester",
    firstName: "Test",
    lastName: "Testsson",
    password: "SectretPass1$",
  };

  test("fail signup email invalid", async () => {
    await req
      .post({ ...userObj, email: "test@failmail" })
      .expect(400)
      .expect((response: request.Response) => {
        matchErrorSupertest(response, '"email" must be a valid email');
        expect(mockController.signup).not.toBeCalled();
      });
  });

  test("fail signup userName invalid", async () => {
    await req
      .post({ ...userObj, userName: "hej@" })
      .expect(400)
      .expect((res: request.Response) => {
        expect(mockController.signup).not.toBeCalled();
        matchErrorSupertest(
          res,
          '"userName" with value "hej@" fails to match the required pattern:',
        );
      });
  });

  test("fail signup firstName invalid", async () => {
    await req
      .post({ ...userObj, firstName: "F" })
      .expect(400)
      .expect((res: request.Response) => {
        expect(mockController.signup).not.toBeCalled();
        matchErrorSupertest(res, '"firstName" length must be at least');
      });
  });

  test("fail signup lastName invalid", async () => {
    await req
      .post({ ...userObj, lastName: "F" })
      .expect(400)
      .expect((res: request.Response) => {
        expect(mockController.signup).not.toBeCalled();
        matchErrorSupertest(res, '"lastName" length must be at least');
      });
  });

  test("fail signup password invalid", async () => {
    await req
      .post({ ...userObj, password: "notvalid" })
      .expect(400)
      .expect((res: request.Response) => {
        expect(mockController.signup).not.toBeCalled();
        matchErrorSupertest(
          res,
          '"password" failed custom validation because Password must have mixed UPPER and lower case',
        );
      });
  });

  test("fail signup phone invalid", async () => {
    await req
      .post({ ...userObj, phone: "0987&3332" })
      .expect(400)
      .expect((res: request.Response) => {
        expect(mockController.signup).not.toBeCalled();
        matchErrorSupertest(
          res,
          '"phone" with value "0987&3332" fails to match',
        );
      });
  });

  test("succeed signup", async () => {
    await req
      .post({ ...userObj })
      .expect(200)
      .expect((response: any) => {
        expect(response.body).toEqual(userObj);
      });
  });
});

describe("login", () => {
  const req = new JsonReq(app, "/users/login");
  const loginObj = {
    login: userPrimaryObj.userName,
    password: userPrimaryObj.password,
  };

  beforeAll(createUser);

  afterAll(destroyUser);

  test("fail login name empty", async () => {
    await req
      .post({ ...loginObj, login: "" })
      .expect(400)
      .expect((res: request.Response) => {
        expect(mockController.login).not.toBeCalled();
        matchErrorSupertest(
          res,
          '"login" does not match any of the allowed types',
        );
      });
  });

  test("fail login email invalid", async () => {
    await req
      .post({ ...loginObj, login: "test@failmail" })
      .expect(400)
      .expect((res: request.Response) => {
        expect(mockController.login).not.toBeCalled();
        matchErrorSupertest(
          res,
          '"login" does not match any of the allowed types',
        );
      });
  });

  test("fail login name to short", async () => {
    await req
      .post({ ...loginObj, login: "he" })
      .expect(400)
      .expect((res: request.Response) => {
        expect(mockController.login).not.toBeCalled();
        matchErrorSupertest(
          res,
          '"login" does not match any of the allowed types',
        );
      });
  });

  test("fail login with password invalid", async () => {
    await req
      .post({ ...loginObj, password: "Secretpass1" })
      .expect(400)
      .expect((res: request.Response) => {
        expect(mockController.login).not.toBeCalled();
        matchErrorSupertest(
          res,
          '"password" failed custom validation because Password insufficient strength',
        );
      });
  });

  test("succeed login with email", async () => {
    await req
      .post({ ...loginObj, login: user.email })
      .expect(200)
      .expect(async (response: request.Response) => {
        expect(mockController.login).toBeCalled();
        const request = (mockController.login as jest.Mock).mock.calls[0][0];
        compareUser(request?.user?.user, user);
        expect(request.user?.user?.updatedAt.getTime())
          .toBeGreaterThan(user.updatedAt.getTime());
        const login = await Login.findOne({
          where:{userId:user.id},order:[[literal('id'), 'DESC']]});
        expect(login?.state).toBe(eLoginState.PasswdLoginOk);
      });
  });

  test("succeed login with userName", async () => {
    await req
      .post({ ...loginObj, login: user.userName })
      .expect(200)
      .expect(async (response: request.Response) => {
        expect(mockController.login).toBeCalled();
        const request = (mockController.login as jest.Mock).mock.calls[0][0];
        compareUser(request.user.user, user);
        const login = await Login.findOne({
          where:{userId:user.id},order:[[literal('id'), 'DESC']]})
        expect(login?.state).toBe(eLoginState.PasswdLoginOk);
      });
  });

  test("fail login with userName wrong password", async () => {
    await req
      .post({password: 'NotThePa$3WdWeWan%t', login: user.userName })
      .expect(403)
      .expect(async (response: request.Response) => {
          const login = await Login.findOne({
            where:{userId:user.id},order:[[literal('id'), 'DESC']]});
          expect(login?.state).toBe(eLoginState.WrongPassword);
      });
  });

  test("fail login 10 times, get 429 Too many request", async () => {
    for (let i = 0; i < 10; i++)
      await req.post({password: 'Not@corre3tPla$e', login:user.email});

    // check on the 10th request
    await req
      .post({password: 'NotThePa$3WdWeWan%t', login: user.userName })
      .expect(429)
      .expect('Retry-After', '600')
      .expect(async (response: request.Response) => {
          const login = await Login.findOne({
            where:{userId:user.id},order:[[literal('id'), 'DESC']]});
          expect(login?.state).toBe(eLoginState.LoginSpam);
      });
  });
});

describe("oauth google", () => {
  // not sure how to test this?
});

describe("myinfo", () => {
  const req = new JsonReq(app, "/users/myinfo");
  let token: string;

  beforeEach(createUser);

  afterEach(destroyUser);

  afterEach(() => {
    req.setToken("");
  });

  test("fail no token", async () => {
    await req
      .get()
      .expect(401)
      .expect((res: request.Response) => {
        expect(mockController.myInfo).not.toBeCalled();
        matchErrorSupertest(res, "No auth token");
      });
  });

  test("fail expired token", async () => {
    req.setToken(
      signToken({
        userId: user.id,
        expiresInMinutes: 0,
      }),
    );
    await req
      .get()
      .expect(401)
      .expect((res: request.Response) => {
        expect(mockController.myInfo).not.toBeCalled();
        matchErrorSupertest(res, "jwt expired");
      });
  });

  test("fail not yet valid token", async () => {
    req.setToken(
      signToken({
        userId: user.id,
        expiresInMinutes: 10,
        notBefore: 5,
      }),
    );
    await req
      .get()
      .expect(401)
      .expect((res: request.Response) => {
        expect(mockController.myInfo).not.toBeCalled();
        matchErrorSupertest(res, "jwt not active");
      });
  });

  test("fail tampered token", async () => {
    const tokenPaths = signToken({
      userId: user.id,
    }).split(".");
    tokenPaths[1] = (() => {
      const data = JSON.parse(
        Buffer.from(tokenPaths[1], "base64").toString("utf-8"),
      );
      data.sub = "0123456789abcd";
      return Buffer.from(JSON.stringify(data)).toString("base64");
    })();
    req.setToken(tokenPaths.join("."));
    await req
      .get()
      .expect(401)
      .expect((res: request.Response) => {
        //console.log(res);
        expect(mockController.myInfo).not.toBeCalled();
        matchErrorSupertest(res, "invalid token");
      });
  });

  test("fail banned user", async () => {
    user.banned = true;
    await user.save();
    req.setToken(signToken({ userId: user.id }));
    await req
      .get()
      .expect(403)
      .expect((res: request.Response) => {
        expect(res.forbidden).toBe(true);
        expect(mockController.myInfo).not.toBeCalled();
        matchErrorSupertest(res, "User is banned");
      });
  });

  test("fail token belongs to deleted user", async () => {
    await user.destroy()
    req.setToken(signToken({ userId: user.id }));
    await req
      .get()
      .expect(401)
      .expect((res: request.Response) => {
        expect(mockController.myInfo).not.toBeCalled();
        matchErrorSupertest(res, "User does not exist");
      });
  });

  test("succeed with valid token", async () => {
    req.setToken(signToken({ userId: user.id }));
    await req
      .get()
      .expect(200)
      .expect((res: request.Response) => {
        expect(mockController.myInfo).toBeCalled();
        const r = (mockController.myInfo as jest.Mock).mock.calls[0][0];
        compareUser(r.user.user, user);
      });
  });
});

describe("savemyuserinfo", () => {
  const req = new JsonReq(app, "/users/savemyuserinfo");
  let token: string;

  const userObj = {
    firstName: userPrimaryObj.firstName,
    lastName: userPrimaryObj.lastName,
    email: userPrimaryObj.email,
    picture: pictureDefaultObj.blob
  };

  beforeAll(createUser);

  afterAll(destroyUser);

  afterEach(() => {
    req.setToken("");
  });

  test("fail when GET", async () => {
    await req.get().expect(404);
  });

  test("fail no token", async () => {
    await req
      .post({ ...userObj })
      .expect(401)
      .expect((res: request.Response) => {
        expect(mockController.saveMyUserInfo).not.toBeCalled();
        matchErrorSupertest(res, "No auth token");
      });
  });

  test("fail invalid email", async () => {
    req.setToken(signToken({ userId: user.id }));
    await req
      .post({ ...userObj, email: "no@invalid" })
      .expect(400)
      .expect((res: request.Response) => {
        expect(mockController.saveMyUserInfo).not.toBeCalled();
        matchErrorSupertest(res, '"email" must be a valid email');
      });
  });

  test("fail invalid firstName", async () => {
    req.setToken(signToken({ userId: user.id }));
    await req
      .post({ ...userObj, firstName: "n" })
      .expect(400)
      .expect((res: request.Response) => {
        expect(mockController.saveMyUserInfo).not.toBeCalled();
        matchErrorSupertest(res, '"firstName" length must be at least');
      });
  });

  test("fail invalid lastName", async () => {
    req.setToken(signToken({ userId: user.id }));
    await req
      .post({ ...userObj, lastName: "n" })
      .expect(400)
      .expect((res: request.Response) => {
        expect(mockController.saveMyUserInfo).not.toBeCalled();
        matchErrorSupertest(res, '"lastName" length must be at least');
      });
  });

  test("fail invalid picture", async () => {
    req.setToken(signToken({ userId: user.id }));
    await req
      .post({ ...userObj, picture: "invalid" })
      .expect(400)
      .expect((res: request.Response) => {
        expect(mockController.saveMyUserInfo).not.toBeCalled();
        matchErrorSupertest(res, '"picture" must be a valid uri');
      });
  });

  test("succeed with save userInfo", async () => {
    req.setToken(signToken({ userId: user.id }));
    await req
      .post({ ...userObj })
      .expect(200)
      .expect((res: request.Response) => {
        expect(mockController.saveMyUserInfo).toBeCalled();
        const r = (mockController.saveMyUserInfo as jest.Mock).mock.calls[0][0];
        compareUser(r.user.user, user);
      });
  });
});

describe("changemypassword", () => {
  const req = new JsonReq(app, "/users/changemypassword");
  let token: string;

  const userObj = {
    password: "SecretPass1$",
  };

  beforeAll(createUser);

  afterAll(destroyUser);

  afterEach(() => {
    req.setToken("");
  });

  test("fail when GET", async () => {
    await req.get().expect(404);
  });

  test("fail no token", async () => {
    await req
      .post({ ...userObj })
      .expect(401)
      .expect((res: request.Response) => {
        expect(mockController.changeMyPassword).not.toBeCalled();
        matchErrorSupertest(res, "No auth token");
      });
  });

  test("fail invalid password", async () => {
    req.setToken(signToken({ userId: user.id}));
    await req
      .post({ ...userObj, password: "Secretpass1" })
      .expect(400)
      .expect((res: request.Response) => {
        expect(mockController.changeMyPassword).not.toBeCalled();
        matchErrorSupertest(
          res,
          '"password" failed custom validation because Password insufficient strength',
        );
      });
  });

  test("succeed with change password", async () => {
    req.setToken(signToken({ userId: user.id }));
    await req
      .post({ ...userObj })
      .expect(200)
      .expect((res: request.Response) => {
        expect(mockController.changeMyPassword).toBeCalled();
        const r = (mockController.changeMyPassword as jest.Mock).mock
          .calls[0][0];
        compareUser(r.user.user, user);
      });
  });
});

describe("deletemyself", () => {
  const req = new JsonReq(app, "/users/deletemyself");
  let token: string;

  const userObj = {
    userName: userPrimaryObj.userName,
    firstName: userPrimaryObj.firstName,
    lastName: userPrimaryObj.lastName,
    email: userPrimaryObj.email,
    password: userPrimaryObj.password,
  };

  beforeAll(createUser);

  afterAll(destroyUser);

  afterEach(() => {
    req.setToken("");
  });

  test("fail when GET", async () => {
    await req.get().expect(404);
  });

  test("fail no token", async () => {
    await req
      .post({ ...userObj })
      .expect(401)
      .expect((res: request.Response) => {
        expect(mockController.deleteMyself).not.toBeCalled();
        matchErrorSupertest(res, "No auth token");
      });
  });

  test("fail invalid userName", async () => {
    req.setToken(signToken({ userId: user.id }));
    await req
      .post({ ...userObj, userName: "no@" })
      .expect(400)
      .expect((res: request.Response) => {
        expect(mockController.deleteMyself).not.toBeCalled();
        matchErrorSupertest(
          res,
          '"userName" with value "no@" fails to match the required pattern',
        );
      });
  });

  test("fail invalid email", async () => {
    req.setToken(signToken({ userId: user.id }));
    await req
      .post({ ...userObj, email: "no@invalid" })
      .expect(400)
      .expect((res: request.Response) => {
        expect(mockController.deleteMyself).not.toBeCalled();
        matchErrorSupertest(res, '"email" must be a valid email');
      });
  });

  test("fail invalid firstName", async () => {
    req.setToken(signToken({ userId: user.id }));
    await req
      .post({ ...userObj, firstName: "n" })
      .expect(400)
      .expect((res: request.Response) => {
        expect(mockController.deleteMyself).not.toBeCalled();
        matchErrorSupertest(res, '"firstName" length must be at least');
      });
  });

  test("fail invalid lastName", async () => {
    req.setToken(signToken({ userId: user.id }));
    await req
      .post({ ...userObj, lastName: "n" })
      .expect(400)
      .expect((res: request.Response) => {
        expect(mockController.deleteMyself).not.toBeCalled();
        matchErrorSupertest(res, '"lastName" length must be at least');
      });
  });

  test("fail invalid password", async () => {
    req.setToken(signToken({ userId: user.id }));
    await req
      .post({ ...userObj, password: "Secret" })
      .expect(400)
      .expect((res: request.Response) => {
        expect(mockController.deleteMyself).not.toBeCalled();
        matchErrorSupertest(
          res,
          '"password" does not match any of the allowed types',
        );
      });
  });

  test("succeed with save userInfo", async () => {
    req.setToken(signToken({ userId: user.id }));
    await req
      .post({ ...userObj })
      .expect(200)
      .expect((res: request.Response) => {
        expect(mockController.deleteMyself).toBeCalled();
        const r = (mockController.deleteMyself as jest.Mock).mock.calls[0][0];
        compareUser(r.user.user, user);
      });
  });

  test("succeed with save userInfo and empty password", async () => {
    req.setToken(signToken({ userId: user.id }));
    await req
      .post({ ...userObj, password: "" })
      .expect(200)
      .expect((res: request.Response) => {
        expect(mockController.deleteMyself).toBeCalled();
        const r = (mockController.deleteMyself as jest.Mock).mock.calls[0][0];
        compareUser(r.user.user, user);
      });
  });
});

describe("avaliableroles", () => {
  const req = new JsonReq(app, "/users/availableroles");
  let token: string;

  beforeAll(createUser);

  afterAll(destroyUser);

  afterEach(() => {
    req.setToken("");
  });

  test("fail when Post", async () => {
    await req.post({}).expect(404);
  });

  test("fail no token", async () => {
    await req
      .get()
      .expect(401)
      .expect((res: request.Response) => {
        expect(mockController.rolesAvailable).not.toBeCalled();
        matchErrorSupertest(res, "No auth token");
      });
  });

  test("fail with role student", async () => {
    await user.save()
    req.setToken(signToken({ userId: user.id }));
    await req
      .get()
      .expect(403)
      .expect((res: request.Response) => {
        expect(mockController.rolesAvailable).not.toBeCalled();
        matchErrorSupertest(res, "Insufficient privileges");
      });
  });

  test("fail with role teacher", async () => {
    await Role.create({userId:user.id,role:eRolesAvailable.teacher})
    await user.save()
    req.setToken(signToken({ userId: user.id }));
    await req
      .get()
      .expect(403)
      .expect((res: request.Response) => {
        expect(mockController.rolesAvailable).not.toBeCalled();
        matchErrorSupertest(res, "Insufficient privileges");
      });
  });

  test("succeed with role admin", async () => {
    await Role.create({userId:user.id,role:eRolesAvailable.admin});
    await user.save();
    req.setToken(signToken({ userId: user.id }));
    await req
      .get()
      .expect(200)
      .expect((res: request.Response) => {
        expect(mockController.rolesAvailable).toBeCalled();
        const r = (mockController.rolesAvailable as jest.Mock).mock
          .calls[0][0];
        compareUser(r.user.user, user);
      });
  });

  test("succeed with role super admin", async () => {
    await Role.create({userId:user.id,role:eRolesAvailable.super})
    await user.save()
    req.setToken(signToken({ userId: user.id }));
    await req
      .get()
      .expect(200)
      .expect((res: request.Response) => {
        expect(mockController.rolesAvailable).toBeCalled();
        const r = (mockController.rolesAvailable as jest.Mock).mock
          .calls[0][0];
        compareUser(r.user.user, user);
      });
  });
});

describe("secret", () => {
  const req = new JsonReq(app, "/users/secret");
  let token: string;

  beforeAll(createUser);

  afterAll(destroyUser);

  afterEach(() => {
    req.setToken("");
  });

  test("fail when POST", async () => {
    await req.post({}).expect(404);
  });

  test("fail no token", async () => {
    await req
      .get()
      .expect(401)
      .expect((res: request.Response) => {
        expect(mockController.secret).not.toBeCalled();
        matchErrorSupertest(res, "No auth token");
      });
  });

  test("succeed with token", async () => {
    req.setToken(signToken({ userId: user.id }));
    await req
      .get()
      .expect(200)
      .expect((res: request.Response) => {
        expect(mockController.secret).toBeCalled();
        const r = (mockController.secret as jest.Mock).mock.calls[0][0];
        compareUser(r.user.user, user);
      });
  });
});
