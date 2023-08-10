import { isPromise } from "util/types";
import { getSequelize } from "../models";

/**
 * Returns a date that are adjusted to UTC time
 * @param {Date | number} [date=new Date()] The date to adjust from
 * @returns {Date} the date in UTC time
 */
export const toUtcDate = (date: Date | number = new Date()) => {
  if (typeof date === 'number')
    date = new Date(date);
  return new Date(((+date) + (date.getTimezoneOffset() * 1000 * 3600)));
}

/**
 * Returns a UTC date adjusted to current time
 *
 */
export const fromUtcDate = (date: Date | number = new Date()) => {
  if (typeof date === 'number')
    date = new Date(date);
  return new Date(((+date) - (date.getTimezoneOffset() * 1000 * 3600)));
}

/**
 * Turns off Foreign keys in a transaction for all core in callback
 * It re-enables them before leaving this function.
 * @param {function} callback Run the code in this callback with
 *  foreign keys disabled
 * @returns {Promise<any>} whatever the callback returns
 */
export const withForeignKeysOff = async (callback:()=>Promise<any>) => {
    // turn of foreign ket constraint temporarily

  const sequelize = getSequelize();
  const queries = [];
  const dbDialect = sequelize.getDialect();
  switch (dbDialect) {
  case 'sqlite':
    queries.push(...['PRAGMA foreign_keys=0','PRAGMA foreign_keys=1']);
    break;
  case 'mysql': case 'mariadb':
    queries.push(...['SET foreign_key_checks=0','SET foreign_key_checks = 0']);
    break;
  default:
    throw new Error(`Using unsupported database ${dbDialect}`)
  }

  let res;
  try {
    await sequelize.query(queries[0]+';');
    res = await sequelize.transaction(callback);
  } catch(err) {
    throw err;
  } finally {
    await sequelize.query(queries[1]+';');
  }

  return isPromise(res) ? await res : res;
}