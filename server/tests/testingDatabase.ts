import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

let mongod: MongoMemoryServer;

const appname = process.env.APP_NAME;
process.env.APP_NAME = "testing app";

let connections = 0;

export async function initMemoryDb() {
  if (connections++ === 0) {
    // This will create an new instance of "MongoMemoryServer" and automatically start it
    mongod = await MongoMemoryServer.create();

    const uri = mongod.getUri();

    //connect to DB
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
    });
  }
}

export async function closeMemoryDb() {
  if (--connections === 0) {
    await mongoose.disconnect();
    process.env.APP_NAME = appname;
    return await mongod.stop();
  }
}
