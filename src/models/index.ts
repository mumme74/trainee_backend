import { Sequelize } from "sequelize";

import { Picture } from "./picture";
import { Role } from "./role";
import { User } from "./user";
import { OAuth } from "./oauth";
import { Organization } from "./organization";
import { Group } from "./group";
import { GroupTeacher } from "./groupTeacher";
import { GroupStudent } from "./groupStudent";

export async function initDb() {
  const dbHost = process.env.DB_HOST || "localhost";
  const dbUser = process.env.DB_USER;
  const dbPass = process.env.DB_PASS;
  const dbPort = process.env.DB_PORT || 3306;
  const dbName = process.env.DB_NAME||"";

  const connectionString = `mysql://${dbUser}:${dbPass}@${dbHost}:${dbPort}/${dbName}`;

  const sequelize = new Sequelize(connectionString);

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
}


