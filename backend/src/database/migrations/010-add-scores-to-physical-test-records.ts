import { MigrationContext } from '../umzug.js';
import { MigrationFn } from 'umzug';
import {
  addColumnIfMissing,
  removeColumnIfExists,
} from '../migration-helpers.js';

export const up: MigrationFn<MigrationContext> = async (params) => {
  const { context } = params;
  const { queryInterface, DataTypes } = context;

  await addColumnIfMissing(queryInterface, 'physical_test_records', 'scores', {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: '各项分数JSON',
  });
}

export const down: MigrationFn<MigrationContext> = async (params) => {
  await removeColumnIfExists(
    params.context.queryInterface,
    'physical_test_records',
    'scores',
  );
};
