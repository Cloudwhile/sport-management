import sequelize from './connection.js';
import { hashPassword } from '../utils/password.js';
import {
  User,
  Grade,
  Class,
  Student,
  StudentClassRelation,
} from '../models/index.js';

const seedDatabase = async (): Promise<void> => {
  try {
    console.log('开始初始化数据库...');

    // 同步数据库结构
    await sequelize.sync({ force: true });
    console.log('✓ 数据库结构同步完成');

    // 创建管理员账号
    const adminPassword = await hashPassword('admin123');
    const admin = await User.create({
      username: 'admin',
      password: adminPassword,
      role: 'admin',
      realName: '系统管理员',
    } as any);
    console.log('✓ 创建管理员账号: admin/admin123');

    // 创建测试教师账号
    const teacherPassword = await hashPassword('teacher123');
    const teacher = await User.create({
      username: 'teacher',
      password: teacherPassword,
      role: 'teacher',
      realName: '张老师',
    } as any);
    console.log('✓ 创建教师账号: teacher/teacher123');

    // 创建年级
    const grades = await Grade.bulkCreate([
      { gradeName: '一年级', gradeLevel: 1 },
      { gradeName: '二年级', gradeLevel: 2 },
      { gradeName: '三年级', gradeLevel: 3 },
      { gradeName: '四年级', gradeLevel: 4 },
      { gradeName: '五年级', gradeLevel: 5 },
      { gradeName: '六年级', gradeLevel: 6 },
    ] as any[]);
    console.log(`✓ 创建年级: ${grades.length}个`);

    // 创建班级（每个年级2个班）
    const classes: any[] = [];
    for (const grade of grades) {
      const classPassword = await hashPassword('class123');

      const gradeData = grade.toJSON() as any;
      const class1 = await Class.create({
        gradeId: gradeData.id,
        className: '一班',
        academicYear: '2024-2025',
        classAccount: `${gradeData.gradeLevel}01`,
        classPassword: classPassword,
      } as any);

      const class2 = await Class.create({
        gradeId: gradeData.id,
        className: '二班',
        academicYear: '2024-2025',
        classAccount: `${gradeData.gradeLevel}02`,
        classPassword: classPassword,
      } as any);

      classes.push(class1, class2);
    }
    console.log(`✓ 创建班级: ${classes.length}个（账号密码: 101/class123, 102/class123...）`);

    // 创建测试学生（每个班级5个学生）
    const students: any[] = [];
    const studentNames = ['张三', '李四', '王五', '赵六', '钱七'];
    let studentIdCounter = 1;

    for (const classItem of classes.slice(0, 2)) { // 只为前2个班级创建学生
      for (let i = 0; i < 5; i++) {
        const student = await Student.create({
          studentIdNational: `2024${String(studentIdCounter).padStart(6, '0')}`,
          studentIdSchool: `S${String(studentIdCounter).padStart(4, '0')}`,
          name: `${studentNames[i]}`,
          gender: i % 2 === 0 ? 'male' : 'female',
          birthDate: `2018-0${(i % 9) + 1}-15`,
          idCardNumber: `44010120180${String(i + 1).padStart(2, '0')}0000${String(studentIdCounter).padStart(2, '0')}`,
          phone: `138${String(studentIdCounter).padStart(8, '0')}`,
        } as any);

        const classData = classItem.toJSON() as any;
        const studentData = student.toJSON() as any;

        // 建立学生-班级关系
        await StudentClassRelation.create({
          studentId: studentData.id,
          classId: classData.id,
          academicYear: '2024-2025',
          isActive: true,
        } as any);

        students.push(student);
        studentIdCounter++;
      }
    }
    console.log(`✓ 创建学生: ${students.length}个`);

    console.log('\n数据库初始化完成！');
    console.log('\n=== 登录账号信息 ===');
    console.log('管理员账号: admin / admin123');
    console.log('教师账号: teacher / teacher123');
    console.log('班级账号示例: 101 / class123 (一年级一班)');
    console.log('班级账号示例: 102 / class123 (一年级二班)');
    console.log('==================\n');

    process.exit(0);
  } catch (error) {
    console.error('数据库初始化失败:', error);
    process.exit(1);
  }
};

seedDatabase();
