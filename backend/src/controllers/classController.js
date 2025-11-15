import { Class, Grade } from '../models/index.js';
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';

/**
 * 班级控制器
 */
class ClassController {
  /**
   * 获取所有班级
   * 支持按年级筛选、分页
   */
  async getAll(req, res) {
    try {
      const {
        gradeId,
        academicYear,
        page = 1,
        limit = 20,
      } = req.query;

      const where = {};
      if (gradeId) where.gradeId = gradeId;
      if (academicYear) where.academicYear = academicYear;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      const { count, rows } = await Class.findAndCountAll({
        where,
        include: [
          {
            model: Grade,
            as: 'grade',
            attributes: ['id', 'gradeName', 'gradeLevel'],
          },
        ],
        limit: parseInt(limit),
        offset,
        order: [
          ['academicYear', 'DESC'],
          ['gradeId', 'ASC'],
          ['className', 'ASC'],
        ],
      });

      res.json({
        success: true,
        data: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error('获取班级列表失败:', error);
      res.status(500).json({
        success: false,
        error: '获取班级列表失败',
        message: error.message,
      });
    }
  }

  /**
   * 根据ID获取班级详情
   */
  async getById(req, res) {
    try {
      const { id } = req.params;

      const classData = await Class.findByPk(id, {
        include: [
          {
            model: Grade,
            as: 'grade',
            attributes: ['id', 'gradeName', 'gradeLevel'],
          },
        ],
      });

      if (!classData) {
        return res.status(404).json({
          success: false,
          error: '班级不存在',
        });
      }

      res.json({
        success: true,
        data: classData,
      });
    } catch (error) {
      console.error('获取班级详情失败:', error);
      res.status(500).json({
        success: false,
        error: '获取班级详情失败',
        message: error.message,
      });
    }
  }

  /**
   * 创建班级
   * 自动生成班级账号和密码
   */
  async create(req, res) {
    try {
      const { gradeId, className, academicYear } = req.body;

      // 验证必填字段
      if (!gradeId || !className || !academicYear) {
        return res.status(400).json({
          success: false,
          error: '年级ID、班级名称和学年为必填项',
        });
      }

      // 验证年级是否存在
      const grade = await Grade.findByPk(gradeId);
      if (!grade) {
        return res.status(404).json({
          success: false,
          error: '年级不存在',
        });
      }

      // 检查同一年级、同一学年下是否已存在相同班级名
      const existingClass = await Class.findOne({
        where: {
          gradeId,
          className,
          academicYear,
        },
      });

      if (existingClass) {
        return res.status(400).json({
          success: false,
          error: '该年级下已存在相同的班级',
        });
      }

      // 生成班级账号：class_{学年}_{年级}_{班级}
      // 提取学年的起始年份，如 2024-2025 -> 2024
      const yearStart = academicYear.split('-')[0];
      // 提取班级数字，如 "一班" -> "1"
      const classNumber = this.extractClassNumber(className);
      const classAccount = `class_${yearStart}_${grade.gradeLevel}_${classNumber}`;

      // 生成初始密码（默认为 123456）
      const defaultPassword = '123456';
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);

      // 创建班级
      const newClass = await Class.create({
        gradeId,
        className,
        academicYear,
        classAccount,
        classPassword: hashedPassword,
      });

      // 重新查询包含年级信息
      const classData = await Class.findByPk(newClass.id, {
        include: [
          {
            model: Grade,
            as: 'grade',
            attributes: ['id', 'gradeName', 'gradeLevel'],
          },
        ],
      });

      res.status(201).json({
        success: true,
        data: classData,
        initialPassword: defaultPassword, // 返回初始密码供管理员查看
      });
    } catch (error) {
      console.error('创建班级失败:', error);
      res.status(500).json({
        success: false,
        error: '创建班级失败',
        message: error.message,
      });
    }
  }

  /**
   * 更新班级
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const { gradeId, className, academicYear } = req.body;

      // 查找班级
      const classData = await Class.findByPk(id);
      if (!classData) {
        return res.status(404).json({
          success: false,
          error: '班级不存在',
        });
      }

      // 如果修改了年级，验证年级是否存在
      if (gradeId && gradeId !== classData.gradeId) {
        const grade = await Grade.findByPk(gradeId);
        if (!grade) {
          return res.status(404).json({
            success: false,
            error: '年级不存在',
          });
        }
      }

      // 检查是否与其他班级重名
      if (gradeId || className || academicYear) {
        const checkGradeId = gradeId || classData.gradeId;
        const checkClassName = className || classData.className;
        const checkAcademicYear = academicYear || classData.academicYear;

        const existingClass = await Class.findOne({
          where: {
            id: { [Op.ne]: id },
            gradeId: checkGradeId,
            className: checkClassName,
            academicYear: checkAcademicYear,
          },
        });

        if (existingClass) {
          return res.status(400).json({
            success: false,
            error: '该年级下已存在相同的班级',
          });
        }
      }

      // 更新班级信息
      const updateData = {};
      if (gradeId) updateData.gradeId = gradeId;
      if (className) updateData.className = className;
      if (academicYear) updateData.academicYear = academicYear;

      // 如果更新了关键信息，重新生成班级账号
      if (gradeId || className || academicYear) {
        const finalGradeId = gradeId || classData.gradeId;
        const finalClassName = className || classData.className;
        const finalAcademicYear = academicYear || classData.academicYear;

        const grade = await Grade.findByPk(finalGradeId);
        const yearStart = finalAcademicYear.split('-')[0];
        const classNumber = this.extractClassNumber(finalClassName);
        updateData.classAccount = `class_${yearStart}_${grade.gradeLevel}_${classNumber}`;
      }

      await classData.update(updateData);

      // 重新查询包含年级信息
      const updatedClass = await Class.findByPk(id, {
        include: [
          {
            model: Grade,
            as: 'grade',
            attributes: ['id', 'gradeName', 'gradeLevel'],
          },
        ],
      });

      res.json({
        success: true,
        data: updatedClass,
      });
    } catch (error) {
      console.error('更新班级失败:', error);
      res.status(500).json({
        success: false,
        error: '更新班级失败',
        message: error.message,
      });
    }
  }

  /**
   * 删除班级
   */
  async delete(req, res) {
    try {
      const { id } = req.params;

      const classData = await Class.findByPk(id);
      if (!classData) {
        return res.status(404).json({
          success: false,
          error: '班级不存在',
        });
      }

      // TODO: 检查是否有学生或其他关联数据，如果有则不允许删除
      // const studentCount = await StudentClassRelation.count({ where: { classId: id } });
      // if (studentCount > 0) {
      //   return res.status(400).json({
      //     success: false,
      //     error: '该班级下还有学生，无法删除',
      //   });
      // }

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
        message: error.message,
      });
    }
  }

  /**
   * 重置班级密码
   */
  async resetPassword(req, res) {
    try {
      const { id } = req.params;

      const classData = await Class.findByPk(id);
      if (!classData) {
        return res.status(404).json({
          success: false,
          error: '班级不存在',
        });
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
        message: error.message,
      });
    }
  }

  /**
   * 从班级名称中提取班级数字
   * 例如：一班 -> 1, 二班 -> 2, 12班 -> 12
   */
  extractClassNumber(className) {
    // 中文数字映射
    const chineseNumbers = {
      '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
      '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
      '十一': 11, '十二': 12, '十三': 13, '十四': 14, '十五': 15,
      '十六': 16, '十七': 17, '十八': 18, '十九': 19, '二十': 20,
    };

    // 提取中文数字（如：一班、二班）
    const chineseMatch = className.match(/^(一|二|三|四|五|六|七|八|九|十|十一|十二|十三|十四|十五|十六|十七|十八|十九|二十)班?$/);
    if (chineseMatch) {
      return chineseNumbers[chineseMatch[1]] || 1;
    }

    // 提取阿拉伯数字（如：1班、12班）
    const numberMatch = className.match(/^(\d+)班?$/);
    if (numberMatch) {
      return parseInt(numberMatch[1]);
    }

    // 如果无法提取，返回1
    return 1;
  }
}

export default new ClassController();
