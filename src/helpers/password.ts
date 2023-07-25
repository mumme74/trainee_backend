import bcrypt from "bcrypt";
import { UserError } from "./errorHelpers";


/**
 * Generate a hash from cleartext
 * @param {string} cleartext The password to hash
 * @returns {Promise<string>} The hashed string
 * @throws Might throw a bcrypt
 */
export async function hashPassword(cleartext: string):
  Promise<string>
{
  // generate a salt
  const salt = await bcrypt.genSalt(10);
  // generate a password hash
  return await bcrypt.hash(cleartext, salt);
}

/**
 * Compare a string against encryptedStr
 * @param {string} cleartext The password given by user
 * @param {string} encryptedStr The encrypted string in db
 * @returns {Promise<boolean>} True if match, both empty gives true
 * @throws {UserError} From bcrypt if it throws
 */
export async function comparePasswordHash(
  cleartext: string,
  encryptedStr: string,
): Promise<boolean> {
  try {
    if (cleartext === "" && encryptedStr === "") return true;
    return await bcrypt.compare(cleartext, encryptedStr);
  } catch (err: any) {
    throw new UserError(err);
  }
}
