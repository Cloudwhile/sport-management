import { DataTypes } from 'sequelize';
import type { MigrationFn } from 'umzug';
import type { MigrationContext } from '../umzug.js';

export const up: MigrationFn<MigrationContext> = async (params) => {
  const { context } = params;
  const { queryInterface } = context;

  await queryInterface.createTable('settings', {
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
  await queryInterface.addIndex('settings', ['key'], {
    unique: true,
    name: 'settings_key_unique',
  });

  await queryInterface.addIndex('settings', ['category'], {
    name: 'settings_category_index',
  });

  await queryInterface.addIndex('settings', ['is_public'], {
    name: 'settings_is_public_index',
  });

  // 插入默认设置
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
};

export const down: MigrationFn<MigrationContext> = async (params) => {
  const { context } = params;
  const { queryInterface } = context;

  await queryInterface.dropTable('settings');
};
