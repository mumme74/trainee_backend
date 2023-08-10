jest.mock("nodemailer");

import nodemailer from "nodemailer";
import { sendEmail } from "../../src/services/email.service";

import "../testProcess.env";

import { NextFunction, Request, Response, response } from "express";
import request from "supertest";
// must be imported before imported dependencies

import type { IAuthController } from "../../src/controllers/auth.controller";
import AuthController from "../../src/controllers/auth.controller";
import { User } from "../../src/models/core_user";
import { Role, eRolesAvailable } from "../../src/models/core_role";
import { Login, eLoginState } from "../../src/models/core_login";
import { InvalidateToken } from "../../src/models/core_invalidate_token";
import authRoutes from "../../src/routes/auth.routes";
import { initTestDb, closeTestDb } from "../testingDatabase";
import * as tokens from "../../src/services/token.service";
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
  TstResponse,
  testInSync,
} from "../testHelpers";
import { literal } from "sequelize";
import { comparePasswordHash } from "../../src/helpers/password";
import { PasswordReset } from "../../src/models/core_password_reset";
import { getSequelize } from "../../src/models";
import { toUtcDate } from "../../src/helpers/dbHelpers";

const mockConsole = new MockConsole();

//mockConsole.restore();

const mockController: IAuthController = {
  signup: jest.fn(AuthController.signup),
  login: jest.fn(AuthController.login),
  logout: jest.fn(AuthController.logout),
  refreshLogin: jest.fn(AuthController.refreshLogin),
  invalidateUserTokens: jest.fn(AuthController.invalidateUserTokens),
  invalidateAllTokens: jest.fn(AuthController.invalidateAllTokens),
  requestPasswordReset: jest.fn(AuthController.requestPasswordReset),
  setPasswordOnReset: jest.fn(AuthController.setPasswordOnReset),
  googleOAuthOk: jest.fn(AuthController.googleOAuthOk),
}

const app = jsonApp();
const router = authRoutes(app, mockController);
app.finalize();

beforeAll(async () => {
  await initTestDb();
  await tokens.initService();
});

afterAll(async () => {
  mockConsole.restore();
  await closeTestDb();
});

beforeEach(async () => {
  for (const mockFn of Object.values(mockController)) {
    await mockFn.mockClear();
  }
  sendMailMock?.mockClear();
});

// helper functions
let user: User;
async function createUser() {
  user = await createTestUser()
}

async function destroyUser() {
  await destroyTestUser();
}


let sendMailMock: jest.Mock<any, any, any>;
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockImplementation(() => {
    const o = {
      sendMail: jest.fn(()=>{
      //console.log('sendMail.called')
      })
    };
    sendMailMock = o.sendMail;
    return o;
  }),
}));

// -----------------------------------------------------------------
describe("signup", () => {
  const req = new JsonReq(app, "/auth/signup");
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
      .expect(async (response: any) => {
        expect(response.body.access_token).toBeTruthy();
        expect(response.body.success).toBe(true);
        const {password, ...user} = userObj;
        expect(response.body.user).toMatchObject(user);
        return expect(
          (await User.findAndCountAll({
            where:{userName:user.userName}
          })
          ).count
        ).toBe(1);
      });
  });
});

describe("login", () => {
  const req = new JsonReq(app, "/auth/login");
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
      .expect(async (res: request.Response) => {
        expect(mockController.login).not.toBeCalled();
        matchErrorSupertest(
          res,
          '"login" does not match any of the allowed types',
        );
        expect((await User.findAndCountAll({
            where:{userName:'he'}
          })
        ).count).toBe(0);
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

  test('Test correct response on success', async ()=>{
    await req
      .post({ ...loginObj})
      .expect(200)
      .expect('set-cookie', /refresh_token=.+;.* HttpOnly/)
      .expect((response: request.Response) => {
        expect(mockController.login).toBeCalled();
        expect(response.body.success).toBe(true);
        expect(response.body['access_token']).not.toBeFalsy();
      });
  });

  test('Test correct response on fail', async ()=>{
    await req
      .post({ ...loginObj, login: 'I_do_not_exist' })
      .expect(401)
      .expect((res:TstResponse)=>res.headers['set-cookie']===undefined)
      .expect((response: TstResponse) => {
        expect(mockController.login).not.toBeCalled();
        expect(response.body.success).toBe(false);
        expect(response.body.error?.message).toBe('User does not exist')
        expect(response.body['access_token']).toBeFalsy();
      });
  });

  // must be done last in test
  test("fail login 10 times, get 429 Too many request", async () => {
    for (let i = 0; i < 10; i++)
      await req.post({password: 'Not@corre3tPla$e', login:user.email});

    // check on the 10th request
    const response = await req
      .post({password: 'NotThePa$3WdWeWan%t', login: user.userName })
      .expect(429)
      .expect('Retry-After', '600');

    const login = await Login.findOne({
      where:{userId:user.id},order:[[literal('id'), 'DESC']]
    });
    expect(login?.state).toBe(eLoginState.LoginSpam);
  });
});

describe("logout", ()=>{
  const req = new JsonReq(app, "/auth/logout");
  const loginObj = {
    login: userPrimaryObj.userName,
    password: userPrimaryObj.password,
  };

  beforeAll(createUser);

  afterAll(destroyUser);

  test("should fail not logged in", async ()=>{
    await req
      .post({})
      .expect(401)
      .expect((response:TstResponse)=>{
        expect(mockController.logout).not.toBeCalled();
        expect(response.body.success).toBe(false);
        expect(response.body.error?.message).toMatch(/No.*auth.*token/);
      });
  });

  test("should fail logout non existent user", async ()=>{
    const authToken = signToken({userId:0}),
          refreshToken = signToken({
            userId:0, secret:process.env.JWT_REFRESH_SECRET});
    req.setToken(authToken);
    await req
      .post({})
      .set('Cookie', [`refresh_token=${refreshToken}`])
      .expect(401)
      .expect((res:TstResponse)=>{
        expect(mockController.logout).not.toBeCalled();
        expect(res.body.success).toBe(false);
        expect(res.body.error?.message).toMatch(/User.*not.*exist/)
      });
  });

  test("should fail wrong refresh token", async ()=>{
    const authToken = signToken({userId:user.id}),
          refreshToken = signToken({
            userId:0, secret:process.env.JWT_REFRESH_SECRET});
      req.setToken(authToken);
      await req
      .post({})
      .set('Cookie', [`refresh_token=${refreshToken}`])
      .expect(401)
      .expect((res:TstResponse)=>{
        expect(mockController.logout).not.toBeCalled();
        expect(res.body.success).toBe(false);
        expect(res.body.error?.message).toMatch(/wrong.*info/i)
      });
  });

  test("should fail expired refresh token", async ()=>{
    const authToken = signToken({userId:user.id}),
          refreshToken = signToken({
            expiresInMinutes:-0.1,
            userId:user.id, secret:process.env.JWT_REFRESH_SECRET});
      req.setToken(authToken);
      await req
      .post({})
      .set('Cookie', [`refresh_token=${refreshToken}`])
      .expect(401)
      .expect((res:TstResponse)=>{
        expect(mockController.logout).not.toBeCalled();
        expect(res.body.success).toBe(false);
        expect(res.body.error?.message).toMatch(/(?:Expired | Invalid).*token/i)
      });
  });

  test("should fail wrong secret refresh token", async ()=>{
    const authToken = signToken({userId:user.id}),
          refreshToken = signToken({
            userId:0, secret:"invalid"});
      req.setToken(authToken);
      await req
      .post({})
      .set('Cookie', [`refresh_token=${refreshToken}`])
      .expect(401)
      .expect((res:TstResponse)=>{
        expect(mockController.logout).not.toBeCalled();
        expect(res.body.success).toBe(false);
        expect(res.body.error?.message).toMatch(/(?:Expired | Invalid).*token/i)
      });
  });

  test("should not succeed logout using get", async ()=>{
    await req
    .get().expect(404);
  });

  test("should succeed logout using post", async ()=>{
    const authToken = signToken({userId:user.id}),
          refreshToken = signToken({
          userId:user.id, secret:process.env.JWT_REFRESH_SECRET});
    req.setToken(authToken);
    await req
    .post({})
    .set('Cookie', [`refresh_token=${refreshToken}`])
    .expect(200)
    .expect('set-cookie', /refresh_token=;/)
    .expect((res:TstResponse)=>{
      expect(mockController.logout).toBeCalled();
      expect(res.body.success).toBe(true);
      expect(res.body.error).toBeFalsy();
    });
  });
});

describe("refreshLogin", ()=>{

  const req = new JsonReq(app, "/auth/refreshLogin");
  const loginObj = {
    login: userPrimaryObj.userName,
    password: userPrimaryObj.password,
  };

  beforeAll(createUser);

  afterAll(destroyUser);

  test("Should fail no refreshToken", async ()=>{
    const authToken = signToken({userId:user.id});
    req.setToken(authToken);
    await req
    .post({})
    .expect(400)
    .expect((res:TstResponse)=>{
      expect(mockController.logout).not.toBeCalled();
      expect(res.body.success).toBe(false);
      expect(res.body.error?.message).toMatch(/No.*http.*token/)
    });
  });

  test("Should fail not valid refreshToken", async ()=>{
    const authToken = signToken({userId:user.id}),
          refreshToken = signToken({
            userId:user.id, secret:"invalid"});
      req.setToken(authToken);
      await req
      .post({})
      .set('Cookie', [`refresh_token=${refreshToken}`])
      .expect(401)
      .expect((res:TstResponse)=>{
        expect(mockController.logout).not.toBeCalled();
        expect(res.body.success).toBe(false);
        expect(res.body.error?.message).toMatch(/(?:Expired | Invalid).*token/i)
      });
  });

  test("Should fail expired refreshToken", async ()=>{
    const authToken = signToken({userId:user.id}),
          refreshToken = signToken({
            expiresInMinutes:-0.1,
            userId:user.id, secret:process.env.JWT_REFRESH_SECRET});
      req.setToken(authToken);
      await req
      .post({})
      .set('Cookie', [`refresh_token=${refreshToken}`])
      .expect(401)
      .expect((res:TstResponse)=>{
        expect(mockController.logout).not.toBeCalled();
        expect(res.body.success).toBe(false);
        expect(res.body.error?.message).toMatch(/(?:Expired | Invalid).*token/i)
      });
  });

  test("Should fail future date refreshToken", async ()=>{
    const authToken = signToken({userId:user.id}),
          refreshToken = signToken({
            expiresInMinutes:1, nowIsAt: new Date(+new Date() + 60000),
            userId:user.id, secret:process.env.JWT_REFRESH_SECRET});
      req.setToken(authToken);
      await req
      .post({})
      .set('Cookie', [`refresh_token=${refreshToken}`])
      .expect(401)
      .expect((res:TstResponse)=>{
        expect(mockController.logout).not.toBeCalled();
        expect(res.body.success).toBe(false);
        expect(res.body.error?.message).toMatch(/(?:Expired | Invalid).*token/i)
      });
  });

  test("Should fail refreshToken using get", async ()=>{
    await req
      .get()
      .expect(404);
  })

  test("Should succeed correct refreshToken", async ()=>{
    const authToken = signToken({userId:user.id}),
          refreshToken = signToken({
            expiresInMinutes:1,
            userId:user.id, secret:process.env.JWT_REFRESH_SECRET});
      req.setToken(authToken);
      await req
      .post({})
      .set('Cookie', [`refresh_token=${refreshToken}`])
      .expect(200)
      .expect('set-cookie', /refresh_token=.+;.*HttpOnly/)
      .expect((res:TstResponse)=>{
        expect(mockController.refreshLogin).toBeCalled();
        expect(res.body.success).toBe(true);
        expect(res.body.error).toBeFalsy();
      });
  });
});

describe("invalidateUserTokens", ()=>{
  const createReq = ()=>new JsonReq(app, "/auth/invalidateUserTokens");
  const req = createReq();

  beforeAll(createUser);

  afterAll(destroyUser);


  test("User should fail to invalidate user, not logged in", async ()=>{
    await req
    .post({})
    .expect(401)
    .expect((res:TstResponse)=>{
      expect(mockController.logout).not.toBeCalled();
      expect(res.body.success).toBe(false);
      expect(res.body.error?.message).toMatch(/No.*auth.*token/)
    });
  });


  test("User should succeed invalidate user", async ()=>{
    const authToken = signToken({userId:user.id}),
          refreshToken = signToken({
            expiresInMinutes:1, userId:user.id,
            secret:process.env.JWT_REFRESH_SECRET});

      await new Promise((resolve, reject)=>{
        request(app).post('/auth/invalidateUserTokens')
        .set('Cookie',`refresh_token=${refreshToken}`)
        .set('Authorization', authToken)
        .expect(200)
        .expect((res:any)=>{
          expect(mockController.invalidateUserTokens).toBeCalled();
          expect(res.body.success).toBe(true);
          expect(res.body.error).toBeFalsy();
          resolve(true);
        })
        .send({userId:user.id})
        // timeout here is needed as supertest call resolve when it has sent
        // the request, before expects are complete for som strange reason?
        .then(()=>{setTimeout(reject, 1000)}, reject);
      });

      await new Promise((resolve, reject)=>{
        request(app).post('/auth/logout')
        .set('Cookie', [`refresh_token=${refreshToken}`])
        .set('Authorization',authToken)
        .expect(401)
        .expect(res=>{
          expect(res.body.success).toBe(false);
          expect(res.body.error?.message).toMatch(/(?:Expired|invalid).+token/)
          return resolve(res);
        })
        .send({userId:user.id})
        .then(resolve, reject);
      });
  });
});


describe("invalidateAllTokens", ()=>{
  const createReq = ()=>new JsonReq(app, "/auth/invalidateAllTokens");
  const req = createReq();

  beforeAll(createUser);

  afterAll(destroyUser);


  test("User should fail to invalidate global, not logged in", async ()=>{
    await req
    .post({})
    .expect(401)
    .expect((res:TstResponse)=>{
      expect(mockController.logout).not.toBeCalled();
      expect(res.body.success).toBe(false);
      expect(res.body.error?.message).toMatch(/No.*auth.*token/)
    });
  });


  test("User should succeed invalidate global", async ()=>{
    const authToken = signToken({userId:user.id}),
          refreshToken = signToken({
            expiresInMinutes:1, userId:user.id,
            secret:process.env.JWT_REFRESH_SECRET});

      const r1 = await request(app).post('/auth/invalidateAllTokens')
        .set('Cookie',`refresh_token=${refreshToken}`)
        .set('Authorization', authToken)
        .expect(200)
        .send({userId:user.id});

      expect(mockController.invalidateAllTokens).toBeCalled();
      expect(r1.body.success).toBe(true);
      expect(r1.body.error).toBeFalsy();

      const r2 = await request(app).post('/auth/logout')
        .set('Cookie', [`refresh_token=${refreshToken}`])
        .set('Authorization',authToken)
        .expect(401)
        .send({userId:user.id})

      expect(r2.body.success).toBe(false);
      expect(r2.body.error?.message).toMatch(/(?:Expired|invalid).+token/)
  });
});


describe("requestPasswordReset", ()=>{
  const createReq = ()=>new JsonReq(app, "/auth/requestPasswordReset");
  const req = createReq();

  beforeAll(createUser);
  afterAll(destroyUser);


  test("Should fail non existent user", async ()=>{
    await req
      .post({email:'nonexistant@dot.com'})
      .expect(403)
      .expect((res)=>{
        expect(res.body.success).toBe(false);
        expect(res.body.error?.message).toMatch(/user.+not.+found/i)
      });
  });

  test("Should succeed to create resetToken and mail", async ()=>{
    await req
      .post({email:user.email})
      .expect(200)
      .expect(async (res)=>{
        expect(res.body.success).toBe(true);
        expect(sendMailMock).toHaveBeenCalled();
        const call = sendMailMock.mock.lastCall?.at(0) as any;

        expect(call?.to).toBe(user.email);
        matchTokenAndId(call.html);
      });
  });
});

// common between 2 describes
const matchTokenAndId = async (html:string) => {
  const mat = /<a href="[^?]+\?token=([^"]+)&(?:amp;)?id=(\d+)/g.exec(html) as string[];
  if (mat.length > 2) {
    const token = decodeURIComponent(mat[1]), id=mat[2];
    expect(+id).toBeGreaterThanOrEqual(1)
    const pwRst = await PasswordReset.findOne({where:{userId:user.id}});
    const comp = await comparePasswordHash(token, ""+pwRst?.resetToken);
    expect(comp).toBe(true);
    return {token, id:+id};
  } else throw new Error('resetToken not generated i html')
}

describe("setPasswordOnReset", ()=>{
  const createReq = ()=>new JsonReq(app, "/auth/setPasswordOnReset");
  const req = createReq();

  beforeAll(createUser);
  afterAll(async ()=>{
    sendMailMock.mockClear();
    await destroyUser();
  });

  test("Should fail no id", async ()=>{
    await req
    .post({password:'HejD¤GladeS3leman',
          token:'MDg0ZmVkMDhiOTc4YWY0ZDdkMTk2YTc0NDZhODZiNTgwMDllNjM2YjYxMWRiMTYyMTFiNjVhOWFhZGZmMjljNQ=='})
    .expect(400)
    .expect((res)=>{
      expect(res.body.success).toBe(false);
      expect(res.body.error?.message).toMatch(/"id"/i)
    });
  });
  test("Should fail non existent no resetToken", async ()=>{
    await req
    .post({id:0,password:'HejD¤GladeS3leman'})
    .expect(400)
    .expect((res)=>{
      expect(res.body.success).toBe(false);
      expect(res.body.error?.message).toMatch(/"token"/i)
    });
  });
  test("Should fail non existent no password", async ()=>{
    await req
    .post({id:0,password:'HejDuGladeS3leman',token:'MDg0ZmVkMDhiOTc4YWY0ZDdkMTk2YTc0NDZhODZiNTgwMDllNjM2YjYxMWRiMTYyMTFiNjVhOWFhZGZmMjljNQ=='})
    .expect(400)
    .expect((res)=>{
      expect(res.body.success).toBe(false);
      expect(res.body.error?.message).toMatch(/"password"/i)
    });
  });
  test("Should fail non existent to weak password", async ()=>{
    await req
    .post({id:0,token:'MDg0ZmVkMDhiOTc4YWY0ZDdkMTk2YTc0NDZhODZiNTgwMDllNjM2YjYxMWRiMTYyMTFiNjVhOWFhZGZmMjljNQ=='})
    .expect(400)
    .expect((res)=>{
      expect(res.body.success).toBe(false);
      expect(res.body.error?.message).toMatch(/"password"/i)
    });
  });

  test("Should fail non existent invalid resetToken", async ()=>{
    await req
    .post({id:0,password:'HejD¤GladeS3leman',
          token:'MDg0ZmVkMDhiOTc4YWY0ZDdkMTk2YTc0NDZhODZiNTgwMDllNjM2YjYxMWRiMTYyMTFiNjVhOWFhZGZmMjljNQ=='})
    .expect(401)
    .expect((res)=>{
      expect(res.body.success).toBe(false);
      expect(res.body.error?.message).toMatch(/invalid.+expired.+token/i)
    });
  });

  test("Should fail to old resetToken", async ()=>{
    await new Promise((resolve)=>setTimeout(resolve,1000))
    let token:string, id:number;
      const req1 = new JsonReq(app, '/auth/requestPasswordReset');
      const r1 = await req1
      .post({email:user.email})
      .expect(200)
      .expect(async (res)=>{
      })

    const call = sendMailMock.mock.calls?.at(-1)?.at(0) as any;
    const obj = await matchTokenAndId(call?.html);
    token= obj.token; id=obj.id;

    await getSequelize().query(
      'UPDATE core_PasswordResets SET createdAt=?', {
        replacements:[
        toUtcDate((+new Date()) - 1000*60*6)
    ]})

    const req2 = new JsonReq(app, '/auth/setPasswordOnReset');
    const r2 = await req2
      .post({id, token, password:'HejD¤GladeS3leman'})
      .expect(401)

    expect(r2.body.error?.message)
      .toMatch(/invalid.+expired.+reset\s*Token/i);
  });

  test("Should succeed resetToken", async ()=>{
    let token:string, id:number;
      const req1 = new JsonReq(app, '/auth/requestPasswordReset')
      const r1 = await req1
      .post({email:user.email})
      .expect(200)


    const call = sendMailMock.mock.calls?.at(-1)?.at(0) as any;
    const obj = await matchTokenAndId(call?.html);
    token= obj.token; id=obj.id;

    const req2 = new JsonReq(app, '/auth/setPasswordOnReset');
    const r2 = await req2
      .post({id, token, password:'HejD¤GladeS3leman'})
      .expect(res=>{
        console.log(res.body)
      })
      .expect(200)

    expect(r2.body.success).toBe(true);
    await new Promise((resolve)=>setTimeout(resolve, 1));
    const cnt = await PasswordReset.findAndCountAll({where:{userId:user.id}})
    expect(cnt.count).toBe(0);
  });
});


describe("oauth google", () => {
  // not sure how to test this?
});
