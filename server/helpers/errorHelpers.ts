import { MongoError } from "mongodb";

export interface IErrorResponse {
  success: false;
  error: { message: string; type?: string; stack?: string[] };
}

/**
 * @brief Custom error to differentiate between system error and error user triggred
 *        such as insuficient credentials
 */
export class UserError extends Error {
  toString() {
    return "UserError: " + this.message;
  }
}

/**
 * @brief a common error reporting function,
 *        use to make error reporting conform within this app
 * @param err String or Error
 * @returns a IErrorResponse
 */
export const errorResponse = (err: Error | string): IErrorResponse => {
  let stack, type, message;
  if (typeof err !== "string") {
    if (
      process.env.NODE_ENV === "development" &&
      err.stack &&
      !(err instanceof UserError || err instanceof MongoError)
    ) {
      stack = err.stack.split("\n");
      type = err.toString();
    }

    message = err.message;
  } else {
    message = err;
  }

  return {
    success: false,
    error: {
      message,
      type,
      stack,
    },
  };
};
