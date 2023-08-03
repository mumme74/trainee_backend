import { Model, DataTypes, Sequelize, InitOptions } from "sequelize";

/**
 * Stores teachers connected to a group (group such as a class)
 * Acts as a array of teacher to this group
 */
export class GroupTeacher extends Model {
  declare id: number;
  declare teacherId: number;
  declare groupId: number;
  declare createdBy: number;
  declare createdAt: Date;

  // run once
  static async bootstrap(options: InitOptions) {

    const roleModel = GroupTeacher.init({
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      teacherId: {
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
          teacherModel = sequelize.models.core_GroupTeachers;

    teacherModel.belongsTo(userModel, {
      foreignKey: 'createdBy',
      onDelete: 'NO ACTION'
    });

    teacherModel.belongsTo(userModel, {
      foreignKey: 'teacherId',
      onDelete: 'CASCADE'
    });

    teacherModel.belongsTo(groupModel, {
      foreignKey: 'groupId',
      onDelete: 'CASCADE'
    })
  }
}
