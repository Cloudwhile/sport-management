import { MigrationContext } from '../umzug.js';
import { MigrationFn } from 'umzug';
import {
  addColumnIfMissing,
  removeColumnIfExists,
} from '../migration-helpers.js';

export const up: MigrationFn<MigrationContext> = async (params) => {
  const { context } = params;
  const { queryInterface, DataTypes } = context;

  await addColumnIfMissing(queryInterface, 'form_test_items', 'validation_rules', {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: '验证规则配置: { min, max, decimals }'
  });
};

export const down: MigrationFn<MigrationContext> = async (params) => {
  await removeColumnIfExists(
    params.context.queryInterface,
    'form_test_items',
    'validation_rules',
  );
};
