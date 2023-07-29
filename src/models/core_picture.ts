import { Model, DataTypes, Sequelize, InitOptions } from "sequelize";
import { registerDbModel } from "./index";

export class Picture extends Model {
  declare id: number;
  declare ownerId: number;
  declare blob: Buffer;
  declare mime:string;
  declare title:string;
  declare createdAt: Date;

  // run once
  static async bootstrap(options: InitOptions) {
    const pictureModel = Picture.init({
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      ownerId: {
        type: DataTypes.INTEGER,
      },
      blob: {
        type: DataTypes.BLOB,
        allowNull: false,
      },
      mime: {
        type: DataTypes.STRING,
        allowNull: false,
        // remote is to load a avatar image from google or other provider
        validate: { is: /^(?:image\/\S{3,}|remote)$/ }
      },
      title: {
        type: DataTypes.STRING
      }
    },{
      ...options,
      timestamps: true,
      updatedAt: false
    });

  }

  static async bootstrapAfterHook(sequelize: Sequelize) {
    const userModel = sequelize.models.core_Users,
          pictureModel =sequelize.models.core_Pictures;

    // user has ownership over it's pictures
    pictureModel.belongsTo(userModel, {
      foreignKey: 'ownerId',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
  }
}

registerDbModel(Picture, 'Core');
