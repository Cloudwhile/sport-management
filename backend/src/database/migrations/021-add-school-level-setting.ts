import type { MigrationFn } from 'umzug';
import type { MigrationContext } from '../umzug.js';
import { Op } from 'sequelize';

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

  await queryInterface.sequelize.query(
    `
      INSERT INTO settings (key, value, description, category, is_public, created_at, updated_at)
      VALUES (:key, :value, :description, :category, :is_public, :created_at, :updated_at)
      ON CONFLICT (key) DO NOTHING
    `,
    { replacements: setting },
  );
};

export const down: MigrationFn<MigrationContext> = async (params) => {
  const { context } = params;
  const { queryInterface } = context;

  await queryInterface.bulkDelete('settings', {
    [Op.and]: [
      { key: setting.key },
      { value: setting.value },
      { category: setting.category },
    ],
  });
};
