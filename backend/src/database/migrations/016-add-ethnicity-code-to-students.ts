import { DataTypes } from 'sequelize';
import type { MigrationFn } from 'umzug';
import type { MigrationContext } from '../migrator.js';

export const up: MigrationFn<MigrationContext> = async (params) => {
  const { context } = params;
  const { queryInterface } = context;

  await queryInterface.addColumn('students', 'ethnicity_code', {
    type: DataTypes.STRING(10),
    allowNull: true,
    comment: '民族代码',
  });
};

export const down: MigrationFn<MigrationContext> = async (params) => {
  const { context } = params;
  const { queryInterface } = context;

  await queryInterface.removeColumn('students', 'ethnicity_code');
};
