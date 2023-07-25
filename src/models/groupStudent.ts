import { Model, DataTypes, Sequelize } from "sequelize";

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
  static bootstrap(sequelize: Sequelize) {

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
      modelName: 'core_GroupStudents',
      sequelize,
      timestamps: true,
      updatedAt: false, createdAt: true
    });
  }

  static bootstrapAfterHook(sequelize: Sequelize) {
    const groupModel = sequelize.models.core_Groups,
          userModel  = sequelize.models.core_Users,
          teacherModel = sequelize.models.core_GroupTeachers;

    teacherModel.belongsTo(userModel, {
      foreignKey: 'createdId',
      onDelete: 'NO ACTION'
    });

    teacherModel.belongsTo(userModel, {
      foreignKey: 'studentId',
      onDelete: 'CASCADE'
    });

    teacherModel.belongsTo(groupModel, {
      foreignKey: 'groupId',
      onDelete: 'CASCADE'
    })
  }
}