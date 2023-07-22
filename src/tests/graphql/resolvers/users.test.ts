import type { CallbackHandler } from "supertest";

// must be imported before any other local import
import "../../testProcess.env";

import {
  jsonApp,
  matchErrorSupertest,
  signToken,
  JsonReq,
  userPrimaryObj,
} from "../../testHelpers";

import graphqlRoute from "../../../graphql";
import { IUserDocument, eRolesAvailable } from "../../../models/usersModel";
import User from "../../../models/usersModel";
import { closeMemoryDb, initMemoryDb } from "../../testingDatabase";
import UsersController from "../../../controllers/users";
import { userLoader } from "../../../graphql/resolvers/users";

const processEnv = process.env;

const app = jsonApp();
graphqlRoute(app);
app.finalize();

const req = new JsonReq(app, "/graphql");

beforeAll(initMemoryDb);

afterAll(async () => {
  await closeMemoryDb();
  process.env = processEnv;
});

let users: IUserDocument[];
// helpers
async function fillDbWithUSers() {
  users = await User.create([
    {
      ...userPrimaryObj,
      userName: "user0",
      firstName: "AdminTeacher",
      email: "user0@testing.com",
      roles: [eRolesAvailable.admin, eRolesAvailable.teacher],
    },
    {
      ...userPrimaryObj,
      userName: "user1",
      firstName: "Super",
      email: "user1@testing.com",
      roles: [eRolesAvailable.super],
    },
    {
      ...userPrimaryObj,
      userName: "user2",
      firstName: "Teacher",
      email: "user2@testing.com",
      roles: [eRolesAvailable.teacher],
    },
    {
      ...userPrimaryObj,
      userName: "user3",
      firstName: "Student",
      email: "user3@testing.com",
    },
  ]);
  users[2].updatedBy = users[0].id;
  users[0].updatedBy = users[1].id;
  await users[2].save();
  await users[0].save();
}

// -----------------------------------------------

describe("userLoader", () => {
  beforeAll(async () => {
    await fillDbWithUSers();
  });

  afterAll(async () => {
    await User.deleteMany({});
  });

  test("empty array non existant id", async () => {
    const user = await userLoader.load("01234567890abcdefabcdefa");
    expect(user).toStrictEqual([]);
  });

  test("succeed when user found", async () => {
    expect(await userLoader.load(users[2].id.toString())).toMatchObject(
      users[2],
    );
  });

  test("fail when one id of many not found", async () => {
    expect(async () => {
      await userLoader.loadMany([
        users[0].id.toString(),
        users[1].id.toString(),
        "01234567890abcdefabcdefa",
      ]);
    }).toThrowError();
  });
});
