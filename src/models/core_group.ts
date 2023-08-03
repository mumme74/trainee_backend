import { Model, DataTypes, Sequelize, InitOptions } from "sequelize";

/// stores a group such as a class

export class Group extends Model {
  declare id: number;
  declare ownerId: number;
  declare name: string;
  declare description?: string;
  declare updatedBy: number;
  declare createdAt: Date;
  declare updatedAt: Date;

  // run once
  static async bootstrap(options: InitOptions) {

    const roleModel = Group.init({
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      ownerId: {
        type: DataTypes.INTEGER,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          is: {
            args: /^[^\s\d][\S ]+$/,
            msg: 'Not a valid name'
          }
        }
      },
      description: {
        type: DataTypes.TEXT
      },
      updatedBy: {
        type: DataTypes.INTEGER
      }
    }, options);
  }

  static async bootstrapAfterHook(sequelize: Sequelize) {
    const groupModel = sequelize.models.core_Groups,
          userModel  = sequelize.models.core_Users;

    groupModel.belongsTo(userModel, {
      foreignKey: 'ownerId',
      onDelete: 'SET NULL',
    });
  }
}
