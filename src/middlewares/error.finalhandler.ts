import {
  Request,
  Response,
  NextFunction
} from 'express';
import {
  getErrorMessage,
  getHttpStatusCode,
  logErrorMessage
} from './common.errorhandlers';
import { errorResponse } from '../helpers/errorHelpers';

// finalhandler to report in json instead of html
// as default to express

// heavily influenced by:
// https://simonplend.com/how-to-create-an-error-handler-for-your-express-api/

const NODE_ENV = process.env.NODE_ENV || "development";

export function finalhandlerErrorToJson (
  error: Error, request: Request,
  response: Response, next: NextFunction
) {
  const errMsg = getErrorMessage(error);
  logErrorMessage(error);

  // We can't modify response as it has already begun sending headers
  // delegate to default handler in express.
  if (response.headersSent)
    return next(error);

  const statusCode = getHttpStatusCode({error, response});
  let body: string = "";

  if (NODE_ENV !== 'production')
    body = errMsg;

  // set err code
  response.status(statusCode);

  // format error
  response.format({
    // when client sent header Accepts contains 'application/json' or '*/*'
    // or when it isn't set at all.
    "application/json": ()=>{
      response.json(errorResponse(body))
    },
    // last resort respond in plain text.
    default: ()=>{
      response.type("text/plain").send(body)
    }
  });

  // Ensure remaining middleware are run.
  return next();
}
