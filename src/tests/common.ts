
import { MongoError } from "mongodb";
import { UserError, errorResponse } from "../helpers/errorHelpers";

export type AnError = Error | UserError | MongoError;

// only used to get a stacktrace
export function throwErr(err: AnError) : Error {
  try {
    throw err;
  } catch (e: any) {
    return e;
  }
}