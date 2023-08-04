import { MongoError } from "mongodb";
import { UserError, errorResponse } from "../../src/helpers/errorHelpers";
import { throwErr } from "../common";

const processEnv = process.env;

afterEach(() => {
  process.env = processEnv;
});

describe("UserError", () => {
  test("sanity checks for UserError", () => {
    const err = new UserError("test");
    expect(err instanceof Error).toEqual(true);
    expect(err.toString()).toEqual("UserError: test");
    expect(err.message).toEqual("test");
  });
});

describe("errorResponse", () => {
  function matchObj(
    err:
      | string
      | {
          message: string;
          stack?: string[];
          type?: string;
        },
  ) {
    return {
      success: false,
      error: typeof err === "string" ? { message: err } : err,
    };
  }

  test("with string", () => {
    const res = errorResponse("testStr");
    expect(res).toEqual(matchObj("testStr"));
    expect(Object.keys(res.error).length).toEqual(1);
  });

  test("with Error, should have no stack or type", () => {
    const err = throwErr(new Error("test"));
    const res = errorResponse(err);
    expect(res).toEqual(matchObj("test"));
    expect(Object.keys(res.error).length).toEqual(1);
  });

  test("with Error, dev mode, should have stack and type", () => {
    const err = throwErr(new Error("test"));
    process.env = { ...processEnv, NODE_ENV: "development" };
    const res = errorResponse(err);
    expect(res).toEqual(
      matchObj({
        message: "test",
        stack: err.stack?.split("\n") || [],
        type: "Error: test",
      }),
    );
    expect(Object.keys(res.error).length).toEqual(3);
  });
  test("with UserError, dev mode, should have no stack nor type", () => {
    const err = throwErr(new UserError("test"));
    const res = errorResponse(err);
    expect(res).toEqual(matchObj("test"));
    expect(Object.keys(res.error).length).toEqual(1);
  });
  test("with MongoError, dev mode, should have no stack nor type", () => {
    const err = throwErr(new MongoError("test"));
    const res = errorResponse(err);
    expect(res).toEqual(matchObj("test"));
    expect(Object.keys(res.error).length).toEqual(1);
  });
});
