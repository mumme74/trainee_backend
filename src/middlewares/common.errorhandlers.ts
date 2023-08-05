/// helper functions for error handlers

import { HttpError } from 'http-errors';
import { Response } from 'express';

// these are heavily influenced by:
// https://simonplend.com/how-to-create-an-error-handler-for-your-express-api/


/**
 * Extract the message for the error
 * @param {Error} error
 * @returns {string} The error message
 */
export function getErrorMessage(error: Error): string {
  // prefer using stack if it exists
  if (error.stack)
    return error.stack;

  // convert to string
  if (typeof error.toString === 'function')
    return error.toString();

  // some defaults if above does not work
  return error.message || `No message in error ${error.name}?`;
}

/**
 * Log error message
 * @param {Error} error The error to log
 */
export function logErrorMessage(error: Error) {
  console.error(error)
}

/**
 * Check if http error code are within 400-600 range
 * @param {number} status The HTTP status code
 * @returns {boolean} True if it is an error code
 */
export function isErrorStatusCode(status: number) {
  return status >= 400 && status < 600;
}

/**
 * Get the statuscode for this error or response
 *
 * Search in this order:
 *
 * - Error object('status' or 'statusCode')
 * - Express response object ('statusCode')
 *
 * @param {Object} options
 * @param {Error} error The Error to search in
 * @param {Response} response The Express response
 * @returns {number} The error code for this error or response
 */
export function getHttpStatusCode({
  error,
  response
}: {
  error: Error,
  response: Response
}) {
  // typecast, typescript thing
  const errorObj = error as unknown as {
    status:number, statusCode: number};

  // error object has statusCode?
  const errorStatusCode = errorObj.status || errorObj.statusCode;
  if (isErrorStatusCode(errorStatusCode))
    return errorStatusCode;

  // maybe the response has set the statusCode?
  if (isErrorStatusCode(response.statusCode))
    return response.statusCode;

  // fallback to 500 Internal error
  return 500;
}
