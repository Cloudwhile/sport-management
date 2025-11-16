import { MigrationContext } from '../umzug.js';
import { MigrationFn } from 'umzug';

export const up: MigrationFn<MigrationContext> = async (params) => {
  const { context } = params;
  const { queryInterface, DataTypes } = context;

  // 为 form_test_items 表添加 is_calculated 字段
  await queryInterface.addColumn('form_test_items', 'is_calculated', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: '是否为计算型项目（不需要手动输入）'
  });
};

export const down: MigrationFn<MigrationContext> = async (params) => {
  // 回滚时删除字段
  await params.context.queryInterface.removeColumn('form_test_items', 'is_calculated');
};
