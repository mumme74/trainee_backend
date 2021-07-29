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
import { rolesAvailable } from "../models/usersModel";

interface IJsonApp extends ExpressType {
  finalize: () => void;
}
export function jsonApp() {
  const app = Express() as IJsonApp;
  app.use(Express.json());
  app.finalize = () => {
    app.use((req: Request, res: Response, next: NextFunction) => {
      console.log(`404 not found ${req.path}`);
      res.status(404).json({
        success: false,
        error: { message: `Not found ${req.path}` },
      });
    });

    app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      const errObj = {
        success: false,
        error: {
          message: "500: Internal Server Error",
          status: 500,
          error: { message: err.message, stack: err.stack?.split("\n") },
        },
      };
      console.log(err);
      res.status(500).json(errObj);
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
  private headers: { key: string; vlu: string }[];
  private token = "";
  constructor(
    app: ExpressType,
    basePath: string,
    headers?: { key: string; vlu: string }[],
  ) {
    this.app = app;
    this.basePath = basePath;
    this.headers = headers || [];
  }

  setToken(token: string) {
    this.token = token;
  }

  private setHeaders(req: request.Test) {
    req.set("Accept", "application/json");
    this.headers.forEach((header) => {
      req.set(header.key, header.vlu);
    });
    if (this.token) req.set("Authorization", this.token);
    return req;
  }

  post(postObj: any, path?: string) {
    const req = request(this.app)
      .post(this.basePath + (path || ""))
      .set("Accept", "application/json");
    return this.setHeaders(req).send(postObj).expect("Content-Type", /json/);
  }

  get(path?: string) {
    const req = request(this.app).get(this.basePath + (path || ""));
    return this.setHeaders(req).send().expect("Content-Type", /json/);
  }
}

export function signToken({
  userId,
  expiresInMinutes = 60 * 8,
  notBefore = 0, // in seconds
  roles,
}: {
  userId: string;
  expiresInMinutes?: number;
  notBefore?: number;
  roles?: rolesAvailable[];
}): string {
  return JWT.sign(
    {
      iss: process.env.APP_NAME,
      sub: userId,
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