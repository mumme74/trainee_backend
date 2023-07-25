import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

import type { IUserDocument } from "../../src/models/old_mongo/usersModel";
import User, {
  eRolesAvailable,
  comparePasswordHash,
} from "../../src/models/old_mongo/usersModel";

let mongod: MongoMemoryServer;

beforeAll(async () => {
  // This will create an new instance of "MongoMemoryServer" and automatically start it
  mongod = await MongoMemoryServer.create();

  const uri = mongod.getUri();

  //connect to DB
  await mongoose.connect(uri, { });
});

afterAll(async () => {
  await mongoose.disconnect();
  // The Server can be stopped again with
  return await mongod.stop();
});

let user: IUserDocument;
beforeEach(() => {
  user = new User({
    firstName: "Test",
    lastName: "Testson",
    userName: "tester",
    method: "google",
    email: "user@testing.com",
    password: passwordClearText,
    google: { id: "123456789abc" },
    domain: "testing.com",
    roles: [eRolesAvailable.student],
    updatedBy: "123456789abc",
  });
});

afterEach(async () => {
  await User.deleteMany();
});

const passwordClearText = "SecretPass1$";
const secretSecondPassWd = "SecretsecondPass1%";
const passwordClearTextHashed =
  "$2b$10$IJf6HO.IKzfJnemg1moky.lQBWksIkwgPL8rvoVjsVwL0xfKXH.yO";

describe("User model save hash password", () => {
  test("Hash when new document", async () => {
    expect(user.password).toEqual(passwordClearText);
    await user.save();
    expect(user.password).not.toEqual(passwordClearText);
  });

  test("Hash when updated", async () => {
    expect(user.password).toEqual(passwordClearText);
    await user.save();
    expect(user.password).not.toEqual(passwordClearText);
    const hashedPw = user.password;
    user.password = secretSecondPassWd;
    await user.save();
    expect(user.password).not.toEqual(secretSecondPassWd);
  });

  test("Don't hash when password not updated", async () => {
    expect(user.password).toEqual(passwordClearText);
    await user.save();
    const passwd = user.password;
    user.firstName = "random";
    await user.save();
    expect(user.password).toEqual(passwd);
  });
});

describe("compare passwords", () => {
  test("isValidPassword mismatch", async () => {
    user.password = secretSecondPassWd;
    await user.save();
    await expect(user.isValidPassword(passwordClearText)).resolves.toEqual(
      false,
    );
  });

  test("isValidPassword match", async () => {
    await user.save();
    await expect(user.isValidPassword(passwordClearText)).resolves.toEqual(
      true,
    );
  });

  test("fail compare check", async () => {
    await expect(
      comparePasswordHash(secretSecondPassWd, passwordClearTextHashed),
    ).resolves.toEqual(false);
  });

  test("succeed compare check", async () => {
    await expect(
      comparePasswordHash(passwordClearText, passwordClearTextHashed),
    ).resolves.toEqual(true);
  });

  test("succeed compare empty passwords", async () => {
    await expect(comparePasswordHash("", "")).resolves.toEqual(true);
  });
});
