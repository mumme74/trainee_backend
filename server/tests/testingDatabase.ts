import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

import "./testProcess.env";

let mongod: MongoMemoryServer;

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
    return await mongod.stop();
  }
}
