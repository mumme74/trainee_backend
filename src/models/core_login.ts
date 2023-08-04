import {
  Model,
  DataTypes,
  Sequelize,
  InitOptions,
  SyncOptions
} from "sequelize";

/**
 * The state of the login record
 */
export enum eLoginState {
  PasswdLoginOk = 0,
  UserNotFound = 1,
  UserBanned = 2,
  WrongPassword = 3,
  LoginSpam = 4,
  OAuthLoginOk = 10,
  OAuthRejected = 11,
  OAuthFailedConnect = 12,
  OAuthFailAud = 13,
  OAuthTokenExpired = 14,
  OAuthWrongClientId = 15,
};

/**
 * Stores Login attempts for a specific user
 *
 * - Which method it used
 *
 * - If it was successful
 *
 * - Date time it happened
 */
export class Login extends Model {
  constructor(arg1:any = {}, arg2:any = {}) {
    super(arg1, arg2);
  }

  declare id: number;
  declare userId: number;
  declare oauthId: number;
  declare state: eLoginState;
  declare createdAt: Date;

  static async bootstrap(options: InitOptions) {
    const loginModel = Login.init({
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      oauthId: {
        type: DataTypes.INTEGER,
        allowNull: true, // true indicates login via password
      },
      state: {
        type: DataTypes.TINYINT,
        allowNull: false,
        get(){
          return this.getDataValue('state') as eLoginState;
        },
        set(value: eLoginState){
          this.setDataValue('state', value);
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
          loginModel = sequelize.models.core_Logins,
          oauthModel = sequelize.models.core_OAuths;

    loginModel.belongsTo(userModel, {
      foreignKey: 'userId',
      onDelete: 'CASCADE'
    });

    loginModel.belongsTo(oauthModel, {
      foreignKey: 'oauthId',
      onDelete: 'CASCADE'
    });

    loginModel.afterSync('createCleanupEvent', async ()=>{
      await createCleanupEvent(sequelize)
    })
  }
}

async function createCleanupEvent(sequelize: Sequelize) {
  // in testing we don't create a cleanup event
  if (sequelize.getDialect().startsWith('mysql')) {
    await sequelize.query(`DROP EVENT IF EXISTS core_event_LoginCleanup;`);
    await sequelize.query(`
      CREATE EVENT core_event_LoginCleanup
        ON SCHEDULE EVERY 1 DAY
        COMMENT 'Clean up Login attempts automatically every day'
        DO DELETE FROM core_Login
           WHERE createdAt < DATE_SUB(NOW(), INTERVAL 1 YEAR);
    `);
  }
}