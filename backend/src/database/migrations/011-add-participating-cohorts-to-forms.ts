import { MigrationContext } from '../umzug.js';
import { MigrationFn } from 'umzug';
import {
  addColumnIfMissing,
  removeColumnIfExists,
} from '../migration-helpers.js';

export const up: MigrationFn<MigrationContext> = async (params) => {
  const { context } = params;
  const { queryInterface, DataTypes } = context;

  await addColumnIfMissing(queryInterface, 'physical_test_forms', 'participating_cohorts', {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
    comment: '参与的年级(入学年份数组), 如 ["2022", "2023"]',
  });
}

export const down: MigrationFn<MigrationContext> = async (params) => {
  await removeColumnIfExists(
    params.context.queryInterface,
    'physical_test_forms',
    'participating_cohorts',
  );
};
