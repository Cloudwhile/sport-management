import { MigrationContext } from '../umzug.js';
import { MigrationFn } from 'umzug';
import {
  createIndexIfColumnsExist,
  createTableIfMissing,
  dropTableIfExists,
} from '../migration-helpers.js';

export const up: MigrationFn<MigrationContext> = async (params) => {
  const { context } = params;
  const { queryInterface, DataTypes } = context;
  await createTableIfMissing(queryInterface, 'physical_test_forms', {
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
  await createIndexIfColumnsExist(
    context,
    'physical_test_forms',
    'physical_test_forms_academic_year_idx',
    ['academic_year'],
  );

  await createIndexIfColumnsExist(
    context,
    'physical_test_forms',
    'physical_test_forms_status_idx',
    ['status'],
  );
}

export const down: MigrationFn<MigrationContext> = async (params) => {
  await dropTableIfExists(params.context.queryInterface, 'physical_test_forms');
};
