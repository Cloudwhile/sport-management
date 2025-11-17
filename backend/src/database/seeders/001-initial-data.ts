import { MigrationContext } from '../umzug.js';
import { MigrationFn } from 'umzug';
import { hashPassword } from '../../utils/password.js';

export const up: MigrationFn<MigrationContext> = async (params) => {
  const { context } = params;
  const { sequelize } = context;
  const queryInterface = sequelize.getQueryInterface();

  console.log('开始填充初始数据...');

  // 检查是否已存在管理员账号
  const [existingUsers] = await sequelize.query(
    `SELECT username FROM users WHERE username IN ('admin', 'teacher')`
  );

  if (existingUsers.length > 0) {
    const existingUsernames = (existingUsers as any[]).map(u => u.username);
    console.log(`⚠ 以下用户已存在，跳过创建: ${existingUsernames.join(', ')}`);

    // 只创建不存在的用户
    const usersToCreate = [];

    if (!existingUsernames.includes('admin')) {
      const adminPassword = await hashPassword('admin123');
      usersToCreate.push({
        username: 'admin',
        password: adminPassword,
        role: 'admin',
        real_name: '系统管理员',
        created_at: new Date(),
        updated_at: new Date(),
      });
    }

    if (!existingUsernames.includes('teacher')) {
      const teacherPassword = await hashPassword('teacher123');
      usersToCreate.push({
        username: 'teacher',
        password: teacherPassword,
        role: 'teacher',
        real_name: '测试教师账户',
        created_at: new Date(),
        updated_at: new Date(),
      });
    }

    if (usersToCreate.length > 0) {
      await queryInterface.bulkInsert('users', usersToCreate);
      console.log(`✓ 创建新用户: ${usersToCreate.map(u => u.username).join(', ')}`);
    }
  } else {
    // 创建管理员和教师账号
    const adminPassword = await hashPassword('admin123');
    const teacherPassword = await hashPassword('teacher123');

    await queryInterface.bulkInsert('users', [
      {
        username: 'admin',
        password: adminPassword,
        role: 'admin',
        real_name: '系统管理员',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        username: 'teacher',
        password: teacherPassword,
        role: 'teacher',
        real_name: '张老师',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    console.log('✓ 创建用户账号: admin/admin123, teacher/teacher123');
  }

  console.log('\n初始数据填充完成！');
  console.log('\n=== 登录账号信息 ===');
  console.log('管理员账号: admin / admin123');
  console.log('教师账号: teacher / teacher123');
  console.log('==================\n');
}

export const down: MigrationFn<MigrationContext> = async (params) => {
  const { context } = params;
  const queryInterface = context.sequelize.getQueryInterface();

  console.log('开始清除初始数据...');

  // 按照外键依赖的逆序删除
  await queryInterface.bulkDelete('form_test_items', {});
  await queryInterface.bulkDelete('physical_test_forms', {});
  await queryInterface.bulkDelete('student_class_relations', {});
  await queryInterface.bulkDelete('students', {});
  await queryInterface.bulkDelete('classes', {});
  await queryInterface.bulkDelete('grades', {});
  await queryInterface.bulkDelete('users', {});

  console.log('✓ 初始数据已清除');
}
