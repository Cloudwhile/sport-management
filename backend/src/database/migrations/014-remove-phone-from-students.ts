import { MigrationContext } from '../umzug.js';
import { MigrationFn } from 'umzug';

export const up: MigrationFn<MigrationContext> = async (params) => {
  const { context } = params;
  const { queryInterface } = context;

  // 删除 students 表的 phone 列
  await queryInterface.removeColumn('students', 'phone');
};

export const down: MigrationFn<MigrationContext> = async (params) => {
  const { context } = params;
  const { queryInterface, DataTypes } = context;

  // 回滚时重新添加 phone 列
  await queryInterface.addColumn('students', 'phone', {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '联系电话',
  });
};
