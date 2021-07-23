import {Schema, model, connect  } from "mongoose";
import bcrypt from "bcrypt";
//import { string } from "joi";

import { UserError } from "../helpers/customErrors";

/**
 * @brief these are the 4 different roles a user can have
 */
export enum rolesAvailable {
  'student' = 0, 'teacher' = 1, 'admin' = 2, 'super' = 3
};
export const rolesAvailableKeys = Object.keys(rolesAvailable).map(
  (key)=>{return isNaN(+key) ? key : undefined; }
).filter(itm=>itm !== undefined) as string[];

export const rolesAvailableKeyValue = Object.entries(rolesAvailableKeys)


// database models
export interface IUserCollection {
  readonly id: string;
  method: string;
  userName: string;
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  picture?:string;
  domain?:string;
  google: {
   id: string;
  }
  roles: [rolesAvailable];
  updatedBy: string;
  lastLogin: typeof Date;
  updatedAt: typeof Date;
  createdAt: typeof Date;
}
  



// create a schema
const userSchema = new Schema<IUserCollection>({
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
  domain: { // higher level domain ie. vaxjo.se
    type: String,
  },

  google: {
    id: {
      type: String,
    },
  },

  roles: {
    type: [Number],
    enum: rolesAvailable,
    required: true,
    default: rolesAvailable.student
  },

  updatedBy: {
    type: Schema.Types.ObjectId
  }
}, {timestamps: true});

// hash password before save
userSchema.pre("save", async function (next) {
  // only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

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

export async function comparePasswordHash(pass1: string, pass2: string) : Promise<boolean> {
  try {
    return await bcrypt.compare(pass1, pass2);
  } catch (err) {
    throw new UserError(err);
  }
}

userSchema.methods.isValidPassword = async function (newPassword) {
  return comparePasswordHash(newPassword, this.password);
};

// create a model
const User = model("user", userSchema);

// export the model
export default User;
