import { passAsSuperAdmin, passAsTeacher } from "../../helpers/escalateRoles";
import type { IUserDocument } from "../../models/usersModel";
import { rolesAvailable } from "../../models/usersModel";

function mockUser(): IUserDocument {
  return {
    id: "1234567890abc",
    firstName: "mock",
    lastName: "mock",
    email: "mock@testschool.org",
    domain: "testschool.org",
    userName: "userName",
    roles: [rolesAvailable.student],
    method: "local",
    updatedBy: "123456789abc",
    updatedAt: Date,
    createdAt: Date,
    lastLogin: Date,
  };
}

const student: IUserDocument = {
  ...mockUser(),
  firstName: "Student",
  lastName: "Studentson",
  email: "student1@testschool.org",
  userName: "001stustu",
};

const external: IUserDocument = {
  ...mockUser(),
  firstName: "123TEGY External",
  lastName: "Externalson 123TEGY",
  email: "External@external.com",
  userName: "001stustu",
  domain: "external.com",
};

const teacherNoEscalate: IUserDocument = {
  ...mockUser(),
  firstName: "Teacher",
  lastName: "Teacherson",
  email: "teacher123@testschool.org",
  userName: "noEscalateTeacher",
};

const teacherEscalate: IUserDocument = {
  ...mockUser(),
  firstName: "123KAGY Teacher",
  lastName: "Teacherson 123KAGY",
  email: "teacher123@teacher.testschool.org",
  userName: "escalateTeacher",
};

const teacherEscalateSuper: IUserDocument = {
  ...mockUser(),
  firstName: "TeacherSuper",
  lastName: "Teacherson 123KUGY",
  email: "teacher123super@teacher.testschool.org",
  userName: "escalateTeacherSuper",
};

let oldProcessEnv: any;
beforeAll(() => {
  oldProcessEnv = process.env;
});

afterAll(() => {
  process.env = oldProcessEnv;
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

  test("student no escalation", () => {
    expect(passAsTeacher(student)).toBe(false);
  });
  test("external no escalation", () => {
    expect(passAsTeacher(external)).toBe(false);
  });
  test("teacher1 no escalation", () => {
    expect(passAsTeacher(teacherNoEscalate)).toBe(false);
  });
  test("teacher2 no escalation", () => {
    expect(passAsTeacher(teacherEscalate)).toBe(false);
  });
  test("teacher3 no escalation", () => {
    expect(passAsTeacher(teacherEscalateSuper)).toBe(false);
  });
});

describe("escalation domain", () => {
  beforeEach(() => {
    process.env.ENABLE_AUTO_ROLE_TEACHER = "true";
    process.env.TEACHER_DOMAIN_REGEX = "^testschool\\.org$";
  });

  // All
  test("student escalation", () => {
    expect(passAsTeacher(student)).toBe(true);
  });
  test("external no escalation", () => {
    expect(passAsTeacher(external)).toBe(false);
  });
  test("teacher1 escalation", () => {
    expect(passAsTeacher(teacherNoEscalate)).toBe(true);
  });
  test("teacher2 escalation", () => {
    expect(passAsTeacher(teacherEscalate)).toBe(true);
  });
  test("teacher3 escalation", () => {
    expect(passAsTeacher(teacherEscalateSuper)).toBe(true);
  });
});

describe("escalation domain force google", () => {
  beforeEach(() => {
    process.env.ENABLE_AUTO_ROLE_TEACHER = "true";
    process.env.AUTO_ROLE_REQUIRE_GOOGLE_ID = "true";
    process.env.TEACHER_DOMAIN_REGEX = "^testschool\\.org$";
  });

  test("student escalation", () => {
    expect(passAsTeacher(student)).toBe(false);
  });
  test("external no escalation", () => {
    expect(passAsTeacher(external)).toBe(false);
  });
  test("teacher1 escalation", () => {
    expect(passAsTeacher(teacherNoEscalate)).toBe(false);
  });
  test("teacher2 escalation", () => {
    expect(passAsTeacher(teacherEscalate)).toBe(false);
  });
  test("teacher3 escalation", () => {
    expect(passAsTeacher(teacherEscalateSuper)).toBe(false);
  });
});

describe("escalation email", () => {
  beforeEach(() => {
    process.env.ENABLE_AUTO_ROLE_TEACHER = "true";
    process.env.TEACHER_EMAIL_REGEX = "^[^@]{2,}@teacher\\.testschool\\.org$";
  });

  test("student no escalation", () => {
    expect(passAsTeacher(student)).toBe(false);
  });
  test("external no escalation", () => {
    expect(passAsTeacher(external)).toBe(false);
  });
  test("teacher1 no escalation", () => {
    expect(passAsTeacher(teacherNoEscalate)).toBe(false);
  });
  test("teacher2 escalation", () => {
    expect(passAsTeacher(teacherEscalate)).toBe(true);
  });
  test("teacher3 escalation", () => {
    expect(passAsTeacher(teacherEscalateSuper)).toBe(true);
  });
});

describe("escalation firstname", () => {
  beforeEach(() => {
    process.env.ENABLE_AUTO_ROLE_TEACHER = "true";
    process.env.TEACHER_FIRST_NAME_REGEX = "^123(?:KU|TE|KA)GY\\s.+$";
  });

  test("student no escalation", () => {
    expect(passAsTeacher(student)).toBe(false);
  });
  test("external escalation", () => {
    expect(passAsTeacher(external)).toBe(true);
  });
  test("teacher1 no escalation", () => {
    expect(passAsTeacher(teacherNoEscalate)).toBe(false);
  });
  test("teacher2 escalation", () => {
    expect(passAsTeacher(teacherEscalate)).toBe(true);
  });
  test("teacher3 no escalation", () => {
    expect(passAsTeacher(teacherEscalateSuper)).toBe(false);
  });
});

describe("escalation lastname", () => {
  beforeEach(() => {
    process.env.ENABLE_AUTO_ROLE_TEACHER = "true";
    process.env.TEACHER_LAST_NAME_REGEX = "^.+\\s123(?:KU|TE|KA)GY$";
  });

  test("student no escalation", () => {
    expect(passAsTeacher(student)).toBe(false);
  });
  test("external escalation", () => {
    expect(passAsTeacher(external)).toBe(true);
  });
  test("teacher1 no escalation", () => {
    expect(passAsTeacher(teacherNoEscalate)).toBe(false);
  });
  test("teacher2 escalation", () => {
    expect(passAsTeacher(teacherEscalate)).toBe(true);
  });
  test("teacher3 escalation", () => {
    expect(passAsTeacher(teacherEscalateSuper)).toBe(true);
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

  test("student no escalation", () => {
    expect(passAsTeacher(student)).toBe(false);
  });
  test("external no escalation", () => {
    expect(passAsTeacher(external)).toBe(false);
  });
  test("teacher1 no escalation", () => {
    expect(passAsTeacher(teacherNoEscalate)).toBe(false);
  });
  test("teacher2 escalation", () => {
    expect(passAsTeacher(teacherEscalate)).toBe(true);
  });
  test("teacher3  no escalation", () => {
    expect(passAsTeacher(teacherEscalateSuper)).toBe(false);
  });
});

describe("super admin escalation", () => {
  test("super escalation off", () => {
    process.env.SUPER_ADMIN_EMAIL_REGEX =
      "teacher123super@teacher.testschool.org";
    expect(passAsSuperAdmin(teacherEscalateSuper)).toBe(false);
    expect(passAsSuperAdmin(teacherEscalate)).toBe(false);
    expect(passAsSuperAdmin(teacherNoEscalate)).toBe(false);
    expect(passAsSuperAdmin(student)).toBe(false);
  });

  test("super escalation on", () => {
    process.env.SUPER_ADMIN_EMAIL_REGEX =
      "teacher123super@teacher.testschool.org";
    process.env.ENABLE_AUTO_ROLE_SUPER_ADMIN = "true";
    expect(passAsSuperAdmin(teacherEscalateSuper)).toBe(true);
    expect(passAsSuperAdmin(teacherEscalate)).toBe(false);
    expect(passAsSuperAdmin(teacherNoEscalate)).toBe(false);
    expect(passAsSuperAdmin(student)).toBe(false);
  });
});
