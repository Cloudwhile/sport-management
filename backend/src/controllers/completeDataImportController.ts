import { Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { Op } from "sequelize";
import * as XLSX from "xlsx";
import sequelize from "../database/connection.js";
import {
  Class,
  FormTestItem,
  PhysicalTestForm,
  PhysicalTestRecord,
  Student,
  StudentClassRelation,
} from "../models/index.js";
import { defaultTestItems } from "../config/defaultTestItems.js";
import { hashPassword } from "../utils/password.js";
import { normalizeClassName } from "../utils/classNameFormatter.js";

const DEFAULT_FORM_NAME = "2024学年完整体质测试数据";
const DEFAULT_ACADEMIC_YEAR = "2024";
const DEFAULT_COHORTS = ["2024", "2023", "2022"];

const rawToItemCode: Record<string, string> = {
  身高: "height",
  体重: "weight",
  肺活量: "lung_capacity",
  "50米跑": "sprint_50m",
  立定跳远: "standing_jump",
  坐位体前屈: "sit_reach",
  "800米跑": "run_800m",
  "1000米跑": "run_1000m",
  一分钟仰卧起坐: "situp_1min",
  引体向上: "pullup",
};

const scoreToItemCode: Record<string, string> = {
  BMI得分: "bmi",
  肺活量: "lung_capacity",
  "50米跑": "sprint_50m",
  立定跳远: "standing_jump",
  坐位体前屈: "sit_reach",
  "800米跑": "run_800m",
  "1000米跑": "run_1000m",
  一分钟仰卧起坐: "situp_1min",
  引体向上: "pullup",
};

interface ParsedCompleteDataFile {
  fileKey: string;
  fileName: string;
  sheetNames: string[];
  rawSheetName: string;
  analysisSheetName?: string;
  rawRows: any[];
  analysisByStudentId: Map<string, any>;
  warnings: string[];
}

interface ImportOptions {
  formName: string;
  academicYear: string;
  participatingCohorts: string[];
}

interface SheetSelection {
  fileKey: string;
  fileName: string;
  rawSheetName?: string;
  analysisSheetName?: string;
}

class CompleteDataImportBadRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CompleteDataImportBadRequestError";
  }
}

class CompleteDataImportValidationError extends Error {
  results: unknown;

  constructor(message: string, results: unknown) {
    super(message);
    this.name = "CompleteDataImportValidationError";
    this.results = results;
  }
}

class CompleteDataImportCanceledError extends Error {
  constructor() {
    super("完整数据导入已取消，已回滚本次导入");
    this.name = "CompleteDataImportCanceledError";
  }
}

interface ImportContext {
  isCanceled: () => boolean;
  reportProgress?: (progress: ImportProgressUpdate) => void;
}

interface ImportProgressUpdate {
  totalRows: number;
  processedRows: number;
  fileProgresses?: ImportFileProgress[];
  currentFileKey?: string;
  currentFileName?: string;
  currentRow?: number;
  message?: string;
}

interface ImportFileProgress {
  fileKey: string;
  fileName: string;
  totalRows: number;
  processedRows: number;
  progress: number;
}

type CompleteDataImportJobStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "canceling"
  | "canceled";

interface CompleteDataImportJob {
  id: string;
  status: CompleteDataImportJobStatus;
  phase: "queued" | "importing" | "completed" | "failed" | "canceled";
  files: string[];
  fileProgresses: ImportFileProgress[];
  totalRows: number;
  processedRows: number;
  progress: number;
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
  estimatedSecondsRemaining: number | null;
  currentFileKey?: string;
  currentFileName?: string;
  currentRow?: number;
  message: string;
  cancelRequested: boolean;
  result?: unknown;
  error?: string;
}

const completeDataImportJobs = new Map<string, CompleteDataImportJob>();

const toJobSnapshot = (job: CompleteDataImportJob) => {
  const { cancelRequested, ...snapshot } = job;
  return snapshot;
};

const updateJobProgress = (
  job: CompleteDataImportJob,
  update: Partial<CompleteDataImportJob> & {
    processedRows?: number;
    totalRows?: number;
  },
) => {
  Object.assign(job, update);
  job.updatedAt = new Date().toISOString();

  if (job.totalRows > 0) {
    job.progress = Math.min(
      100,
      Math.round((job.processedRows / job.totalRows) * 100),
    );
  }

  if (
    job.status === "running" &&
    job.processedRows > 0 &&
    job.processedRows < job.totalRows
  ) {
    const elapsedSeconds = (Date.now() - Date.parse(job.startedAt)) / 1000;
    const rowsPerSecond =
      elapsedSeconds > 0 ? job.processedRows / elapsedSeconds : 0;
    job.estimatedSecondsRemaining =
      rowsPerSecond > 0
        ? Math.ceil((job.totalRows - job.processedRows) / rowsPerSecond)
        : null;
  } else {
    job.estimatedSecondsRemaining = null;
  }
};

const createCompleteDataImportJob = (files: ParsedCompleteDataFile[]) => {
  const now = new Date().toISOString();
  const job: CompleteDataImportJob = {
    id: randomUUID(),
    status: "queued",
    phase: "queued",
    files: files.map((file) => file.fileName),
    fileProgresses: files.map((file) => ({
      fileKey: file.fileKey,
      fileName: file.fileName,
      totalRows: file.rawRows.length,
      processedRows: 0,
      progress: 0,
    })),
    totalRows: files.reduce((sum, file) => sum + file.rawRows.length, 0),
    processedRows: 0,
    progress: 0,
    startedAt: now,
    updatedAt: now,
    estimatedSecondsRemaining: null,
    message: "等待开始导入",
    cancelRequested: false,
  };

  completeDataImportJobs.set(job.id, job);
  return job;
};

const scheduleJobCleanup = (jobId: string) => {
  setTimeout(
    () => {
      completeDataImportJobs.delete(jobId);
    },
    60 * 60 * 1000,
  ).unref();
};

const createImportContext = (req: Request, res: Response): ImportContext => {
  let canceled = false;

  req.on("aborted", () => {
    canceled = true;
  });

  res.on("close", () => {
    if (!res.writableEnded) {
      canceled = true;
    }
  });

  return {
    isCanceled: () => canceled || res.destroyed,
  };
};

const throwIfImportCanceled = (context?: ImportContext) => {
  if (context?.isCanceled()) {
    throw new CompleteDataImportCanceledError();
  }
};

const getUploadedFiles = (req: Request): Express.Multer.File[] => {
  if (Array.isArray(req.files)) return req.files;
  return [];
};

const parseOptions = (req: Request): ImportOptions => {
  const formName = (req.body.formName || DEFAULT_FORM_NAME).toString().trim();
  const academicYear = (req.body.academicYear || DEFAULT_ACADEMIC_YEAR)
    .toString()
    .trim();
  const participatingCohorts = req.body.participatingCohorts
    ? req.body.participatingCohorts
        .toString()
        .split(",")
        .map((item: string) => item.trim())
        .filter(Boolean)
    : DEFAULT_COHORTS;

  return {
    formName: formName || DEFAULT_FORM_NAME,
    academicYear: academicYear || DEFAULT_ACADEMIC_YEAR,
    participatingCohorts:
      participatingCohorts.length > 0 ? participatingCohorts : DEFAULT_COHORTS,
  };
};

const parseSheetSelections = (req: Request): Map<string, SheetSelection> => {
  if (!req.body.sheetSelections) return new Map();

  try {
    const selections = JSON.parse(
      req.body.sheetSelections.toString(),
    ) as SheetSelection[];

    if (!Array.isArray(selections)) {
      throw new Error("sheetSelections must be an array");
    }

    const invalidSelection = selections.find(
      (selection) =>
        !selection ||
        typeof selection !== "object" ||
        typeof selection.fileKey !== "string" ||
        !selection.fileKey.trim(),
    );

    if (invalidSelection) {
      throw new CompleteDataImportBadRequestError(
        "sheetSelections 中每个文件选择都必须包含 fileKey",
      );
    }

    return new Map(
      selections.map((selection) => [selection.fileKey, selection]),
    );
  } catch (error) {
    if (error instanceof CompleteDataImportBadRequestError) {
      throw error;
    }

    throw new CompleteDataImportBadRequestError("sheetSelections 格式无效");
  }
};

const normalizeStudentId = (value: unknown): string => {
  return value == null ? "" : value.toString().trim();
};

const isEmptyValue = (value: unknown): boolean => {
  return value === undefined || value === null || value === "";
};

const parseNumber = (value: unknown): number | null => {
  if (isEmptyValue(value)) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseExcelDateSerial = (serial: number): string | null => {
  if (!Number.isFinite(serial)) return null;

  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const excelEpoch = Date.UTC(1899, 11, 30);
  const date = new Date(excelEpoch + Math.floor(serial) * millisecondsPerDay);

  if (Number.isNaN(date.getTime())) return null;

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const parseDate = (value: unknown): string | null => {
  if (isEmptyValue(value)) return null;

  if (typeof value === "number") {
    return parseExcelDateSerial(value);
  }

  const str = value.toString().trim();
  const match = str.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  if (!match) return null;

  return `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
};

const getDisplayFileName = (file: Express.Multer.File): string => {
  const originalName = file.originalname || "未命名文件";

  try {
    const decoded = Buffer.from(originalName, "latin1").toString("utf8");
    return decoded.includes("�") ? originalName : decoded;
  } catch {
    return originalName;
  }
};

const getUploadedFileKey = (file: Express.Multer.File, index: number): string => {
  return `${index}:${getDisplayFileName(file)}:${file.size}`;
};

const parseTimeToSeconds = (value: unknown): number | null => {
  if (isEmptyValue(value)) return null;
  if (typeof value === "number") return value;

  const str = value.toString().trim();
  if (/^\d+(\.\d+)?$/.test(str)) {
    return Number(str);
  }

  const match = str.match(/^(\d+)[':：](\d+(?:\.\d+)?)"?$/);
  if (!match) return null;

  return Number(match[1]) * 60 + Number(match[2]);
};

const numberToChinese = (num: string): string => {
  const map: Record<string, string> = {
    "1": "一",
    "2": "二",
    "3": "三",
    "4": "四",
    "5": "五",
    "6": "六",
    "7": "七",
    "8": "八",
    "9": "九",
    "10": "十",
    "11": "十一",
    "12": "十二",
    "13": "十三",
    "14": "十四",
    "15": "十五",
    "16": "十六",
    "17": "十七",
    "18": "十八",
    "19": "十九",
    "20": "二十",
  };
  return map[num] || num;
};

const parseClassInfo = (
  classNameRaw: unknown,
): { cohort: string; className: string; classNumber: string } | null => {
  const className = classNameRaw == null ? "" : classNameRaw.toString().trim();
  const match = className.match(/(\d{4})级(\d+)班/);
  if (!match) return null;

  return {
    cohort: match[1],
    className: normalizeClassName(`${match[2]}班`),
    classNumber: match[2],
  };
};

const mapGender = (value: unknown): "male" | "female" | null => {
  const code = Number(value);
  if (code === 1) return "male";
  if (code === 2) return "female";
  return null;
};

const mapGradeLevel = (
  value: unknown,
): "excellent" | "good" | "pass" | "fail" | null => {
  const text = value == null ? "" : value.toString().trim();
  const map: Record<string, "excellent" | "good" | "pass" | "fail"> = {
    优秀: "excellent",
    良好: "good",
    及格: "pass",
    不及格: "fail",
  };
  return map[text] || null;
};

const buildTestData = (row: any): Record<string, number> => {
  const testData: Record<string, number> = {};

  for (const [column, itemCode] of Object.entries(rawToItemCode)) {
    const rawValue = row[column];
    if (isEmptyValue(rawValue)) continue;

    const value =
      itemCode === "run_800m" || itemCode === "run_1000m"
        ? parseTimeToSeconds(rawValue)
        : parseNumber(rawValue);

    if (value !== null) {
      testData[itemCode] = value;
    }
  }

  return testData;
};

const buildScores = (analysisRow?: any): Record<string, number> | null => {
  if (!analysisRow) return null;

  const scores: Record<string, number> = {};
  for (const [column, itemCode] of Object.entries(scoreToItemCode)) {
    const value = parseNumber(analysisRow[column]);
    if (value !== null) {
      scores[itemCode] = value;
    }
  }

  return Object.keys(scores).length > 0 ? scores : null;
};

const findSheetName = (
  workbook: XLSX.WorkBook,
  requiredHeaders: string[],
  excludeSheetName?: string,
): string | undefined => {
  return workbook.SheetNames.find((sheetName) => {
    if (sheetName === excludeSheetName) return false;
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: "",
      blankrows: false,
    }) as any[][];
    const headers = rows[0] || [];
    return requiredHeaders.every((header) => headers.includes(header));
  });
};

const parseCompleteDataFile = (
  file: Express.Multer.File,
  fileKey: string,
  selection?: SheetSelection,
): ParsedCompleteDataFile => {
  const fileName = getDisplayFileName(file);
  const workbook = XLSX.read(file.buffer, { type: "buffer" });
  const rawSheetName =
    selection?.rawSheetName &&
    workbook.SheetNames.includes(selection.rawSheetName)
      ? selection.rawSheetName
      : findSheetName(workbook, ["班级名称", "学籍号", "姓名"]) ||
        workbook.SheetNames[0];
  const analysisSheetName =
    selection?.analysisSheetName &&
    workbook.SheetNames.includes(selection.analysisSheetName)
      ? selection.analysisSheetName
      : findSheetName(
          workbook,
          ["学籍号", "综合成绩", "综合等级"],
          rawSheetName,
        );

  if (!rawSheetName) {
    throw new Error(`${fileName} 未找到可导入的工作表`);
  }

  const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[rawSheetName], {
    defval: "",
  }) as any[];
  const analysisRows = analysisSheetName
    ? (XLSX.utils.sheet_to_json(workbook.Sheets[analysisSheetName], {
        defval: "",
      }) as any[])
    : [];

  const analysisByStudentId = new Map<string, any>();
  for (const row of analysisRows) {
    const studentId = normalizeStudentId(row["学籍号"]);
    if (studentId) {
      analysisByStudentId.set(studentId, row);
    }
  }

  const warnings: string[] = [];
  if (!analysisSheetName) {
    warnings.push("未找到分析结果工作表，将只导入原始体测数据");
  }

  return {
    fileKey,
    fileName,
    sheetNames: workbook.SheetNames,
    rawSheetName,
    analysisSheetName,
    rawRows,
    analysisByStudentId,
    warnings,
  };
};

const summarizeFile = (parsed: ParsedCompleteDataFile) => {
  const classes = new Set<string>();
  const studentIds = new Set<string>();
  const duplicateStudentIds = new Set<string>();
  const issues: Array<{ row: number; message: string }> = [];

  parsed.rawRows.forEach((row, index) => {
    const rowNumber = index + 2;
    const studentId = normalizeStudentId(row["学籍号"]);
    const classInfo = parseClassInfo(row["班级名称"]);
    const gender = mapGender(row["性别"]);

    if (!studentId) issues.push({ row: rowNumber, message: "缺少学籍号" });
    if (!row["姓名"]) issues.push({ row: rowNumber, message: "缺少姓名" });
    if (!classInfo)
      issues.push({ row: rowNumber, message: "班级名称格式无法识别" });
    if (!gender)
      issues.push({ row: rowNumber, message: "性别代码不是 1 或 2" });
    if (studentId && studentIds.has(studentId))
      duplicateStudentIds.add(studentId);
    if (studentId) studentIds.add(studentId);
    if (classInfo) classes.add(`${classInfo.cohort}${classInfo.className}`);
    if (
      studentId &&
      parsed.analysisSheetName &&
      !parsed.analysisByStudentId.has(studentId)
    ) {
      issues.push({ row: rowNumber, message: "未找到对应分析结果行" });
    }
  });

  return {
    fileKey: parsed.fileKey,
    fileName: parsed.fileName,
    sheetNames: parsed.sheetNames,
    rawSheetName: parsed.rawSheetName,
    analysisSheetName: parsed.analysisSheetName,
    totalRows: parsed.rawRows.length,
    classCount: classes.size,
    studentCount: studentIds.size,
    duplicateStudentIds: Array.from(duplicateStudentIds),
    warnings: parsed.warnings,
    issues,
  };
};

const ensureCompleteDataForm = async (
  options: ImportOptions,
  transaction: any,
) => {
  let form = await PhysicalTestForm.findOne({
    where: {
      formName: options.formName,
      academicYear: options.academicYear,
    },
    transaction,
  });

  if (!form) {
    form = await PhysicalTestForm.create(
      {
        formName: options.formName,
        academicYear: options.academicYear,
        participatingCohorts: options.participatingCohorts,
        status: "closed",
        description: "通过完整数据导入创建的体质测试表单",
        createdBy: null,
      },
      { transaction },
    );
  } else {
    await form.update(
      {
        participatingCohorts: options.participatingCohorts,
        status: "closed",
      },
      { transaction },
    );
  }

  const itemCount = await FormTestItem.count({
    where: { formId: form.get("id") as number },
    transaction,
  });

  if (itemCount === 0) {
    await FormTestItem.bulkCreate(
      defaultTestItems.map((item) => ({
        ...item,
        formId: form.get("id") as number,
      })),
      { transaction },
    );
  }

  return form;
};

const ensureClass = async (
  cohort: string,
  className: string,
  classNumber: string,
  transaction: any,
) => {
  let classRecord = await Class.findOne({
    where: { cohort, className },
    transaction,
  });

  let created = false;
  if (!classRecord) {
    const normalizedClassNumber = classNumber.padStart(2, "0");
    const classAccount = `class_${cohort}_${normalizedClassNumber}`;
    classRecord = await Class.create(
      {
        cohort,
        className,
        classAccount,
        classPassword: await hashPassword(`${cohort}${normalizedClassNumber}`),
      },
      { transaction },
    );
    created = true;
  }

  return { classRecord, created };
};

const importParsedFiles = async (
  files: ParsedCompleteDataFile[],
  options: ImportOptions,
  context?: ImportContext,
) => {
  const transaction = await sequelize.transaction();
  const totalRows = files.reduce((sum, file) => sum + file.rawRows.length, 0);
  const fileProcessedRows = new Map(files.map((file) => [file.fileKey, 0]));
  const buildFileProgresses = () =>
    files.map((file) => {
      const processedRows = fileProcessedRows.get(file.fileKey) || 0;
      return {
        fileKey: file.fileKey,
        fileName: file.fileName,
        totalRows: file.rawRows.length,
        processedRows,
        progress:
          file.rawRows.length > 0
            ? Math.min(
                100,
                Math.round((processedRows / file.rawRows.length) * 100),
              )
            : 0,
      };
    });
  const results = {
    formId: 0,
    files: files.map((file) => file.fileName),
    rows: 0,
    studentsCreated: 0,
    studentsUpdated: 0,
    classesCreated: 0,
    relationsUpserted: 0,
    recordsCreated: 0,
    recordsUpdated: 0,
    failed: 0,
    warnings: [] as Array<{ fileName: string; row?: number; message: string }>,
    errors: [] as Array<{ fileName: string; row: number; message: string }>,
  };

  try {
    context?.reportProgress?.({
      totalRows,
      processedRows: 0,
      fileProgresses: buildFileProgresses(),
      message: "正在准备导入任务",
    });
    throwIfImportCanceled(context);
    const form = await ensureCompleteDataForm(options, transaction);
    throwIfImportCanceled(context);
    const formId = form.get("id") as number;
    results.formId = formId;

    const classCache = new Map<string, any>();

    for (const parsed of files) {
      for (let i = 0; i < parsed.rawRows.length; i++) {
        throwIfImportCanceled(context);
        const row = parsed.rawRows[i];
        const rowNumber = i + 2;
        results.rows++;

        try {
          const studentIdNational = normalizeStudentId(row["学籍号"]);
          const name = row["姓名"] == null ? "" : row["姓名"].toString().trim();
          const gender = mapGender(row["性别"]);
          const classInfo = parseClassInfo(row["班级名称"]);

          if (!studentIdNational || !name || !gender || !classInfo) {
            throw new Error("缺少必要字段或字段格式错误");
          }

          const cacheKey = `${classInfo.cohort}-${classInfo.className}`;
          let classRecord = classCache.get(cacheKey);
          if (!classRecord) {
            const ensured = await ensureClass(
              classInfo.cohort,
              classInfo.className,
              classInfo.classNumber,
              transaction,
            );
            classRecord = ensured.classRecord;
            classCache.set(cacheKey, classRecord);
            if (ensured.created) results.classesCreated++;
          }
          throwIfImportCanceled(context);

          const ethnicityCode = isEmptyValue(row["民族代码"])
            ? null
            : row["民族代码"].toString().trim();
          const birthDate = parseDate(row["出生日期"]);

          const existingByNational = await Student.findOne({
            where: { studentIdNational },
            transaction,
          });
          throwIfImportCanceled(context);
          const existingBySchoolId = existingByNational
            ? null
            : await Student.findOne({
                where: { studentIdSchool: studentIdNational },
                transaction,
              });
          throwIfImportCanceled(context);

          let student = existingByNational || existingBySchoolId;

          if (student) {
            const updatePayload: any = {
              name,
              gender,
              birthDate,
              ethnicityCode,
            };

            if (!existingByNational) {
              updatePayload.studentIdNational = studentIdNational;
            }

            if (
              (student.get("studentIdSchool") as string) !== studentIdNational
            ) {
              const schoolIdOwner = await Student.findOne({
                where: {
                  studentIdSchool: studentIdNational,
                  id: { [Op.ne]: student.get("id") as number },
                },
                transaction,
              });
              if (!schoolIdOwner) {
                updatePayload.studentIdSchool = studentIdNational;
              }
            }

            await student.update(updatePayload, { transaction });
            results.studentsUpdated++;
          } else {
            student = await Student.create(
              {
                studentIdNational,
                studentIdSchool: studentIdNational,
                name,
                gender,
                birthDate,
                ethnicityCode,
              },
              { transaction },
            );
            results.studentsCreated++;
          }
          throwIfImportCanceled(context);

          const studentId = student.get("id") as number;
          const classId = classRecord.get("id") as number;

          await StudentClassRelation.update(
            { isActive: false },
            {
              where: { studentId, isActive: true },
              transaction,
            },
          );
          throwIfImportCanceled(context);

          const existingRelation = await StudentClassRelation.findOne({
            where: { studentId, academicYear: options.academicYear },
            transaction,
          });

          if (existingRelation) {
            await existingRelation.update(
              { classId, isActive: true },
              { transaction },
            );
          } else {
            await StudentClassRelation.create(
              {
                studentId,
                classId,
                academicYear: options.academicYear,
                isActive: true,
              },
              { transaction },
            );
          }
          results.relationsUpserted++;
          throwIfImportCanceled(context);

          const analysisRow = parsed.analysisByStudentId.get(studentIdNational);
          if (!analysisRow) {
            results.warnings.push({
              fileName: parsed.fileName,
              row: rowNumber,
              message: "未找到对应分析结果行，记录将不包含分析分数",
            });
          }

          const existingRecord = await PhysicalTestRecord.findOne({
            where: { formId, studentId },
            transaction,
          });

          const recordPayload = {
            formId,
            studentId,
            classId,
            testData: buildTestData(row),
            scores: buildScores(analysisRow),
            totalScore: analysisRow
              ? parseNumber(analysisRow["综合成绩"])
              : null,
            gradeLevel: analysisRow
              ? mapGradeLevel(analysisRow["综合等级"])
              : null,
            submittedBy: "完整数据导入",
            submittedAt: new Date(),
          };

          if (existingRecord) {
            await existingRecord.update(recordPayload, { transaction });
            results.recordsUpdated++;
          } else {
            await PhysicalTestRecord.create(recordPayload, { transaction });
            results.recordsCreated++;
          }
          throwIfImportCanceled(context);
        } catch (error: any) {
          if (error instanceof CompleteDataImportCanceledError) {
            throw error;
          }

          results.failed++;
          results.errors.push({
            fileName: parsed.fileName,
            row: rowNumber,
            message: error.message,
          });
        }

        fileProcessedRows.set(
          parsed.fileKey,
          (fileProcessedRows.get(parsed.fileKey) || 0) + 1,
        );
        context?.reportProgress?.({
          totalRows,
          processedRows: results.rows,
          fileProgresses: buildFileProgresses(),
          currentFileKey: parsed.fileKey,
          currentFileName: parsed.fileName,
          currentRow: rowNumber,
          message: `正在导入 ${parsed.fileName} 第 ${rowNumber} 行`,
        });
      }
    }

    if (results.failed > 0) {
      throw new CompleteDataImportValidationError(
        `存在 ${results.failed} 行数据导入失败，已回滚本次导入`,
        results,
      );
    }

    throwIfImportCanceled(context);
    await transaction.commit();
    return results;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

export const previewPhysicalTests = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const files = getUploadedFiles(req);
    if (files.length === 0) {
      res.status(400).json({ error: "请上传完整数据 Excel 文件" });
      return;
    }

    const options = parseOptions(req);
    const sheetSelections = parseSheetSelections(req);
    const parsedFiles = files.map((file, index) => {
      const fileKey = getUploadedFileKey(file, index);
      return parseCompleteDataFile(file, fileKey, sheetSelections.get(fileKey));
    });
    const summaries = parsedFiles.map(summarizeFile);

    res.json({
      data: {
        form: options,
        files: summaries,
        totals: summaries.reduce(
          (acc, item) => {
            acc.rows += item.totalRows;
            acc.students += item.studentCount;
            acc.classes += item.classCount;
            acc.issues += item.issues.length;
            return acc;
          },
          { rows: 0, students: 0, classes: 0, issues: 0 },
        ),
      },
    });
  } catch (error: any) {
    console.error("完整数据预检查失败:", error);
    res
      .status(error instanceof CompleteDataImportBadRequestError ? 400 : 500)
      .json({ error: "完整数据预检查失败", message: error.message });
  }
};

const runCompleteDataImportJob = async (
  jobId: string,
  parsedFiles: ParsedCompleteDataFile[],
  options: ImportOptions,
) => {
  const job = completeDataImportJobs.get(jobId);
  if (!job) return;

  updateJobProgress(job, {
    status: "running",
    phase: "importing",
    message: "服务端正在写入完整数据",
  });

  const jobContext: ImportContext = {
    isCanceled: () => job.cancelRequested,
    reportProgress: (progress) => {
      updateJobProgress(job, {
        phase: "importing",
        totalRows: progress.totalRows,
        processedRows: progress.processedRows,
        fileProgresses: progress.fileProgresses,
        currentFileKey: progress.currentFileKey,
        currentFileName: progress.currentFileName,
        currentRow: progress.currentRow,
        message: progress.message || "服务端正在写入完整数据",
      });
    },
  };

  try {
    const result = await importParsedFiles(parsedFiles, options, jobContext);
    updateJobProgress(job, {
      status: "completed",
      phase: "completed",
      processedRows: job.totalRows,
      fileProgresses: job.fileProgresses.map((file) => ({
        ...file,
        processedRows: file.totalRows,
        progress: 100,
      })),
      progress: 100,
      completedAt: new Date().toISOString(),
      message: "完整数据导入完成",
      result,
    });
  } catch (error: any) {
    const canceled =
      error instanceof CompleteDataImportCanceledError || job.cancelRequested;
    updateJobProgress(job, {
      status: canceled ? "canceled" : "failed",
      phase: canceled ? "canceled" : "failed",
      completedAt: new Date().toISOString(),
      message: canceled
        ? "完整数据导入已取消，事务已回滚"
        : "完整数据导入失败，事务已回滚",
      error: error.message,
      result:
        error instanceof CompleteDataImportValidationError
          ? error.results
          : undefined,
    });
  } finally {
    scheduleJobCleanup(jobId);
  }
};

export const importPhysicalTests = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const importContext = createImportContext(req, res);

  try {
    const files = getUploadedFiles(req);
    if (files.length === 0) {
      res.status(400).json({ error: "请上传完整数据 Excel 文件" });
      return;
    }

    const options = parseOptions(req);
    const sheetSelections = parseSheetSelections(req);
    const parsedFiles = files.map((file, index) => {
      const fileKey = getUploadedFileKey(file, index);
      return parseCompleteDataFile(file, fileKey, sheetSelections.get(fileKey));
    });

    if (req.body.asyncImport?.toString() === "true") {
      const job = createCompleteDataImportJob(parsedFiles);
      res.status(202).json({ data: toJobSnapshot(job) });
      void runCompleteDataImportJob(job.id, parsedFiles, options);
      return;
    }

    const results = await importParsedFiles(
      parsedFiles,
      options,
      importContext,
    );

    if (importContext.isCanceled()) {
      return;
    }

    res.json({
      message: "完整体测数据导入完成",
      data: results,
    });
  } catch (error: any) {
    if (error instanceof CompleteDataImportCanceledError) {
      console.warn("完整体测数据导入已取消，事务已回滚");
      if (!res.headersSent && !importContext.isCanceled()) {
        res
          .status(499)
          .json({ error: "完整体测数据导入已取消", message: error.message });
      }
      return;
    }

    console.error("完整体测数据导入失败:", error);
    if (error instanceof CompleteDataImportValidationError) {
      res.status(400).json({
        error: "完整体测数据导入失败",
        message: error.message,
        data: error.results,
      });
      return;
    }

    if (error instanceof CompleteDataImportBadRequestError) {
      res.status(400).json({
        error: "完整体测数据导入失败",
        message: error.message,
      });
      return;
    }

    res
      .status(500)
      .json({ error: "完整体测数据导入失败", message: error.message });
  }
};

export const getImportJobStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const job = completeDataImportJobs.get(req.params.jobId);
  if (!job) {
    res.status(404).json({ error: "导入任务不存在或已过期" });
    return;
  }

  res.json({ data: toJobSnapshot(job) });
};

export const cancelImportJob = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const job = completeDataImportJobs.get(req.params.jobId);
  if (!job) {
    res.status(404).json({ error: "导入任务不存在或已过期" });
    return;
  }

  if (
    job.status === "completed" ||
    job.status === "failed" ||
    job.status === "canceled"
  ) {
    res.json({ data: toJobSnapshot(job) });
    return;
  }

  job.cancelRequested = true;
  updateJobProgress(job, {
    status: "canceling",
    message: "正在取消导入并回滚事务",
  });

  res.json({ data: toJobSnapshot(job) });
};
