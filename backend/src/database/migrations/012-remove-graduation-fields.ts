import { DataTypes } from 'sequelize';
import { MigrationContext } from '../umzug.js';
import { MigrationFn } from 'umzug';
import {
  addColumnIfMissing,
  createIndexIfColumnsExist,
  describeTableIfExists,
  removeColumnIfExists,
} from '../migration-helpers.js';

export const up: MigrationFn<MigrationContext> = async (params) => {
  const { context } = params;
  const { queryInterface } = context;
  const tableDescription = await describeTableIfExists(queryInterface, 'classes');

  if (!tableDescription) {
    console.log('- classes table does not exist, skipping graduation fields removal');
    return;
  }

  try {
    await queryInterface.removeIndex('classes', ['graduated']);
  } catch {
    // Index may not exist in older or partially migrated databases.
  }

  if (tableDescription.graduated) {
    await removeColumnIfExists(queryInterface, 'classes', 'graduated');
  }

  if (tableDescription.graduation_year) {
    await removeColumnIfExists(queryInterface, 'classes', 'graduation_year');
  }
};

export const down: MigrationFn<MigrationContext> = async (params) => {
  const { context } = params;
  const { queryInterface } = context;
  const tableDescription = await describeTableIfExists(queryInterface, 'classes');

  if (!tableDescription) {
    console.log('- classes table does not exist, skipping graduation fields restore');
    return;
  }

  if (!tableDescription.graduated) {
    await addColumnIfMissing(queryInterface, 'classes', 'graduated', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Whether the class has graduated',
    });
  }

  if (!tableDescription.graduation_year) {
    await addColumnIfMissing(queryInterface, 'classes', 'graduation_year', {
      type: DataTypes.STRING(10),
      allowNull: true,
      comment: 'Graduation year',
    });
  }

  await createIndexIfColumnsExist(
    context,
    'classes',
    'classes_graduated_idx',
    ['graduated'],
  );
};
