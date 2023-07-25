import { Model, DataTypes, Sequelize } from "sequelize";

/**
 * @brief these are the 4 different roles a user can have
 */
export enum eRolesAvailable {
  "student" = 0,
  "teacher" = 1,
  "admin" = 2,
  "super" = 3,
}

const roleNrs: number[] = [],
      roleStrs: string[] = [];
Object.keys(eRolesAvailable).forEach((key) => {
  isNaN(+key) ?
    roleStrs.push(key) :
      roleNrs.push(+key);
});
export const rolesAvailableKeys = roleStrs;
export const rolesAvailableNrs = roleNrs;

export class Role extends Model {
  declare id: number;
  declare userId: number;
  declare role: number;
  declare createdAt: Date;


  // run once
  static bootstrap(sequelize: Sequelize) {

    const roleModel = Role.init({
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      userId: {
        type: DataTypes.INTEGER,
      },
      role: {
        type:DataTypes.TINYINT,
        allowNull:false,
        validate:{
          min: roleNrs[0],
          max: roleNrs[roleNrs.length-1]
        }
      }
    },{
      sequelize,
      modelName: "core_Roles",
      timestamps: true,
      updatedAt: false
    });
  }

  static bootstrapAfterHook(sequelize: Sequelize) {}
}