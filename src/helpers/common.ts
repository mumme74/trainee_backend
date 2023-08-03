import path from "node:path";
import * as fsAwait from "node:fs/promises";

/**
 * Gets the classname cls
 * @param {object} cls The class to get name from
 * @returns {string} The defined name in JS code
 */
export const getClassName = (cls: object) => {
  const name = cls.constructor.name;
  return name !== 'Function' ? name :
    cls.toString().match(/^class\s+([a-z_0-9]+)/i)?.at(1) || ""
}

const getSettingsPath = (): string => {
  const home = process.env.HOME || process.env.USERPROFILE,
        appName = (""+process.env.APP_NAME).replace(/\s{1}/g, '_');
  return path.join(home+"", "."+appName)
}

const getJsonFromFile = async (file:string) => {
  let str:string;
  try {
    str = await fsAwait.readFile(file) + "";
  } catch(e) {
    str = "{}"
  }
  return JSON.parse(str);
}

/**
 * Gets a setting from persistent store in $HOME/.trainee
 * @param {string} key The setting to look for
 * @returns {any} The value found or notFoundValue
 */
export async function getUserSetting(key:string, notFoundValue: any = undefined) {
  const filePath = getSettingsPath();
  const json = await getJsonFromFile(filePath);
  return json[key] === undefined ? notFoundValue : json[key];
}

/**
 * Set a setting to persistent store in $HOME/.trainee
 * @param {string} key The key for this setting
 * @param {any} value The value to save
 */
export async function setUserSetting(key:string, value: any) {
  const filePath = getSettingsPath();
  const json = await getJsonFromFile(filePath);
  json[key] = value;
  await fsAwait.writeFile(getSettingsPath(), JSON.stringify(json));
}

/**
 * Convert a base64 string to Uint8Array
 * @param {string} base64 The value to convert to bytes
 * @returns {Uint8Array} The bytes from base64 string
 */
export function base64ToBytes(base64:string):
  Uint8Array
{
  const cb = (m:string) =>
    m.codePointAt(0) || 0;
  const binString = atob(base64);
  return Uint8Array.from(binString, cb);
}

/**
 * Convert a Uint8Array to a base64 string
 * @param {Uint8Array} bytes The bytes to convert
 * @returns {string} The base64 encoded string
 */
export function bytesToBase64(bytes:Uint8Array):
  string
{
  const binString = Array.from(bytes, (x) => String.fromCodePoint(x)).join("");
  return btoa(binString);
}

/**
 * Get the Root dir for this project
 * @returns {string} Absolute path to project root
 *
 * `ie: [root]/
 *
 *           src/..
 *
 *           tests/..
 *
 *           package.json
 * `
 */
export const getRootPath = (): string => {
  return path.resolve('./').replace(/\/build\/?/, '/')
}
