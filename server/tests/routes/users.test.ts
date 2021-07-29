import { getMockRes } from "@jest-mock/express";
import { NextFunction, Request, Response } from "express";
import request from "supertest";
import type { CallbackHandler } from "supertest";

// must be imported before imported dependancies
import "../testProcess.env";

import type { IUsersController } from "../../controllers/users";
import User, { IUserDocument, rolesAvailable } from "../../models/usersModel";
import userRoutes from "../../routes/users";
import { initMemoryDb, closeMemoryDb } from "../testingDatabase";
import {
  JsonReq,
  matchErrorSupertest,
  signToken,
  jsonApp,
} from "../testHelpers";
import { AnyAaaaRecord } from "dns";

function respond(req: Request, res: Response, next: NextFunction) {
  return res.status(200).json(req.body);
}

const mockController: IUsersController = {
  signup: jest.fn(respond),
  login: jest.fn(respond),
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
  await initMemoryDb();
});

afterAll(async () => {
  await closeMemoryDb();
});

const userPrimaryObj = {
  firstName: "Test",
  lastName: "Testson",
  userName: "tester",
  method: "google",
  password: "SecretPass1$",
  email: "user@testing.com",
  google: { id: "123456789abc" },
  domain: "testing.com",
  picture: "https://somedomain.com/path/to/imgae.png",
  roles: [rolesAvailable.student],
  updatedBy: "123456789abc",
};

beforeEach(() => {
  for (const mockFn of Object.values(mockController)) {
    mockFn.mockClear();
  }
});

// helper functions
function compareUser(user: any, userSaved: IUserDocument) {
  expect(user.id.toString()).toEqual(userSaved.id.toString());
  expect(user.updatedBy.toString()).toEqual(userSaved.updatedBy.toString());
  expect(user).toMatchObject({
    method: userSaved.method,
    userName: userSaved.userName,
    email: userSaved.email,
    firstName: userSaved.firstName,
    lastName: userSaved.lastName,
    domain: userSaved.domain,
    createdAt: userSaved.createdAt,
    updatedAt: userSaved.updatedAt,
  });
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

  test("fail signup email invalid", (done: CallbackHandler) => {
    req
      .post({ ...userObj, email: "test@failmail" })
      .expect(400)
      .expect((response: request.Response) => {
        matchErrorSupertest(response, '"email" must be a valid email');
        expect(mockController.signup).not.toBeCalled();
      })
      .end(done);
  });

  test("fail signup userName invalid", (done: CallbackHandler) => {
    req
      .post({ ...userObj, userName: "hej@" })
      .expect(400)
      .expect((res: request.Response) => {
        expect(mockController.signup).not.toBeCalled();
        matchErrorSupertest(
          res,
          '"userName" with value "hej@" fails to match the required pattern:',
        );
      })
      .end(done);
  });

  test("fail signup firstName invalid", (done: CallbackHandler) => {
    req
      .post({ ...userObj, firstName: "F" })
      .expect(400)
      .expect((res: request.Response) => {
        expect(mockController.signup).not.toBeCalled();
        matchErrorSupertest(res, '"firstName" length must be at least');
      })
      .end(done);
  });

  test("fail signup lastName invalid", (done: CallbackHandler) => {
    req
      .post({ ...userObj, lastName: "F" })
      .expect(400)
      .expect((res: request.Response) => {
        expect(mockController.signup).not.toBeCalled();
        matchErrorSupertest(res, '"lastName" length must be at least');
      })
      .end(done);
  });

  test("fail signup password invalid", (done: CallbackHandler) => {
    req
      .post({ ...userObj, password: "notvalid" })
      .expect(400)
      .expect((res: request.Response) => {
        expect(mockController.signup).not.toBeCalled();
        matchErrorSupertest(
          res,
          '"password" with value "notvalid" fails to match the required pattern:',
        );
      })
      .end(done);
  });

  test("succeed signup", (done: CallbackHandler) => {
    req
      .post({ ...userObj })
      .expect(200)
      .expect((response: any) => {
        expect(response.body).toEqual(userObj);
      })
      .end(done);
  });
});

describe("login", () => {
  const req = new JsonReq(app, "/users/login");
  const loginObj = {
    login: userPrimaryObj.userName,
    password: userPrimaryObj.password,
  };

  let user: IUserDocument;
  beforeAll(async () => {
    user = new User(userPrimaryObj);
    await user.save();
  });

  afterAll(async () => {
    await user.remove();
  });

  test("fail login name empty", (done: CallbackHandler) => {
    req
      .post({ ...loginObj, login: "" })
      .expect(400)
      .expect((res: request.Response) => {
        expect(mockController.login).not.toBeCalled();
        matchErrorSupertest(
          res,
          '"login" does not match any of the allowed types',
        );
      })
      .end(done);
  });

  test("fail login email invalid", (done: CallbackHandler) => {
    req
      .post({ ...loginObj, login: "test@failmail" })
      .expect(400)
      .expect((res: request.Response) => {
        expect(mockController.login).not.toBeCalled();
        matchErrorSupertest(
          res,
          '"login" does not match any of the allowed types',
        );
      })
      .end(done);
  });

  test("fail login name to short", (done: CallbackHandler) => {
    req
      .post({ ...loginObj, login: "he" })
      .expect(400)
      .expect((res: request.Response) => {
        expect(mockController.login).not.toBeCalled();
        matchErrorSupertest(
          res,
          '"login" does not match any of the allowed types',
        );
      })
      .end(done);
  });

  test("fail login with password invalid", (done: CallbackHandler) => {
    req
      .post({ ...loginObj, password: "Secretpass1" })
      .expect(400)
      .expect((res: request.Response) => {
        expect(mockController.login).not.toBeCalled();
        matchErrorSupertest(
          res,
          '"password" with value "Secretpass1" fails to match the required pattern',
        );
      })
      .end(done);
  });

  test("succeed login with email", (done: CallbackHandler) => {
    req
      .post({ ...loginObj, login: userPrimaryObj.email })
      .expect(200)
      .expect((response: request.Response) => {
        expect(mockController.login).toBeCalled();
        const request = (mockController.login as jest.Mock).mock.calls[0][0];
        compareUser(request.user, user);
      })
      .end(done);
  });

  test("succeed login with userName", (done: CallbackHandler) => {
    req
      .post({ ...loginObj })
      .expect(200)
      .expect((response: request.Response) => {
        expect(mockController.login).toBeCalled();
        const request = (mockController.login as jest.Mock).mock.calls[0][0];
        compareUser(request.user, user);
      })
      .end(done);
  });
});

describe("oauth google", () => {
  // not sure how to test this?
});

describe("myinfo", () => {
  const req = new JsonReq(app, "/users/myinfo");
  let token: string;
  let user: IUserDocument;
  beforeEach(async () => {
    user = new User(userPrimaryObj);
    await user.save();
  });

  afterEach(async () => {
    await User.deleteMany();
  });

  afterEach(() => {
    req.setToken("");
  });

  test("fail no token", (done: CallbackHandler) => {
    req
      .get()
      .expect(401)
      .expect((res: request.Response) => {
        expect(mockController.myInfo).not.toBeCalled();
        matchErrorSupertest(res, "No auth token");
      })
      .end(done);
  });

  test("fail expired token", (done: CallbackHandler) => {
    req.setToken(
      signToken({
        userId: user.id.toString(),
        expiresInMinutes: 0,
      }),
    );
    req
      .get()
      .expect(401)
      .expect((res: request.Response) => {
        expect(mockController.myInfo).not.toBeCalled();
        matchErrorSupertest(res, "jwt expired");
      })
      .end(done);
  });

  test("fail not yet valid token", (done: CallbackHandler) => {
    req.setToken(
      signToken({
        userId: user.id.toString(),
        expiresInMinutes: 10,
        notBefore: 5,
      }),
    );
    req
      .get()
      .expect(401)
      .expect((res: request.Response) => {
        expect(mockController.myInfo).not.toBeCalled();
        matchErrorSupertest(res, "jwt not active");
      })
      .end(done);
  });

  test("fail tampered token", (done: CallbackHandler) => {
    const tokenPaths = signToken({
      userId: user.id.toString(),
    }).split(".");
    tokenPaths[1] = (() => {
      const data = JSON.parse(
        Buffer.from(tokenPaths[1], "base64").toString("utf-8"),
      );
      data.sub = "0123456789abcd";
      return Buffer.from(JSON.stringify(data)).toString("base64");
    })();
    req.setToken(tokenPaths.join("."));
    req
      .get()
      .expect(401)
      .expect((res: request.Response) => {
        //console.log(res);
        expect(mockController.myInfo).not.toBeCalled();
        matchErrorSupertest(res, "invalid token");
      })
      .end(done);
  });

  test("fail banned user", (done: any) => {
    user.banned = true;
    user
      .save()
      .then(() => {
        req.setToken(signToken({ userId: user.id.toString() }));
        req
          .get()
          .expect(403)
          .expect((res: request.Response) => {
            expect(mockController.myInfo).not.toBeCalled();
            matchErrorSupertest(res, "Unauthenticated");
          })
          .end(done);
      })
      .catch(done);
  });

  test("fail token belongs to deleted user", (done: any) => {
    User.deleteMany()
      .then(() => {
        req.setToken(signToken({ userId: user.id.toString() }));
        req
          .get()
          .expect(401)
          .expect((res: request.Response) => {
            expect(mockController.myInfo).not.toBeCalled();
            matchErrorSupertest(res, "Unauthenticated");
          })
          .end(done);
      })
      .catch(done);
  });

  test("succeed with valid token", (done: CallbackHandler) => {
    req.setToken(signToken({ userId: user.id.toString() }));
    req
      .get()
      .expect(200)
      .expect((res: request.Response) => {
        expect(mockController.myInfo).toBeCalled();
        const r = (mockController.myInfo as jest.Mock).mock.calls[0][0];
        compareUser(r.user, user);
      })
      .end(done);
  });
});

describe("savemyuserinfo", () => {
  const req = new JsonReq(app, "/users/savemyuserinfo");
  let token: string;
  let user: IUserDocument;

  const userObj = {
    firstName: userPrimaryObj.firstName,
    lastName: userPrimaryObj.lastName,
    email: userPrimaryObj.email,
    picture: userPrimaryObj.picture,
  };

  beforeAll(async () => {
    user = new User(userPrimaryObj);
    await user.save();
  });

  afterAll(async () => {
    await User.deleteMany();
  });

  afterEach(() => {
    req.setToken("");
  });

  test("fail when GET", (done: CallbackHandler) => {
    req.get().expect(404).end(done);
  });

  test("fail no token", (done: CallbackHandler) => {
    req
      .post({ ...userObj })
      .expect(401)
      .expect((res: request.Response) => {
        expect(mockController.saveMyUserInfo).not.toBeCalled();
        matchErrorSupertest(res, "No auth token");
      })
      .end(done);
  });

  test("fail invalid email", (done: CallbackHandler) => {
    req.setToken(signToken({ userId: user.id.toString() }));
    req
      .post({ ...userObj, email: "no@invalid" })
      .expect(400)
      .expect((res: request.Response) => {
        expect(mockController.saveMyUserInfo).not.toBeCalled();
        matchErrorSupertest(res, '"email" must be a valid email');
      })
      .end(done);
  });

  test("fail invalid firstName", (done: CallbackHandler) => {
    req.setToken(signToken({ userId: user.id.toString() }));
    req
      .post({ ...userObj, firstName: "n" })
      .expect(400)
      .expect((res: request.Response) => {
        expect(mockController.saveMyUserInfo).not.toBeCalled();
        matchErrorSupertest(res, '"firstName" length must be at least');
      })
      .end(done);
  });

  test("fail invalid lastName", (done: CallbackHandler) => {
    req.setToken(signToken({ userId: user.id.toString() }));
    req
      .post({ ...userObj, lastName: "n" })
      .expect(400)
      .expect((res: request.Response) => {
        expect(mockController.saveMyUserInfo).not.toBeCalled();
        matchErrorSupertest(res, '"lastName" length must be at least');
      })
      .end(done);
  });

  test("fail invalid picture", (done: CallbackHandler) => {
    req.setToken(signToken({ userId: user.id.toString() }));
    req
      .post({ ...userObj, picture: "invalid" })
      .expect(400)
      .expect((res: request.Response) => {
        expect(mockController.saveMyUserInfo).not.toBeCalled();
        matchErrorSupertest(res, '"picture" must be a valid uri');
      })
      .end(done);
  });

  test("succeed with save userInfo", (done: CallbackHandler) => {
    req.setToken(signToken({ userId: user.id.toString() }));
    req
      .post({ ...userObj })
      .expect(200)
      .expect((res: request.Response) => {
        expect(mockController.saveMyUserInfo).toBeCalled();
        const r = (mockController.saveMyUserInfo as jest.Mock).mock.calls[0][0];
        compareUser(r.user, user);
      })
      .end(done);
  });
});

describe("changemypassword", () => {
  const req = new JsonReq(app, "/users/changemypassword");
  let token: string;
  let user: IUserDocument;

  const userObj = {
    password: "SecretPass1$",
  };

  beforeAll(async () => {
    user = new User(userPrimaryObj);
    await user.save();
  });

  afterAll(async () => {
    await User.deleteMany();
  });

  afterEach(() => {
    req.setToken("");
  });

  test("fail when GET", (done: CallbackHandler) => {
    req.get().expect(404).end(done);
  });

  test("fail no token", (done: CallbackHandler) => {
    req
      .post({ ...userObj })
      .expect(401)
      .expect((res: request.Response) => {
        expect(mockController.changeMyPassword).not.toBeCalled();
        matchErrorSupertest(res, "No auth token");
      })
      .end(done);
  });

  test("fail invalid password", (done: CallbackHandler) => {
    req.setToken(signToken({ userId: user.id.toString() }));
    req
      .post({ ...userObj, password: "Secretpass1" })
      .expect(400)
      .expect((res: request.Response) => {
        expect(mockController.changeMyPassword).not.toBeCalled();
        matchErrorSupertest(
          res,
          '"password" with value "Secretpass1" fails to match the required pattern',
        );
      })
      .end(done);
  });

  test("succeed with change password", (done: CallbackHandler) => {
    req.setToken(signToken({ userId: user.id.toString() }));
    req
      .post({ ...userObj })
      .expect(200)
      .expect((res: request.Response) => {
        expect(mockController.changeMyPassword).toBeCalled();
        const r = (mockController.changeMyPassword as jest.Mock).mock
          .calls[0][0];
        compareUser(r.user, user);
      })
      .end(done);
  });
});

describe("deletemyself", () => {
  const req = new JsonReq(app, "/users/deletemyself");
  let token: string;
  let user: IUserDocument;

  const userObj = {
    userName: userPrimaryObj.userName,
    firstName: userPrimaryObj.firstName,
    lastName: userPrimaryObj.lastName,
    email: userPrimaryObj.email,
    password: userPrimaryObj.password,
  };

  beforeAll(async () => {
    user = new User(userPrimaryObj);
    await user.save();
  });

  afterAll(async () => {
    await User.deleteMany();
  });

  afterEach(() => {
    req.setToken("");
  });

  test("fail when GET", (done: CallbackHandler) => {
    req.get().expect(404).end(done);
  });

  test("fail no token", (done: CallbackHandler) => {
    req
      .post({ ...userObj })
      .expect(401)
      .expect((res: request.Response) => {
        expect(mockController.deleteMyself).not.toBeCalled();
        matchErrorSupertest(res, "No auth token");
      })
      .end(done);
  });

  test("fail invalid userName", (done: CallbackHandler) => {
    req.setToken(signToken({ userId: user.id.toString() }));
    req
      .post({ ...userObj, userName: "no@" })
      .expect(400)
      .expect((res: request.Response) => {
        expect(mockController.deleteMyself).not.toBeCalled();
        matchErrorSupertest(
          res,
          '"userName" with value "no@" fails to match the required pattern',
        );
      })
      .end(done);
  });

  test("fail invalid email", (done: CallbackHandler) => {
    req.setToken(signToken({ userId: user.id.toString() }));
    req
      .post({ ...userObj, email: "no@invalid" })
      .expect(400)
      .expect((res: request.Response) => {
        expect(mockController.deleteMyself).not.toBeCalled();
        matchErrorSupertest(res, '"email" must be a valid email');
      })
      .end(done);
  });

  test("fail invalid firstName", (done: CallbackHandler) => {
    req.setToken(signToken({ userId: user.id.toString() }));
    req
      .post({ ...userObj, firstName: "n" })
      .expect(400)
      .expect((res: request.Response) => {
        expect(mockController.deleteMyself).not.toBeCalled();
        matchErrorSupertest(res, '"firstName" length must be at least');
      })
      .end(done);
  });

  test("fail invalid lastName", (done: CallbackHandler) => {
    req.setToken(signToken({ userId: user.id.toString() }));
    req
      .post({ ...userObj, lastName: "n" })
      .expect(400)
      .expect((res: request.Response) => {
        expect(mockController.deleteMyself).not.toBeCalled();
        matchErrorSupertest(res, '"lastName" length must be at least');
      })
      .end(done);
  });

  test("fail invalid password", (done: CallbackHandler) => {
    req.setToken(signToken({ userId: user.id.toString() }));
    req
      .post({ ...userObj, password: "SecretPass1" })
      .expect(400)
      .expect((res: request.Response) => {
        expect(mockController.deleteMyself).not.toBeCalled();
        matchErrorSupertest(
          res,
          '"password" does not match any of the allowed types',
        );
      })
      .end(done);
  });

  test("succeed with save userInfo", (done: CallbackHandler) => {
    req.setToken(signToken({ userId: user.id.toString() }));
    req
      .post({ ...userObj })
      .expect(200)
      .expect((res: request.Response) => {
        expect(mockController.deleteMyself).toBeCalled();
        const r = (mockController.deleteMyself as jest.Mock).mock.calls[0][0];
        compareUser(r.user, user);
      })
      .end(done);
  });

  test("succeed with save userInfo and empty password", (done: CallbackHandler) => {
    req.setToken(signToken({ userId: user.id.toString() }));
    req
      .post({ ...userObj, password: "" })
      .expect(200)
      .expect((res: request.Response) => {
        expect(mockController.deleteMyself).toBeCalled();
        const r = (mockController.deleteMyself as jest.Mock).mock.calls[0][0];
        compareUser(r.user, user);
      })
      .end(done);
  });
});

describe("avaliableroles", () => {
  const req = new JsonReq(app, "/users/availableroles");
  let token: string;
  let user: IUserDocument;

  beforeAll(async () => {
    user = new User(userPrimaryObj);
    await user.save();
  });

  afterAll(async () => {
    await User.deleteMany();
  });

  afterEach(() => {
    req.setToken("");
  });

  test("fail when Post", (done: CallbackHandler) => {
    req.post({}).expect(404).end(done);
  });

  test("fail no token", (done: CallbackHandler) => {
    req
      .get()
      .expect(401)
      .expect((res: request.Response) => {
        expect(mockController.rolesAvailable).not.toBeCalled();
        matchErrorSupertest(res, "No auth token");
      })
      .end(done);
  });

  test("fail with role student", (done: any) => {
    user.roles = [rolesAvailable.student];
    user
      .save()
      .then(() => {
        req.setToken(signToken({ userId: user.id.toString() }));
        req
          .get()
          .expect(403)
          .expect((res: request.Response) => {
            expect(mockController.rolesAvailable).not.toBeCalled();
            matchErrorSupertest(res, "Insufficient priviledges");
          })
          .end(done);
      })
      .catch(done);
  });

  test("fail with role teacher", (done: any) => {
    user.roles.push(rolesAvailable.teacher);
    user
      .save()
      .then(() => {
        req.setToken(signToken({ userId: user.id.toString() }));
        req
          .get()
          .expect(403)
          .expect((res: request.Response) => {
            expect(mockController.rolesAvailable).not.toBeCalled();
            matchErrorSupertest(res, "Insufficient priviledges");
          })
          .end(done);
      })
      .catch(done);
  });

  test("succeed with role admin", (done: any) => {
    user.roles.push(rolesAvailable.admin);
    user
      .save()
      .then(() => {
        req.setToken(signToken({ userId: user.id.toString() }));
        req
          .get()
          .expect(200)
          .expect((res: request.Response) => {
            expect(mockController.rolesAvailable).toBeCalled();
            const r = (mockController.rolesAvailable as jest.Mock).mock
              .calls[0][0];
            compareUser(r.user, user);
          })
          .end(done);
      })
      .catch(done);
  });

  test("succeed with role super admin", (done: any) => {
    user.roles.push(rolesAvailable.super);
    user
      .save()
      .then(() => {
        req.setToken(signToken({ userId: user.id.toString() }));
        req
          .get()
          .expect(200)
          .expect((res: request.Response) => {
            expect(mockController.rolesAvailable).toBeCalled();
            const r = (mockController.rolesAvailable as jest.Mock).mock
              .calls[0][0];
            compareUser(r.user, user);
          })
          .end(done);
      })
      .catch(done);
  });
});

describe("secret", () => {
  const req = new JsonReq(app, "/users/secret");
  let token: string;
  let user: IUserDocument;

  beforeAll(async () => {
    user = new User(userPrimaryObj);
    await user.save();
  });

  afterAll(async () => {
    await User.deleteMany();
  });

  afterEach(() => {
    req.setToken("");
  });

  test("fail when POST", (done: CallbackHandler) => {
    req.post({}).expect(404).end(done);
  });

  test("fail no token", (done: CallbackHandler) => {
    req
      .get()
      .expect(401)
      .expect((res: request.Response) => {
        expect(mockController.secret).not.toBeCalled();
        matchErrorSupertest(res, "No auth token");
      })
      .end(done);
  });

  test("succeed with token", (done: CallbackHandler) => {
    req.setToken(signToken({ userId: user.id.toString() }));
    req
      .get()
      .expect(200)
      .expect((res: request.Response) => {
        expect(mockController.secret).toBeCalled();
        const r = (mockController.secret as jest.Mock).mock.calls[0][0];
        compareUser(r.user, user);
      })
      .end(done);
  });
});
