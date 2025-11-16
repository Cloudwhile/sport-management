import { Request, Response } from 'express';
import { Op } from 'sequelize';
import * as XLSX from 'xlsx';
import {
  Student,
  Class,
  StudentClassRelation,
} from '../models/index.js';
import { hashPassword } from '../utils/password.js';

// 获取学生列表
export const getAll = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      pageSize = 10,
      search = '',
      name,
      studentIdNational,
      studentIdSchool,
      gender,
      classId,
      gradeId,
      academicYear,
    } = req.query;

    const limit = parseInt(pageSize as string);
    const offset = (parseInt(page as string) - 1) * limit;

    // 构建查询条件
    const whereConditions: any = {};
    const relationWhereConditions: any = { isActive: true };

    // 通用搜索条件（姓名或学号）
    if (search) {
      whereConditions[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { studentIdNational: { [Op.iLike]: `%${search}%` } },
        { studentIdSchool: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // 单独的筛选条件
    if (name) {
      whereConditions.name = { [Op.iLike]: `%${name}%` };
    }

    if (studentIdNational) {
      whereConditions.studentIdNational = { [Op.iLike]: `%${studentIdNational}%` };
    }

    if (studentIdSchool) {
      whereConditions.studentIdSchool = { [Op.iLike]: `%${studentIdSchool}%` };
    }

    if (gender) {
      whereConditions.gender = gender;
    }

    // 班级筛选
    if (classId) {
      relationWhereConditions.classId = parseInt(classId as string);
    }

    // 学年筛选
    if (academicYear) {
      relationWhereConditions.academicYear = academicYear;
    }

    // 构建 include 条件
    const includeConditions: any[] = [
      {
        model: StudentClassRelation,
        as: 'classRelations',
        where: relationWhereConditions,
        required: true,
        include: [
          {
            model: Class,
            as: 'class',
          },
        ],
      },
    ];

    // 查询数据
    const { count, rows } = await Student.findAndCountAll({
      where: whereConditions,
      include: includeConditions,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      distinct: true,
    });

    // 处理返回数据
    const students = rows.map((student) => {
      const studentData = student.toJSON() as any;
      const currentRelation = studentData.classRelations.find((r: any) => r.isActive);

      return {
        id: studentData.id,
        studentIdNational: studentData.studentIdNational,
        studentIdSchool: studentData.studentIdSchool,
        name: studentData.name,
        gender: studentData.gender,
        birthDate: studentData.birthDate,
        idCardNumber: studentData.idCardNumber,
        createdAt: studentData.createdAt,
        updatedAt: studentData.updatedAt,
        currentClass: currentRelation
          ? {
              id: currentRelation.class.id,
              cohort: currentRelation.class.cohort,
              className: currentRelation.class.className,
              // classAccount 移除，学生端不需要看到班级账号
            }
          : null,
        currentAcademicYear: currentRelation ? currentRelation.academicYear : null,
      };
    });

    res.json({
      data: students,
      pagination: {
        total: count,
        page: parseInt(page as string),
        pageSize: limit,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error('获取学生列表失败:', error);
    res.status(500).json({ error: '获取学生列表失败', message: (error as Error).message });
  }
};

// 获取学生详情
export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const student = await Student.findByPk(id, {
      include: [
        {
          model: StudentClassRelation,
          as: 'classRelations',
          include: [
            {
              model: Class,
              as: 'class',
            },
          ],
          order: [['academicYear', 'DESC']],
        },
      ],
    });

    if (!student) {
      res.status(404).json({ error: '学生不存在' });
      return;
    }

    const studentData = student.toJSON() as any;
    const currentRelation = studentData.classRelations.find((r: any) => r.isActive);

    res.json({
      ...studentData,
      currentClass: currentRelation
        ? {
            id: currentRelation.class.id,
            cohort: currentRelation.class.cohort,
            className: currentRelation.class.className,
            // classAccount 移除，学生端不需要看到班级账号
          }
        : null,
      currentAcademicYear: currentRelation ? currentRelation.academicYear : null,
    });
  } catch (error) {
    console.error('获取学生详情失败:', error);
    res.status(500).json({ error: '获取学生详情失败', message: (error as Error).message });
  }
};

// 创建学生
export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      studentIdNational,
      studentIdSchool,
      name,
      gender,
      birthDate,
      idCardNumber,
      classId,
      academicYear,
    } = req.body;

    // 验证必填字段
    if (!studentIdNational || !studentIdSchool || !name || !gender) {
      res.status(400).json({ error: '缺少必填字段' });
      return;
    }

    if (!classId || !academicYear) {
      res.status(400).json({ error: '必须指定班级和学年' });
      return;
    }

    // 检查学籍号是否已存在
    const existingNational = await Student.findOne({
      where: { studentIdNational },
    });
    if (existingNational) {
      res.status(400).json({ error: '学籍号已存在' });
      return;
    }

    // 检查学校学号是否已存在
    const existingSchool = await Student.findOne({
      where: { studentIdSchool },
    });
    if (existingSchool) {
      res.status(400).json({ error: '学校学号已存在' });
      return;
    }

    // 检查班级是否存在
    const classExists = await Class.findByPk(classId);
    if (!classExists) {
      res.status(400).json({ error: '班级不存在' });
      return;
    }

    // 创建学生
    const student = await Student.create({
      studentIdNational,
      studentIdSchool,
      name,
      gender,
      birthDate,
      idCardNumber,
    });

    // 创建学生-班级关联
    await StudentClassRelation.create({
      studentId: student.get('id') as number,
      classId: parseInt(classId),
      academicYear,
      isActive: true,
    });

    // 获取完整的学生信息（包含班级）
    const studentWithClass = await Student.findByPk(student.get('id') as number, {
      include: [
        {
          model: StudentClassRelation,
          as: 'classRelations',
          where: { isActive: true },
          include: [
            {
              model: Class,
              as: 'class',
            },
          ],
        },
      ],
    });

    res.status(201).json({
      message: '学生创建成功',
      data: studentWithClass,
    });
  } catch (error) {
    console.error('创建学生失败:', error);
    res.status(500).json({ error: '创建学生失败', message: (error as Error).message });
  }
};

// 更新学生
export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      studentIdNational,
      studentIdSchool,
      name,
      gender,
      birthDate,
      idCardNumber,
    } = req.body;

    const student = await Student.findByPk(id);
    if (!student) {
      res.status(404).json({ error: '学生不存在' });
      return;
    }

    // 如果更新学籍号，检查是否与其他学生重复
    if (studentIdNational && studentIdNational !== student.get('studentIdNational')) {
      const existing = await Student.findOne({
        where: {
          studentIdNational,
          id: { [Op.ne]: id },
        },
      });
      if (existing) {
        res.status(400).json({ error: '学籍号已存在' });
        return;
      }
    }

    // 如果更新学校学号，检查是否与其他学生重复
    if (studentIdSchool && studentIdSchool !== student.get('studentIdSchool')) {
      const existing = await Student.findOne({
        where: {
          studentIdSchool,
          id: { [Op.ne]: id },
        },
      });
      if (existing) {
        res.status(400).json({ error: '学校学号已存在' });
        return;
      }
    }

    // 更新学生信息
    await student.update({
      studentIdNational: studentIdNational || student.get('studentIdNational'),
      studentIdSchool: studentIdSchool || student.get('studentIdSchool'),
      name: name || student.get('name'),
      gender: gender || student.get('gender'),
      birthDate: birthDate !== undefined ? birthDate : student.get('birthDate'),
      idCardNumber: idCardNumber !== undefined ? idCardNumber : student.get('idCardNumber'),
    });

    // 获取更新后的完整信息
    const updatedStudent = await Student.findByPk(id, {
      include: [
        {
          model: StudentClassRelation,
          as: 'classRelations',
          where: { isActive: true },
          include: [
            {
              model: Class,
              as: 'class',
            },
          ],
        },
      ],
    });

    res.json({
      message: '学生信息更新成功',
      data: updatedStudent,
    });
  } catch (error) {
    console.error('更新学生失败:', error);
    res.status(500).json({ error: '更新学生失败', message: (error as Error).message });
  }
};

// 删除学生
export const deleteStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const student = await Student.findByPk(id);
    if (!student) {
      res.status(404).json({ error: '学生不存在' });
      return;
    }

    // 删除学生的所有班级关联
    await StudentClassRelation.destroy({
      where: { studentId: id },
    });

    // 删除学生
    await student.destroy();

    res.json({ message: '学生删除成功' });
  } catch (error) {
    console.error('删除学生失败:', error);
    res.status(500).json({ error: '删除学生失败', message: (error as Error).message });
  }
};

// 转班操作
export const transfer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { classId, academicYear } = req.body;

    if (!classId || !academicYear) {
      res.status(400).json({ error: '缺少班级或学年信息' });
      return;
    }

    // 检查学生是否存在
    const student = await Student.findByPk(id);
    if (!student) {
      res.status(404).json({ error: '学生不存在' });
      return;
    }

    // 检查新班级是否存在
    const newClass = await Class.findByPk(classId);
    if (!newClass) {
      res.status(400).json({ error: '目标班级不存在' });
      return;
    }

    // 查找当前激活的班级关联
    const currentRelation = await StudentClassRelation.findOne({
      where: {
        studentId: id,
        isActive: true,
      },
    });

    // 如果存在当前班级，将其设置为非激活
    if (currentRelation) {
      await currentRelation.update({ isActive: false });
    }

    // 检查是否已存在相同学年的关联
    const existingRelation = await StudentClassRelation.findOne({
      where: {
        studentId: id,
        academicYear,
      },
    });

    if (existingRelation) {
      // 更新现有关联
      await existingRelation.update({
        classId: parseInt(classId),
        isActive: true,
      });
    } else {
      // 创建新的班级关联
      await StudentClassRelation.create({
        studentId: parseInt(id as string),
        classId: parseInt(classId),
        academicYear,
        isActive: true,
      });
    }

    // 获取更新后的学生信息
    const updatedStudent = await Student.findByPk(id, {
      include: [
        {
          model: StudentClassRelation,
          as: 'classRelations',
          where: { isActive: true },
          include: [
            {
              model: Class,
              as: 'class',
            },
          ],
        },
      ],
    });

    res.json({
      message: '转班成功',
      data: updatedStudent,
    });
  } catch (error) {
    console.error('转班失败:', error);
    res.status(500).json({ error: '转班失败', message: (error as Error).message });
  }
};

// 批量导入学生
export const batchImport = async (req: Request, res: Response): Promise<void> => {
  try {
    // 检查是否有上传文件
    if (!req.file) {
      res.status(400).json({ error: '请上传文件' });
      return;
    }

    // 获取学年参数
    const academicYear = req.body.academicYear;
    if (!academicYear) {
      res.status(400).json({ error: '请提供学年参数' });
      return;
    }

    // 解析 Excel 文件
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    const results = {
      success: 0,
      failed: 0,
      warnings: 0,
      errors: [] as Array<{
        row: number;
        error: string;
        data: any;
        type: 'error' | 'warning';
      }>,
    };

    // 用于跟踪每个班级的缓存（不再包含学年，因为学年由用户统一指定）
    const classCache = new Map<string, number>(); // key: cohort-className, value: classId

    // 处理每一行数据
    for (let i = 0; i < data.length; i++) {
      const row = data[i] as any;
      const rowNumber = i + 2; // Excel行号从2开始（第1行是表头）

      try {
        // 解析班级名称，格式：高中2024级1班
        const classNameRaw = row['班级名称']?.toString().trim();
        if (!classNameRaw) {
          results.errors.push({
            row: rowNumber,
            error: '缺少班级名称',
            data: row,
            type: 'error',
          });
          results.failed++;
          continue;
        }

        // 提取入学年份（级）和班级编号
        // 匹配格式：高中2024级1班 或 初中2023级2班
        const classMatch = classNameRaw.match(/(\d{4})级(\d+)班/);
        if (!classMatch) {
          results.errors.push({
            row: rowNumber,
            error: `班级名称格式错误，应为"高中2024级1班"格式，实际为"${classNameRaw}"`,
            data: row,
            type: 'error',
          });
          results.failed++;
          continue;
        }

        const cohort = classMatch[1]; // 入学年份，如 "2024"
        const classNumber = classMatch[2]; // 班级编号，如 "1"

        // 将数字班级编号转换为中文
        const numberToChinese = (num: string): string => {
          const map: Record<string, string> = {
            '1': '一', '2': '二', '3': '三', '4': '四', '5': '五',
            '6': '六', '7': '七', '8': '八', '9': '九', '10': '十',
            '11': '十一', '12': '十二', '13': '十三', '14': '十四', '15': '十五',
            '16': '十六', '17': '十七', '18': '十八', '19': '十九', '20': '二十'
          };
          return map[num] || num;
        };

        // 从班级名称中提取学段和班级名（如 "一班"）
        const classNameOnly = `${numberToChinese(classNumber)}班`;

        // 查找或缓存班级
        const cacheKey = `${cohort}-${classNameOnly}`;
        let classId = classCache.get(cacheKey);

        if (!classId) {
          // 查找班级
          let foundClass = await Class.findOne({
            where: {
              cohort,
              className: classNameOnly,
            },
          });

          // 如果班级不存在，自动创建
          if (!foundClass) {
            // 生成班级账号：格式为 class_cohort_classNumber，如 class_2024_01
            const classAccount = `class_${cohort}_${classNumber.padStart(2, '0')}`;
            // 生成默认密码：格式为 cohort+班级编号，如 202401
            const defaultPassword = `${cohort}${classNumber.padStart(2, '0')}`;
            // 对密码进行 hash
            const classPassword = await hashPassword(defaultPassword);

            foundClass = await Class.create({
              cohort,
              className: classNameOnly,
              classAccount,
              classPassword,
            });

            console.log(`自动创建班级：${cohort}级 ${classNameOnly}，账号：${classAccount}，默认密码：${defaultPassword}`);
          }

          classId = foundClass.get('id') as number;
          classCache.set(cacheKey, classId);
        }

        // 验证必填字段
        const studentIdNational = row['学籍号']?.toString().trim();
        const name = row['姓名']?.toString().trim();
        const genderCode = row['性别'];

        const missingFields = [];
        if (!studentIdNational) missingFields.push('学籍号');
        if (!name) missingFields.push('姓名');
        if (genderCode === undefined || genderCode === null) missingFields.push('性别');

        if (missingFields.length > 0) {
          results.errors.push({
            row: rowNumber,
            error: `缺少必填字段：${missingFields.join('、')}`,
            data: row,
            type: 'error',
          });
          results.failed++;
          continue;
        }

        // 性别转换：1=男，2=女
        let gender: 'male' | 'female';
        const genderNum = parseInt(genderCode.toString());
        if (genderNum === 1) {
          gender = 'male';
        } else if (genderNum === 2) {
          gender = 'female';
        } else {
          results.errors.push({
            row: rowNumber,
            error: `性别代码错误，应为1（男）或2（女），实际为"${genderCode}"`,
            data: row,
            type: 'error',
          });
          results.failed++;
          continue;
        }

        // 处理出生日期（格式：2009/08/08 或 Excel序列号）
        let birthDate: string | null = null;
        if (row['出生日期']) {
          const birthDateRaw = row['出生日期'];

          // 检查是否为 Excel 日期序列号（纯数字）
          if (typeof birthDateRaw === 'number') {
            // Excel 日期序列号转换为 JS 日期
            // Excel 日期从 1900-01-01 开始，但有一个1900年闰年bug，实际需要减去2
            const excelEpoch = new Date(1899, 11, 30); // 1899年12月30日
            const jsDate = new Date(excelEpoch.getTime() + birthDateRaw * 86400000); // 86400000ms = 1天

            const year = jsDate.getFullYear();
            const month = String(jsDate.getMonth() + 1).padStart(2, '0');
            const day = String(jsDate.getDate()).padStart(2, '0');
            birthDate = `${year}-${month}-${day}`;
          } else {
            // 尝试解析文本格式的日期
            const birthDateStr = birthDateRaw.toString().trim();
            const dateMatch = birthDateStr.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
            if (dateMatch) {
              const year = dateMatch[1];
              const month = dateMatch[2].padStart(2, '0');
              const day = dateMatch[3].padStart(2, '0');
              birthDate = `${year}-${month}-${day}`;
            } else {
              results.errors.push({
                row: rowNumber,
                error: `出生日期格式错误："${birthDateStr}"，应为 YYYY/MM/DD 格式`,
                data: row,
                type: 'warning',
              });
              results.warnings++;
            }
          }
        }

        // 处理身份证号（可能为空，转为字符串）
        let idCardNumber: string | null = null;
        if (row['身份证号']) {
          idCardNumber = row['身份证号'].toString().trim();
          if (!idCardNumber) {
            idCardNumber = null;
          }
        }

        // 处理民族代码（数字）
        let ethnicityCode: string | null = null;
        if (row['民族代码']) {
          ethnicityCode = row['民族代码'].toString().trim();
          if (!ethnicityCode) {
            ethnicityCode = null;
          }
        }

        // 检查学籍号是否已存在
        const existingStudent = await Student.findOne({
          where: { studentIdNational },
        });

        let student: any;
        let isUpdate = false;

        if (existingStudent) {
          // 学生已存在，更新学生信息
          isUpdate = true;
          await existingStudent.update({
            name,
            gender,
            birthDate,
            idCardNumber,
            ethnicityCode,
          });
          student = existingStudent;
        } else {
          // 学生不存在，创建新学生
          const studentIdSchool = studentIdNational; // 使用学籍号作为学校学号

          student = await Student.create({
            studentIdNational,
            studentIdSchool,
            name,
            gender,
            birthDate,
            idCardNumber,
            ethnicityCode,
          });
        }

        // 处理班级关联
        const studentId = student.get('id') as number;

        // 查找该学生当前激活的班级关系
        const currentActiveRelation = await StudentClassRelation.findOne({
          where: {
            studentId,
            isActive: true,
          },
        });

        // 检查是否需要更新班级关系
        let needUpdate = true;
        if (currentActiveRelation) {
          const currentClassId = currentActiveRelation.get('classId') as number;
          const currentAcademicYear = currentActiveRelation.get('academicYear') as string;

          // 如果当前班级和学年都一致，不需要更新
          if (currentClassId === classId && currentAcademicYear === academicYear) {
            needUpdate = false;
          }
        }

        if (needUpdate) {
          // 将之前的所有关系设置为 inactive
          await StudentClassRelation.update(
            { isActive: false },
            {
              where: {
                studentId,
                isActive: true,
              },
            }
          );

          // 检查是否已经存在相同班级和学年的关系（可能之前被设为 inactive）
          const existingRelation = await StudentClassRelation.findOne({
            where: {
              studentId,
              classId: classId,
              academicYear: academicYear,
            },
          });

          if (existingRelation) {
            // 已存在该关系，重新激活
            await existingRelation.update({ isActive: true });
          } else {
            // 不存在，创建新的班级关系
            await StudentClassRelation.create({
              studentId,
              classId: classId,
              academicYear: academicYear,
              isActive: true,
            });
          }
        }

        results.success++;

        // 如果是更新操作，添加一个提示
        if (isUpdate) {
          results.errors.push({
            row: rowNumber,
            error: `学生 ${name}(${studentIdNational}) 已存在，已更新其信息和班级关系`,
            data: row,
            type: 'warning',
          });
          results.warnings++;
        }
      } catch (error) {
        console.error(`第 ${rowNumber} 行导入失败:`, (error as Error).message, '数据:', row);
        results.errors.push({
          row: rowNumber,
          error: (error as Error).message,
          data: row,
          type: 'error',
        });
        results.failed++;
      }
    }

    console.log('批量导入完成:', results);
    console.log('失败的前10条:', results.errors.slice(0, 10));

    res.json({
      message: `批量导入完成，成功 ${results.success} 条，失败 ${results.failed} 条，警告 ${results.warnings} 条`,
      data: results,
    });
  } catch (error) {
    console.error('批量导入失败:', error);
    res.status(500).json({ error: '批量导入失败', message: (error as Error).message });
  }
};
