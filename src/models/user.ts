import {
  Model, DataTypes, Sequelize,
  CreateOptions, QueryTypes
} from "sequelize";
import { Role, eRolesAvailable } from "./role";
import { Picture } from "./picture";
import { rolesAvailableKeys } from "./role";
import { comparePasswordHash, hashPassword } from "../helpers/password";
import { Organization } from "./organization";

const nameValidator = {
  args: /^[^\s\d]\S+$/,
  msg: 'Not a valid name'
};

export class User extends Model {
  declare id: number;
  declare userName: string;
  declare firstName: string;
  declare lastName: string;
  declare email: string;
  declare password: string | null;
  declare pictureId: number;
  declare organizationId: number;
  declare updatedBy: number;
  declare banned: boolean;
  declare lastLogin: Date;
  declare readonly updatedAt: Date;
  declare readonly createdAt: Date;

  // virtual functions
  async roles(): Promise<string[]> {
    const myroles = await this.getRoles()
    const res = await myroles.map((n: Role)=>rolesAvailableKeys[n.role]);
    return res;
  }
  fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
  async isValidPassword(cleartext: string): Promise<boolean> {
    if (this.password)
      return await comparePasswordHash(cleartext, this.password);
    return !cleartext;
  }
  async domain(): Promise<string|null>  {
    const res = await this.sequelize.query(
      'SELECT domain FROM core_Organiztion WHERE id=?'
      , {
        replacements: [this.organizationId],
        type: QueryTypes.SELECT
      }) as {domain:string}[];
    return res ? res[0].domain : null;
  }
  //declare organizations: string;


  declare getRoles: ()=>Promise<Role[]>;
  declare getPicture: ()=>Promise<Picture|null>;
  declare getOrganization: ()=>Promise<Organization|null>;

  // run once
  static bootstrap(sequelize: Sequelize) {


    const userModel = User.init({
      id:{
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      userName:{
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate:{ is: nameValidator }
      },
      firstName:{
        type: DataTypes.STRING,
        allowNull: false,
        validate: { is: nameValidator }
      },
      lastName:{
        type: DataTypes.STRING,
        allowNull: false,
        validate: {is: nameValidator }
      },
      email:{
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true }
      },
      password:{
        type: DataTypes.STRING,
        async set(cleartext: string) {
          if (!cleartext) return;
          try {
            const hash = await hashPassword(cleartext);
            this.setDataValue('password', hash);
          } catch(err){
            console.error(err);
          }
        }
      },
      pictureId: {
        type: DataTypes.INTEGER
      },
      updatedBy:{
        type: DataTypes.INTEGER
      },
      banned:{
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      lastLogin:{
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
    },{
      sequelize,
      modelName: 'core_Users',
      paranoid: true, // recoverable delete
      hooks: {
        async afterCreate(user: User, options: CreateOptions<any>) {
          // create a default role for new users
          const defaultŔole = Role.build({
            userId: user.id,
            role: eRolesAvailable.student
          });
          await defaultŔole.save();
        }
      }
    });
  }

  static bootstrapAfterHook(sequelize: Sequelize) {
    // set constraints

    const roleModel = sequelize.models.core_Roles,
          pictureModel = sequelize.models.core_Pictures,
          userModel = sequelize.models.core_Users,
          organizationModel = sequelize.models.core_Organizations;

    // user can have many roles
    userModel.hasMany(roleModel);
    roleModel.belongsTo(userModel, {
      foreignKey: {
        allowNull: false,
        name: "userId"
      }
    });

    // the avatar image
    userModel.hasOne(pictureModel, {
      foreignKey: "pictureId",
    });
    userModel.belongsTo(pictureModel, {
      foreignKey:'pictureId',
      onDelete: 'SET NULL'
    });

    // the organization
    organizationModel.hasMany(userModel, {
      foreignKey: 'organizationId',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    })
    userModel.belongsTo(organizationModel, {
      foreignKey: 'organizationId',
    })
  }
}