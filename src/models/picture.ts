import { Model, DataTypes, Sequelize } from "sequelize";

export class Picture extends Model {
  declare id: number;
  declare ownerId: number;
  declare blob: Buffer;
  declare mime:string;
  declare title:string;
  declare createdAt: Date;

  // run once
  static bootstrap(sequelize: Sequelize) {
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
      sequelize,
      modelName:"core_Pictures",
      timestamps: true,
      updatedAt: false
    });

  }

  static bootstrapAfterHook(sequelize: Sequelize) {
    const userModel = sequelize.models.core_Users,
          pictureModel =sequelize.models.core_Pictures;

    // user has ownership over it's pictures
    userModel.hasMany(pictureModel, {
      foreignKey: 'ownerId',
      onDelete: 'CASCADE',
    });
    pictureModel.belongsTo(userModel, {
      foreignKey: 'ownerId',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
  }
}