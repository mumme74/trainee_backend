import { User } from "../models/user";

export const passAsTeacher = async (user: User):
  Promise<boolean> =>
{
  let matchCnt = 0,
    regexCnt = 0;
  function match(regexStr: string, input: string): void {
    try {
      if (regexStr) {
        ++regexCnt;
        if (new RegExp(regexStr).test(input)) ++matchCnt;
      }
    } catch (e) { /*squelsh*/ }
  }

  if (
    process.env.ENABLE_AUTO_ROLE_TEACHER !== "true" ||
    (process.env.AUTO_ROLE_REQUIRE_GOOGLE_ID)
  ) {
    return false;
  }

  // to auto escalate, we must be part of a domain
  const organization = await user.getOrganization()
  if (organization?.domain) {
    // match against env variable regex
    if (process.env.TEACHER_EMAIL_REGEX)
      match(process.env.TEACHER_EMAIL_REGEX, user.email);
    if (process.env.TEACHER_FIRST_NAME_REGEX)
      match(process.env.TEACHER_FIRST_NAME_REGEX, user.firstName);
    if (process.env.TEACHER_LAST_NAME_REGEX)
      match(process.env.TEACHER_LAST_NAME_REGEX, user.lastName);
    if (process.env.TEACHER_DOMAIN_REGEX)
      match(process.env.TEACHER_DOMAIN_REGEX, organization.domain);
  }

  return matchCnt > 0 && matchCnt === regexCnt;
};

/**
 * @brief makes it possible to set a specific user as a super upon registration
 *        Must set value in the environment variable to app server.
 * @param user user to check against
 * @returns true if user matches
 */
export const passAsSuperAdmin = (user: User): boolean => {
  if (process.env.ENABLE_AUTO_ROLE_SUPER_ADMIN !== "true") {
    return false;
  }

  return new RegExp(process.env.SUPER_ADMIN_EMAIL_REGEX + "").test(user.email);
};
