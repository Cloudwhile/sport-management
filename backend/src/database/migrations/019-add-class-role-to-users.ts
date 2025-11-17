import type { MigrationFn } from 'umzug';
import type { MigrationContext } from '../umzug.js';

export const up: MigrationFn<MigrationContext> = async (params) => {
  const { context } = params;
  const { queryInterface, sequelize } = context;

  // 修改 role 枚举类型，添加 'class' 值
  await queryInterface.sequelize.query(`
    ALTER TYPE "enum_users_role" ADD VALUE IF NOT EXISTS 'class';
  `);
};

export const down: MigrationFn<MigrationContext> = async (params) => {
  const { context } = params;
  const { queryInterface } = context;

  // PostgreSQL 不支持直接删除枚举值，需要重建枚举类型
  // 这里我们创建一个新的枚举，然后替换
  await queryInterface.sequelize.query(`
    -- 创建临时枚举类型
    CREATE TYPE "enum_users_role_old" AS ENUM ('admin', 'teacher');

    -- 修改列使用旧的枚举类型
    ALTER TABLE users
      ALTER COLUMN role TYPE "enum_users_role_old"
      USING role::text::"enum_users_role_old";

    -- 删除新的枚举类型
    DROP TYPE "enum_users_role";

    -- 重命名临时枚举类型
    ALTER TYPE "enum_users_role_old" RENAME TO "enum_users_role";
  `);
};
