import { regexp } from "sequelize/types/lib/operators";
import { IUserCollection } from "../models/user"


export const passAsTeacher = (user: IUserCollection):boolean => {
    let matchCnt = 0, regexCnt = 0;
    function match(regexStr: string, input: string): void {
        try {
            if (regexStr) {
                ++regexCnt;
                if ((new RegExp(regexStr)).test(input))
                    ++matchCnt
            }
        } catch (e) { /*squelsh*/ }
    }

    if (process.env.ENABLE_AUTO_ROLE_TEACHER !== "true") {
        return false;
    }

    if (user.google.id && user.domain) {
        // match against env variable regex
        match(process.env.TEACHER_EMAIL_REGEX + "", user.email);
        match(process.env.TEACHER_FIRST_NAME_REGEX + "", user.firstName);
        match(process.env.TEACHER_LAST_NAME_REGEX + "", user.lastName);
        match(process.env.TEACHER_HD_REGEX + "", user.domain)
    }

    return matchCnt > 0 && matchCnt === regexCnt;
}

/**
 * @brief makes it possible to set a specific user as a super upon registration
 *        Must set value in the environment variable to app server.
 * @param user user to check against
 * @returns true if user matches 
 */
export const passAsSuperAdmin = (user: IUserCollection): boolean => {
    if (process.env.ENABLE_AUTO_ROLE_SUPER_ADMIN !== "true") {
        return false;
    }

    return (new RegExp(process.env.SUPER_ADMIN_EMAIL_REGEX+"")).test(user.email);
}