import { defineDb } from "../src/models";
import { Sequelize } from "sequelize";

import "./testProcess.env";

let connections = 0;
let sequelize: Sequelize | undefined;

export async function initTestDb(
  force:boolean = false, logging:boolean = false
) {
  if (connections++ === 0 || force) {
    sequelize = await defineDb("sqlite::memory", {
      logging,
      sync:{force:true, alter:false}
    });
  }
}

export async function closeTestDb(force:boolean = false) {
  if (force || (connections > 0 && --connections === 0)) {
    await sequelize?.close();
    sequelize = undefined;
    if (force) connections = 0;
  }
}
