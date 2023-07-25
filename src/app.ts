const nodeEnv = process.env.NODE_ENV || "development";
import dotenv from "dotenv";
dotenv.config({ path: `.env.${nodeEnv}` }); // must be done bofore any other imports

import express, { Request, Response } from "express";
import morgan from "morgan";
import mongoose from "mongoose";
import cors from "cors";

import sanitize from "./helpers/sanitize";
import userRoutes from "./routes/users";
import graphQlRoute from "./graphql";
import { initDb } from "./models"

try{
  initDb();
}catch(e){
  console.error(e)
}

mongoose.Promise = global.Promise;

/*
// "mongodb://user:password@localhost:port/database";
const dbHost = process.env.DB_HOST || "localhost";
const dbUser = process.env.DB_USER;
const dbPass = process.env.DB_PASS;
const dbPort = process.env.DB_PORT || 27017;
const dbName = process.env.DB_NAME;

const connectionString = `mongodb://${dbUser}:${dbPass}@${dbHost}:${dbPort}/${dbName}`;

// connect to DB
mongoose.connect(connectionString, { });
*/

// create the global app
const app = express();

// cross origin
app.use(cors({ origin: process.env.CORS_HOST }));

sanitize.preJsonParse(app);

// middleware
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev")); // dont clutter logs
}

app.use(express.json());

sanitize.postJsonParse(app);

// Routes
userRoutes(app);
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
