import Router from "express-promise-router";
import type { Express } from "express";
import { createHandler } from 'graphql-http/lib/use/express';
import { Request, Response, NextFunction } from "express";
import { passportJWT } from "../passport";

import {promises as fs}  from "fs";
import path from "path";

import { getAllResolvers, initGraphQl } from "./index";
import { getGraphQlSchema } from "./schema";


export function graphQlRoute(app: Express) {
  const router = Router();
  app.use("/graphql", router);

  // all logic starts here
  const useGraphiql = process.env.NODE_ENV === "development";

  if (useGraphiql) {
    app.use("/graphiql", async (req, res) => {
      const p = path.join(path.resolve('./build'), 'src/views/graphiql.html');
      const html = await fs.readFile(p, 'utf-8');
      res.setHeader('Content-Type','text/html')
      res.status(200).send(html);
    });
  }

  router.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader("Access-Control-Allow-Origin", process.env.CORS_HOST + "");
    res.setHeader("Access-Control-Allow-Methods", "POST,GET,OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization",
    );

    if (req.method === "OPTIONS") {
      return res.status(200).send();
    }
    next();
  });

  router.use(
    "/",
    passportJWT, (req: Request, res: Response, next: NextFunction) => {
      const handler = createHandler({
        schema: getGraphQlSchema(),
        rootValue: getAllResolvers(),
        context: req as any
      });
      handler(req, res, next);
    },
  );
}

