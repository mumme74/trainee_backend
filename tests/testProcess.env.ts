import dotenv from "dotenv";
dotenv.config({ path: `.env.test` }); // must be done before any other imports


process.env.APP_NAME = "testing app";

process.env.JWT_AUTH_SECRET = "ThisIsASecretKey";
process.env.GOOGLE_CLIENT_ID = "1234567890abcdefghijklmnop";

process.env.ENABLE_AUTO_ROLE_TEACHER = "";
process.env.AUTO_ROLE_REQUIRE_GOOGLE_ID = "";
process.env.TEACHER_EMAIL_REGEX = "";
process.env.TEACHER_FIRST_NAME_REGEX = "";
process.env.TEACHER_LAST_NAME_REGEX = "";
process.env.TEACHER_DOMAIN_REGEX = "";
process.env.ENABLE_AUTO_ROLE_SUPER_ADMIN = "";
process.env.SUPER_ADMIN_EMAIL_REGEX = "";