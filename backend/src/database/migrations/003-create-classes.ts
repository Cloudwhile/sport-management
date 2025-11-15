import { MigrationContext } from '../umzug.js';
import { MigrationFn } from 'umzug';

export const up: MigrationFn<MigrationContext> = async (params) => {
  const { context } = params;
  const { queryInterface, DataTypes } = context;
  await queryInterface.createTable('classes', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    grade_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'grades',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
      comment: '年级ID',
    },
    class_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '班级名称',
    },
    academic_year: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: '学年',
    },
    class_account: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
      comment: '班级账号',
    },
    class_password: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: '班级密码哈希',
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  // 创建索引
  await queryInterface.addIndex('classes', ['grade_id'], {
    name: 'classes_grade_id_idx',
  });

  await queryInterface.addIndex('classes', ['academic_year'], {
    name: 'classes_academic_year_idx',
  });
}

export const down: MigrationFn<MigrationContext> = async (params) => {
  await params.context.queryInterface.dropTable('classes');
};
