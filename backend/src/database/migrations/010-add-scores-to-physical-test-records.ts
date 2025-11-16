import { MigrationContext } from '../umzug.js';
import { MigrationFn } from 'umzug';

export const up: MigrationFn<MigrationContext> = async (params) => {
  const { context } = params;
  const { queryInterface, DataTypes } = context;

  await queryInterface.addColumn('physical_test_records', 'scores', {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: '各项分数JSON',
  });
}

export const down: MigrationFn<MigrationContext> = async (params) => {
  await params.context.queryInterface.removeColumn('physical_test_records', 'scores');
};
