import { defineDb } from "../src/models";
import { Sequelize } from "sequelize";

import "./testProcess.env";

let connections = 0;
let sequelize: Sequelize | undefined;

export async function initTestDb() {
  if (connections++ === 0) {
    sequelize = await defineDb("sqlite::memory",{logging:false});
  }
}

export async function closeTestDb() {
  if (--connections === 0) {
    await sequelize?.close();
    sequelize = undefined;
  }
}
