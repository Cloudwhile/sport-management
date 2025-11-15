import { Request, Response } from 'express';
import { Class } from '../models/index.js';
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import {
  calculateGradeLevel,
  getCurrentAcademicYear,
  getGradeName,
  getGraduationYear,
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
        gradeLevel,
        academicYear,
        graduated,
        page = 1,
        pageSize = 10,
      } = req.query;

      const where: any = {};

      // 按cohort筛选
      if (cohort) {
        where.cohort = cohort;
      }

      // 按是否毕业筛选
      if (graduated !== undefined) {
        where.graduated = graduated === 'true';
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

      // 获取当前学年用于计算年级
      const currentYear = academicYear as string || await getCurrentAcademicYear();

      // 为每个班级添加计算的年级信息
      let classesWithGrade = rows.map((cls) => {
        const classData = cls.toJSON() as any;
        const currentGradeLevel = calculateGradeLevel(classData.cohort, currentYear);

        return {
          ...classData,
          currentGradeLevel,
          currentGradeName: currentGradeLevel ? getGradeName(currentGradeLevel) : '已毕业',
          currentAcademicYear: currentYear,
        };
      });

      // 如果指定了gradeLevel筛选，过滤结果
      if (gradeLevel) {
        const targetLevel = parseInt(gradeLevel as string);
        classesWithGrade = classesWithGrade.filter(
          (cls) => cls.currentGradeLevel === targetLevel
        );
        count = classesWithGrade.length;
      }

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

      res.json({
        success: true,
        data: {
          ...classJson,
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
          error: 'cohort格式不正确，应为"2024级"格式',
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
      const cohortYear = cohort.replace(/级$/, '');
      const classNumber = extractClassNumber(className);
      const classAccount = `class_${cohortYear}_${classNumber}`;

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

      // 计算预计毕业年份
      const graduationYear = getGraduationYear(cohort, schoolYears);

      // 创建班级
      const newClass = await Class.create({
        cohort,
        className,
        classAccount,
        classPassword: hashedPassword,
        graduated: false,
        graduationYear,
      });

      // 添加计算的年级信息
      const currentYear = await getCurrentAcademicYear();
      const classJson = newClass.toJSON() as any;
      const currentGradeLevel = calculateGradeLevel(cohort, currentYear);

      res.status(201).json({
        success: true,
        data: {
          ...classJson,
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
      const { cohort, className, graduated, schoolYears = 3 } = req.body;

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
          error: 'cohort格式不正确，应为"2024级"格式',
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

      // 更新班级信息
      const updateData: any = {};
      if (cohort) updateData.cohort = cohort;
      if (className) updateData.className = className;
      if (graduated !== undefined) updateData.graduated = graduated;

      // 如果更新了cohort或className，重新生成班级账号
      if (cohort || className) {
        const finalCohort = cohort || classData.get('cohort');
        const finalClassName = className || classData.get('className');

        const cohortYear = (finalCohort as string).replace(/级$/, '');
        const classNumber = extractClassNumber(finalClassName as string);
        updateData.classAccount = `class_${cohortYear}_${classNumber}`;
      }

      // 如果更新了cohort，重新计算毕业年份
      if (cohort) {
        updateData.graduationYear = getGraduationYear(cohort, schoolYears);
      }

      await classData.update(updateData);

      // 重新查询并添加年级信息
      const updatedClass = await Class.findByPk(id);
      const currentYear = await getCurrentAcademicYear();
      const classJson = updatedClass!.toJSON() as any;
      const currentGradeLevel = calculateGradeLevel(classJson.cohort, currentYear);

      res.json({
        success: true,
        data: {
          ...classJson,
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
}

export default new ClassController();
