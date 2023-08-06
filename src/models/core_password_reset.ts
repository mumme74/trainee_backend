import {
  Model,
  DataTypes,
  Sequelize,
  InitOptions,
} from "sequelize";
import { hashPasswordSync } from "../helpers/password";

/**
 * Stores Tokens for password resets
 * When a user requests as pw reset, we generate a token
 * We later match this token to the hash of that
 * token we have stored here.
 */
export class PasswordReset extends Model {
  declare id: number;
  declare userId: number;
  declare resetToken: string;
  declare createdAt: Date;

  static async bootstrap(options: InitOptions) {
    const loginModel = PasswordReset.init({
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      resetToken: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len:[32,255]
        },
        set(token: string) {
          this.setDataValue('resetToken', hashPasswordSync(token))
        }
      },
      createdAt: {
        type: DataTypes.DATE
      }
    }, {
      ...options,
      timestamps: true,
      updatedAt: false
    });
  }

  static async bootstrapAfterHook(sequelize: Sequelize) {
    const userModel = sequelize.models.core_Users,
          pwResetModel = sequelize.models.core_PasswordResets;

    pwResetModel.belongsTo(userModel, {
      foreignKey: 'userId',
      onDelete: 'CASCADE'
    });

    pwResetModel.afterSync('createCleanupEvent', async ()=>{
      await createCleanupEvent(sequelize)
    })
  }
}

async function createCleanupEvent(sequelize: Sequelize) {
  // in testing we don't create a cleanup event
  if (sequelize.getDialect().startsWith('mysql')) {
    await sequelize.query(`DROP EVENT IF EXISTS core_event_PasswordResetCleanup;`);
    await sequelize.query(`
      CREATE EVENT core_event_PasswordResetCleanup
        ON SCHEDULE EVERY 5 MINUTE
        COMMENT 'Clean up password reset requests every 5 minutes'
        DO DELETE FROM core_PasswordResets
           WHERE createdAt < DATE_SUB(NOW(), INTERVAL 1 HOUR);
    `);
  }
}