import { getMockReq, getMockRes } from "@jest-mock/express";
import type { Request, Response } from "express-serve-static-core";

import "../../testProcess.env";
import type { IUserDocument } from "../../../models/usersModel";
import User, { rolesAvailable } from "../../../models/usersModel";
import type { AuthRequest } from "../../../types";
import { initMemoryDb, closeMemoryDb } from "../../testingDatabase";
import { userPrimaryObj, matchErrorMockCall } from "../../testHelpers";

import {
  composeErrorResponse,
  rolesFilter,
} from "../../../graphql/resolvers/helpers";
import { UserError } from "../../../helpers/errorHelpers";
import { MongoError } from "mongodb";
import { IFilterOptions } from "../../../helpers/userHelpers";

interface IRequest extends Request {
  res: Response;
}

const { res, next, clearMockRes } = getMockRes();

const processEnv = process.env;

beforeAll(async () => {
  await initMemoryDb();
});

afterAll(async () => {
  await closeMemoryDb();
});

beforeEach(() => {
  clearMockRes();
  process.env = processEnv;
});

// ------------------------------------------------------
// ------------------------------------------------------

describe("composeErrorResponse", () => {
  function throwToGetStack(err: Error | UserError | MongoError) {
    try {
      throw err;
    } catch (e) {
      return e;
    }
  }

  function matchObj(
    err: { message: string; type?: string; stack?: string } | string,
  ) {
    return {
      success: false,
      error: typeof err === "string" ? { message: err } : err,
      __typename: "ErrorResponse",
    };
  }

  test("with string", () => {
    const err = composeErrorResponse("This is a errStr");
    expect(err).toEqual(matchObj("This is a errStr"));
  });

  test("with Error", () => {
    const e = throwToGetStack(Error("This is a Error obj"));
    const err = composeErrorResponse(e);
    expect(err).toEqual(matchObj("This is a Error obj"));
  });

  test("with Error, has type and stack", () => {
    process.env = { ...processEnv, NODE_ENV: "development" };
    const e = throwToGetStack(new Error("This is a Error obj"));
    const err = composeErrorResponse(e);
    expect(err).toMatchObject(
      matchObj({
        message: "This is a Error obj",
        type: "Error: This is a Error obj",
      }),
    );
    expect(Array.isArray(err.error.stack)).toEqual(true);
    const stack = err.error.stack || [null];
    expect(typeof stack[0]).toEqual("string");
  });

  test("with UserError, no type, nor stack", () => {
    process.env = { ...processEnv, NODE_ENV: "development" };
    const e = throwToGetStack(new UserError("This is a UserError obj"));
    const err = composeErrorResponse(e);
    expect(err).toEqual(matchObj({ message: "This is a UserError obj" }));
  });

  test("with MongoError, no type, nor stack", () => {
    process.env = { ...processEnv, NODE_ENV: "development" };
    const e = throwToGetStack(new UserError("This is a MongoError obj"));
    const err = composeErrorResponse(e);
    expect(err).toEqual(matchObj({ message: "This is a MongoError obj" }));
  });
});

describe("rolesFilter", () => {
  const callback = jest.fn((args: any, req: AuthRequest, info: any) => {
    return "ret";
  });

  const arg = { args: "arg" };
  const info = "info";

  const ANY_OF_ERR_STRING = "Insufficient priviledges";
  const ALL_OF_ERR_STRING = "You do not have all required priviledges";
  const EXCLUDE_ERR_STRING = "You have a priviledge that you shall NOT have";

  let user: IUserDocument;
  beforeEach(async () => {
    user = new User(userPrimaryObj);
    await user.save();
  });

  afterEach(async () => {
    await user.delete();
    callback.mockClear();
  });

  test("fail no match anyOf", () => {
    const req = getMockReq({ user: user, res: res });
    const opt = { anyOf: rolesAvailable.teacher };
    const filter = rolesFilter(opt, callback);
    expect(() => {
      filter(arg, req, info);
    }).toThrowError(new UserError(ANY_OF_ERR_STRING));
    expect(req.res?.status).toHaveBeenCalledWith(403);
    expect(callback).not.toBeCalled();
  });

  test("succeed match anyOf", () => {
    const req = getMockReq({ user: user, res: res });
    const opt = { anyOf: rolesAvailable.student };
    const filter = rolesFilter(opt, callback);
    const ret = filter(arg, req, info);
    expect(callback).toHaveBeenCalledWith(arg, req, info);
    expect(ret).toEqual("ret");
    expect(req.res?.status).not.toHaveBeenCalled();
  });

  test("fail no match anyOf array", () => {
    const req = getMockReq({ user: user, res: res });
    const opt = { anyOf: [rolesAvailable.teacher, rolesAvailable.admin] };
    const filter = rolesFilter(opt, callback);
    expect(() => {
      filter(arg, req, info);
    }).toThrowError(new UserError(ANY_OF_ERR_STRING));
    expect(req.res?.status).toHaveBeenCalledWith(403);
    expect(callback).not.toBeCalled();
  });

  test("succeed match anyOf array", () => {
    const req = getMockReq({ user: user, res: res });
    const opt = { anyOf: [rolesAvailable.student, rolesAvailable.teacher] };
    const filter = rolesFilter(opt, callback);
    const ret = filter(arg, req, info);
    expect(callback).toHaveBeenCalledWith(arg, req, info);
    expect(ret).toEqual("ret");
    expect(req.res?.status).not.toHaveBeenCalled();
  });

  test("fail no match allOf", () => {
    const req = getMockReq({ user: user, res: res });
    const opt = { allOf: rolesAvailable.teacher };
    const filter = rolesFilter(opt, callback);
    expect(() => {
      filter(arg, req, info);
    }).toThrowError(new UserError(ALL_OF_ERR_STRING));
    expect(req.res?.status).toHaveBeenCalledWith(403);
    expect(callback).not.toBeCalled();
  });

  test("succeed match allOf", () => {
    const req = getMockReq({ user: user, res: res });
    const opt = { allOf: rolesAvailable.student };
    const filter = rolesFilter(opt, callback);
    const ret = filter(arg, req, info);
    expect(callback).toHaveBeenCalledWith(arg, req, info);
    expect(ret).toEqual("ret");
    expect(req.res?.status).not.toHaveBeenCalled();
  });

  test("fail no match allOf array", () => {
    const req = getMockReq({ user: user, res: res });
    const opt = { allOf: [rolesAvailable.teacher, rolesAvailable.admin] };
    const filter = rolesFilter(opt, callback);
    expect(() => {
      filter(arg, req, info);
    }).toThrowError(new UserError(ALL_OF_ERR_STRING));
    expect(req.res?.status).toHaveBeenCalledWith(403);
    expect(callback).not.toBeCalled();
  });

  test("succeed match allOf array", async () => {
    user.roles.push(rolesAvailable.teacher);
    await user.save();
    const req = getMockReq({ user: user, res: res });
    const opt = { allOf: [rolesAvailable.student, rolesAvailable.teacher] };
    const filter = rolesFilter(opt, callback);
    const ret = filter(arg, req, info);
    expect(callback).toHaveBeenCalledWith(arg, req, info);
    expect(ret).toEqual("ret");
    expect(req.res?.status).not.toHaveBeenCalled();
  });

  test("fail no match exclude", () => {
    const req = getMockReq({ user: user, res: res });
    const opt: IFilterOptions = { exclude: rolesAvailable.student };
    const filter = rolesFilter(opt, callback);
    expect(() => {
      filter(arg, req, info);
    }).toThrowError(new UserError(EXCLUDE_ERR_STRING));
    expect(req.res?.status).toHaveBeenCalledWith(403);
    expect(callback).not.toBeCalled();
  });

  test("succeed match exclude", () => {
    const req = getMockReq({ user: user, res: res });
    const opt = { exclude: rolesAvailable.teacher };
    const filter = rolesFilter(opt, callback);
    const ret = filter(arg, req, info);
    expect(callback).toHaveBeenCalledWith(arg, req, info);
    expect(ret).toEqual("ret");
    expect(req.res?.status).not.toHaveBeenCalled();
  });

  test("fail no match exclude array", () => {
    const req = getMockReq({ user: user, res: res });
    const opt = { exclude: [rolesAvailable.student, rolesAvailable.teacher] };
    const filter = rolesFilter(opt, callback);
    expect(() => {
      filter(arg, req, info);
    }).toThrowError(new UserError(EXCLUDE_ERR_STRING));
    expect(req.res?.status).toHaveBeenCalledWith(403);
    expect(callback).not.toBeCalled();
  });

  test("succeed match exclude array", () => {
    const req = getMockReq({ user: user, res: res });
    const opt = {
      exclude: [
        rolesAvailable.teacher,
        rolesAvailable.super,
        rolesAvailable.admin,
      ],
    };
    const filter = rolesFilter(opt, callback);
    const ret = filter(arg, req, info);
    expect(callback).toHaveBeenCalledWith(arg, req, info);
    expect(ret).toEqual("ret");
    expect(req.res?.status).not.toHaveBeenCalled();
  });
});
