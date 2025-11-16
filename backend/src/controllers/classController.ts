import { Request, Response } from 'express';
import { Class } from '../models/index.js';
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import {
  calculateGradeLevel,
  getCurrentAcademicYear,
  getGradeName,
  isGraduated,
  isValidCohort,
  extractClassNumber,
} from '../utils/gradeHelper.js';

/**
 * 班级控制器（基于cohort设计）
 */
class ClassController {
  /**
   * 获取所有班级
   * 支持按cohort、gradeLevel、是否毕业筛选，支持分页
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const {
        cohort,
        className,
        classAccount,
        gradeLevel,
        academicYear,
        graduated,
        page = 1,
        pageSize = 10,
      } = req.query;

      // 获取当前学年用于计算年级
      const currentYear = academicYear as string || await getCurrentAcademicYear();

      const where: any = {};

      // 按className筛选（模糊匹配）
      if (className) {
        where.className = { [Op.iLike]: `%${className}%` };
      }

      // 按classAccount筛选（模糊匹配）
      if (classAccount) {
        where.classAccount = { [Op.iLike]: `%${classAccount}%` };
      }

      // cohort、gradeLevel、graduated 三者只能选其一（优先级：gradeLevel > graduated > cohort）
      if (gradeLevel) {
        // 按年级筛选（需要计算对应的cohort）
        const targetLevel = parseInt(gradeLevel as string);
        const currentYearInt = parseInt(currentYear.split('-')[0]); // 从 "2024-2025" 取 2024
        const targetCohort = (currentYearInt - targetLevel + 1).toString();
        where.cohort = targetCohort;
      } else if (graduated !== undefined) {
        // 按毕业状态筛选（需要计算对应的cohort范围）
        const isGraduatedFilter = graduated === 'true';
        const currentYearInt = parseInt(currentYear.split('-')[0]);
        const config = (await import('../config/school.js')).getSchoolConfig();

        if (isGraduatedFilter) {
          // 已毕业：cohort < (当前年份 - 学制年数 + 1)
          const maxGraduatedCohort = currentYearInt - config.schoolYears;
          where.cohort = { [Op.lt]: maxGraduatedCohort.toString() };
        } else {
          // 未毕业：cohort >= (当前年份 - 学制年数 + 1)
          const minActiveCohort = currentYearInt - config.schoolYears + 1;
          where.cohort = { [Op.gte]: minActiveCohort.toString() };
        }
      } else if (cohort) {
        // 按cohort筛选（精确匹配）
        where.cohort = cohort;
      }

      const limit = parseInt(pageSize as string);
      const offset = (parseInt(page as string) - 1) * limit;

      let { count, rows } = await Class.findAndCountAll({
        where,
        limit,
        offset,
        order: [
          ['cohort', 'DESC'],
          ['className', 'ASC'],
        ],
      });

      // 导入StudentClassRelation用于统计学生数量
      const StudentClassRelation = (await import('../models/StudentClassRelation.js')).default;

      // 为每个班级添加计算的年级信息和学生数量
      const classesWithGrade = await Promise.all(
        rows.map(async (cls) => {
          const classData = cls.toJSON() as any;
          const currentGradeLevel = calculateGradeLevel(classData.cohort, currentYear);

          // 统计当前在读学生数量
          const studentCount = await StudentClassRelation.count({
            where: {
              classId: classData.id,
              isActive: true,
            },
          });

          // 移除敏感字段
          const { classPassword, ...safeData } = classData;

          return {
            ...safeData,
            currentGradeLevel,
            currentGradeName: currentGradeLevel ? getGradeName(currentGradeLevel) : '已毕业',
            currentAcademicYear: currentYear,
            studentCount,
          };
        })
      );

      res.json({
        success: true,
        data: classesWithGrade,
        pagination: {
          total: count,
          page: parseInt(page as string),
          pageSize: limit,
          totalPages: Math.ceil(count / limit),
        },
      });
    } catch (error) {
      console.error('获取班级列表失败:', error);
      res.status(500).json({
        success: false,
        error: '获取班级列表失败',
        message: (error as Error).message,
      });
    }
  }

  /**
   * 根据ID获取班级详情
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { academicYear } = req.query;

      const classData = await Class.findByPk(id);

      if (!classData) {
        res.status(404).json({
          success: false,
          error: '班级不存在',
        });
        return;
      }

      // 获取当前学年
      const currentYear = academicYear as string || await getCurrentAcademicYear();
      const classJson = classData.toJSON() as any;
      const currentGradeLevel = calculateGradeLevel(classJson.cohort, currentYear);

      // 移除敏感字段
      const { classPassword, ...safeData } = classJson;

      res.json({
        success: true,
        data: {
          ...safeData,
          currentGradeLevel,
          currentGradeName: currentGradeLevel ? getGradeName(currentGradeLevel) : '已毕业',
          currentAcademicYear: currentYear,
        },
      });
    } catch (error) {
      console.error('获取班级详情失败:', error);
      res.status(500).json({
        success: false,
        error: '获取班级详情失败',
        message: (error as Error).message,
      });
    }
  }

  /**
   * 创建班级
   * 基于cohort（入学年份）创建，自动生成固定的班级账号
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { cohort, className, schoolYears = 3 } = req.body;

      // 验证必填字段
      if (!cohort || !className) {
        res.status(400).json({
          success: false,
          error: 'cohort和className为必填项',
        });
        return;
      }

      // 验证cohort格式
      if (!isValidCohort(cohort)) {
        res.status(400).json({
          success: false,
          error: 'cohort格式不正确，应为"2024"格式（纯数字年份）',
        });
        return;
      }

      // 检查是否已存在相同的班级
      const existingClass = await Class.findOne({
        where: {
          cohort,
          className,
        },
      });

      if (existingClass) {
        res.status(400).json({
          success: false,
          error: '该届已存在相同的班级',
        });
        return;
      }

      // 生成固定的班级账号：class_{入学年份}_{班号}
      const classNumber = extractClassNumber(className);
      const classAccount = `class_${cohort}_${classNumber}`;

      // 检查账号是否已被使用
      const existingAccount = await Class.findOne({
        where: { classAccount },
      });

      if (existingAccount) {
        res.status(400).json({
          success: false,
          error: '班级账号已存在',
        });
        return;
      }

      // 生成初始密码（默认为 123456）
      const defaultPassword = '123456';
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);

      // 创建班级（毕业状态将自动计算）
      const newClass = await Class.create({
        cohort,
        className,
        classAccount,
        classPassword: hashedPassword,
      });

      // 添加计算的年级信息
      const currentYear = await getCurrentAcademicYear();
      const classJson = newClass.toJSON() as any;
      const currentGradeLevel = calculateGradeLevel(cohort, currentYear);

      // 移除敏感字段
      const { classPassword: _, ...safeData } = classJson;

      res.status(201).json({
        success: true,
        data: {
          ...safeData,
          currentGradeLevel,
          currentGradeName: currentGradeLevel ? getGradeName(currentGradeLevel) : '未入学',
          currentAcademicYear: currentYear,
        },
        initialPassword: defaultPassword, // 返回初始密码供管理员查看
      });
    } catch (error) {
      console.error('创建班级失败:', error);
      res.status(500).json({
        success: false,
        error: '创建班级失败',
        message: (error as Error).message,
      });
    }
  }

  /**
   * 更新班级
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { cohort, className } = req.body;

      // 查找班级
      const classData = await Class.findByPk(id);
      if (!classData) {
        res.status(404).json({
          success: false,
          error: '班级不存在',
        });
        return;
      }

      // 验证cohort格式（如果有修改）
      if (cohort && !isValidCohort(cohort)) {
        res.status(400).json({
          success: false,
          error: 'cohort格式不正确，应为"2024"格式',
        });
        return;
      }

      // 检查是否与其他班级重名
      if (cohort || className) {
        const checkCohort = cohort || classData.get('cohort');
        const checkClassName = className || classData.get('className');

        const existingClass = await Class.findOne({
          where: {
            id: { [Op.ne]: id },
            cohort: checkCohort,
            className: checkClassName,
          },
        });

        if (existingClass) {
          res.status(400).json({
            success: false,
            error: '该届已存在相同的班级',
          });
          return;
        }
      }

      // 更新班级信息（毕业状态将自动计算）
      const updateData: any = {};
      if (cohort) updateData.cohort = cohort;
      if (className) updateData.className = className;

      // 如果更新了cohort或className，重新生成班级账号
      if (cohort || className) {
        const finalCohort = cohort || classData.get('cohort');
        const finalClassName = className || classData.get('className');

        const cohortYear = (finalCohort as string).replace(/级$/, '');
        const classNumber = extractClassNumber(finalClassName as string);
        updateData.classAccount = `class_${cohortYear}_${classNumber}`;
      }

      await classData.update(updateData);

      // 重新查询并添加年级信息
      const updatedClass = await Class.findByPk(id);
      const currentYear = await getCurrentAcademicYear();
      const classJson = updatedClass!.toJSON() as any;
      const currentGradeLevel = calculateGradeLevel(classJson.cohort, currentYear);

      // 移除敏感字段
      const { classPassword, ...safeData } = classJson;

      res.json({
        success: true,
        data: {
          ...safeData,
          currentGradeLevel,
          currentGradeName: currentGradeLevel ? getGradeName(currentGradeLevel) : '已毕业',
          currentAcademicYear: currentYear,
        },
      });
    } catch (error) {
      console.error('更新班级失败:', error);
      res.status(500).json({
        success: false,
        error: '更新班级失败',
        message: (error as Error).message,
      });
    }
  }

  /**
   * 删除班级
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const classData = await Class.findByPk(id);
      if (!classData) {
        res.status(404).json({
          success: false,
          error: '班级不存在',
        });
        return;
      }

      // 检查是否有学生或其他关联数据，如果有则不允许删除
      const StudentClassRelation = (await import('../models/StudentClassRelation.js')).default;
      const studentCount = await StudentClassRelation.count({ where: { classId: id } });
      if (studentCount > 0) {
        res.status(400).json({
          success: false,
          error: '该班级下还有学生，无法删除',
        });
        return;
      }

      await classData.destroy();

      res.json({
        success: true,
        message: '班级删除成功',
      });
    } catch (error) {
      console.error('删除班级失败:', error);
      res.status(500).json({
        success: false,
        error: '删除班级失败',
        message: (error as Error).message,
      });
    }
  }

  /**
   * 重置班级密码
   */
  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const classData = await Class.findByPk(id);
      if (!classData) {
        res.status(404).json({
          success: false,
          error: '班级不存在',
        });
        return;
      }

      // 重置为默认密码 123456
      const defaultPassword = '123456';
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);

      await classData.update({
        classPassword: hashedPassword,
      });

      res.json({
        success: true,
        message: '密码重置成功',
        newPassword: defaultPassword,
      });
    } catch (error) {
      console.error('重置密码失败:', error);
      res.status(500).json({
        success: false,
        error: '重置密码失败',
        message: (error as Error).message,
      });
    }
  }

  /**
   * 添加学生到班级
   */
  async addStudent(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { studentId, academicYear } = req.body;

      if (!studentId || !academicYear) {
        res.status(400).json({
          success: false,
          error: '缺少学生ID或学年参数',
        });
        return;
      }

      // 检查班级是否存在
      const classData = await Class.findByPk(id);
      if (!classData) {
        res.status(404).json({
          success: false,
          error: '班级不存在',
        });
        return;
      }

      // 检查学生是否存在
      const Student = (await import('../models/Student.js')).default;
      const student = await Student.findByPk(studentId);
      if (!student) {
        res.status(404).json({
          success: false,
          error: '学生不存在',
        });
        return;
      }

      const StudentClassRelation = (await import('../models/StudentClassRelation.js')).default;

      // 检查该学年是否已有班级关联
      const existingRelation = await StudentClassRelation.findOne({
        where: {
          studentId: parseInt(studentId),
          academicYear,
        },
      });

      if (existingRelation) {
        res.status(400).json({
          success: false,
          error: '该学生在该学年已有班级关联',
        });
        return;
      }

      // 创建关联
      await StudentClassRelation.create({
        studentId: parseInt(studentId),
        classId: parseInt(id),
        academicYear,
        isActive: true,
      });

      res.json({
        success: true,
        message: '学生添加成功',
      });
    } catch (error) {
      console.error('添加学生到班级失败:', error);
      res.status(500).json({
        success: false,
        error: '添加学生到班级失败',
        message: (error as Error).message,
      });
    }
  }

  /**
   * 从班级移除学生
   */
  async removeStudent(req: Request, res: Response): Promise<void> {
    try {
      const { id, studentId } = req.params;

      // 检查班级是否存在
      const classData = await Class.findByPk(id);
      if (!classData) {
        res.status(404).json({
          success: false,
          error: '班级不存在',
        });
        return;
      }

      const StudentClassRelation = (await import('../models/StudentClassRelation.js')).default;

      // 查找学生班级关联
      const relation = await StudentClassRelation.findOne({
        where: {
          studentId: parseInt(studentId),
          classId: parseInt(id),
        },
      });

      if (!relation) {
        res.status(404).json({
          success: false,
          error: '该学生不在该班级中',
        });
        return;
      }

      // 删除关联
      await relation.destroy();

      res.json({
        success: true,
        message: '学生移除成功',
      });
    } catch (error) {
      console.error('从班级移除学生失败:', error);
      res.status(500).json({
        success: false,
        error: '从班级移除学生失败',
        message: (error as Error).message,
      });
    }
  }

  /**
   * 获取班级统计详情
   * 包括：班级基本信息、学生列表、体测统计数据
   */
  async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { academicYear } = req.query;

      // 查找班级
      const classData = await Class.findByPk(id);
      if (!classData) {
        res.status(404).json({
          success: false,
          error: '班级不存在',
        });
        return;
      }

      // 获取当前学年
      const currentYear = academicYear as string || await getCurrentAcademicYear();
      const classJson = classData.toJSON() as any;
      const currentGradeLevel = calculateGradeLevel(classJson.cohort, currentYear);

      // 导入必要的模型
      const Student = (await import('../models/Student.js')).default;
      const StudentClassRelation = (await import('../models/StudentClassRelation.js')).default;
      const PhysicalTestRecord = (await import('../models/PhysicalTestRecord.js')).default;
      const PhysicalTestForm = (await import('../models/PhysicalTestForm.js')).default;

      // 获取班级的所有当前在读学生
      const studentRelations = await StudentClassRelation.findAll({
        where: {
          classId: id,
          isActive: true,
        },
        include: [
          {
            model: Student,
            as: 'student',
            attributes: ['id', 'studentIdNational', 'studentIdSchool', 'name', 'gender', 'birthDate'],
          },
        ],
        order: [['id', 'ASC']],
      });

      const students = studentRelations.map((rel: any) => rel.student);

      // 统计该班级参与的体测表单数量
      const testFormsCount = await PhysicalTestForm.count({
        where: {
          participatingCohorts: {
            [Op.contains]: [classJson.cohort.replace(/级$/, '')],
          },
        },
      });

      // 统计该班级学生的体测记录总数
      const studentIds = students.map((s: any) => s.id);
      const testRecordsCount = studentIds.length > 0
        ? await PhysicalTestRecord.count({
            where: {
              studentId: {
                [Op.in]: studentIds,
              },
            },
          })
        : 0;

      // 计算平均完成率（如果有体测表单的话）
      let completionRate = 0;
      if (testFormsCount > 0 && students.length > 0) {
        const totalExpectedRecords = testFormsCount * students.length;
        completionRate = totalExpectedRecords > 0
          ? Math.round((testRecordsCount / totalExpectedRecords) * 100)
          : 0;
      }

      // 移除敏感字段
      const { classPassword, ...safeClassData } = classJson;

      // 返回统计数据
      res.json({
        success: true,
        data: {
          // 班级基本信息
          classInfo: {
            ...safeClassData,
            currentGradeLevel,
            currentGradeName: currentGradeLevel ? getGradeName(currentGradeLevel) : '已毕业',
            currentAcademicYear: currentYear,
            studentCount: students.length,
          },
          // 学生列表
          students,
          // 体测统计
          testStatistics: {
            participatedFormsCount: testFormsCount, // 参与的体测表单数量
            totalRecordsCount: testRecordsCount, // 体测记录总数
            completionRate, // 完成率（百分比）
          },
        },
      });
    } catch (error) {
      console.error('获取班级统计信息失败:', error);
      res.status(500).json({
        success: false,
        error: '获取班级统计信息失败',
        message: (error as Error).message,
      });
    }
  }
}

export default new ClassController();
