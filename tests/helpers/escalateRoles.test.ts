import { passAsSuperAdmin, passAsTeacher } from "../../src/helpers/escalateRoles";
import { User} from "../../src/models/core_user";
import { Role, eRolesAvailable } from "../../src/models/core_role";
import {
  createTestUser, destroyTestUser, organizationDefaultObj
} from "../testHelpers";
import { Organization } from "../../src/models/core_organization";
import { closeTestDb, initTestDb } from "../testingDatabase";

const defaultUser = {
  firstName: "mock",
  lastName: "mock",
  email: "mock@testschool.org",
  userName: "userName",
  updatedBy: 2,
  updatedAt: new Date(),
  createdAt: new Date(),
  lastLogin: new Date(),
};


let student: User,
    external: User,
    teacherNoEscalate: User,
    teacherEscalate: User,
    teacherEscalateSuper: User,
    organization: Organization,
    extOrganization: Organization;

async function buildUsers() {
  organization = await Organization.create({
    ...organizationDefaultObj,
    domain: 'testschool.org'
  });
  extOrganization = await Organization.create({
    ...organizationDefaultObj,
    name: 'external org',
    domain: 'external.com'
  })

  student = await createTestUser({
    ...defaultUser,
    firstName: "Student",
    lastName: "Studentson",
    email: "student1@testschool.org",
    userName: "001stustu",
    organizationId: organization.id
  });

  external = await createTestUser({
    ...defaultUser,
    firstName: "123TEGY External",
    lastName: "Externalson 123TEGY",
    email: "External@external.com",
    userName: "001stustu",
    organizationId: extOrganization.id,
  });

  teacherNoEscalate = await createTestUser({
    ...defaultUser,
    firstName: "Teacher",
    lastName: "Teacherson",
    email: "teacher123@testschool.org",
    userName: "noEscalateTeacher",
    organizationId: organization.id
  });

  teacherEscalate = await createTestUser({
    ...defaultUser,
    firstName: "123KAGY Teacher",
    lastName: "Teacherson 123KAGY",
    email: "teacher123@teacher.testschool.org",
    userName: "escalateTeacher",
    organizationId: organization.id
  });

  teacherEscalateSuper = await createTestUser({
    ...defaultUser,
    firstName: "TeacherSuper",
    lastName: "Teacherson 123KUGY",
    email: "teacher5super@teacher.testschool.org",
    userName: "escalateTeacherSuper",
    organizationId: organization.id
  });
}

let oldProcessEnv: any;
beforeAll(async () => {
  await initTestDb();
  await buildUsers();
  oldProcessEnv = process.env;
});

afterAll(async () => {
  process.env = oldProcessEnv;
  await destroyTestUser();
  await organization.destroy({force:true});
  await extOrganization.destroy({force: true});
  await closeTestDb();
});

beforeEach(() => {
  process.env.ENABLE_AUTO_ROLE_TEACHER = "";
  process.env.AUTO_ROLE_REQUIRE_GOOGLE_ID = "";
  process.env.TEACHER_EMAIL_REGEX = "";
  process.env.TEACHER_FIRST_NAME_REGEX = "";
  process.env.TEACHER_LAST_NAME_REGEX = "";
  process.env.TEACHER_DOMAIN_REGEX = "";
  process.env.ENABLE_AUTO_ROLE_SUPER_ADMIN = "";
  process.env.SUPER_ADMIN_EMAIL_REGEX = "";
});

describe("escalation off", () => {
  beforeEach(() => {
    process.env.TEACHER_DOMAIN_REGEX = "^testschool\\.org$";
  });

  test("student no escalation", async () => {
    expect(await passAsTeacher(student)).toBe(false);
  });
  test("external no escalation", async () => {
    expect(await passAsTeacher(external)).toBe(false);
  });
  test("teacher1 no escalation", async () => {
    expect(await passAsTeacher(teacherNoEscalate)).toBe(false);
  });
  test("teacher2 no escalation", async () => {
    expect(await passAsTeacher(teacherEscalate)).toBe(false);
  });
  test("teacher3 no escalation", async () => {
    expect(await passAsTeacher(teacherEscalateSuper)).toBe(false);
  });
});

describe("escalation domain", () => {
  beforeEach(() => {
    process.env.ENABLE_AUTO_ROLE_TEACHER = "true";
    process.env.TEACHER_DOMAIN_REGEX = "^testschool\\.org$";
  });

  // All
  test("student escalation", async () => {
    expect(await passAsTeacher(student)).toBe(true);
  });
  test("external no escalation", async () => {
    expect(await passAsTeacher(external)).toBe(false);
  });
  test("teacher1 escalation", async () => {
    expect(await passAsTeacher(teacherNoEscalate)).toBe(true);
  });
  test("teacher2 escalation", async () => {
    expect(await passAsTeacher(teacherEscalate)).toBe(true);
  });
  test("teacher3 escalation", async () => {
    expect(await passAsTeacher(teacherEscalateSuper)).toBe(true);
  });
});

describe("escalation domain force google", () => {
  beforeEach(() => {
    process.env.ENABLE_AUTO_ROLE_TEACHER = "true";
    process.env.AUTO_ROLE_REQUIRE_GOOGLE_ID = "true";
    process.env.TEACHER_DOMAIN_REGEX = "^testschool\\.org$";
  });

  test("student escalation", async () => {
    expect(await passAsTeacher(student)).toBe(false);
  });
  test("external no escalation", async () => {
    expect(await passAsTeacher(external)).toBe(false);
  });
  test("teacher1 escalation", async () => {
    expect(await passAsTeacher(teacherNoEscalate)).toBe(false);
  });
  test("teacher2 escalation", async () => {
    expect(await passAsTeacher(teacherEscalate)).toBe(false);
  });
  test("teacher3 escalation", async () => {
    expect(await passAsTeacher(teacherEscalateSuper)).toBe(false);
  });
});

describe("escalation email", () => {
  beforeEach(() => {
    process.env.ENABLE_AUTO_ROLE_TEACHER = "true";
    process.env.TEACHER_EMAIL_REGEX = "^[^@]{2,}@teacher\\.testschool\\.org$";
  });

  test("student no escalation", async () => {
    expect(await passAsTeacher(student)).toBe(false);
  });
  test("external no escalation", async () => {
    expect(await passAsTeacher(external)).toBe(false);
  });
  test("teacher1 no escalation", async () => {
    expect(await passAsTeacher(teacherNoEscalate)).toBe(false);
  });
  test("teacher2 escalation", async () => {
    expect(await passAsTeacher(teacherEscalate)).toBe(true);
  });
  test("teacher3 escalation", async () => {
    expect(await passAsTeacher(teacherEscalateSuper)).toBe(true);
  });
});

describe("escalation firstname", () => {
  beforeEach(() => {
    process.env.ENABLE_AUTO_ROLE_TEACHER = "true";
    process.env.TEACHER_FIRST_NAME_REGEX = "^123(?:KU|TE|KA)GY\\s.+$";
  });

  test("student no escalation", async () => {
    expect(await passAsTeacher(student)).toBe(false);
  });
  test("external escalation", async () => {
    expect(await passAsTeacher(external)).toBe(true);
  });
  test("teacher1 no escalation", async () => {
    expect(await passAsTeacher(teacherNoEscalate)).toBe(false);
  });
  test("teacher2 escalation", async () => {
    expect(await passAsTeacher(teacherEscalate)).toBe(true);
  });
  test("teacher3 no escalation", async () => {
    expect(await passAsTeacher(teacherEscalateSuper)).toBe(false);
  });
});

describe("escalation lastName", () => {
  beforeEach(() => {
    process.env.ENABLE_AUTO_ROLE_TEACHER = "true";
    process.env.TEACHER_LAST_NAME_REGEX = "^.+\\s123(?:KU|TE|KA)GY$";
  });

  test("student no escalation", async () => {
    expect(await passAsTeacher(student)).toBe(false);
  });
  test("external escalation", async () => {
    expect(await passAsTeacher(external)).toBe(true);
  });
  test("teacher1 no escalation", async () => {
    expect(await passAsTeacher(teacherNoEscalate)).toBe(false);
  });
  test("teacher2 escalation", async () => {
    expect(await passAsTeacher(teacherEscalate)).toBe(true);
  });
  test("teacher3 escalation", async () => {
    expect(await passAsTeacher(teacherEscalateSuper)).toBe(true);
  });
});

describe("escalation combined", () => {
  beforeEach(() => {
    process.env.ENABLE_AUTO_ROLE_TEACHER = "true";
    process.env.TEACHER_LAST_NAME_REGEX = "^.+\\s123(?:KU|TE|KA)GY$";
    process.env.TEACHER_FIRST_NAME_REGEX = "^123(?:KU|TE|KA)GY\\s.+$";
    process.env.TEACHER_EMAIL_REGEX = "^[^@]{2,}@teacher\\.testschool\\.org$";
    process.env.TEACHER_DOMAIN_REGEX = "^testschool\\.org$";
  });

  test("student no escalation", async () => {
    expect(await passAsTeacher(student)).toBe(false);
  });
  test("external no escalation", async () => {
    expect(await passAsTeacher(external)).toBe(false);
  });
  test("teacher1 no escalation", async () => {
    expect(await passAsTeacher(teacherNoEscalate)).toBe(false);
  });
  test("teacher2 escalation", async () => {
    expect(await passAsTeacher(teacherEscalate)).toBe(true);
  });
  test("teacher3  no escalation", async () => {
    expect(await passAsTeacher(teacherEscalateSuper)).toBe(false);
  });
});

describe("super admin escalation", () => {
  test("super escalation off", async () => {
    process.env.SUPER_ADMIN_EMAIL_REGEX =
      "teacher123super@teacher.testschool.org";
    expect(await passAsSuperAdmin(teacherEscalateSuper)).toBe(false);
    expect(await passAsSuperAdmin(teacherEscalate)).toBe(false);
    expect(await passAsSuperAdmin(teacherNoEscalate)).toBe(false);
    expect(await passAsSuperAdmin(student)).toBe(false);
  });

  test("super escalation on", async () => {
    process.env.SUPER_ADMIN_EMAIL_REGEX =
      "teacher5super@teacher.testschool.org";
    process.env.ENABLE_AUTO_ROLE_SUPER_ADMIN = "true";
    expect(await passAsSuperAdmin(teacherEscalateSuper)).toBe(true);
    expect(await passAsSuperAdmin(teacherEscalate)).toBe(false);
    expect(await passAsSuperAdmin(teacherNoEscalate)).toBe(false);
    expect(await passAsSuperAdmin(student)).toBe(false);
  });
});
