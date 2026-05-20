import { DataTypes } from 'sequelize';
import type { MigrationFn } from 'umzug';
import type { MigrationContext } from '../umzug.js';
import {
  createIndexIfColumnsExist,
  createTableIfMissing,
  describeTableIfExists,
  dropTableIfExists,
} from '../migration-helpers.js';

export const up: MigrationFn<MigrationContext> = async (params) => {
  const { context } = params;
  const { queryInterface } = context;

  await createTableIfMissing(queryInterface, 'settings', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    key: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: '设置键名',
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '设置值',
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: '设置描述',
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'system',
      comment: '设置分类：system, appearance, feature等',
    },
    is_public: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '是否公开（无需登录即可访问）',
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  // 创建索引
  await createIndexIfColumnsExist(
    context,
    'settings',
    'settings_key_unique',
    ['key'],
    true,
  );

  await createIndexIfColumnsExist(
    context,
    'settings',
    'settings_category_index',
    ['category'],
  );

  await createIndexIfColumnsExist(
    context,
    'settings',
    'settings_is_public_index',
    ['is_public'],
  );

  // 插入默认设置
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

  const [existingAppTitleRows] = await queryInterface.sequelize.query(
    'SELECT 1 FROM settings WHERE key = :key LIMIT 1',
    { replacements: { key: 'app_title' } },
  );

  if ((existingAppTitleRows as unknown[]).length === 0) {
    await queryInterface.bulkInsert('settings', [
    {
      key: 'app_title',
      value: '学校体测数据管理系统',
      description: '系统标题，显示在浏览器标签和页面顶部',
      category: 'system',
      is_public: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    ]);
  }
};

export const down: MigrationFn<MigrationContext> = async (params) => {
  const { context } = params;
  const { queryInterface } = context;

  await dropTableIfExists(queryInterface, 'settings');
};
