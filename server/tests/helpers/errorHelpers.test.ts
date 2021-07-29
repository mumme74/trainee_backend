import { MongoError } from "mongodb";
import { UserError, errorResponse } from "../../helpers/errorHelpers";

const processEnv = process.env;

afterEach(() => {
  process.env = processEnv;
});

describe("UserError", () => {
  test("sanity checks for Usererror", () => {
    const err = new UserError("test");
    expect(err instanceof Error).toEqual(true);
    expect(err.toString()).toEqual("UserError: test");
    expect(err.message).toEqual("test");
  });
});

describe("errorReponse", () => {
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
  // only used to get a stacktrace
  function throwErr(err: Error | UserError | MongoError) {
    try {
      throw err;
    } catch (e) {
      return e;
    }
  }

  test("with string", () => {
    const res = errorResponse("testStr");
    expect(res).toEqual(matchObj("testStr"));
  });

  test("with Error, should have no stack or type", () => {
    const err = throwErr(new Error("test"));
    const res = errorResponse(err);
    expect(res).toEqual(matchObj("test"));
  });

  test("with Error, dev mode, should have stack and type", () => {
    const err = throwErr(new Error("test"));
    process.env = { ...processEnv, NODE_ENV: "development" };
    const res = errorResponse(err);
    expect(res).toEqual(
      matchObj({
        message: "test",
        stack: err.stack.split("\n"),
        type: "Error: test",
      }),
    );
  });
  test("with UserError, dev mode, should have no stack or type", () => {
    const err = throwErr(new UserError("test"));
    const res = errorResponse(err);
    expect(res).toEqual(matchObj("test"));
  });
  test("with MongoError, dev mode, should have no stack or type", () => {
    const err = throwErr(new MongoError("test"));
    const res = errorResponse(err);
    expect(res).toEqual(matchObj("test"));
  });
});
