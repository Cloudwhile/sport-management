import { MigrationContext } from '../umzug.js';
import { MigrationFn } from 'umzug';

export const up: MigrationFn<MigrationContext> = async (params) => {
  const { context } = params;
  const { queryInterface } = context;

  // 更新 classes 表中所有带"级"的 cohort 数据，去掉"级"字
  // 例如：2024级 -> 2024
  await queryInterface.sequelize.query(`
    UPDATE classes
    SET cohort = REPLACE(cohort, '级', '')
    WHERE cohort LIKE '%级'
  `);
};

export const down: MigrationFn<MigrationContext> = async (params) => {
  const { context } = params;
  const { queryInterface } = context;

  // 回滚时重新加上"级"字
  await queryInterface.sequelize.query(`
    UPDATE classes
    SET cohort = cohort || '级'
    WHERE cohort ~ '^[0-9]{4}$'
  `);
};
