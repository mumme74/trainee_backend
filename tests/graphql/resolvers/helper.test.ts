import { getMockReq, getMockRes } from "@jest-mock/express";
import type { Request, Response } from "express-serve-static-core";

import "../../testProcess.env";
import { User } from "../../../src/models/core_user";
import { Role, eRolesAvailable } from "../../../src/models/core_role";
import type { AuthRequest } from "../../../src/types";
import { initTestDb, closeTestDb } from "../../testingDatabase";
import {
  destroyTestUser,
  createTestUser
} from "../../testHelpers";

import {
  composeErrorResponse,
  rolesFilter,
} from "../../../src/graphql/helpers";
import { UserError } from "../../../src/helpers/errorHelpers";
import { IFilterOptions } from "../../../src/helpers/userHelpers";
import { throwErr as throwToGetStack } from "../../common";
import { initGraphQl } from "../../../src/graphql";

interface IRequest extends Request {
  res: Response;
}

const { res, next, clearMockRes } = getMockRes();

const processEnv = process.env;

beforeAll(() => {
  initGraphQl();
  return initTestDb();
});

afterAll(() => {
  return closeTestDb();
});

let callback: any, user: User;
beforeEach(async () => {
  clearMockRes();
  process.env = processEnv;

  user = await createTestUser();
  callback = jest.fn((args: any, req: AuthRequest, info: any) => {
    return "ret";
  });
});

afterEach(()=>{
  return destroyTestUser()
});

// ------------------------------------------------------
// ------------------------------------------------------

describe("composeErrorResponse", () => {
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

  const arg = { args: "arg" };
  const info = "info";

  const ANY_OF_ERR_STRING = "Insufficient privileges";
  const ALL_OF_ERR_STRING = "You do not have all required privileges";
  const EXCLUDE_ERR_STRING = "You have a privilege that you shall NOT have";



  test("fail no match anyOf single", async () => {
    const req = getMockReq({ user: {user,roles:[],oauth:null}, res: res });
    const opt = { anyOf: eRolesAvailable.teacher };
    const filter = rolesFilter(opt, callback);
    await expect(async () => {
      await filter(arg, req, info);
    }).rejects.toThrowError(new UserError(ANY_OF_ERR_STRING));
    expect(req.res?.status).toHaveBeenCalledWith(403);
    expect(callback).not.toBeCalled();
  });

  test("succeed match anyOf single", async () => {
    const req = getMockReq({ user: {user,roles:[],oauth:null}, res: res });
    const opt = { anyOf: eRolesAvailable.student };
    const filter = rolesFilter(opt, callback);
    const ret = await filter(arg, req, info);
    expect(callback).toHaveBeenCalledWith(arg, req, info);
    expect(ret).toEqual("ret");
    expect(req.res?.status).not.toHaveBeenCalled();
  });

  test("fail no match anyOf array", async () => {
    const req = getMockReq({ user: {user,roles:[],oauth:null}, res: res });
    const opt = { anyOf: [eRolesAvailable.teacher, eRolesAvailable.admin] };
    const filter = rolesFilter(opt, callback);
    await expect(async () => {
      await filter(arg, req, info);
    }).rejects.toThrowError(new UserError(ANY_OF_ERR_STRING));
    expect(req.res?.status).toHaveBeenCalledWith(403);
    expect(callback).not.toBeCalled();
  });

  test("succeed match anyOf array", async () => {
    const req = getMockReq({ user: {user,roles:[],oauth:null}, res: res });
    const opt = { anyOf: [eRolesAvailable.student, eRolesAvailable.teacher] };
    const filter = rolesFilter(opt, callback);
    const ret = await filter(arg, req, info);
    expect(callback).toHaveBeenCalledWith(arg, req, info);
    expect(ret).toEqual("ret");
    expect(req.res?.status).not.toHaveBeenCalled();
  });

  test("fail no match allOf", async () => {
    const req = getMockReq({ user: {user,roles:[],oauth:null}, res: res });
    const opt = { allOf: [eRolesAvailable.teacher] };
    const filter = rolesFilter(opt, callback);
    await expect(async () => {
      await filter(arg, req, info);
    }).rejects.toThrowError(new UserError(ALL_OF_ERR_STRING));
    expect(req.res?.status).toHaveBeenCalledWith(403);
    expect(callback).not.toBeCalled();
  });

  test("succeed match allOf one", async () => {
    const req = getMockReq({ user: {user,roles:[],oauth:null}, res: res });
    const opt = { allOf: [eRolesAvailable.student] };
    const filter = rolesFilter(opt, callback);
    const ret = await filter(arg, req, info);
    expect(callback).toHaveBeenCalledWith(arg, req, info);
    expect(ret).toEqual("ret");
    expect(req.res?.status).not.toHaveBeenCalled();
  });

  test("fail no match allOf two", async () => {
    const req = getMockReq({ user: {user,roles:[],oauth:null}, res: res });
    const opt = { allOf: [eRolesAvailable.teacher, eRolesAvailable.admin] };
    const filter = rolesFilter(opt, callback);
    await expect(async () => {
      await filter(arg, req, info);
    }).rejects.toThrowError(new UserError(ALL_OF_ERR_STRING));
    expect(req.res?.status).toHaveBeenCalledWith(403);
    expect(callback).not.toBeCalled();
  });

  test("succeed match allOf array", async () => {
    await Role.create({userId: user.id, role:eRolesAvailable.teacher});
    await user.save();
    const req = getMockReq({ user: {user,roles:[],oauth:null}, res: res });
    const opt = { allOf: [eRolesAvailable.student, eRolesAvailable.teacher] };
    const filter = rolesFilter(opt, callback);
    const ret = await filter(arg, req, info);
    expect(callback).toHaveBeenCalledWith(arg, req, info);
    expect(ret).toEqual("ret");
    expect(req.res?.status).not.toHaveBeenCalled();
  });

  test("fail no match exclude", async () => {
    const req = getMockReq({ user: {user,roles:[],oauth:null}, res: res });
    const opt: IFilterOptions = { exclude: eRolesAvailable.student };
    const filter = rolesFilter(opt, callback);
    await expect(async () => {
      await filter(arg, req, info);
    }).rejects.toThrowError(new UserError(EXCLUDE_ERR_STRING));
    expect(req.res?.status).toHaveBeenCalledWith(403);
    expect(callback).not.toBeCalled();
  });

  test("succeed match exclude", async () => {
    const req = getMockReq({ user: {user,roles:[],oauth:null}, res: res });
    const opt = { exclude: eRolesAvailable.teacher };
    const filter = rolesFilter(opt, callback);
    const ret = await filter(arg, req, info);
    expect(callback).toHaveBeenCalledWith(arg, req, info);
    expect(ret).toEqual("ret");
    expect(req.res?.status).not.toHaveBeenCalled();
  });

  test("fail no match exclude array", async () => {
    const req = getMockReq({ user: {user,roles:[],oauth:null}, res: res });
    const opt = { exclude: [eRolesAvailable.student, eRolesAvailable.teacher] };
    const filter = rolesFilter(opt, callback);
    await expect(async () => {
      await filter(arg, req, info);
    }).rejects.toThrowError(new UserError(EXCLUDE_ERR_STRING));
    expect(req.res?.status).toHaveBeenCalledWith(403);
    expect(callback).not.toBeCalled();
  });

  test("succeed match exclude array", async () => {
    const req = getMockReq({ user: {user,roles:[],oauth:null}, res: res });
    const opt = {
      exclude: [
        eRolesAvailable.teacher,
        eRolesAvailable.super,
        eRolesAvailable.admin,
      ],
    };
    const filter = rolesFilter(opt, callback);
    const ret = await filter(arg, req, info);
    expect(callback).toHaveBeenCalledWith(arg, req, info);
    expect(ret).toEqual("ret");
    expect(req.res?.status).not.toHaveBeenCalled();
  });
});
