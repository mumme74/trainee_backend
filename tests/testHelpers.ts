import type {
  Express as ExpressType,
  Response,
  Request,
} from "express-serve-static-core";
import { getMockReq } from "@jest-mock/express";
import Express, { NextFunction, response } from "express";
import request from "supertest";
import supertest from "supertest";
import JWT from "jsonwebtoken";
import { eRolesAvailable } from "../src/models/core_role";
import { User } from "../src/models/core_user";
import { Role } from "../src/models/core_role";
import { initGraphQlSchema } from "../src/graphql/schema";
import { Console } from "console";
import internal, { Stream } from "stream";
import { finalhandlerAuthError } from "../src/middlewares/auth.fail.finalhandler";
import { finalhandlerErrorToJson } from "../src/middlewares/error.finalhandler";
import cookieParser from "cookie-parser";
import { toUtcDate } from "../src/helpers/dbHelpers";

export type TstRequest = request.Test;
export type TstResponse = request.Response;

interface IJsonApp extends ExpressType {
  finalize: () => void;
}
export function jsonApp() {
  const app = Express() as IJsonApp;

  app.use(Express.json());
  app.use(Express.urlencoded({extended: true}));
  app.use(cookieParser());

  app.finalize = () => {

    // authentication errors
    app.use(finalhandlerAuthError);


    app.use((req: Request, res: Response, next: NextFunction) => {
      if (res.headersSent)
        return next();
      //console.log(`404 not found ${req.path}`);
      res.status(404).json({
        success: false,
        error: { message: `Not found ${req.path}` },
      });
      return next();
    });


    app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      const status = !isNaN(+err) ? +err : 500
      const errObj = {
        success: false,
        error: {
          message: "Error from express",
          status,
          error: { message: err.message || err, stack: err.stack?.split("\n") },
        },
      };
      console.log('express error',err);
      res.status(status).json(errObj);
      return next(err);
    });

    // last resort final error
    app.use(finalhandlerErrorToJson);
  };
  return app;
}

export function matchErrorSupertest(res: supertest.Response, errMsg: string) {
  matchError(res.body, errMsg);
}

export function matchErrorMockCall(res: Response, errMsg: string) {
  const response = (res.json as jest.Mock).mock.calls[0][0];
  matchError(response, errMsg);
}

export function matchError(
  response: { success: boolean; error: { message: string } },
  errMsg: string,
) {
  expect(response.success).toEqual(false);
  expect(response.error.message.substr(0, errMsg.length)).toEqual(errMsg);
}

export class JsonReq {
  private app: ExpressType;
  private basePath: string;
  private headers: {[key:string]: string}[];
  private token = "";
  private refreshToken:string | undefined = "";
  private contentTypeMatcher = /application\/json/;
  private endCalls  = 0;
  public request: request.SuperTest<request.Test>;
  public chainedReq: number;
  constructor(
    app: ExpressType,
    basePath: string,
    headers: {[key:string]:string}[] = [{"Accept": "application/json"}],
    contentTypeMatcher?: RegExp,
    chainedReq: number = 1, // number of requests after the other
  ) {
    this.app = app;
    this.basePath = basePath;
    this.headers = headers || [];
    if (contentTypeMatcher) {
      this.contentTypeMatcher = contentTypeMatcher;
    }
    this.request = request(app);
    this.chainedReq = chainedReq;
  }

  private finalize(req:TstRequest, sendObj?: object | undefined){
    req.set("Accept", "application/json");
    for (const header of this.headers)
      for (const [key, vlu] of Object.entries(header))
        req.set(key, vlu);
    // do the send last in chain
    if (sendObj) {
      (req as any).end = (...args: any[])=>{
        req.send(sendObj);
        req.constructor.prototype.end.apply(req, args);
      }
    }
    return req;
  }

  setToken(authToken: string, refreshToken?: string) {
    this.token = authToken;
    if (refreshToken)
      this.setRefreshToken(refreshToken);
    return this.setHeader("Authorization", authToken);
  }

  setRefreshToken(refreshToken: string) {
    this.refreshToken = refreshToken;
    return this.setHeader('Cookie', `refresh_token=${refreshToken}`);
  }

  mkTokenPairs(user: User) {
    this.setToken(
      signToken({userId:user.id, secret: process.env.JWT_AUTH_SECRET}),
      signToken({userId:user.id, secret: process.env.JWT_REFRESH_SECRET})
    );
    return this;
  }

  setHeader(name:string, value:string) {
    this.headers.push({[name]: value})
    return this;
  }

  options(path?: string) {
    return this.finalize(
       this.request.options(this.basePath + (path || "")));
  }

  post(postObj: any, path?: string) {
    return this.finalize(
      this.request.post(this.basePath + (path || "")), postObj)
      .expect("Content-Type", this.contentTypeMatcher);
  }

  get(path?: string) {
    return this.finalize(
      this.request.get(this.basePath + (path || "")))
      .expect("Content-Type", this.contentTypeMatcher);
  }
}

export function signToken({
  userId,
  expiresInMinutes = 60 * 8,
  notBefore = 0, // in seconds
  roles, nowIsAt = new Date(),
  secret = process.env.JWT_AUTH_SECRET+""
}: {
  userId: number;
  expiresInMinutes?: number;
  notBefore?: number;
  roles?: eRolesAvailable[];
  nowIsAt?: Date,
  secret?: string;
}): string {
  return JWT.sign(
    {
      iss: process.env.APP_NAME,
      sub: userId.toString(),
      nbf: Math.floor(+nowIsAt / 1000) + notBefore,
      iat: Math.floor(+nowIsAt / 1000), // need to be seconds not milliseconds
      exp: Math.floor(
        +new Date(+nowIsAt + expiresInMinutes * 60000) / 1000,
      ),
      roles,
    },
    secret,
  );
}

export const userPrimaryObj = {
  firstName: "Test",
  lastName: "Testson",
  userName: "tester1",
  phone: "+46 70-5648944",
  method: "google",
  password: "SecretPass1$",
  email: "user1@testing.com",
  updatedBy: 123456789,
};

export const roleDefaultObj = {
  role: eRolesAvailable.student
}

export const pictureDefaultObj = {
  blob: "https://somedomain.com/path/to/image.png",
  mime: "remote"
}

export const oauthDefaultObj = {
  oauthId: "123456789abc"
}

export const organizationDefaultObj = {
  name: 'Test organization',
  domain: "testschool.com",
}

export function compareUser(
  user: any,
  userSaved: User,
  compareId = true,
) {
  if (compareId) {
    expect(user.id).toEqual(userSaved.id);
  }
  if (user.updatedBy && userSaved.updatedBy) {
    expect(user.updatedBy.toString()).toEqual(userSaved.updatedBy.toString());
  }
  const subset = (u: User) => {
    return {
      userName:  u.userName,
      email:     u.email,
      firstName: u.firstName,
      lastName:  u.lastName,
      createdAt: u.createdAt,
      //updatedAt: u.updatedAt,
      updatedBy: u.updatedBy,
    }
  }

  expect(subset(user)).toMatchObject(subset(userSaved));
}

let user: User, defaultRole: Role, iterations = 0;
const users: User[] = [], defaultRoles: Role[] = [];
export async function createTestUser(
  spreadValues: {[key:string]:number|string|Date} = {}
):
  Promise<User>
{
  try {
    const values = {...userPrimaryObj, ...spreadValues}
    user = await User.create({
      ...values,
      userName: values.userName.replace(/[0-9]+/, (++iterations).toString()),
      email:values.email.replace(/[0-9]+/, (iterations).toString())
    });
    users.push(user);
    defaultRole = await Role.create({userId:user.id,role:eRolesAvailable.student});
    defaultRoles.push(defaultRole);
  } catch(err:any) {
    if (err.errors)
      err.errors.forEach((e: any)=>console.error(e.message, e.value || err.stack))
    else
      console.error(err.message || err, err.stack);
  }
  return user;
}

export async function destroyTestUser(user: User | undefined = undefined) {
  try {
    const ids:number[] = [];
    for (const u of users.length ? users : (user ? [user] : [])) {
      ids.push(u.id);
      await u.destroy({force:true});
    }

    for (const r of defaultRoles.filter(r=>ids.indexOf(r.userId)>-1))
      await r.destroy({force:true})
  } catch(err: any) {
    if (err.errors)
      err.errors.forEach((e: any)=>console.error(e.message));
    else console.error(err.message || err, err.stack);
    throw err;
  }
}

export class ArrStream extends Stream.Writable {
  private arr: any[];
  constructor(
    arr: any[],
    opts?: internal.WritableOptions | undefined
  ) {
    super(opts);
    this.arr = arr;
  }
  _write(chunk: any, enc:any, next:any) {
    this.arr.push(chunk.toString ? chunk.toString() : chunk);
    next();
  }
}

export class MockConsole extends Console {
  private oldConsole = global.console;
  private stdOutArr: any[];
  private stdErrArr: any[];

  constructor() {
    console.log('redirect console')
    const stdOutArr: any[] = [], stdErrArr:any[] = [];
    const stdout = new ArrStream(stdOutArr),
          stderr = new ArrStream(stdErrArr);

    super(stdout, stderr);

    this.oldConsole = global.console;
    global.console = this;
    this.stdErrArr = stdErrArr;
    this.stdOutArr = stdOutArr;
  }

  get stdout(): any[] {
    return [...this.stdOutArr.splice(0)];
  }

  get stderr(): any[] {
    return [...this.stdErrArr.splice(0)];
  }

  debug(message?: any, ...optionalParams: any[]): void {
    this.oldConsole.log.apply(this.oldConsole, arguments as any);
  }

  clear() {
    this.stdErrArr.splice(0);
    this.stdOutArr.splice(0);
  }

  restore() {
    global.console = this.oldConsole;
    console.log('console restored');
  }
}
