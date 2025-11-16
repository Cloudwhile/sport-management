import { DataTypes } from 'sequelize';
import { MigrationContext } from '../umzug.js';
import { MigrationFn } from 'umzug';

export const up: MigrationFn<MigrationContext> = async (params) => {
  const { context } = params;
  const queryInterface = context.sequelize.getQueryInterface();

  console.log('开始删除班级表的毕业状态相关字段...');

  // 删除 graduated 字段的索引
  try {
    await queryInterface.removeIndex('classes', ['graduated']);
    console.log('✓ 删除 graduated 字段索引');
  } catch (error) {
    console.log('- graduated 字段索引不存在或已删除');
  }

  // 删除 graduated 字段
  await queryInterface.removeColumn('classes', 'graduated');
  console.log('✓ 删除 graduated 字段');

  // 删除 graduation_year 字段
  await queryInterface.removeColumn('classes', 'graduation_year');
  console.log('✓ 删除 graduation_year 字段');

  console.log('✅ 毕业状态字段已改为虚拟计算字段');
  console.log('   现在班级的毕业状态将根据 cohort 字段自动计算');
  console.log('   配置文件: backend/src/config/school.ts');
};

export const down: MigrationFn<MigrationContext> = async (params) => {
  const { context } = params;
  const queryInterface = context.sequelize.getQueryInterface();

  console.log('恢复班级表的毕业状态字段...');

  // 恢复 graduated 字段
  await queryInterface.addColumn('classes', 'graduated', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: '是否已毕业',
  });

  // 恢复 graduation_year 字段
  await queryInterface.addColumn('classes', 'graduation_year', {
    type: DataTypes.STRING(10),
    allowNull: true,
    comment: '毕业年份',
  });

  // 恢复 graduated 索引
  await queryInterface.addIndex('classes', ['graduated']);

  console.log('✓ 毕业状态字段已恢复');
};
