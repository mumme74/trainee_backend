// goal here is to set up middlewares that filter out bad input

import {
  Express,
  Request,
  Response,
  NextFunction,
} from "express-serve-static-core";

// safeguards
import helmet from "helmet";
//import xssClean from "xss-clean";
import hpp from "hpp";
import rateLimit from "express-rate-limit";
import xss from "xss";

// xss sanitize all input strings against xss attacks
// exported so it can be tested
export function xssClean(branch: any): any {
  if (branch instanceof Object || branch instanceof Array) {
    for (const key in branch) {
      if (typeof branch[key] === "string") {
        branch[key] = xss(branch[key]);
      } else {
        branch[key] = xssClean(branch[key]); // find subtree or just a primitive type
      }
    }
  }

  // finished or a primitive type
  return branch;
}

export function preJsonParse(app: Express):
  void
{
  // safeguard service, need to turn of content-security when dev, to make graphiql work
  app.use(
    helmet({
      contentSecurityPolicy:
        process.env.NODE_ENV === "development" ? false : undefined,
    }),
  );
  app.use(hpp());
  // Restrict all routes to only 100 requests per IP address every 1o minutes
  app.use(
    rateLimit({
      windowMs: 10 * 60 * 1000, // 10 minutes
      max: 100, // 100 requests per IP
    }),
  );
}

export function postJsonParse(app: Express):
  void
{
  app.use((req: Request, res: Response, next: NextFunction): void => {
    req.body = xssClean(req.body);
    next();
  });
}

