import { Sequelize } from "sequelize";

import { Picture } from "./picture";
import { Role } from "./role";
import { User } from "./user";
import { OAuth } from "./oauth";
import { Organization } from "./organization";
import { Group } from "./group";
import { GroupTeacher } from "./groupTeacher";
import { GroupStudent } from "./groupStudent";


/**
 * Initializes db and the models
 *
 * Reads from .env.production or .env.dev file
 * Builds the connectionsString to sequelize and
 * calls defineDb
 * @returns {Sequelize} The sequelize singleton
 */
export async function initDb() {
  const dbHost = process.env.DB_HOST || "localhost";
  const dbUser = process.env.DB_USER;
  const dbPass = process.env.DB_PASS;
  const dbPort = process.env.DB_PORT || 3306;
  const dbName = process.env.DB_NAME||"";

  const connectionString = `mysql://${dbUser}:${dbPass}@${dbHost}:${dbPort}/${dbName}`;
  return await defineDb(connectionString, {
    logging: process.env.NODE_ENV !== 'production'
  });
}

/**
 * Creates Sequelize and defines the models
 * @param {string} connectionString  Connection string to Sequelize
 * @returns {Sequelize} The sequelize singleton
 */
export async function defineDb(
  connectionString: string,
  opt: {[key:string]:any} = {}
) {

  const sequelize = new Sequelize(connectionString, opt);

  // all models in application, initialize in this order
  const modelClasses = [
    Picture, Role, User, OAuth, Organization,
    Group, GroupStudent, GroupTeacher
  ];

  // TODO plugins here

  // init models
  for (const model of modelClasses)
    model.bootstrap(sequelize);

  // set up associations
  for (const model of modelClasses)
    model.bootstrapAfterHook(sequelize);

  await sequelize.sync();

  console.log('Started database');
  return sequelize
}


