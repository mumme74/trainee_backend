import {
  Request,
  Response,
  NextFunction
} from 'express';
import {
  getHttpStatusCode,
  logErrorMessage
} from './common.errorhandlers';
import { errorResponse } from '../helpers/errorHelpers';

// finalhandler to report in json instead of html
// as default to express

// heavily influenced by:
// https://simonplend.com/how-to-create-an-error-handler-for-your-express-api/

const NODE_ENV = process.env.NODE_ENV || "development";

export function finalhandlerAuthError (
  error: Error, request: Request,
  response: Response, next: NextFunction
) {

  // We can't modify response as it has already begun sending headers
  // delegate to default handler in express.
  if (response.headersSent)
    return next(error);

  // determine if this is a auth error
  const statusCode = getHttpStatusCode({error, response});
  if ([401, 403].indexOf(statusCode) === -1)
    return next(error);

  const errMsg = error.message || ""+error;
  logErrorMessage(error);

  // set err code
  response.status(statusCode);

  // format error
  response.format({
    // when client sent header Accepts contains 'application/json' or '*/*'
    // or when it isn't set at all.
    "application/json": ()=>{
      response.json(errorResponse(errMsg))
    },
    // last resort respond in plain text.
    default: ()=>{
      response.type("text/plain").send(errMsg)
    }
  });

  // Ensure remaining middleware are run.
  return next();
}
