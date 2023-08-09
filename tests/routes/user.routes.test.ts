import { NextFunction, Request, Response } from "express";
import request from "supertest";
// must be imported before imported dependencies
import "../testProcess.env";

import type { IUsersController } from "../../src/controllers/user.controller";
import UsersController from "../../src/controllers/user.controller";
import { User } from "../../src/models/core_user";
import { Role, eRolesAvailable } from "../../src/models/core_role";
import { Login, eLoginState } from "../../src/models/core_login";
import userRoutes from "../../src/routes/user.routes";
import { initTestDb, closeTestDb } from "../testingDatabase";
import {
  JsonReq,
  matchErrorSupertest,
  signToken,
  jsonApp,
  userPrimaryObj,
  compareUser,
  pictureDefaultObj,
  createTestUser,
  destroyTestUser,
  MockConsole,
} from "../testHelpers";

const mockConsole = new MockConsole();

function respond(req: Request, res: Response, next: NextFunction) {
  return res.status(200).json(req.body);
}

const mockController: IUsersController = {
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
    await req.setToken(
        signToken({
          userId: user.id,
          expiresInMinutes: 0,
        }),
        signToken({
          userId:user.id,
          secret:process.env.JWT_REFRESH_SECRET
        })
      )
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
    const refreshToken = signToken({userId:user.id});
    await req.setToken(tokenPaths.join('.'), refreshToken)
      .get()
      .set('Cookie',`refresh_token=${refreshToken}`)
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
    await req.mkTokenPairs(user)
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
    await req.mkTokenPairs(user)
      .get()
      .expect(401)
      .expect((res: request.Response) => {
        expect(mockController.myInfo).not.toBeCalled();
        matchErrorSupertest(res, "User does not exist");
      });
  });

  test("succeed with valid token", async () => {
    await req.mkTokenPairs(user)
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
    await req.mkTokenPairs(user)
      .post({ ...userObj, email: "no@invalid" })
      .expect(400)
      .expect((res: request.Response) => {
        expect(mockController.saveMyUserInfo).not.toBeCalled();
        matchErrorSupertest(res, '"email" must be a valid email');
      });
  });

  test("fail invalid firstName", async () => {
    await req.mkTokenPairs(user)
      .post({ ...userObj, firstName: "n" })
      .expect(400)
      .expect((res: request.Response) => {
        expect(mockController.saveMyUserInfo).not.toBeCalled();
        matchErrorSupertest(res, '"firstName" length must be at least');
      });
  });

  test("fail invalid lastName", async () => {
    await req.mkTokenPairs(user)
      .post({ ...userObj, lastName: "n" })
      .expect(400)
      .expect((res: request.Response) => {
        expect(mockController.saveMyUserInfo).not.toBeCalled();
        matchErrorSupertest(res, '"lastName" length must be at least');
      });
  });

  test("fail invalid picture", async () => {
    await req.mkTokenPairs(user)
      .post({ ...userObj, picture: "invalid" })
      .expect(400)
      .expect((res: request.Response) => {
        expect(mockController.saveMyUserInfo).not.toBeCalled();
        matchErrorSupertest(res, '"picture" must be a valid uri');
      });
  });

  test("succeed with save userInfo", async () => {
    await req.mkTokenPairs(user)
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
    await req.mkTokenPairs(user)
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
    await req.mkTokenPairs(user)
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
    await req.mkTokenPairs(user)
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
    await req.mkTokenPairs(user)
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

describe("Avaliable roles", () => {
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
    await req.mkTokenPairs(user)
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
    await req.mkTokenPairs(user)
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
    await req.mkTokenPairs(user)
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
    await req.mkTokenPairs(user)
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
    await req.mkTokenPairs(user)
      .get()
      .expect(200)
      .expect((res: request.Response) => {
        expect(mockController.secret).toBeCalled();
        const r = (mockController.secret as jest.Mock).mock.calls[0][0];
        compareUser(r.user.user, user);
      });
  });
});
