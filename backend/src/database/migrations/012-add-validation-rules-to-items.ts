import { MigrationContext } from '../umzug.js';
import { MigrationFn } from 'umzug';

export const up: MigrationFn<MigrationContext> = async (params) => {
  const { context } = params;
  const { queryInterface, DataTypes } = context;

  await queryInterface.addColumn('form_test_items', 'validation_rules', {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: '验证规则配置: { min, max, decimals }'
  });
};

export const down: MigrationFn<MigrationContext> = async (params) => {
  await params.context.queryInterface.removeColumn('form_test_items', 'validation_rules');
};
