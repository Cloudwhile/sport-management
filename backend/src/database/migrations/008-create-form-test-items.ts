import { MigrationContext } from '../umzug.js';
import { MigrationFn } from 'umzug';

export const up: MigrationFn<MigrationContext> = async (params) => {
  const { context } = params;
  const { queryInterface, DataTypes } = context;
  await queryInterface.createTable('form_test_items', {
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
  await queryInterface.addIndex('form_test_items', ['form_id'], {
    name: 'form_test_items_form_id_idx',
  });

  await queryInterface.addIndex('form_test_items', ['item_code'], {
    name: 'form_test_items_item_code_idx',
  });
}

export const down: MigrationFn<MigrationContext> = async (params) => {
  await params.context.queryInterface.dropTable('form_test_items');
};
