import { Request, Response } from 'express';
import { Op } from 'sequelize';
import sequelize from '../database/connection.js';
import PhysicalTestRecord from '../models/PhysicalTestRecord.js';
import PhysicalTestForm from '../models/PhysicalTestForm.js';
import FormTestItem from '../models/FormTestItem.js';
import Student from '../models/Student.js';
import Class from '../models/Class.js';
import Grade from '../models/Grade.js';
import StudentClassRelation from '../models/StudentClassRelation.js';

/**
 * 获取整体统计数据
 */
export const getOverallStats = async (req: Request, res: Response) => {
  try {
    const { academicYear } = req.query;

    // 统计学生总数
    const totalStudents = await Student.count();

    // 统计班级总数
    const totalClasses = await Class.count();

    // 统计体测表单数
    const totalForms = await PhysicalTestForm.count();

    // 统计测试记录数
    const totalRecords = await PhysicalTestRecord.count();

    // 如果指定了学年，统计该学年的数据
    let yearStats = null;
    if (academicYear) {
      const yearForms = await PhysicalTestForm.count({
        where: { academicYear: academicYear as string }
      });

      const yearFormIds = await PhysicalTestForm.findAll({
        where: { academicYear: academicYear as string },
        attributes: ['id']
      });

      const yearRecords = await PhysicalTestRecord.count({
        where: {
          formId: {
            [Op.in]: yearFormIds.map(f => f.id)
          }
        }
      });

      yearStats = {
        forms: yearForms,
        records: yearRecords
      };
    }

    res.json({
      success: true,
      data: {
        totalStudents,
        totalClasses,
        totalForms,
        totalRecords,
        yearStats
      }
    });
  } catch (error: any) {
    console.error('获取整体统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取统计数据失败',
      error: error.message
    });
  }
};

/**
 * 获取班级统计数据
 */
export const getClassStats = async (req: Request, res: Response) => {
  try {
    const { formId, classId } = req.params;

    // 获取表单信息
    const form = await PhysicalTestForm.findByPk(formId);
    if (!form) {
      return res.status(404).json({
        success: false,
        message: '表单不存在'
      });
    }

    // 获取班级信息
    const classInfo = await Class.findByPk(classId, {
      include: [{ model: Grade, as: 'grade' }]
    });

    if (!classInfo) {
      return res.status(404).json({
        success: false,
        message: '班级不存在'
      });
    }

    // 获取该班级在该学年的学生总数
    const totalStudents = await StudentClassRelation.count({
      where: {
        classId,
        academicYear: form.academicYear,
        isActive: true
      }
    });

    // 获取已完成测试的学生数
    const completedStudents = await PhysicalTestRecord.count({
      where: {
        formId,
        classId
      }
    });

    // 获取所有记录及分数
    const records = await PhysicalTestRecord.findAll({
      where: {
        formId,
        classId
      },
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'name', 'gender']
        }
      ]
    });

    // 计算平均分
    const totalScore = records.reduce((sum, record) => {
      return sum + (Number(record.totalScore) || 0);
    }, 0);
    const avgScore = completedStudents > 0 ? totalScore / completedStudents : 0;

    // 统计分数分布
    const scoreDistribution = {
      excellent: 0, // >= 90
      good: 0,      // 80-89
      pass: 0,      // 60-79
      fail: 0       // < 60
    };

    records.forEach(record => {
      const score = Number(record.totalScore) || 0;
      if (score >= 90) scoreDistribution.excellent++;
      else if (score >= 80) scoreDistribution.good++;
      else if (score >= 60) scoreDistribution.pass++;
      else scoreDistribution.fail++;
    });

    // 按性别统计
    const maleRecords = records.filter(r => r.student?.gender === 'male');
    const femaleRecords = records.filter(r => r.student?.gender === 'female');

    const maleAvg = maleRecords.length > 0
      ? maleRecords.reduce((sum, r) => sum + (Number(r.totalScore) || 0), 0) / maleRecords.length
      : 0;

    const femaleAvg = femaleRecords.length > 0
      ? femaleRecords.reduce((sum, r) => sum + (Number(r.totalScore) || 0), 0) / femaleRecords.length
      : 0;

    res.json({
      success: true,
      data: {
        class: classInfo,
        form: {
          id: form.id,
          formName: form.formName,
          academicYear: form.academicYear
        },
        stats: {
          totalStudents,
          completedStudents,
          completionRate: totalStudents > 0 ? (completedStudents / totalStudents * 100).toFixed(2) : 0,
          avgScore: avgScore.toFixed(2),
          scoreDistribution,
          genderStats: {
            male: {
              count: maleRecords.length,
              avgScore: maleAvg.toFixed(2)
            },
            female: {
              count: femaleRecords.length,
              avgScore: femaleAvg.toFixed(2)
            }
          }
        }
      }
    });
  } catch (error: any) {
    console.error('获取班级统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取统计数据失败',
      error: error.message
    });
  }
};

/**
 * 获取年级统计数据
 */
export const getGradeStats = async (req: Request, res: Response) => {
  try {
    const { formId, gradeId } = req.params;

    // 获取表单信息
    const form = await PhysicalTestForm.findByPk(formId);
    if (!form) {
      return res.status(404).json({
        success: false,
        message: '表单不存在'
      });
    }

    // 获取年级信息和该年级的所有班级
    const grade = await Grade.findByPk(gradeId, {
      include: [
        {
          model: Class,
          as: 'classes'
        }
      ]
    });

    if (!grade) {
      return res.status(404).json({
        success: false,
        message: '年级不存在'
      });
    }

    const classIds = grade.classes?.map(c => c.id) || [];

    // 统计各班级的数据
    const classStats = [];
    for (const classInfo of grade.classes || []) {
      const totalStudents = await StudentClassRelation.count({
        where: {
          classId: classInfo.id,
          academicYear: form.academicYear,
          isActive: true
        }
      });

      const records = await PhysicalTestRecord.findAll({
        where: {
          formId,
          classId: classInfo.id
        }
      });

      const completedStudents = records.length;
      const totalScore = records.reduce((sum, r) => sum + (Number(r.totalScore) || 0), 0);
      const avgScore = completedStudents > 0 ? totalScore / completedStudents : 0;

      classStats.push({
        classId: classInfo.id,
        className: classInfo.className,
        totalStudents,
        completedStudents,
        avgScore: avgScore.toFixed(2)
      });
    }

    // 年级整体统计
    const allRecords = await PhysicalTestRecord.findAll({
      where: {
        formId,
        classId: {
          [Op.in]: classIds
        }
      }
    });

    const totalScore = allRecords.reduce((sum, r) => sum + (Number(r.totalScore) || 0), 0);
    const avgScore = allRecords.length > 0 ? totalScore / allRecords.length : 0;

    res.json({
      success: true,
      data: {
        grade: {
          id: grade.id,
          gradeName: grade.gradeName,
          gradeLevel: grade.gradeLevel
        },
        form: {
          id: form.id,
          formName: form.formName,
          academicYear: form.academicYear
        },
        overall: {
          totalRecords: allRecords.length,
          avgScore: avgScore.toFixed(2)
        },
        classes: classStats
      }
    });
  } catch (error: any) {
    console.error('获取年级统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取统计数据失败',
      error: error.message
    });
  }
};

/**
 * 获取表单统计数据（全校）
 */
export const getFormStats = async (req: Request, res: Response) => {
  try {
    const { formId } = req.params;

    // 获取表单信息
    const form = await PhysicalTestForm.findByPk(formId, {
      include: [
        {
          model: FormTestItem,
          as: 'testItems',
          order: [['sortOrder', 'ASC']]
        }
      ]
    });

    if (!form) {
      return res.status(404).json({
        success: false,
        message: '表单不存在'
      });
    }

    // 获取所有测试记录
    const records = await PhysicalTestRecord.findAll({
      where: { formId },
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'gender']
        },
        {
          model: Class,
          as: 'class',
          include: [
            {
              model: Grade,
              as: 'grade'
            }
          ]
        }
      ]
    });

    // 整体统计
    const totalScore = records.reduce((sum, r) => sum + (Number(r.totalScore) || 0), 0);
    const avgScore = records.length > 0 ? totalScore / records.length : 0;

    // 分数分布
    const scoreDistribution = {
      excellent: 0,
      good: 0,
      pass: 0,
      fail: 0
    };

    records.forEach(record => {
      const score = Number(record.totalScore) || 0;
      if (score >= 90) scoreDistribution.excellent++;
      else if (score >= 80) scoreDistribution.good++;
      else if (score >= 60) scoreDistribution.pass++;
      else scoreDistribution.fail++;
    });

    // 按年级统计
    const gradeStatsMap = new Map();
    records.forEach(record => {
      const gradeId = record.class?.Grade?.id;
      const gradeName = record.class?.Grade?.gradeName;

      if (gradeId) {
        if (!gradeStatsMap.has(gradeId)) {
          gradeStatsMap.set(gradeId, {
            gradeId,
            gradeName,
            count: 0,
            totalScore: 0
          });
        }

        const stats = gradeStatsMap.get(gradeId);
        stats.count++;
        stats.totalScore += Number(record.totalScore) || 0;
      }
    });

    const gradeStats = Array.from(gradeStatsMap.values()).map(stats => ({
      gradeId: stats.gradeId,
      gradeName: stats.gradeName,
      count: stats.count,
      avgScore: (stats.totalScore / stats.count).toFixed(2)
    }));

    // 各项目平均成绩
    const itemStats: any[] = [];
    if (form.testItems) {
      for (const item of form.testItems) {
        const itemScores: number[] = [];

        records.forEach(record => {
          const scores = record.scores as Record<string, any>;
          if (scores && scores[item.itemCode] != null) {
            itemScores.push(Number(scores[item.itemCode]));
          }
        });

        const itemAvg = itemScores.length > 0
          ? itemScores.reduce((sum, s) => sum + s, 0) / itemScores.length
          : 0;

        itemStats.push({
          itemCode: item.itemCode,
          itemName: item.itemName,
          itemUnit: item.itemUnit,
          avgScore: itemAvg.toFixed(2),
          count: itemScores.length
        });
      }
    }

    res.json({
      success: true,
      data: {
        form: {
          id: form.id,
          formName: form.formName,
          academicYear: form.academicYear,
          testDate: form.testDate
        },
        overall: {
          totalRecords: records.length,
          avgScore: avgScore.toFixed(2),
          scoreDistribution
        },
        gradeStats,
        itemStats
      }
    });
  } catch (error: any) {
    console.error('获取表单统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取统计数据失败',
      error: error.message
    });
  }
};

/**
 * 获取历史趋势数据
 */
export const getTrendData = async (req: Request, res: Response) => {
  try {
    const { classId, gradeId } = req.query;

    // 获取所有已发布的表单
    const forms = await PhysicalTestForm.findAll({
      where: { status: 'published' },
      order: [['academicYear', 'ASC'], ['testDate', 'ASC']]
    });

    const trendData = [];

    for (const form of forms) {
      let whereClause: any = { formId: form.id };

      if (classId) {
        whereClause.classId = classId;
      } else if (gradeId) {
        // 获取该年级的所有班级
        const classes = await Class.findAll({
          where: { gradeId: gradeId as string },
          attributes: ['id']
        });
        whereClause.classId = {
          [Op.in]: classes.map(c => c.id)
        };
      }

      const records = await PhysicalTestRecord.findAll({
        where: whereClause
      });

      const totalScore = records.reduce((sum, r) => sum + (Number(r.totalScore) || 0), 0);
      const avgScore = records.length > 0 ? totalScore / records.length : 0;

      trendData.push({
        formId: form.id,
        formName: form.formName,
        academicYear: form.academicYear,
        testDate: form.testDate,
        count: records.length,
        avgScore: avgScore.toFixed(2)
      });
    }

    res.json({
      success: true,
      data: trendData
    });
  } catch (error: any) {
    console.error('获取趋势数据失败:', error);
    res.status(500).json({
      success: false,
      message: '获取趋势数据失败',
      error: error.message
    });
  }
};
