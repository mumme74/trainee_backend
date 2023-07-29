import {
  Model, DataTypes, Sequelize,
  CreateOptions, QueryTypes, InitOptions
} from "sequelize";
import { registerDbModel } from "./index";
import { Role, eRolesAvailable } from "./core_role";
import { Picture } from "./core_picture";
import { rolesAvailableKeys } from "./core_role";
import {
  comparePasswordHash,
  hashPasswordSync
} from "../helpers/password";
import { Organization } from "./core_organization";

const nameValidator = {
  args: /^[^\s].*\S+$/,
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
    const myroles = await this.getRoles();
    const res = myroles.map((n: Role)=>rolesAvailableKeys[n.role]);
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
    if (!this.organizationId) return null;
    const res = await this.sequelize.query(
      'SELECT domain FROM core_Organiztion WHERE id=?'
      , {
        replacements: [this.organizationId],
        type: QueryTypes.SELECT
      }) as {domain:string}[];
    return res ? res[0].domain : null;
  }

  async getRoles(): Promise<Role[]> {
    return (await Role.findAll({where:{userId:this.id}})) || [];
  }
  getPicture(): Promise<Picture|null> {
    return Picture.findByPk(this.pictureId);
  }
  getOrganization(): Promise<Organization|null> {
    return Organization.findByPk(this.organizationId);
  }

  // run once
  static async bootstrap(options: InitOptions) {


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
        set(cleartext: string) {
          if (!cleartext) return;
          try {
            const hash = hashPasswordSync(cleartext);
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
      ...options,
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

  static async bootstrapAfterHook(sequelize: Sequelize) {
    // set constraints

    const pictureModel = sequelize.models.core_Pictures,
          userModel = sequelize.models.core_Users,
          organizationModel = sequelize.models.core_Organizations;

    // the avatar image
    userModel.belongsTo(pictureModel, {
      foreignKey:'pictureId',
      onDelete: 'SET NULL'
    });

    // the organization
    userModel.belongsTo(organizationModel, {
      foreignKey: 'organizationId',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    })
  }
}

registerDbModel(User, 'Core');
