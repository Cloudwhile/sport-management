import { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { Op } from 'sequelize';
import * as XLSX from 'xlsx';
import sequelize from '../database/connection.js';
import {
  Student,
  Class,
  StudentClassRelation,
} from '../models/index.js';
import { hashPassword } from '../utils/password.js';
import { normalizeClassName } from '../utils/classNameFormatter.js';

type StudentBatchImportJobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'canceling' | 'canceled';

interface StudentBatchImportResult {
  success: number;
  failed: number;
  warnings: number;
  errors: Array<{
    row: number;
    error: string;
    data: any;
    type: 'error' | 'warning';
  }>;
}

interface StudentBatchImportJob {
  id: string;
  status: StudentBatchImportJobStatus;
  fileName: string;
  academicYear: string;
  totalRows: number;
  processedRows: number;
  progress: number;
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
  estimatedSecondsRemaining: number | null;
  currentRow?: number;
  message: string;
  cancelRequested: boolean;
  result?: StudentBatchImportResult;
  error?: string;
}

class StudentBatchImportCanceledError extends Error {
  constructor() {
    super('学生批量导入已取消，事务已回滚');
    this.name = 'StudentBatchImportCanceledError';
  }
}

const studentBatchImportJobs = new Map<string, StudentBatchImportJob>();

const toStudentBatchImportJobSnapshot = (job: StudentBatchImportJob) => {
  const { cancelRequested, ...snapshot } = job;
  return snapshot;
};

const updateStudentBatchImportJob = (
  job: StudentBatchImportJob,
  update: Partial<StudentBatchImportJob>
) => {
  Object.assign(job, update);
  job.updatedAt = new Date().toISOString();

  if (job.totalRows > 0) {
    job.progress = Math.min(100, Math.round((job.processedRows / job.totalRows) * 100));
  }

  if (job.status === 'running' && job.processedRows > 0 && job.processedRows < job.totalRows) {
    const elapsedSeconds = (Date.now() - Date.parse(job.startedAt)) / 1000;
    const rowsPerSecond = elapsedSeconds > 0 ? job.processedRows / elapsedSeconds : 0;
    job.estimatedSecondsRemaining = rowsPerSecond > 0
      ? Math.ceil((job.totalRows - job.processedRows) / rowsPerSecond)
      : null;
  } else {
    job.estimatedSecondsRemaining = null;
  }
};

const scheduleStudentBatchImportJobCleanup = (jobId: string) => {
  setTimeout(() => {
    studentBatchImportJobs.delete(jobId);
  }, 60 * 60 * 1000).unref();
};

const createStudentBatchImportJob = (fileName: string, academicYear: string, totalRows: number) => {
  const now = new Date().toISOString();
  const job: StudentBatchImportJob = {
    id: randomUUID(),
    status: 'queued',
    fileName,
    academicYear,
    totalRows,
    processedRows: 0,
    progress: 0,
    startedAt: now,
    updatedAt: now,
    estimatedSecondsRemaining: null,
    message: '学生批量导入等待开始',
    cancelRequested: false,
  };

  studentBatchImportJobs.set(job.id, job);
  return job;
};

const getDisplayFileName = (file: Express.Multer.File): string => {
  const originalName = file.originalname || '未命名文件';

  try {
    const decoded = Buffer.from(originalName, 'latin1').toString('utf8');
    return decoded.includes('�') ? originalName : decoded;
  } catch {
    return originalName;
  }
};

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

const parseStudentImportRows = (file: Express.Multer.File) => {
  const workbook = XLSX.read(file.buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(worksheet);
};

const parseStudentBirthDate = (value: unknown): { value: string | null; warning?: string } => {
  if (!value) return { value: null };

  if (typeof value === 'number') {
    const excelEpoch = new Date(1899, 11, 30);
    const jsDate = new Date(excelEpoch.getTime() + value * 86400000);
    const year = jsDate.getFullYear();
    const month = String(jsDate.getMonth() + 1).padStart(2, '0');
    const day = String(jsDate.getDate()).padStart(2, '0');
    return { value: `${year}-${month}-${day}` };
  }

  const dateText = value.toString().trim();
  const dateMatch = dateText.match(/(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})/);
  if (!dateMatch) {
    return { value: null, warning: `出生日期格式错误："${dateText}"，应为 YYYY/MM/DD 格式` };
  }

  return {
    value: `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}`,
  };
};

const importStudentRows = async (
  rows: any[],
  academicYear: string,
  context?: {
    isCanceled?: () => boolean;
    reportProgress?: (processedRows: number, currentRow: number) => void;
  }
): Promise<StudentBatchImportResult> => {
  const transaction = await sequelize.transaction();
  const results: StudentBatchImportResult = {
    success: 0,
    failed: 0,
    warnings: 0,
    errors: [],
  };
  const classCache = new Map<string, number>();

  const ensureNotCanceled = () => {
    if (context?.isCanceled?.()) {
      throw new StudentBatchImportCanceledError();
    }
  };

  try {
    for (let i = 0; i < rows.length; i++) {
      ensureNotCanceled();

      const row = rows[i] as any;
      const rowNumber = i + 2;

      try {
        const classNameRaw = row['班级名称']?.toString().trim();
        const classMatch = classNameRaw?.match(/(\d{4})级(\d+)班/);
        if (!classNameRaw) {
          results.errors.push({ row: rowNumber, error: '缺少班级名称', data: row, type: 'error' });
          results.failed++;
          continue;
        }

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

        const cohort = classMatch[1];
        const classNumber = classMatch[2];
        const classNameOnly = normalizeClassName(`${classNumber}班`);
        const cacheKey = `${cohort}-${classNameOnly}`;
        let classId = classCache.get(cacheKey);

        if (!classId) {
          let foundClass = await Class.findOne({
            where: { cohort, className: classNameOnly },
            transaction,
          });

          if (!foundClass) {
            const classAccount = `class_${cohort}_${classNumber.padStart(2, '0')}`;
            const defaultPassword = `${cohort}${classNumber.padStart(2, '0')}`;
            const classPassword = await hashPassword(defaultPassword);

            foundClass = await Class.create(
              {
                cohort,
                className: classNameOnly,
                classAccount,
                classPassword,
              },
              { transaction }
            );
          }

          classId = foundClass.get('id') as number;
          classCache.set(cacheKey, classId);
        }

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

        const genderNum = parseInt(genderCode.toString());
        const gender = genderNum === 1 ? 'male' : genderNum === 2 ? 'female' : null;
        if (!gender) {
          results.errors.push({
            row: rowNumber,
            error: `性别代码错误，应为1（男）或2（女），实际为"${genderCode}"`,
            data: row,
            type: 'error',
          });
          results.failed++;
          continue;
        }

        const birthDateResult = parseStudentBirthDate(row['出生日期']);
        if (birthDateResult.warning) {
          results.errors.push({
            row: rowNumber,
            error: birthDateResult.warning,
            data: row,
            type: 'warning',
          });
          results.warnings++;
        }

        const idCardNumber = row['身份证号']?.toString().trim() || null;
        const ethnicityCode = row['民族代码']?.toString().trim() || null;

        const existingStudent = await Student.findOne({
          where: { studentIdNational },
          transaction,
        });
        let student: any;
        let isUpdate = false;

        if (existingStudent) {
          isUpdate = true;
          await existingStudent.update(
            {
              name,
              gender,
              birthDate: birthDateResult.value,
              idCardNumber,
              ethnicityCode,
            },
            { transaction }
          );
          student = existingStudent;
        } else {
          student = await Student.create(
            {
              studentIdNational,
              studentIdSchool: studentIdNational,
              name,
              gender,
              birthDate: birthDateResult.value,
              idCardNumber,
              ethnicityCode,
            },
            { transaction }
          );
        }

        const studentId = student.get('id') as number;
        const currentActiveRelation = await StudentClassRelation.findOne({
          where: { studentId, isActive: true },
          transaction,
        });

        let needUpdate = true;
        if (currentActiveRelation) {
          const currentClassId = currentActiveRelation.get('classId') as number;
          const currentAcademicYear = currentActiveRelation.get('academicYear') as string;
          needUpdate = currentClassId !== classId || currentAcademicYear !== academicYear;
        }

        if (needUpdate) {
          await StudentClassRelation.update(
            { isActive: false },
            {
              where: { studentId, isActive: true },
              transaction,
            }
          );

          const existingRelation = await StudentClassRelation.findOne({
            where: { studentId, classId, academicYear },
            transaction,
          });

          if (existingRelation) {
            await existingRelation.update({ isActive: true }, { transaction });
          } else {
            await StudentClassRelation.create(
              {
                studentId,
                classId,
                academicYear,
                isActive: true,
              },
              { transaction }
            );
          }
        }

        results.success++;

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
        if (error instanceof StudentBatchImportCanceledError) throw error;

        console.error(`第 ${rowNumber} 行导入失败:`, (error as Error).message, '数据:', row);
        results.errors.push({
          row: rowNumber,
          error: (error as Error).message,
          data: row,
          type: 'error',
        });
        results.failed++;
      } finally {
        context?.reportProgress?.(i + 1, rowNumber);
      }
    }

    ensureNotCanceled();
    await transaction.commit();
    return results;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const runStudentBatchImportJob = async (jobId: string, file: Express.Multer.File, academicYear: string) => {
  const job = studentBatchImportJobs.get(jobId);
  if (!job) return;

  updateStudentBatchImportJob(job, {
    status: 'running',
    message: '服务端正在解析学生导入文件',
  });

  try {
    if (job.cancelRequested) {
      throw new StudentBatchImportCanceledError();
    }

    const rows = parseStudentImportRows(file);
    updateStudentBatchImportJob(job, {
      totalRows: rows.length,
      message: '服务端正在导入学生数据',
    });

    if (job.cancelRequested) {
      throw new StudentBatchImportCanceledError();
    }

    const result = await importStudentRows(rows, academicYear, {
      isCanceled: () => job.cancelRequested,
      reportProgress: (processedRows, currentRow) => {
        updateStudentBatchImportJob(job, {
          processedRows,
          currentRow,
          message: `服务端正在导入第 ${currentRow} 行`,
        });
      },
    });

    updateStudentBatchImportJob(job, {
      status: 'completed',
      processedRows: job.totalRows,
      progress: 100,
      completedAt: new Date().toISOString(),
      message: '学生批量导入完成',
      result,
    });
  } catch (error: any) {
    const canceled = error instanceof StudentBatchImportCanceledError || job.cancelRequested;
    updateStudentBatchImportJob(job, {
      status: canceled ? 'canceled' : 'failed',
      completedAt: new Date().toISOString(),
      message: canceled ? '学生批量导入已取消，事务已回滚' : '学生批量导入失败，事务已回滚',
      error: error.message,
    });
  } finally {
    scheduleStudentBatchImportJobCleanup(jobId);
  }
};

// 批量导入学生
export const batchImport = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: '请上传文件' });
      return;
    }

    const academicYear = req.body.academicYear;
    if (!academicYear) {
      res.status(400).json({ error: '请提供学年参数' });
      return;
    }

    if (req.body.asyncImport?.toString() === 'true') {
      const asyncFile = {
        ...req.file,
        buffer: Buffer.from(req.file.buffer),
      };
      const job = createStudentBatchImportJob(getDisplayFileName(asyncFile), academicYear, 0);
      res.status(202).json({ data: toStudentBatchImportJobSnapshot(job) });
      void runStudentBatchImportJob(job.id, asyncFile, academicYear);
      return;
    }

    const rows = parseStudentImportRows(req.file);
    const results = await importStudentRows(rows, academicYear);

    res.json({
      message: `批量导入完成，成功 ${results.success} 条，失败 ${results.failed} 条，警告 ${results.warnings} 条`,
      data: results,
    });
  } catch (error) {
    if (error instanceof StudentBatchImportCanceledError) {
      res.status(499).json({ error: '学生批量导入已取消', message: error.message });
      return;
    }

    console.error('批量导入失败:', error);
    res.status(500).json({ error: '批量导入失败', message: (error as Error).message });
  }
};

export const getBatchImportJobStatus = async (req: Request, res: Response): Promise<void> => {
  const job = studentBatchImportJobs.get(req.params.jobId);
  if (!job) {
    res.status(404).json({ error: '学生批量导入任务不存在或已过期' });
    return;
  }

  res.json({ data: toStudentBatchImportJobSnapshot(job) });
};

export const cancelBatchImportJob = async (req: Request, res: Response): Promise<void> => {
  const job = studentBatchImportJobs.get(req.params.jobId);
  if (!job) {
    res.status(404).json({ error: '学生批量导入任务不存在或已过期' });
    return;
  }

  if (job.status === 'completed' || job.status === 'failed' || job.status === 'canceled') {
    res.json({ data: toStudentBatchImportJobSnapshot(job) });
    return;
  }

  job.cancelRequested = true;
  updateStudentBatchImportJob(job, {
    status: 'canceling',
    message: '正在取消学生批量导入并回滚事务',
  });

  res.json({ data: toStudentBatchImportJobSnapshot(job) });
};
