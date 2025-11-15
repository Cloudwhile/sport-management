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
    cohort: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: '入学年份：2024级',
    },
    class_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '班级名称：一班、二班',
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
    graduated: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '是否已毕业',
    },
    graduation_year: {
      type: DataTypes.STRING(10),
      allowNull: true,
      comment: '毕业年份',
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
  await queryInterface.addIndex('classes', ['cohort'], {
    name: 'classes_cohort_idx',
  });

  await queryInterface.addIndex('classes', ['graduated'], {
    name: 'classes_graduated_idx',
  });

  // 创建唯一约束：同一届同一个班级只能有一个
  await queryInterface.addConstraint('classes', {
    fields: ['cohort', 'class_name'],
    type: 'unique',
    name: 'classes_cohort_class_name_unique',
  });
}

export const down: MigrationFn<MigrationContext> = async (params) => {
  await params.context.queryInterface.dropTable('classes');
};
