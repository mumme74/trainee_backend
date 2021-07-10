import {Schema, model, connect  } from "mongoose";
import bcrypt from "bcrypt";

import type {IUser } from "../types"



// create a schema
const userSchema = new Schema<IUser>({
  method: {
    type: String,
    enum: ["local", "google"],
    required: true,
  },
  userName: {
    type: String,
    required: true,
    unique: true
  },
  firstName: {
    type: String,
    required: true,
    minLength: 2,
    maxLength: 30,
  },
  lastName: {
    type: String,
    required: true,
    minLength: 2,
    maxLength: 50,
  },
  email: {
    type: String,
    lowerCase: true,
    unique: true,
    match: /[a-zA-Z][^@\.]+@[a-zA-Z][^@\.]+\.[a-zA-Z]{2,}/
  },
  password: {
    type: String,
  },
  picture: {
    type: String,
    maxLength: 256
  },

  google: {
    id: {
      type: String,
    },
    hd: { // higher level domain ie. vaxjo.se
      type: String,
    }
  },
});

// hash password before save
userSchema.pre("save", async function (next) {
  try {
    // generate a salt
    const salt = await bcrypt.genSalt(10);
    // generate a password hash
    const passwordHash = await bcrypt.hash(this.password, salt);
    // replace original password
    this.password = passwordHash;
  } catch (err) {
    next(err);
  }
});

userSchema.methods.isValidPassword = async function (newPassword) {
  try {
    return await bcrypt.compare(newPassword, this.password);
  } catch (err) {
    throw new Error(err);
  }
};

// create a model
const User = model("user", userSchema);

// export the model
export default User;
