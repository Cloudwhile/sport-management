import type { MigrationFn } from 'umzug';
import type { MigrationContext } from '../umzug.js';
import { columnExists } from '../migration-helpers.js';

const enumTypeExists = async (
  context: MigrationContext,
  typeName: string,
) => {
  const [rows] = await context.sequelize.query(
    'SELECT 1 FROM pg_type WHERE typname = :typeName LIMIT 1',
    { replacements: { typeName } },
  );

  return (rows as unknown[]).length > 0;
};

export const up: MigrationFn<MigrationContext> = async (params) => {
  const { context } = params;
  const { queryInterface } = context;

  if (!(await enumTypeExists(context, 'enum_users_role'))) {
    return;
  }

  // 修改 role 枚举类型，添加 'class' 值
  await queryInterface.sequelize.query(`
    ALTER TYPE "enum_users_role" ADD VALUE IF NOT EXISTS 'class';
  `);
};

export const down: MigrationFn<MigrationContext> = async (params) => {
  const { context } = params;
  const { queryInterface } = context;

  if (
    !(await columnExists(queryInterface, 'users', 'role')) ||
    !(await enumTypeExists(context, 'enum_users_role'))
  ) {
    return;
  }

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
