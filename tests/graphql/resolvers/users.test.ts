import type { CallbackHandler } from "supertest";

// must be imported before any other local import
import "../../testProcess.env";

import {
  jsonApp,
  matchErrorSupertest,
  signToken,
  JsonReq,
  userPrimaryObj,
  compareUser,
} from "../../testHelpers";

import graphqlRoute from "../../../src/graphql";
import { User } from "../../../src/models/user";
import { eRolesAvailable } from "../../../src/models/role";
import { closeTestDb, initTestDb } from "../../testingDatabase";
import UsersController from "../../../src/controllers/users";
import { userLoader } from "../../../src/graphql/resolvers/users";

const processEnv = process.env;

const app = jsonApp();
graphqlRoute(app);
app.finalize();

const req = new JsonReq(app, "/graphql");

beforeAll(initTestDb);

afterAll(async () => {
  for (const u of users)
    await u.destroy({force:true})
  await closeTestDb();
  process.env = processEnv;
});

let users: User[];
// helpers
async function fillDbWithUSers() {
  users = await User.bulkBuild([
    {
      ...userPrimaryObj,
      userName: "user1",
      firstName: "AdminTeacher",
      email: "user1@testing.com",
      roles: [eRolesAvailable.admin, eRolesAvailable.teacher],
    },
    {
      ...userPrimaryObj,
      userName: "user2",
      firstName: "Super",
      email: "user2@testing.com",
      roles: [eRolesAvailable.super],
    },
    {
      ...userPrimaryObj,
      userName: "user3",
      firstName: "Teacher",
      email: "user3@testing.com",
      roles: [eRolesAvailable.teacher],
    },
    {
      ...userPrimaryObj,
      userName: "user4",
      firstName: "Student",
      email: "user4@testing.com",
    },
  ]);
  users[2].updatedBy = users[0].id;
  users[0].updatedBy = users[1].id;
  await users[2].save();
  await users[1].save();
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
    const user = await userLoader.loadMany([1234567890]);
    expect(user[0] instanceof Error).toBe(true);
    expect((user[0] as Error).message).toContain('User.id=');
    expect((user[0] as Error).message).toContain('not found');
  });

  test("succeed when user found", async () => {
    compareUser(await userLoader.load(users[2].id), users[2]);
  });

  test("fail when one id of many not found", async () => {
    expect(() => {
      return userLoader.loadAll([
        users[0].id,
        users[1].id,
        1234567890,
      ]);
    }).rejects.toThrowError();
  });
});
