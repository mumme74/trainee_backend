import { getMockReq, getMockRes } from "@jest-mock/express";

import { meetRoles, isAdmin } from "../../src/helpers/userHelpers";
import { AuthRequest } from "../../src/types";
import { Role, eRolesAvailable } from "../../src/models/core_role";
import { User } from "../../src/models/core_user";
import { closeTestDb, initTestDb } from "../testingDatabase";

const { res, next, clearMockRes } = getMockRes();

beforeAll(initTestDb);
afterAll(closeTestDb);

// ----------------------------------------------------------------
let req: AuthRequest;
beforeEach(() => {
  clearMockRes();
  const now = new Date();
  req = getMockReq() as AuthRequest;
  req.user = {
    user: User.build({
      firstName: "Test",
      lastName: "Testson",
      userName: "testUser",
      email: "email@user.com",
      updatedBy: 10,
      updatedAt: now,
      createdAt: now,
      lastLogin: now,
    }),
    roles: [eRolesAvailable.student],
    userPic: null,
    oauth: null,
  };
});

describe("meetRoles function", () => {
  const ANY_OF_ERR_STRING = "Insufficient privileges";
  const ALL_OF_ERR_STRING = "You do not have all required privileges";
  const EXCLUDE_ERR_STRING = "You have a privilege that you shall NOT have";


  afterEach(async ()=>{
    await User.truncate()
  })

  test("fail match anyOf", async () => {
    const res = await meetRoles({ anyOf: eRolesAvailable.teacher }, req);
    expect(res).toEqual(ANY_OF_ERR_STRING);
  });

  test("succeed match anyOf", async () => {
    req.user.roles.push(eRolesAvailable.teacher);
    const res = await meetRoles({ anyOf: eRolesAvailable.teacher }, req);
    expect(res).toEqual("");
  });

  test("succeed match anyOf value=0", async () => {
    const res = await meetRoles({ anyOf: 0 }, req);
    expect(res).toEqual("");
  });

  test("fail match anyOf with array", async () => {
    const res = await meetRoles({ anyOf: [eRolesAvailable.teacher] }, req);
    expect(res).toEqual(ANY_OF_ERR_STRING);
  });

  test("succeed match anyOf with array", async () => {
    req.user.roles.push(eRolesAvailable.teacher);
    const res = await meetRoles({ anyOf: [eRolesAvailable.teacher] }, req);
    expect(res).toEqual("");
  });

  test("succeed match anyOf with 2 alternatives with array", async () => {
    req.user.roles.push(eRolesAvailable.teacher);
    const res = await meetRoles(
      { anyOf: [eRolesAvailable.admin, eRolesAvailable.teacher] },
      req,
    );
    expect(res).toEqual("");
  });

  test("fail match allOf single", async () => {
    req.user.roles.push(eRolesAvailable.teacher);
    const res = await meetRoles({ allOf: [eRolesAvailable.admin] }, req);
    expect(res).toEqual(ALL_OF_ERR_STRING);
  });

  test("succeed match allOf single", async () => {
    req.user.roles.push(eRolesAvailable.teacher);
    req.user.roles.push(eRolesAvailable.admin);
    const res = await meetRoles({ allOf: [eRolesAvailable.teacher] }, req);
    expect(res).toEqual("");
  });

  test("succeed match allOf value=0", async () => {
    const res = await meetRoles({ allOf: [0] }, req);
    expect(res).toEqual("");
  });

  test("fail match allOf with array", async () => {
    req.user.roles.push(eRolesAvailable.teacher);
    const res = await meetRoles(
      { allOf: [eRolesAvailable.admin, eRolesAvailable.teacher] },
      req,
    );
    expect(res).toEqual(ALL_OF_ERR_STRING);
  });

  test("succeed match allOf with array", async () => {
    req.user.roles.push(eRolesAvailable.teacher);
    req.user.roles.push(eRolesAvailable.admin);

    const res = await meetRoles(
      { allOf: [eRolesAvailable.teacher, eRolesAvailable.admin] },
      req,
    );
    expect(res).toEqual("");
  });

  test("fail match exclude", async () => {
    req.user.roles.push(eRolesAvailable.teacher);
    const res = await meetRoles({ exclude: eRolesAvailable.teacher }, req);
    expect(res).toEqual(EXCLUDE_ERR_STRING);
  });

  test("succeed match exclude", async () => {
    const res = await meetRoles({ exclude: eRolesAvailable.teacher }, req);
    expect(res).toEqual("");
  });

  test("fail match exclude value=0", async () => {
    const res = await meetRoles({ exclude: 0 }, req);
    expect(res).toEqual(EXCLUDE_ERR_STRING);
  });

  test("fail match exclude with array", async () => {
    req.user.roles.push(eRolesAvailable.teacher);
    const res = await meetRoles(
      { exclude: [eRolesAvailable.admin, eRolesAvailable.teacher] },
      req,
    );
    expect(res).toEqual(EXCLUDE_ERR_STRING);
  });

  test("succeed match exclude with array", async () => {
    const res = await meetRoles(
      { exclude: [eRolesAvailable.teacher, eRolesAvailable.admin] },
      req,
    );
    expect(res).toEqual("");
  });
});

describe("isAdmin function", () => {

  test("fail isAdmin [student]", async () => {
    const res = await isAdmin(req);
    expect(res).toEqual(false);
  });

  test("fail isAdmin [teacher]", async () => {
    req.user.roles = [eRolesAvailable.teacher];
    const res = await isAdmin(req);
    expect(res).toEqual(false);
  });

  test("fail isAdmin [student, teacher]", async () => {
    req.user.roles.push(eRolesAvailable.teacher);
    const res = await isAdmin(req);
    expect(res).toEqual(false);
  });

  test("success isAdmin [admin]", async () => {
    req.user.roles = [eRolesAvailable.admin];
    const res = await isAdmin(req);
    expect(res).toEqual(true);
  });

  test("success isAdmin [teacher, admin]", async () => {
    req.user.roles = [eRolesAvailable.teacher, eRolesAvailable.admin];
    const res = await isAdmin(req);
    expect(res).toEqual(true);
  });

  test("success isAdmin [super]", async () => {
    req.user.roles = [eRolesAvailable.super];
    const res = await isAdmin(req);
    expect(res).toEqual(true);
  });

  test("success isAdmin [super, admin]", async () => {
    req.user.roles = [eRolesAvailable.super, eRolesAvailable.admin];
    const res = await  isAdmin(req);
    expect(res).toEqual(true);
  });

  test("success isAdmin [super, admin, teacher]", async () => {
    req.user.roles = [
      eRolesAvailable.super,
      eRolesAvailable.admin,
      eRolesAvailable.teacher,
    ];
    const res = await isAdmin(req);
    expect(res).toEqual(true);
  });
});
