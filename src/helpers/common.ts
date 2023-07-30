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

const getSettingsPath = () => {
  const home = process.env.HOME || process.env.USERPROFILE,
        appName = process.env.APP_NAME;
  return path.join(home+"", "."+appName)
}

export async function getUserSetting(key:string) {
  const filePath = getSettingsPath();
  let str = "{}";
  try {
    str = await fsAwait.readFile(filePath) + "";
  } catch {}
  const json = JSON.parse(str);
  return json[key];
}

export async function setUserSetting(key:string, value: any) {
  const filePath = getSettingsPath();
  let str = "{}";
  try {
    str = await fsAwait.readFile(filePath) + "";
  } catch {}
  const json = JSON.parse(str);
  json[key] = value;
  await fsAwait.writeFile(getSettingsPath(), JSON.stringify(json));
}