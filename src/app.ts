const nodeEnv = process.env.NODE_ENV || "development";
import dotenv from "dotenv";
dotenv.config({ path: `.env.${nodeEnv}` }); // must be done bofore any other imports

import express, { Request, Response } from "express";
import morgan from "morgan";
import cors from "cors";

import { postJsonParse, preJsonParse } from "./helpers/sanitize";
import initApi from "./routes";
import pictureRoutes from "./routes/pictures";
import graphQlRoute from "./graphql";
import { initDb } from "./models"
import { initGraphQlSchema } from "./graphql/schema";

try{
  initDb();
}catch(e){
  console.error(e)
}

// create the global app
const app = express();


// cross origin
app.use(cors({ origin: process.env.CORS_HOST }));

preJsonParse(app);

// middleware
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev")); // dont clutter logs
}

// pictures
pictureRoutes(app);

app.use(express.json());

postJsonParse(app);


// Routes
initApi(app);

// graphql
initGraphQlSchema();
graphQlRoute(app);

// 404
app.use((req, res) => {
  res
    .status(404)
    .json({ error: { message: `Endpoint not found ${req.path}` } });
});

const showErrors = nodeEnv === "development";
app.use((err: Error, req: Request, res: Response) => {
  const errObj = {
    success: false,
    error: {
      message: "500: Internal Server Error",
      status: 500,
      error: showErrors
        ? { message: err.message, stack: err.stack?.split("\n") }
        : undefined,
    },
  };
  console.log(err);
  res.status(500).json(errObj);
});

export default app;
