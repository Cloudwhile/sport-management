import { MigrationContext } from '../umzug.js';
import { MigrationFn } from 'umzug';

export const up: MigrationFn<MigrationContext> = async (params) => {
  const { context } = params;
  const { queryInterface, DataTypes } = context;
  await queryInterface.createTable('physical_test_forms', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    form_name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '表单名称',
    },
    academic_year: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: '学年',
    },
    test_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: '测试日期',
    },
    start_time: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '开始填报时间',
    },
    end_time: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '结束填报时间',
    },
    status: {
      type: DataTypes.ENUM('draft', 'published', 'closed'),
      allowNull: false,
      defaultValue: 'draft',
      comment: '状态',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '说明',
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: '创建人',
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
  await queryInterface.addIndex('physical_test_forms', ['academic_year'], {
    name: 'physical_test_forms_academic_year_idx',
  });

  await queryInterface.addIndex('physical_test_forms', ['status'], {
    name: 'physical_test_forms_status_idx',
  });
}

export const down: MigrationFn<MigrationContext> = async (params) => {
  await params.context.queryInterface.dropTable('physical_test_forms');
};
