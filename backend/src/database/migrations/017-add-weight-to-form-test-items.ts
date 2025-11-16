import { MigrationFn } from 'umzug';
import { DataTypes } from 'sequelize';
import { MigrationContext } from '../umzug.js';

/**
 * 为 form_test_items 表添加 weight 字段（权重）
 */
export const up: MigrationFn<MigrationContext> = async (params) => {
  const { context } = params;
  const { queryInterface } = context;

  await queryInterface.addColumn('form_test_items', 'weight', {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    comment: '权重（百分比），用于计算总分，如 15 表示占总分的15%',
  });
};

export const down: MigrationFn<MigrationContext> = async (params) => {
  const { context } = params;
  const { queryInterface } = context;

  await queryInterface.removeColumn('form_test_items', 'weight');
};
