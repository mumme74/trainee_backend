import { Model, DataTypes, Sequelize } from "sequelize";
import { Picture } from "./picture";

export class Organization extends Model {
  declare id: number;
  declare name: string;
  declare domain: string;
  declare pictureId: number;
  declare description: string;
  declare updatedBy: number;
  declare createdAt: Date;
  declare updatedAt: Date;

  // virtual functions
  declare getPicture: ()=>Promise<Picture>;

  // run once
  static bootstrap(sequelize: Sequelize) {

    const roleModel = Organization.init({
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name:{
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
        is: {args:/^\S{2,}.*\S$/, msg: 'Invalid organization name'}
        }
      },
      domain:{
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          is: {
            args:[
              // validate domain
              '^(((?!-))(xn--|_)?[a-z0-9-]{0,61}[a-z0-9]{1,1}\.)*'+
              '(xn--)?([a-z0-9][a-z0-9\-]{0,60}|[a-z0-9-]{1,30}\.'+
              '[a-z]{2,})$'
            ],
            msg: "Invalid domain name"
          }
        }
      },
      pictureId: {
        type: DataTypes.INTEGER,
      },
      description: {
        type: DataTypes.TEXT,
      },
      updatedBy: {
        type: DataTypes.INTEGER
      }
    },{
      modelName: 'core_Organizations',
      paranoid: true,
      sequelize
    });
  }

  static bootstrapAfterHook(sequelize: Sequelize) {
    const organizationModel = sequelize.models.core_Organizations,
          pictureModel = sequelize.models.core_Pictures,
          userModel = sequelize.models.core_Users;

    organizationModel.belongsTo(pictureModel, {
      onDelete: 'CASCADE',
      foreignKey: 'pictureId'
    });

    organizationModel.belongsTo(userModel, {
      foreignKey: 'updatedBy',
      onDelete: 'SET NULL'
    })
  }
}

export const fetchOrganizationNr = async (domain:string) => {
  const org = await Organization.findOne({where:{domain}});
  return org?.id;
}