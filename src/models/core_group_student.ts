import { Model, DataTypes, Sequelize, InitOptions } from "sequelize";
import { registerDbModel } from "./index";

/**
 * Stores students connected to a group (group such as a class)
 * Acts as a array of students to this group
 */
export class GroupStudent extends Model {
  declare id: number;
  declare studentId: number;
  declare groupId: number;
  declare createdBy: number;
  declare createdAt: Date;

  // run once
  static async bootstrap(options: InitOptions) {

    const roleModel = GroupStudent.init({
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      studentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      groupId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    }, {
      ...options,
      timestamps: true,
      updatedAt: false, createdAt: true
    });
  }

  static async bootstrapAfterHook(sequelize: Sequelize) {
    const groupModel = sequelize.models.core_Groups,
          userModel  = sequelize.models.core_Users,
          studentModel = sequelize.models.core_GroupStudents;

    studentModel.belongsTo(userModel, {
      foreignKey: 'createdBy',
      onDelete: 'NO ACTION'
    });

    studentModel.belongsTo(userModel, {
      foreignKey: 'studentId',
      onDelete: 'CASCADE'
    });

    studentModel.belongsTo(groupModel, {
      foreignKey: 'groupId',
      onDelete: 'CASCADE'
    })
  }
}

registerDbModel(GroupStudent, 'Core');
