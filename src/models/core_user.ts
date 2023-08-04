import {
  Model, DataTypes, Sequelize,
  QueryTypes, InitOptions
} from "sequelize";
import { Role } from "./core_role";
import { Picture } from "./core_picture";
import { rolesAvailableKeys } from "./core_role";
import {
  comparePasswordHash,
  hashPasswordSync
} from "../helpers/password";
import { Organization } from "./core_organization";
import { UserError } from "../helpers/errorHelpers";

const nameValidator = (fld?:string)=>{
  return {
    args: /^[^\s].*\S+$/,
    msg: `Not a valid ${fld || "name"}`
  }
};

const passwdValidator = (cleartext?:string) => {
  if (!cleartext) return;
  if (typeof cleartext !== 'string') {
    throw new UserError('Password must be a string')
  } else if (cleartext.length < 8) {
    throw new UserError('Password to short');
  } else if (cleartext.toLowerCase() === cleartext) {
    throw new UserError('Password must have mixed UPPER and lower case');
  } else if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(cleartext)) {
    // special chars
    throw new UserError('Password must contain special chars');
  }
}

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
    const myRoles = await this.getRoles();
    const res = myRoles.map((n: Role)=>rolesAvailableKeys[n.role]);
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
      'SELECT domain FROM core_Organization WHERE id=?'
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
        validate:{ is: nameValidator("userName") }
      },
      firstName:{
        type: DataTypes.STRING,
        allowNull: false,
        validate: { is: nameValidator("firstName") }
      },
      lastName:{
        type: DataTypes.STRING,
        allowNull: false,
        validate: {is: nameValidator("lastName") }
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
          passwdValidator(cleartext);
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
        ...options.hooks,
        /*async afterCreate(user: User, options: CreateOptions<any>) {
          // create a default role for new users
          await Role.create({
            userId: user.id,
            role: eRolesAvailable.student
          }, options);
        }*/
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
