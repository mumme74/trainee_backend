import { User } from "../../src/models/user";
import { comparePasswordHash} from "../../src/helpers/password";
import {
  Role,
  rolesAvailableKeys,
  eRolesAvailable,
} from "../../src/models/role";
import { initTestDb, closeTestDb } from "../testingDatabase";
import {
  createTestUser,
  destroyTestUser
} from "../testHelpers";


beforeAll(async () => {
  await initTestDb()
});

afterAll(async () => {
  await closeTestDb();
});

let user: User;
beforeEach(async () => {
  user = await createTestUser({
    firstName: "Test",
    lastName: "Testson",
    userName: "tester",
    email: "user@testing.com",
    password: passwordClearText,
    updatedBy: "123456789abc",
  });
    //google: { id: "123456789abc" },
    //domain: "testing.com",
});

afterEach(destroyTestUser);

const passwordClearText = "SecretPass1$";
const secretSecondPassWd = "SecretsecondPass1%";
const passwordClearTextHashed =
  "$2b$10$XH7M2c4t9aFzOIFSYa0Q6OY3kJQgWvVrNpW7xJO4akgocAFIbaSjS";

describe("User model save hash password", () => {
  test("Hash when new document", async () => {
    expect(user.password?.substring(0,7)).toEqual('$2b$10$');
    expect(user.password).not.toEqual(passwordClearText);
  });

  test("Hash when updated", async () => {
    expect(user.password?.substring(0,7)).toEqual('$2b$10$');
    expect(user.password).not.toEqual(passwordClearText);
    user.password = secretSecondPassWd;
    expect(user.password.substring(0,7)).toEqual('$2b$10$');
    expect(user.password).not.toEqual(secretSecondPassWd);
  });

  test("Don't hash when password not updated", async () => {
    expect(user.password?.substring(0,7)).toEqual('$2b$10$');
    expect(user.password).not.toEqual(passwordClearText);
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
    expect(await user.isValidPassword(passwordClearText)).toEqual(
      false,
    );
  });

  test("isValidPassword match", async () => {
    await user.save();
    expect(
      await user.isValidPassword(passwordClearText)
    ).toEqual(
      true,
    );
  });

  test("fail compare check", async () => {
    expect(
      await comparePasswordHash(secretSecondPassWd, passwordClearTextHashed),
    ).toEqual(false);
  });

  test("succeed compare check", async () => {
    expect(
      await comparePasswordHash(passwordClearText, passwordClearTextHashed),
    ).toEqual(true);
  });

  test("succeed compare empty passwords", async () => {
    expect(await comparePasswordHash("", "")).toEqual(true);
  });
});
