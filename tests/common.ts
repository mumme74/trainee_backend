
import { UserError, errorResponse } from "../src/helpers/errorHelpers";

export type AnError = Error | UserError;

// only used to get a stacktrace
export function throwErr(err: AnError) : Error {
  try {
    throw err;
  } catch (e: any) {
    return e;
  }
}