import { MigrationContext } from '../umzug.js';
import { MigrationFn } from 'umzug';
import {
  createIndexIfColumnsExist,
  createTableIfMissing,
  dropTableIfExists,
} from '../migration-helpers.js';

export const up: MigrationFn<MigrationContext> = async (params) => {
  const { context } = params;
  const { queryInterface, DataTypes } = context;
  await createTableIfMissing(queryInterface, 'users', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: '用户名',
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: '密码哈希',
    },
    role: {
      type: DataTypes.ENUM('admin', 'teacher'),
      allowNull: false,
      comment: '角色',
    },
    real_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '真实姓名',
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
    'users',
    'users_username_idx',
    ['username'],
  );

  await createIndexIfColumnsExist(
    context,
    'users',
    'users_role_idx',
    ['role'],
  );
}

export const down: MigrationFn<MigrationContext> = async (params) => {
  const { context } = params;
  await dropTableIfExists(context.queryInterface, 'users');
};
