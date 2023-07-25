import { Model, DataTypes, Sequelize } from "sequelize";

/// stores oath login specific stuff

export class OAuth extends Model {
  declare id: number;
  declare userId: number;
  declare provider: string;
  declare idString: string;
  declare createdAt: Date;
  declare updatedAt: Date;

  // run once
  static bootstrap(sequelize: Sequelize) {

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
    },{
      modelName:'core_OAuths',
      sequelize,
    });
  }

  static bootstrapAfterHook(sequelize: Sequelize) {
    const userModel = sequelize.models.core_Users;
    userModel.hasMany(OAuth, {
      onDelete: 'CASCADE', // delete when users is deleted
      onUpdate: 'CASCADE',
      foreignKey: 'userId',
    });
    OAuth.belongsTo(userModel, {
      foreignKey: 'userId'
    });
  }
}
