import { MigrationContext } from '../umzug.js';
import { MigrationFn } from 'umzug';
import {
  addColumnIfMissing,
  removeColumnIfExists,
} from '../migration-helpers.js';

export const up: MigrationFn<MigrationContext> = async (params) => {
  const { context } = params;
  const { queryInterface, DataTypes } = context;

  // 为 form_test_items 表添加 is_calculated 字段
  await addColumnIfMissing(queryInterface, 'form_test_items', 'is_calculated', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: '是否为计算型项目（不需要手动输入）'
  });
};

export const down: MigrationFn<MigrationContext> = async (params) => {
  // 回滚时删除字段
  await removeColumnIfExists(
    params.context.queryInterface,
    'form_test_items',
    'is_calculated',
  );
};
