import type { MigrationFn } from 'umzug';
import type { MigrationContext } from '../umzug.js';
import { describeTableIfExists } from '../migration-helpers.js';

const setting = {
  key: 'school_level',
  value: 'senior',
  description: '学校等级，用于小学、初中、高中等不同环境下的名称展示',
  category: 'system',
  is_public: true,
  created_at: new Date(),
  updated_at: new Date(),
};

export const up: MigrationFn<MigrationContext> = async (params) => {
  const { context } = params;
  const { queryInterface } = context;
  const settingsTable = await describeTableIfExists(queryInterface, 'settings');

  if (
    !settingsTable?.key ||
    !settingsTable.value ||
    !settingsTable.description ||
    !settingsTable.category ||
    !settingsTable.is_public ||
    !settingsTable.created_at ||
    !settingsTable.updated_at
  ) {
    return;
  }

  await queryInterface.sequelize.query(
    `
      INSERT INTO settings (key, value, description, category, is_public, created_at, updated_at)
      VALUES (:key, :value, :description, :category, :is_public, :created_at, :updated_at)
      ON CONFLICT (key) DO NOTHING
    `,
    { replacements: setting },
  );
};

export const down: MigrationFn<MigrationContext> = async (_params) => {
  // No-op: up may skip the insert when school_level already exists.
  // Blind deletion here could remove pre-existing user configuration.
};
