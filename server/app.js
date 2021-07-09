const nodeEnv = process.env.NODE_ENV || "development";
require("dotenv").config({ path: `.env.${nodeEnv}` });
const express = require("express");
const morgan = require("morgan");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");
const errorHandler = require("errorhandler");

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

const app = express();
app.use(cors({ origin: process.env.CORS_HOST }));

// middleware
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev")); // dont clutter logs
}

app.use(express.json());

// Routes
app.use("/users", require("./routes/users"));

// 404
app.use((req, res) => {
  res
    .status(404)
    .json({ error: { message: `Endpoint not found ${req.path}` } });
});

const showErrors = nodeEnv === "development";
app.use((err, req, res, next) => {
  const errObj = {
    error: {
      message: "500: Internal Server Error",
      status: 500,
      error: showErrors ? {message: err.message, stack: err.stack.split('\n')}: undefined,
    },
  };
  res.status(500).json(errObj);
  console.log(err);
});

//app.use(errorHandler({ dumpExceptions: showErrors, showStack: true }));

module.exports = app;
