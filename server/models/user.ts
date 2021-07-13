import {Schema, model, connect  } from "mongoose";
import bcrypt from "bcrypt";
import { string } from "joi";

/**
 * @brief these are the 4 different roles a user can have
 */
export enum rolesAvailable {'student', 'teacher', 'admin', 'super'};


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
  google: {
   id: string;
   hd?: string;
  }
  roles: [typeof rolesAvailable];
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

  google: {
    id: {
      type: String,
    },
    hd: { // higher level domain ie. vaxjo.se
      type: String,
    }
  },

  roles: {
    type: [String],
    enum: Object.keys(rolesAvailable).filter(i=>isNaN(+i)),
    required: true,
    default: rolesAvailable[0]
  }
}, {timestamps: true});

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

export async function comparePasswordHash(pass1: string, pass2: string) : Promise<boolean> {
  try {
    return await bcrypt.compare(pass1, pass2);
  } catch (err) {
    throw new Error(err);
  }
}

userSchema.methods.isValidPassword = async function (newPassword) {
  return comparePasswordHash(newPassword, this.password);
};

// create a model
const User = model("user", userSchema);

// export the model
export default User;
