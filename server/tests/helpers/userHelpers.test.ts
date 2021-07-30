import { getMockReq, getMockRes } from "@jest-mock/express";

import { meetRoles, isAdmin } from "../../helpers/userHelpers";
import { AuthRequest } from "../../types";
import User, { IUserDocument, rolesAvailable } from "../../models/usersModel";

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
      roles: [rolesAvailable.student],
    });
  });

  test("fail match anyOf", () => {
    const res = meetRoles({ anyOf: rolesAvailable.teacher }, req);
    expect(res).toEqual(ANY_OF_ERR_STRING);
  });

  test("succeed match anyOf", () => {
    req.user.roles.push(rolesAvailable.teacher);
    const res = meetRoles({ anyOf: rolesAvailable.teacher }, req);
    expect(res).toEqual("");
  });

  test("succeed match anyOf value=0", () => {
    const res = meetRoles({ anyOf: 0 }, req);
    expect(res).toEqual("");
  });

  test("fail match anyOf with array", () => {
    const res = meetRoles({ anyOf: [rolesAvailable.teacher] }, req);
    expect(res).toEqual(ANY_OF_ERR_STRING);
  });

  test("succeed match anyOf with array", () => {
    req.user.roles.push(rolesAvailable.teacher);
    const res = meetRoles({ anyOf: [rolesAvailable.teacher] }, req);
    expect(res).toEqual("");
  });

  test("succeed match anyOf with 2 alternatives with array", () => {
    req.user.roles.push(rolesAvailable.teacher);
    const res = meetRoles(
      { anyOf: [rolesAvailable.admin, rolesAvailable.teacher] },
      req,
    );
    expect(res).toEqual("");
  });

  test("fail match allOf", () => {
    req.user.roles.push(rolesAvailable.teacher);
    const res = meetRoles({ allOf: rolesAvailable.admin }, req);
    expect(res).toEqual(ALL_OF_ERR_STRING);
  });

  test("succeed match allOf", () => {
    req.user.roles.push(rolesAvailable.teacher);
    req.user.roles.push(rolesAvailable.admin);
    const res = meetRoles({ allOf: rolesAvailable.teacher }, req);
    expect(res).toEqual("");
  });

  test("succeed match allOf value=0", () => {
    const res = meetRoles({ allOf: 0 }, req);
    expect(res).toEqual("");
  });

  test("fail match allOf with array", () => {
    req.user.roles.push(rolesAvailable.teacher);
    const res = meetRoles(
      { allOf: [rolesAvailable.admin, rolesAvailable.teacher] },
      req,
    );
    expect(res).toEqual(ALL_OF_ERR_STRING);
  });

  test("succeed match allOf with array", () => {
    req.user.roles.push(rolesAvailable.teacher);
    req.user.roles.push(rolesAvailable.admin);

    const res = meetRoles(
      { allOf: [rolesAvailable.teacher, rolesAvailable.admin] },
      req,
    );
    expect(res).toEqual("");
  });

  test("fail match exclude", () => {
    req.user.roles.push(rolesAvailable.teacher);
    const res = meetRoles({ exclude: rolesAvailable.teacher }, req);
    expect(res).toEqual(EXCLUDE_ERR_STRING);
  });

  test("succeed match exclude", () => {
    const res = meetRoles({ exclude: rolesAvailable.teacher }, req);
    expect(res).toEqual("");
  });

  test("fail match exclude value=0", () => {
    const res = meetRoles({ exclude: 0 }, req);
    expect(res).toEqual(EXCLUDE_ERR_STRING);
  });

  test("fail match exclude with array", () => {
    req.user.roles.push(rolesAvailable.teacher);
    const res = meetRoles(
      { exclude: [rolesAvailable.admin, rolesAvailable.teacher] },
      req,
    );
    expect(res).toEqual(EXCLUDE_ERR_STRING);
  });

  test("succeed match exclude with array", () => {
    const res = meetRoles(
      { exclude: [rolesAvailable.teacher, rolesAvailable.admin] },
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
      roles: [rolesAvailable.student],
    });
  });

  test("fail isAdmin [student]", () => {
    const res = isAdmin(user);
    expect(res).toEqual(false);
  });

  test("fail isAdmin [teacher]", () => {
    user.roles = [rolesAvailable.teacher];
    const res = isAdmin(user);
    expect(res).toEqual(false);
  });

  test("fail isAdmin [student, teacher]", () => {
    user.roles.push(rolesAvailable.teacher);
    const res = isAdmin(user);
    expect(res).toEqual(false);
  });

  test("success isAdmin [admin]", () => {
    user.roles = [rolesAvailable.admin];
    const res = isAdmin(user);
    expect(res).toEqual(true);
  });

  test("success isAdmin [teacher, admin]", () => {
    user.roles = [rolesAvailable.teacher, rolesAvailable.admin];
    const res = isAdmin(user);
    expect(res).toEqual(true);
  });

  test("success isAdmin [super]", () => {
    user.roles = [rolesAvailable.super];
    const res = isAdmin(user);
    expect(res).toEqual(true);
  });

  test("success isAdmin [super, admin]", () => {
    user.roles = [rolesAvailable.super, rolesAvailable.admin];
    const res = isAdmin(user);
    expect(res).toEqual(true);
  });

  test("success isAdmin [super, admin, teacher]", () => {
    user.roles = [
      rolesAvailable.super,
      rolesAvailable.admin,
      rolesAvailable.teacher,
    ];
    const res = isAdmin(user);
    expect(res).toEqual(true);
  });
});
