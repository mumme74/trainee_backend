import accepts from "accepts";
import Router from "express-promise-router";
import type { Express } from "express";
import { createHandler } from 'graphql-http/lib/use/express';
import { Request, Response, NextFunction } from "express";
import { passportJWT } from "../passport";

import graphQlSchema from "./schema";
import { graphQlResolvers } from "./resolvers";
import renderGraphiQLAuthToken from "./graphiqlWithToken";

import { GraphQLSchema, GraphQLObjectType, GraphQLString } from 'graphql';

/**
 * Construct a GraphQL schema and define the necessary resolvers.
 *
 * type Query {
 *   hello: String
 * }
 */
const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'Query',
    fields: {
      hello: {
        type: GraphQLString,
        resolve: () => 'world',
      },
    },
  }),
});

function graphqlRoute(app: Express) {
  const router = Router();
  app.use("/graphql", router);

  // all logic starts here
  const useGraphiql = process.env.NODE_ENV === "development";

  /*if (useGraphiql) {
    //Overiding the default express-graphql middleware
    router.use("/", async (req, res, next) => {
      const params = await getGraphQLParams(req);
      if (!params.raw && accepts(req).types(["json", "html"]) === "html") {
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.send(renderGraphiQLAuthToken(params));
      } else next();
    });
  }*/

  router.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader("Access-Control-Allow-Origin", process.env.CORS_HOST + "");
    res.setHeader("Access-Control-Allow-Methods", "POST,GET,OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization",
    );

    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  router.use(
    "/",
    passportJWT,
    createHandler({ schema: graphQlSchema, rootValue: graphQlResolvers })
    /*
    graphqlHTTP({
      schema: graphQlSchema,
      rootValue: graphQlResolvers,
      graphiql: false, //useGraphiql,
    }),*/
  );
}

export default graphqlRoute;
