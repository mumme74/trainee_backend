import { getMockReq, getMockRes } from "@jest-mock/express";

import { meetRoles, isAdmin } from "../../helpers/userHelpers";
import { AuthRequest } from "../../types";
import User, { IUserDocument, eRolesAvailable } from "../../models/usersModel";

const { res, next, clearMockRes } = getMockRes();

beforeEach(() => {
  clearMockRes();
});

// ----------------------------------------------------------------

describe("meetRoles function", () => {
  const ANY_OF_ERR_STRING = "Insufficient priviledges";
  const ALL_OF_ERR_STRING = "You do not have all required priviledges";
  const EXCLUDE_ERR_STRING = "You have a priviledge that you shall NOT have";

  let req: AuthRequest;
  beforeEach(() => {
    req = getMockReq() as AuthRequest;
    req.user = new User({
      firstName: "Test",
      lastName: "Testson",
      userName: "testUser",
      email: "email@user.com",
      method: "local",
      updatedBy: "123456789abc",
      updatedAt: Date,
      createdAt: Date,
      lastLogin: Date,
      roles: [eRolesAvailable.student],
    });
  });

  test("fail match anyOf", () => {
    const res = meetRoles({ anyOf: eRolesAvailable.teacher }, req);
    expect(res).toEqual(ANY_OF_ERR_STRING);
  });

  test("succeed match anyOf", () => {
    req.user.roles.push(eRolesAvailable.teacher);
    const res = meetRoles({ anyOf: eRolesAvailable.teacher }, req);
    expect(res).toEqual("");
  });

  test("succeed match anyOf value=0", () => {
    const res = meetRoles({ anyOf: 0 }, req);
    expect(res).toEqual("");
  });

  test("fail match anyOf with array", () => {
    const res = meetRoles({ anyOf: [eRolesAvailable.teacher] }, req);
    expect(res).toEqual(ANY_OF_ERR_STRING);
  });

  test("succeed match anyOf with array", () => {
    req.user.roles.push(eRolesAvailable.teacher);
    const res = meetRoles({ anyOf: [eRolesAvailable.teacher] }, req);
    expect(res).toEqual("");
  });

  test("succeed match anyOf with 2 alternatives with array", () => {
    req.user.roles.push(eRolesAvailable.teacher);
    const res = meetRoles(
      { anyOf: [eRolesAvailable.admin, eRolesAvailable.teacher] },
      req,
    );
    expect(res).toEqual("");
  });

  test("fail match allOf", () => {
    req.user.roles.push(eRolesAvailable.teacher);
    const res = meetRoles({ allOf: eRolesAvailable.admin }, req);
    expect(res).toEqual(ALL_OF_ERR_STRING);
  });

  test("succeed match allOf", () => {
    req.user.roles.push(eRolesAvailable.teacher);
    req.user.roles.push(eRolesAvailable.admin);
    const res = meetRoles({ allOf: eRolesAvailable.teacher }, req);
    expect(res).toEqual("");
  });

  test("succeed match allOf value=0", () => {
    const res = meetRoles({ allOf: 0 }, req);
    expect(res).toEqual("");
  });

  test("fail match allOf with array", () => {
    req.user.roles.push(eRolesAvailable.teacher);
    const res = meetRoles(
      { allOf: [eRolesAvailable.admin, eRolesAvailable.teacher] },
      req,
    );
    expect(res).toEqual(ALL_OF_ERR_STRING);
  });

  test("succeed match allOf with array", () => {
    req.user.roles.push(eRolesAvailable.teacher);
    req.user.roles.push(eRolesAvailable.admin);

    const res = meetRoles(
      { allOf: [eRolesAvailable.teacher, eRolesAvailable.admin] },
      req,
    );
    expect(res).toEqual("");
  });

  test("fail match exclude", () => {
    req.user.roles.push(eRolesAvailable.teacher);
    const res = meetRoles({ exclude: eRolesAvailable.teacher }, req);
    expect(res).toEqual(EXCLUDE_ERR_STRING);
  });

  test("succeed match exclude", () => {
    const res = meetRoles({ exclude: eRolesAvailable.teacher }, req);
    expect(res).toEqual("");
  });

  test("fail match exclude value=0", () => {
    const res = meetRoles({ exclude: 0 }, req);
    expect(res).toEqual(EXCLUDE_ERR_STRING);
  });

  test("fail match exclude with array", () => {
    req.user.roles.push(eRolesAvailable.teacher);
    const res = meetRoles(
      { exclude: [eRolesAvailable.admin, eRolesAvailable.teacher] },
      req,
    );
    expect(res).toEqual(EXCLUDE_ERR_STRING);
  });

  test("succeed match exclude with array", () => {
    const res = meetRoles(
      { exclude: [eRolesAvailable.teacher, eRolesAvailable.admin] },
      req,
    );
    expect(res).toEqual("");
  });
});

describe("isAdmin function", () => {
  let user: IUserDocument;
  beforeEach(() => {
    user = new User({
      firstName: "Test",
      lastName: "Testson",
      userName: "testUser",
      email: "email@user.com",
      method: "local",
      updatedBy: "123456789abc",
      updatedAt: Date,
      createdAt: Date,
      lastLogin: Date,
      roles: [eRolesAvailable.student],
    });
  });

  test("fail isAdmin [student]", () => {
    const res = isAdmin(user);
    expect(res).toEqual(false);
  });

  test("fail isAdmin [teacher]", () => {
    user.roles = [eRolesAvailable.teacher];
    const res = isAdmin(user);
    expect(res).toEqual(false);
  });

  test("fail isAdmin [student, teacher]", () => {
    user.roles.push(eRolesAvailable.teacher);
    const res = isAdmin(user);
    expect(res).toEqual(false);
  });

  test("success isAdmin [admin]", () => {
    user.roles = [eRolesAvailable.admin];
    const res = isAdmin(user);
    expect(res).toEqual(true);
  });

  test("success isAdmin [teacher, admin]", () => {
    user.roles = [eRolesAvailable.teacher, eRolesAvailable.admin];
    const res = isAdmin(user);
    expect(res).toEqual(true);
  });

  test("success isAdmin [super]", () => {
    user.roles = [eRolesAvailable.super];
    const res = isAdmin(user);
    expect(res).toEqual(true);
  });

  test("success isAdmin [super, admin]", () => {
    user.roles = [eRolesAvailable.super, eRolesAvailable.admin];
    const res = isAdmin(user);
    expect(res).toEqual(true);
  });

  test("success isAdmin [super, admin, teacher]", () => {
    user.roles = [
      eRolesAvailable.super,
      eRolesAvailable.admin,
      eRolesAvailable.teacher,
    ];
    const res = isAdmin(user);
    expect(res).toEqual(true);
  });
});
