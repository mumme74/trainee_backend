import { Model, DataTypes, Sequelize, InitOptions } from "sequelize";
import { registerDbModel } from "./index";

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
  static async bootstrap(options: InitOptions) {

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
      ...options,
      timestamps: true,
      updatedAt: false
    });
  }

  static async bootstrapAfterHook(sequelize: Sequelize) {
    const userModel = sequelize.models.core_Users,
          roleModel = sequelize.models.core_Roles;

    // user can have many roles
    roleModel.belongsTo(userModel, {
      foreignKey: "userId",
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
  }
}

registerDbModel(Role, 'Core');