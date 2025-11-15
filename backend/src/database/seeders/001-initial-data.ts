import { MigrationContext } from '../umzug.js';
import { MigrationFn } from 'umzug';
import { hashPassword } from '../../utils/password.js';

export const up: MigrationFn<MigrationContext> = async (params) => {
  const { context } = params;
  const queryInterface = context.sequelize.getQueryInterface();

  console.log('开始填充初始数据...');

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

  // 创建年级
  await queryInterface.bulkInsert('grades', [
    { grade_name: '一年级', grade_level: 1, created_at: new Date() },
    { grade_name: '二年级', grade_level: 2, created_at: new Date() },
    { grade_name: '三年级', grade_level: 3, created_at: new Date() },
    { grade_name: '四年级', grade_level: 4, created_at: new Date() },
    { grade_name: '五年级', grade_level: 5, created_at: new Date() },
    { grade_name: '六年级', grade_level: 6, created_at: new Date() },
  ]);
  console.log('✓ 创建年级: 6个');

  // 创建班级（每个年级2个班）
  const classPassword = await hashPassword('class123');
  const classes: any[] = [];

  for (let gradeId = 1; gradeId <= 6; gradeId++) {
    classes.push(
      {
        grade_id: gradeId,
        class_name: '一班',
        academic_year: '2024-2025',
        class_account: `${gradeId}01`,
        class_password: classPassword,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        grade_id: gradeId,
        class_name: '二班',
        academic_year: '2024-2025',
        class_account: `${gradeId}02`,
        class_password: classPassword,
        created_at: new Date(),
        updated_at: new Date(),
      }
    );
  }

  await queryInterface.bulkInsert('classes', classes);
  console.log(`✓ 创建班级: ${classes.length}个（账号密码: 101/class123, 102/class123...）`);

  // 创建测试学生（前2个班级，每班5个学生）
  const studentNames = ['张三', '李四', '王五', '赵六', '钱七'];
  const students: any[] = [];
  const studentClassRelations: any[] = [];
  let studentIdCounter = 1;

  for (let classId = 1; classId <= 2; classId++) {
    for (let i = 0; i < 5; i++) {
      students.push({
        student_id_national: `2024${String(studentIdCounter).padStart(6, '0')}`,
        student_id_school: `S${String(studentIdCounter).padStart(4, '0')}`,
        name: studentNames[i],
        gender: i % 2 === 0 ? 'male' : 'female',
        birth_date: `2018-0${(i % 9) + 1}-15`,
        id_card_number: `440101201801${String(i + 1).padStart(2, '0')}${String(
          studentIdCounter
        ).padStart(3, '0')}X`,
        phone: `138${String(studentIdCounter).padStart(8, '0')}`,
        created_at: new Date(),
        updated_at: new Date(),
      });

      // 注意：这里假设学生的 id 是自增的，从 1 开始
      studentClassRelations.push({
        student_id: studentIdCounter,
        class_id: classId,
        academic_year: '2024-2025',
        is_active: true,
        created_at: new Date(),
      });

      studentIdCounter++;
    }
  }

  await queryInterface.bulkInsert('students', students);
  console.log(`✓ 创建学生: ${students.length}个`);

  await queryInterface.bulkInsert('student_class_relations', studentClassRelations);
  console.log(`✓ 创建学生-班级关系: ${studentClassRelations.length}条`);

  console.log('\n初始数据填充完成！');
  console.log('\n=== 登录账号信息 ===');
  console.log('管理员账号: admin / admin123');
  console.log('教师账号: teacher / teacher123');
  console.log('班级账号示例: 101 / class123 (一年级一班)');
  console.log('班级账号示例: 102 / class123 (一年级二班)');
  console.log('==================\n');
}

export const down: MigrationFn<MigrationContext> = async (params) => {
  const { context } = params;
  const queryInterface = context.sequelize.getQueryInterface();

  console.log('开始清除初始数据...');

  // 按照外键依赖的逆序删除
  await queryInterface.bulkDelete('student_class_relations', {});
  await queryInterface.bulkDelete('students', {});
  await queryInterface.bulkDelete('classes', {});
  await queryInterface.bulkDelete('grades', {});
  await queryInterface.bulkDelete('users', {});

  console.log('✓ 初始数据已清除');
}
