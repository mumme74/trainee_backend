const nodeEnv = process.env.NODE_ENV || "development";
import dotenv from "dotenv"
dotenv.config({ path: `.env.${nodeEnv}` }); // must be done bofore any other imports

import express, { Request, Response } from "express";
import morgan from "morgan";
import mongoose from "mongoose";
import cors from "cors";

import sanitize from './helpers/sanitize';
import userApiRoute from './routes/users';
import graphQlRoute from "./graphql";

mongoose.Promise = global.Promise;

// "mongodb://user:password@localhost:port/database";
const mongoHost = process.env.MONGO_HOST || "localhost";
const mongoUser = process.env.MONGO_USER;
const mongoPass = process.env.MONGO_PASS;
const mongoPort = process.env.MONGO_PORT || 27017;
const mongoDb = process.env.MONGO_DB;

const connectionString = `mongodb://${mongoUser}:${mongoPass}@${mongoHost}:${mongoPort}/${mongoDb}`;

// connect to DB
mongoose.connect(connectionString, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// crate the global app
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
app.use("/users", userApiRoute);
app.use("/graphql", graphQlRoute);

// 404
app.use((req, res) => {
  res
    .status(404)
    .json({ error: { message: `Endpoint not found ${req.path}` } });
});

const showErrors = nodeEnv === "development";
app.use((err: Error, req: Request, res: Response) => {
  const errObj = {
    error: {
      message: "500: Internal Server Error",
      status: 500,
      error: showErrors ? {message: err.message, stack: err.stack?.split('\n')}: undefined,
    },
  };
  res.status(500).json(errObj);
  console.log(err);
});

export default app;
