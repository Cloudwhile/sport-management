import { MigrationContext } from '../umzug.js';
import { MigrationFn } from 'umzug';

export const up: MigrationFn<MigrationContext> = async (params) => {
  const { context } = params;
  const { queryInterface, DataTypes } = context;
  await queryInterface.createTable('student_class_relations', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    student_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'students',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      comment: '学生ID',
    },
    class_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'classes',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      comment: '班级ID',
    },
    academic_year: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: '学年',
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: '是否当前班级',
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  // 创建唯一索引：同一学年，一个学生只能在一个班级
  await queryInterface.addIndex('student_class_relations', ['student_id', 'academic_year'], {
    name: 'student_class_relations_student_year_unique',
    unique: true,
  });

  await queryInterface.addIndex('student_class_relations', ['class_id'], {
    name: 'student_class_relations_class_id_idx',
  });
}

export const down: MigrationFn<MigrationContext> = async (params) => {
  await params.context.queryInterface.dropTable('student_class_relations');
};
