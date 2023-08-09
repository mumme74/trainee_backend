import { Sequelize, DataTypes, Model, InitOptions } from "sequelize";

/**
 * Used to make refresh tokens invalid
 * All entries here invalidates all JWT tokens issued before
 * the dateTime given in this model.
 * The very first entry here is used as a global invalidate dateTime
 */

export class InvalidateToken extends Model {
  declare id: number;
  declare userId: number;
  declare minimumIat: Date;

  static async bootstrap(options: InitOptions) {

    const invalidTokens = InvalidateToken.init({
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
      }
    }, {
        ...options,
        timestamps: true,
        updatedAt: false,
        createdAt: 'minimumIat',
    });
  }

  static async bootstrapAfterHook(sequelize: Sequelize) {
    const userModel = sequelize.models.core_Users,
          invToken = sequelize.models.core_InvalidateTokens;

    userModel.hasOne(invToken, {
      foreignKey: 'userId',
      onDelete: 'CASCADE'
    })
    invToken.belongsTo(userModel, {
      foreignKey: 'userId',
      onDelete: 'CASCADE'
    })
  }
}
