import { Schema, model } from "mongoose";
import User from "./usersModel";

// sort of a school class, however student might be in many
// different grups event though they are in  the same class
export interface IGroupDocument {
  readonly id: string;
  teacherIds: string[];
  studentIds: string[];
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string; // who last edited this document
}

// sort of a school class, however student might be in many
// different grups event though they are in  the same class
const groupSchema = new Schema<IGroupDocument>(
  {
    teacherIds: {
      type: [Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },

    studentIds: {
      type: [Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: User,
    },
  },
  { timestamps: true },
);

groupSchema.pre("save", function (next) {
  if (this.isNew) {
    if (!this.updatedBy) next(new Error("Must set updatedBy on a new record"));
  } else if (!this.isModified("updatedBy")) next(new Error("Must update updatedBy field!"));
  next();
});

const Group = model("group", groupSchema);

export default Group;
