// @ts-nocheck
import { Request, Response } from 'express';
import PhysicalTestRecord from '../models/PhysicalTestRecord.js';
import PhysicalTestForm from '../models/PhysicalTestForm.js';
import FormTestItem from '../models/FormTestItem.js';
import Student from '../models/Student.js';
import StudentClassRelation from '../models/StudentClassRelation.js';
import Class from '../models/Class.js';
import sequelize from '../database/connection.js';
import { calculateBatchScores, calculateTotalScore, calculateBMI, calculateGradeLevel } from '../utils/scoreCalculator.js';
import { canClassParticipate, getCohortsDisplay } from '../utils/cohortHelper.js';
import { calculateGradeLevel as calculateStudentGradeLevel } from '../utils/gradeHelper.js';

/**
 * 获取班级学生列表（用于录入）
 * 返回班级所有学生及其在指定表单下的体测记录
 */
export const getClassStudentsForForm = async (req: Request, res: Response) => {
  try {
    const { formId, classId } = req.params;
    const { academicYear } = req.query;

    // 验证表单是否存在且已发布
    const form = await PhysicalTestForm.findByPk(formId);
    if (!form) {
      return res.status(404).json({
        success: false,
        message: '表单不存在'
      });
    }

    if (form.status !== 'published') {
      return res.status(400).json({
        success: false,
        message: '表单未发布，无法录入数据'
      });
    }

    // 获取表单的测试项目
    const testItems = await FormTestItem.findAll({
      where: { formId },
      order: [['sortOrder', 'ASC']]
    });

    // 获取班级信息
    const classInfo = await Class.findByPk(classId);

    if (!classInfo) {
      return res.status(404).json({
        success: false,
        message: '班级不存在'
      });
    }

    // 验证班级的年级是否在表单允许范围内
    const classCohort = classInfo.cohort;
    const formCohorts = form.participatingCohorts;

    if (!canClassParticipate(classCohort, formCohorts)) {
      return res.status(403).json({
        success: false,
        message: `该班级(${classCohort}级)不在本次体测允许范围内。允许的年级: ${getCohortsDisplay(formCohorts)}`
      });
    }

    // 获取该班级在指定学年的所有学生
    const year = academicYear || form.academicYear;
    const studentRelations = await StudentClassRelation.findAll({
      where: {
        classId,
        academicYear: year,
        isActive: true
      },
      include: [
        {
          model: Student,
          as: 'student'
        }
      ]
    });

    // 获取这些学生在该表单下的体测记录
    const studentIds = studentRelations.map(rel => rel.studentId);
    const records = studentIds.length > 0
      ? await PhysicalTestRecord.findAll({
          where: {
            formId,
            studentId: studentIds
          }
        })
      : [];

    // 组织数据：学生列表和记录数据
    const studentsWithRecords = studentRelations.map(relation => {
      const student = relation.student;
      const record = records.find(r => r.studentId === student.id);

      // 展平结构：学生属性在顶层，record 作为额外字段
      return {
        id: student.id,
        studentIdNational: student.studentIdNational,
        studentIdSchool: student.studentIdSchool,
        name: student.name,
        gender: student.gender,
        birthDate: student.birthDate,
        _record: record ? {
          id: record.id,
          testData: record.testData,
          scores: record.scores,
          totalScore: record.totalScore,
          gradeLevel: record.gradeLevel,
          submittedAt: record.submittedAt
        } : null
      };
    });

    res.json({
      success: true,
      data: studentsWithRecords,
      testItems: testItems.map(item => ({
        id: item.id,
        itemCode: item.itemCode,
        itemName: item.itemName,
        itemUnit: item.itemUnit,
        genderLimit: item.genderLimit,
        isRequired: item.isRequired,
        isCalculated: item.isCalculated,
        sortOrder: item.sortOrder,
        validationRules: item.validationRules
      }))
    });
  } catch (error: any) {
    console.error('获取班级学生列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取学生列表失败',
      error: error.message
    });
  }
};

/**
 * 创建或更新体测记录
 */
export const createOrUpdateRecord = async (req: Request, res: Response) => {
  const transaction = await sequelize.transaction();

  try {
    const { formId, studentId } = req.params;
    const { testData, classId } = req.body;

    // 验证 classId
    if (!classId) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: '缺少班级信息'
      });
    }

    // 验证表单
    const form = await PhysicalTestForm.findByPk(formId);
    if (!form) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: '表单不存在'
      });
    }

    if (form.status !== 'published') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: '表单未发布，无法录入数据'
      });
    }

    // 验证学生
    const student = await Student.findByPk(studentId);
    if (!student) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: '学生不存在'
      });
    }

    // 获取测试项目（根据学生性别过滤）
    const testItems = await FormTestItem.findAll({
      where: { formId }
    });

    const applicableItems = testItems.filter(item => {
      return item.genderLimit === null || item.genderLimit === student.gender;
    });

    // 自动计算BMI（如果提供了身高和体重）
    if (testData.height && testData.weight) {
      try {
        const height = parseFloat(testData.height.toString());
        const weight = parseFloat(testData.weight.toString());
        testData.bmi = calculateBMI(height, weight);
      } catch (error) {
        console.warn('BMI计算失败:', error);
      }
    }

    // 获取学生所在班级信息以计算年级
    const classInfo = await Class.findByPk(classId);
    let studentGradeLevel: number | null = null;
    if (classInfo) {
      studentGradeLevel = calculateStudentGradeLevel(classInfo.cohort, form.academicYear);
    }

    // 计算各项分数（传入学生性别和年级）
    const scores = calculateBatchScores(testData, applicableItems, student.gender, studentGradeLevel);

    // 计算加权总分
    const totalScore = calculateTotalScore(scores, applicableItems);

    // 计算等级
    const gradeLevel = calculateGradeLevel(totalScore);

    // 查找是否已存在记录
    let record = await PhysicalTestRecord.findOne({
      where: { formId, studentId }
    });

    if (record) {
      // 更新现有记录
      await record.update(
        {
          classId: Number(classId),
          testData,
          scores,
          totalScore,
          gradeLevel,
          submittedAt: new Date()
        },
        { transaction }
      );
    } else {
      // 创建新记录
      record = await PhysicalTestRecord.create(
        {
          formId: Number(formId),
          studentId: Number(studentId),
          classId: Number(classId),
          testData,
          scores,
          totalScore,
          gradeLevel,
          submittedAt: new Date()
        },
        { transaction }
      );
    }

    await transaction.commit();

    res.json({
      success: true,
      message: '保存成功',
      data: record
    });
  } catch (error: any) {
    await transaction.rollback();
    console.error('保存体测记录失败:', error);
    res.status(500).json({
      success: false,
      message: '保存失败',
      error: error.message
    });
  }
};

/**
 * 批量保存体测记录
 */
export const batchCreateOrUpdateRecords = async (req: Request, res: Response) => {
  const transaction = await sequelize.transaction();

  try {
    const { formId } = req.params;
    const { records } = req.body; // [{ studentId, testData }]

    // 验证表单
    const form = await PhysicalTestForm.findByPk(formId);
    if (!form) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: '表单不存在'
      });
    }

    if (form.status !== 'published') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: '表单未发布，无法录入数据'
      });
    }

    // 获取测试项目
    const testItems = await FormTestItem.findAll({
      where: { formId }
    });

    const results = [];

    for (const recordData of records) {
      const { studentId, classId, testData } = recordData;

      // 验证 classId
      if (!classId) {
        continue; // 跳过缺少班级信息的记录
      }

      // 获取学生信息
      const student = await Student.findByPk(studentId);
      if (!student) {
        continue; // 跳过不存在的学生
      }

      // 根据性别过滤测试项目
      const applicableItems = testItems.filter(item => {
        return item.genderLimit === null || item.genderLimit === student.gender;
      });

      // 获取学生所在班级信息以计算年级
      const classInfo = await Class.findByPk(classId);
      let studentGradeLevel: number | null = null;
      if (classInfo) {
        studentGradeLevel = calculateStudentGradeLevel(classInfo.cohort, form.academicYear);
      }

      // 自动计算BMI（如果提供了身高和体重）
      if (testData.height && testData.weight) {
        try {
          const height = parseFloat(testData.height.toString());
          const weight = parseFloat(testData.weight.toString());
          testData.bmi = calculateBMI(height, weight);
        } catch (error) {
          console.warn('BMI计算失败:', error);
        }
      }

      // 计算分数（传入学生性别和年级）
      const scores = calculateBatchScores(testData, applicableItems, student.gender, studentGradeLevel);
      const totalScore = calculateTotalScore(scores, applicableItems);
      const gradeLevel = calculateGradeLevel(totalScore);

      // 调试日志
      console.log(`\n=== 学生 ${student.name} (${student.gender}, 年级${studentGradeLevel}) 的分数计算结果 ===`);
      console.log('测试数据:', testData);
      console.log('各项分数:', scores);
      console.log('总分:', totalScore);
      console.log('等级:', gradeLevel);
      console.log('适用项目数量:', applicableItems.length);

      // 查找或创建记录
      const [record] = await PhysicalTestRecord.upsert(
        {
          formId: Number(formId),
          studentId: Number(studentId),
          classId: Number(classId),
          testData,
          scores,
          totalScore,
          gradeLevel,
          submittedAt: new Date()
        },
        { transaction }
      );

      results.push(record);
    }

    await transaction.commit();

    res.json({
      success: true,
      message: `成功保存 ${results.length} 条记录`,
      data: results
    });
  } catch (error: any) {
    await transaction.rollback();
    console.error('批量保存体测记录失败:', error);
    res.status(500).json({
      success: false,
      message: '批量保存失败',
      error: error.message
    });
  }
};

/**
 * 获取学生的体测记录详情
 */
export const getStudentRecord = async (req: Request, res: Response) => {
  try {
    const { formId, studentId } = req.params;

    const record = await PhysicalTestRecord.findOne({
      where: { formId, studentId },
      include: [
        {
          model: Student,
          as: 'student'
        },
        {
          model: PhysicalTestForm,
          as: 'form',
          include: [
            {
              model: FormTestItem,
              as: 'items',
              order: [['sortOrder', 'ASC']]
            }
          ]
        }
      ]
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: '未找到体测记录'
      });
    }

    res.json({
      success: true,
      data: record
    });
  } catch (error: any) {
    console.error('获取体测记录失败:', error);
    res.status(500).json({
      success: false,
      message: '获取记录失败',
      error: error.message
    });
  }
};

/**
 * 删除体测记录
 */
export const deleteRecord = async (req: Request, res: Response) => {
  try {
    const { formId, studentId } = req.params;

    const record = await PhysicalTestRecord.findOne({
      where: { formId, studentId }
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: '记录不存在'
      });
    }

    await record.destroy();

    res.json({
      success: true,
      message: '删除成功'
    });
  } catch (error: any) {
    console.error('删除体测记录失败:', error);
    res.status(500).json({
      success: false,
      message: '删除失败',
      error: error.message
    });
  }
};
