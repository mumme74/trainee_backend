import { Model, DataTypes, Sequelize, InitOptions } from "sequelize";
import { registerDbModel } from "./index";

/// stores oath login specific stuff

export class OAuth extends Model {
  declare id: number;
  declare userId: number;
  declare provider: string;
  declare idString: string;
  declare createdAt: Date;
  declare updatedAt: Date;

  // run once
  static async bootstrap(options: InitOptions) {

    const roleModel = OAuth.init({
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      userId:{
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      provider:{
        type: DataTypes.ENUM,
        values: ["google"]
      },
      idString:{
        type: DataTypes.STRING,
        allowNull: false,
      }
    }, options);
  }

  static async bootstrapAfterHook(sequelize: Sequelize) {
    const userModel = sequelize.models.core_Users;

    OAuth.belongsTo(userModel, {
      foreignKey: 'userId',
      onDelete: 'CASCADE', // delete when users is deleted
      onUpdate: 'CASCADE',
    });
  }
}

registerDbModel(OAuth, 'Core');
