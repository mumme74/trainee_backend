import bcrypt from "bcrypt";
import { UserError } from "./errorHelpers";

/**
 * Check if cleartext fails sufficiently strong test
 * @param {string} cleartext The password to match against
 * @returns {boolean | string} false if it passes,
 *   a string with error message if not
 */
export function passwdStrengthFail(cleartext:string) {
  if (typeof cleartext !== 'string') {
    return 'Password must be a string';
  } else if (cleartext.length < 8) {
    return 'Password is to short';
  } else if (cleartext.length > 50) {
    return 'Password is to long'
  } else if (cleartext.toLowerCase() === cleartext ||
             cleartext.toUpperCase() === cleartext)
  {
    return 'Password must have mixed UPPER and lower case';
  } else if (!/\d+/.test(cleartext)) {
    return 'Password must have a number in it'
  } else if (!/[!@#$%^&*()¤~_+\-=\[\]{};':"\\|,.<>\/?]/.test(cleartext)) {
    // special chars
    return 'Password insufficient strength.\nMust contain special chars';
  }
}

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
 * Generate a hash from cleartext
 * @param {string} cleartext The password to hash
 * @returns {Promise<string>} The hashed string
 * @throws Might throw a bcrypt
 */
export function hashPasswordSync(cleartext: string): string
{
  // generate a salt
  const salt = bcrypt.genSaltSync(10);
  // generate a password hash
  return bcrypt.hashSync(cleartext, salt);
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
