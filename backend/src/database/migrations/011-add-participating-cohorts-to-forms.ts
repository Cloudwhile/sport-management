import { MigrationContext } from '../umzug.js';
import { MigrationFn } from 'umzug';

export const up: MigrationFn<MigrationContext> = async (params) => {
  const { context } = params;
  const { queryInterface, DataTypes } = context;

  await queryInterface.addColumn('physical_test_forms', 'participating_cohorts', {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
    comment: '参与的年级(入学年份数组), 如 ["2022", "2023"]',
  });
}

export const down: MigrationFn<MigrationContext> = async (params) => {
  await params.context.queryInterface.removeColumn('physical_test_forms', 'participating_cohorts');
};
