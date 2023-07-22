import mongoose from "mongoose";

export function newObjectId(id: any): mongoose.mongo.ObjectId {
  return new mongoose.mongo.ObjectId(id);
}