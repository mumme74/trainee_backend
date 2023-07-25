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

import graphqlRoute from "../../../src/graphql";
import { User } from "../../../src/models/user";
import { eRolesAvailable } from "../../../src/models/role";
import { closeMemoryDb, initMemoryDb } from "../../testingDatabase";
import UsersController from "../../../src/controllers/users";
import { userLoader } from "../../../src/graphql/resolvers/users";

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

let users: User[];
// helpers
async function fillDbWithUSers() {
  users = await User.bulkBuild([
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
    await User.truncate();
  });

  test("empty array non existant id", async () => {
    const user = await userLoader.load(1234567890);
    expect(user).toStrictEqual([]);
  });

  test("succeed when user found", async () => {
    expect(await userLoader.load(users[2].id)).toMatchObject(
      users[2],
    );
  });

  test("fail when one id of many not found", async () => {
    expect(async () => {
      await userLoader.loadMany([
        users[0].id,
        users[1].id,
        1235467890,
      ]);
    }).toThrowError();
  });
});
