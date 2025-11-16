// 数据模型接口定义

import { UserRole, FormStatus, Gender, GradeLevel } from './common';

// 用户模型
export interface User {
  id: number;
  username: string;
  password?: string;
  role: UserRole;
  realName: string;
  createdAt?: string;
  updatedAt?: string;
}

// 班级模型
export interface Class {
  id: number;
  cohort: string; // 入学年份，如 "2024"
  className: string;
  classAccount: string;
  readonly graduated: boolean; // 虚拟字段：根据cohort自动计算
  readonly graduationYear: string; // 虚拟字段：根据cohort自动计算
  createdAt?: string;
  updatedAt?: string;
}

// 学生模型
export interface Student {
  id: number;
  studentIdNational: string; // 全国学籍号
  studentIdSchool: string; // 校内学号
  name: string;
  gender: Gender;
  birthDate: string; // ISO日期格式
  idCardNumber?: string;
  ethnicityCode?: string; // 民族代码
  createdAt?: string;
  updatedAt?: string;
}

// 体测表单模型
export interface PhysicalTestForm {
  id: number;
  formName: string;
  academicYear: string;
  participatingCohorts: string[]; // 参与的年级(入学年份数组), 如 ["2022", "2023"]
  testDate: string; // ISO日期格式
  startTime?: string; // ISO日期时间格式
  endTime?: string; // ISO日期时间格式
  status: FormStatus;
  description?: string;
  createdBy: number;
  createdAt?: string;
  updatedAt?: string;
}

// 测试项目评分标准
export interface ScoringStandard {
  [key: string]: any;
  minValue?: number;
  maxValue?: number;
  scoreRanges?: Array<{
    min: number;
    max: number;
    score: number;
  }>;
}

// 表单测试项目模型
export interface FormTestItem {
  id: number;
  formId: number;
  itemCode: string;
  itemName: string;
  itemUnit: string;
  genderLimit?: Gender;
  isRequired: boolean;
  sortOrder: number;
  scoringStandard?: ScoringStandard | Record<string, any>;
  validationRules?: {
    min?: number;
    max?: number;
    decimals?: number;
  };
  isCalculated?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// 测试数据
export interface TestData {
  [itemCode: string]: number | string;
}

// 成绩数据
export interface Scores {
  [itemCode: string]: number;
}

// 体测记录模型
export interface PhysicalTestRecord {
  id: number;
  formId: number;
  studentId: number;
  classId: number;
  testData: TestData | Record<string, any>;
  scores: Scores | Record<string, any>;
  totalScore?: number;
  gradeLevel?: GradeLevel;
  submittedBy: number;
  submittedAt: string;
  createdAt?: string;
  updatedAt?: string;
}

// 学生班级关系模型
export interface StudentClassRelation {
  studentId: number;
  classId: number;
  academicYear: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// 带关联数据的扩展模型
export interface StudentWithClass extends Student {
  class?: Class;
  classes?: Class[];
}

// 学生带体测记录（用于录入数据页面）
export interface StudentWithRecord extends Student {
  _record?: {
    id: number;
    testData: Record<string, any>;
    scores: Record<string, number>;
    totalScore: number;
    gradeLevel: string;
    submittedAt: string;
  } | null;
}

export interface PhysicalTestRecordWithDetails extends PhysicalTestRecord {
  student?: Student;
  class?: Class;
  form?: PhysicalTestForm;
  submitter?: User;
}

export interface PhysicalTestFormWithItems extends PhysicalTestForm {
  items?: FormTestItem[];
  creator?: User;
}

export interface ClassWithStudents extends Class {
  students?: Student[];
  studentCount?: number;
  currentGradeName?: string; // 当前年级名称
}
