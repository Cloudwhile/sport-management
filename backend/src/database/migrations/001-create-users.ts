import { MigrationContext } from '../umzug.js';
import { MigrationFn } from 'umzug';

export const up: MigrationFn<MigrationContext> = async (params) => {
  const { context } = params;
  const { queryInterface, DataTypes } = context;
  await queryInterface.createTable('users', {
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
  await queryInterface.addIndex('users', ['username'], {
    name: 'users_username_idx',
  });

  await queryInterface.addIndex('users', ['role'], {
    name: 'users_role_idx',
  });
}

export const down: MigrationFn<MigrationContext> = async (params) => {
  const { context } = params;
  await context.queryInterface.dropTable('users');
};
