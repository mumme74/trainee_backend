import * as plugin from '../../../../../src/plugin/types';

export class DbModelTwo extends plugin.Model {
  declare id:  number;
  declare userId: number;
  declare desc: string

  static async bootstrap(
    options: plugin.InitOptions<plugin.Model<any, any>>
  ):
    Promise<void>
  {
    const dbModelTwo = DbModelTwo.init({
      id:{
        type: plugin.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      userId: {
        type: plugin.DataTypes.INTEGER
      },
      desc2: {
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
          dbModelTwo = sequelize.models.tstDb_DbModelTwos;

    dbModelTwo.belongsTo(userModel, {
      foreignKey:'userId',
      onDelete: 'CASCADE'
    });
  }
}
