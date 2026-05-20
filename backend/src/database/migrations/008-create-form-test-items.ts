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
  await createTableIfMissing(queryInterface, 'form_test_items', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    form_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'physical_test_forms',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      comment: '表单ID',
    },
    item_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '项目代码',
    },
    item_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '项目名称',
    },
    item_unit: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: '单位',
    },
    gender_limit: {
      type: DataTypes.ENUM('male', 'female'),
      allowNull: true,
      comment: '性别限制',
    },
    is_required: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: '是否必填',
    },
    sort_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '排序',
    },
    scoring_standard: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: '评分标准',
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  // 创建索引
  await createIndexIfColumnsExist(
    context,
    'form_test_items',
    'form_test_items_form_id_idx',
    ['form_id'],
  );

  await createIndexIfColumnsExist(
    context,
    'form_test_items',
    'form_test_items_item_code_idx',
    ['item_code'],
  );
}

export const down: MigrationFn<MigrationContext> = async (params) => {
  await dropTableIfExists(params.context.queryInterface, 'form_test_items');
};
