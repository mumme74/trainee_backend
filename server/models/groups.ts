import { Schema, model } from "mongoose";
import User from "./user";

export interface IGroups {
  userIds: [
    {
      type: Schema.Types.ObjectId;
      ref: "User";
    },
  ];
  name: {
    type: string;
    required: true;
    unique: true;
  };
}
