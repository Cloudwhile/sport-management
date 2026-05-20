import { DataTypes } from 'sequelize';
import type { MigrationFn } from 'umzug';
import type { MigrationContext } from '../umzug.js';
import {
  addColumnIfMissing,
  removeColumnIfExists,
} from '../migration-helpers.js';

export const up: MigrationFn<MigrationContext> = async (params) => {
  const { context } = params;
  const { queryInterface } = context;

  await addColumnIfMissing(queryInterface, 'students', 'ethnicity_code', {
    type: DataTypes.STRING(10),
    allowNull: true,
    comment: '民族代码',
  });
};

export const down: MigrationFn<MigrationContext> = async (params) => {
  const { context } = params;
  const { queryInterface } = context;

  await removeColumnIfExists(queryInterface, 'students', 'ethnicity_code');
};
