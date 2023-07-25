"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const escalateRoles_1 = require("../../src/helpers/escalateRoles");
const user_1 = require("../../src/models/user");
const role_1 = require("../../src/models/role");
const defaultUser = {
    id: 1,
    firstName: "mock",
    lastName: "mock",
    email: "mock@testschool.org",
    domain: "testschool.org",
    userName: "userName",
    updatedBy: 2,
    updatedAt: new Date(),
    createdAt: new Date(),
    lastLogin: new Date(),
};
const defaultRole = {
    id: 1,
    userId: 1,
    createdAt: new Date(),
    role: role_1.eRolesAvailable.student
};
let student, external, teacherNoEscalate, teacherEscalate, teacherEscalateSuper, studentRole;
function buildUsers() {
    student = user_1.User.build({
        ...defaultUser,
        firstName: "Student",
        lastName: "Studentson",
        email: "student1@testschool.org",
        userName: "001stustu",
    });
    external = user_1.User.build({
        ...defaultUser,
        firstName: "123TEGY External",
        lastName: "Externalson 123TEGY",
        email: "External@external.com",
        userName: "001stustu",
        domain: "external.com",
    });
    teacherNoEscalate = user_1.User.build({
        ...defaultUser,
        firstName: "Teacher",
        lastName: "Teacherson",
        email: "teacher123@testschool.org",
        userName: "noEscalateTeacher",
    });
    teacherEscalate = user_1.User.build({
        ...defaultUser,
        firstName: "123KAGY Teacher",
        lastName: "Teacherson 123KAGY",
        email: "teacher123@teacher.testschool.org",
        userName: "escalateTeacher",
    });
    teacherEscalateSuper = user_1.User.build({
        ...defaultUser,
        firstName: "TeacherSuper",
        lastName: "Teacherson 123KUGY",
        email: "teacher123super@teacher.testschool.org",
        userName: "escalateTeacherSuper",
    });
    studentRole = role_1.Role.build(defaultRole);
}
let oldProcessEnv;
beforeAll(() => {
    buildUsers();
    oldProcessEnv = process.env;
});
afterAll(() => {
    process.env = oldProcessEnv;
    user_1.User.truncate();
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
        expect((0, escalateRoles_1.passAsTeacher)(student)).toBe(false);
    });
    test("external no escalation", () => {
        expect((0, escalateRoles_1.passAsTeacher)(external)).toBe(false);
    });
    test("teacher1 no escalation", () => {
        expect((0, escalateRoles_1.passAsTeacher)(teacherNoEscalate)).toBe(false);
    });
    test("teacher2 no escalation", () => {
        expect((0, escalateRoles_1.passAsTeacher)(teacherEscalate)).toBe(false);
    });
    test("teacher3 no escalation", () => {
        expect((0, escalateRoles_1.passAsTeacher)(teacherEscalateSuper)).toBe(false);
    });
});
describe("escalation domain", () => {
    beforeEach(() => {
        process.env.ENABLE_AUTO_ROLE_TEACHER = "true";
        process.env.TEACHER_DOMAIN_REGEX = "^testschool\\.org$";
    });
    // All
    test("student escalation", () => {
        expect((0, escalateRoles_1.passAsTeacher)(student)).toBe(true);
    });
    test("external no escalation", () => {
        expect((0, escalateRoles_1.passAsTeacher)(external)).toBe(false);
    });
    test("teacher1 escalation", () => {
        expect((0, escalateRoles_1.passAsTeacher)(teacherNoEscalate)).toBe(true);
    });
    test("teacher2 escalation", () => {
        expect((0, escalateRoles_1.passAsTeacher)(teacherEscalate)).toBe(true);
    });
    test("teacher3 escalation", () => {
        expect((0, escalateRoles_1.passAsTeacher)(teacherEscalateSuper)).toBe(true);
    });
});
describe("escalation domain force google", () => {
    beforeEach(() => {
        process.env.ENABLE_AUTO_ROLE_TEACHER = "true";
        process.env.AUTO_ROLE_REQUIRE_GOOGLE_ID = "true";
        process.env.TEACHER_DOMAIN_REGEX = "^testschool\\.org$";
    });
    test("student escalation", () => {
        expect((0, escalateRoles_1.passAsTeacher)(student)).toBe(false);
    });
    test("external no escalation", () => {
        expect((0, escalateRoles_1.passAsTeacher)(external)).toBe(false);
    });
    test("teacher1 escalation", () => {
        expect((0, escalateRoles_1.passAsTeacher)(teacherNoEscalate)).toBe(false);
    });
    test("teacher2 escalation", () => {
        expect((0, escalateRoles_1.passAsTeacher)(teacherEscalate)).toBe(false);
    });
    test("teacher3 escalation", () => {
        expect((0, escalateRoles_1.passAsTeacher)(teacherEscalateSuper)).toBe(false);
    });
});
describe("escalation email", () => {
    beforeEach(() => {
        process.env.ENABLE_AUTO_ROLE_TEACHER = "true";
        process.env.TEACHER_EMAIL_REGEX = "^[^@]{2,}@teacher\\.testschool\\.org$";
    });
    test("student no escalation", () => {
        expect((0, escalateRoles_1.passAsTeacher)(student)).toBe(false);
    });
    test("external no escalation", () => {
        expect((0, escalateRoles_1.passAsTeacher)(external)).toBe(false);
    });
    test("teacher1 no escalation", () => {
        expect((0, escalateRoles_1.passAsTeacher)(teacherNoEscalate)).toBe(false);
    });
    test("teacher2 escalation", () => {
        expect((0, escalateRoles_1.passAsTeacher)(teacherEscalate)).toBe(true);
    });
    test("teacher3 escalation", () => {
        expect((0, escalateRoles_1.passAsTeacher)(teacherEscalateSuper)).toBe(true);
    });
});
describe("escalation firstname", () => {
    beforeEach(() => {
        process.env.ENABLE_AUTO_ROLE_TEACHER = "true";
        process.env.TEACHER_FIRST_NAME_REGEX = "^123(?:KU|TE|KA)GY\\s.+$";
    });
    test("student no escalation", () => {
        expect((0, escalateRoles_1.passAsTeacher)(student)).toBe(false);
    });
    test("external escalation", () => {
        expect((0, escalateRoles_1.passAsTeacher)(external)).toBe(true);
    });
    test("teacher1 no escalation", () => {
        expect((0, escalateRoles_1.passAsTeacher)(teacherNoEscalate)).toBe(false);
    });
    test("teacher2 escalation", () => {
        expect((0, escalateRoles_1.passAsTeacher)(teacherEscalate)).toBe(true);
    });
    test("teacher3 no escalation", () => {
        expect((0, escalateRoles_1.passAsTeacher)(teacherEscalateSuper)).toBe(false);
    });
});
describe("escalation lastname", () => {
    beforeEach(() => {
        process.env.ENABLE_AUTO_ROLE_TEACHER = "true";
        process.env.TEACHER_LAST_NAME_REGEX = "^.+\\s123(?:KU|TE|KA)GY$";
    });
    test("student no escalation", () => {
        expect((0, escalateRoles_1.passAsTeacher)(student)).toBe(false);
    });
    test("external escalation", () => {
        expect((0, escalateRoles_1.passAsTeacher)(external)).toBe(true);
    });
    test("teacher1 no escalation", () => {
        expect((0, escalateRoles_1.passAsTeacher)(teacherNoEscalate)).toBe(false);
    });
    test("teacher2 escalation", () => {
        expect((0, escalateRoles_1.passAsTeacher)(teacherEscalate)).toBe(true);
    });
    test("teacher3 escalation", () => {
        expect((0, escalateRoles_1.passAsTeacher)(teacherEscalateSuper)).toBe(true);
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
        expect((0, escalateRoles_1.passAsTeacher)(student)).toBe(false);
    });
    test("external no escalation", () => {
        expect((0, escalateRoles_1.passAsTeacher)(external)).toBe(false);
    });
    test("teacher1 no escalation", () => {
        expect((0, escalateRoles_1.passAsTeacher)(teacherNoEscalate)).toBe(false);
    });
    test("teacher2 escalation", () => {
        expect((0, escalateRoles_1.passAsTeacher)(teacherEscalate)).toBe(true);
    });
    test("teacher3  no escalation", () => {
        expect((0, escalateRoles_1.passAsTeacher)(teacherEscalateSuper)).toBe(false);
    });
});
describe("super admin escalation", () => {
    test("super escalation off", () => {
        process.env.SUPER_ADMIN_EMAIL_REGEX =
            "teacher123super@teacher.testschool.org";
        expect((0, escalateRoles_1.passAsSuperAdmin)(teacherEscalateSuper)).toBe(false);
        expect((0, escalateRoles_1.passAsSuperAdmin)(teacherEscalate)).toBe(false);
        expect((0, escalateRoles_1.passAsSuperAdmin)(teacherNoEscalate)).toBe(false);
        expect((0, escalateRoles_1.passAsSuperAdmin)(student)).toBe(false);
    });
    test("super escalation on", () => {
        process.env.SUPER_ADMIN_EMAIL_REGEX =
            "teacher123super@teacher.testschool.org";
        process.env.ENABLE_AUTO_ROLE_SUPER_ADMIN = "true";
        expect((0, escalateRoles_1.passAsSuperAdmin)(teacherEscalateSuper)).toBe(true);
        expect((0, escalateRoles_1.passAsSuperAdmin)(teacherEscalate)).toBe(false);
        expect((0, escalateRoles_1.passAsSuperAdmin)(teacherNoEscalate)).toBe(false);
        expect((0, escalateRoles_1.passAsSuperAdmin)(student)).toBe(false);
    });
});
//# sourceMappingURL=escalateRoles.test.js.map