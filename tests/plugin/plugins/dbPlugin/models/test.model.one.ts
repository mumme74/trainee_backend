import * as plugin from '../../../../../src/plugin/types';

export class DbModelOne extends plugin.Model {
  declare id:  number;
  declare userId: number;
  declare desc: string

  static async bootstrap(
    options: plugin.InitOptions<plugin.Model<any, any>>
  ):
    Promise<void>
  {
    const dbModelOne = DbModelOne.init({
      id:{
        type: plugin.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      userId: {
        type: plugin.DataTypes.INTEGER
      },
      desc: {
        type: plugin.DataTypes.STRING
      }
    }, options);
  }

  static async bootstrapAfterHook(
    sequelize: plugin.Sequelize
  ):
    Promise<void>
  {
    const userModel = sequelize.models.core_Users,
          dbModelOne = sequelize.models.tstDb_DbModelOnes;

    dbModelOne.belongsTo(userModel, {
      foreignKey:'userId',
      onDelete: 'CASCADE'
    });
  }
}
