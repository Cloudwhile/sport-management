import { Op } from 'sequelize';
import type { MigrationFn } from 'umzug';
import type { MigrationContext } from '../umzug.js';

const settings = [
  {
    key: 'site_logo_url',
    value: '',
    description: '站点 Logo 图片，用于顶部导航和浏览器标签页图标',
    category: 'appearance',
    is_public: true,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    key: 'home_image_url',
    value: '',
    description: '首页图片，用于登录页背景展示',
    category: 'appearance',
    is_public: true,
    created_at: new Date(),
    updated_at: new Date(),
  },
];

export const up: MigrationFn<MigrationContext> = async (params) => {
  const { context } = params;
  const { queryInterface } = context;

  for (const setting of settings) {
    await queryInterface.sequelize.query(
      `
        INSERT INTO settings (key, value, description, category, is_public, created_at, updated_at)
        VALUES (:key, :value, :description, :category, :is_public, :created_at, :updated_at)
        ON CONFLICT (key) DO UPDATE SET
          description = EXCLUDED.description,
          category = EXCLUDED.category,
          is_public = EXCLUDED.is_public,
          updated_at = EXCLUDED.updated_at
      `,
      { replacements: setting },
    );
  }
};

export const down: MigrationFn<MigrationContext> = async (params) => {
  const { context } = params;
  const { queryInterface } = context;

  await queryInterface.bulkDelete('settings', {
    [Op.and]: [
      { key: { [Op.in]: settings.map(setting => setting.key) } },
      { value: { [Op.in]: settings.map(setting => setting.value) } },
      { category: 'appearance' },
    ],
  });
};
