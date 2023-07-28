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
import { eRolesAvailable } from "../src/models/role";
import { User } from "../src/models/user";
import { Role } from "../src/models/role";

interface IJsonApp extends ExpressType {
  finalize: () => void;
}
export function jsonApp() {
  const app = Express() as IJsonApp;
  app.use(Express.json());
  app.finalize = () => {
    app.use((req: Request, res: Response, next: NextFunction) => {
      //console.log(`404 not found ${req.path}`);
      res.status(404).json({
        success: false,
        error: { message: `Not found ${req.path}` },
      });
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
    });
  };
  return app;
}

export function matchErrorSupertest(res: supertest.Response, errMsg: string) {
  matchError(JSON.parse(res.text), errMsg);
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
  private headers: [string, string][];
  private token = "";
  private contentTypeMatcher = /application\/json/;
  constructor(
    app: ExpressType,
    basePath: string,
    headers: [string, string][] = [["Accept", "application/json"]],
    contentTypeMatcher?: RegExp,
  ) {
    this.app = app;
    this.basePath = basePath;
    this.headers = headers || [];
    if (contentTypeMatcher) {
      this.contentTypeMatcher = contentTypeMatcher;
    }
  }

  setToken(token: string) {
    this.token = token;
  }

  private setHeaders(req: request.Test) {
    req.set("Accept", "application/json");
    this.headers.forEach((header) => {
      req.set(header[0], header[1]);
    });
    if (this.token) req.set("Authorization", this.token);
    return req;
  }

  options(path?: string) {
    const req = request(this.app).options(this.basePath + (path || ""));
    return this.setHeaders(req)
      .send({})
  }

  post(postObj: any, path?: string) {
    const req = request(this.app).post(this.basePath + (path || ""));
    return this.setHeaders(req)
      .send(postObj)
      .expect("Content-Type", this.contentTypeMatcher);
  }

  get(path?: string) {
    const req = request(this.app).get(this.basePath + (path || ""));
    return this.setHeaders(req)
      .send()
      .expect("Content-Type", this.contentTypeMatcher);
  }
}

export function signToken({
  userId,
  expiresInMinutes = 60 * 8,
  notBefore = 0, // in seconds
  roles,
}: {
  userId: number;
  expiresInMinutes?: number;
  notBefore?: number;
  roles?: eRolesAvailable[];
}): string {
  return JWT.sign(
    {
      iss: process.env.APP_NAME,
      sub: userId.toString(),
      nbf: Math.floor(new Date().getTime() / 1000) + notBefore,
      iat: Math.floor(new Date().getTime() / 1000), // need to be seconds not milliseconds
      exp: Math.floor(
        new Date(new Date().getTime() + expiresInMinutes * 60000).getTime() /
          1000,
      ),
      roles,
    },
    process.env.JWT_SECRET + "",
  );
}

export const userPrimaryObj = {
  firstName: "Test",
  lastName: "Testson",
  userName: "tester1",
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
