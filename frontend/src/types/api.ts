// API 请求/响应类型定义

import type {
  User,
  Class,
  Student,
  PhysicalTestForm,
  FormTestItem,
  PhysicalTestRecord,
  StudentClassRelation,
  StudentWithClass,
  PhysicalTestRecordWithDetails,
  PhysicalTestFormWithItems,
  ClassWithStudents
} from './models';
import type {
  PaginationParams,
  PaginatedResponse,
  SortParams,
  FilterParams
} from './common';
import { UserRole, FormStatus, Gender } from './common';

// ==================== 用户相关 API ====================

// 登录请求
export interface LoginRequest {
  username: string;
  password: string;
}

// 登录响应
export interface LoginResponse {
  token: string;
  user: User;
}

// 创建用户请求
export interface CreateUserRequest {
  username: string;
  password: string;
  role: UserRole;
  realName: string;
}

// 更新用户请求
export interface UpdateUserRequest {
  username?: string;
  password?: string;
  role?: UserRole;
  realName?: string;
}

// 用户查询参数
export interface UserQueryParams extends PaginationParams, SortParams {
  role?: UserRole;
  realName?: string;
  username?: string;
}

// ==================== 班级相关 API ====================

// 创建班级请求
export interface CreateClassRequest {
  cohort: string;
  className: string;
  classAccount: string;
}

// 更新班级请求
export interface UpdateClassRequest {
  cohort?: string;
  className?: string;
  classAccount?: string;
}

// 班级查询参数
export interface ClassQueryParams extends PaginationParams, SortParams {
  cohort?: string;
  className?: string;
  classAccount?: string;
  graduated?: boolean;
  gradeLevel?: number;
}

// 班级统计响应
export interface ClassStatisticsResponse {
  classInfo: ClassWithStudents;
  students: Student[];
  testStatistics: {
    participatedFormsCount: number; // 参与的体测表单数量
    totalRecordsCount: number; // 体测记录总数
    completionRate: number; // 完成率（百分比）
  };
}

// ==================== 学生相关 API ====================

// 创建学生请求
export interface CreateStudentRequest {
  studentIdNational: string;
  studentIdSchool: string;
  name: string;
  gender: Gender;
  birthDate: string;
  idCardNumber?: string;
}

// 更新学生请求
export interface UpdateStudentRequest {
  studentIdNational?: string;
  studentIdSchool?: string;
  name?: string;
  gender?: Gender;
  birthDate?: string;
  idCardNumber?: string;
}

// 学生查询参数
export interface StudentQueryParams extends PaginationParams, SortParams {
  name?: string;
  gender?: Gender;
  studentIdNational?: string;
  studentIdSchool?: string;
  classId?: number;
  academicYear?: string;
}

// ==================== 体测表单相关 API ====================

// 创建体测表单请求
export interface CreatePhysicalTestFormRequest {
  formName: string;
  academicYear: string;
  participatingCohorts: string[]; // 必填: 参与的年级
  testDate: string;
  startTime?: string;
  endTime?: string;
  status?: FormStatus;
  description?: string;
}

// 更新体测表单请求
export interface UpdatePhysicalTestFormRequest {
  formName?: string;
  academicYear?: string;
  participatingCohorts?: string[]; // 草稿状态可修改
  testDate?: string;
  startTime?: string;
  endTime?: string;
  status?: FormStatus;
  description?: string;
}

// 体测表单查询参数
export interface PhysicalTestFormQueryParams extends PaginationParams, SortParams {
  academicYear?: string;
  status?: FormStatus;
  formName?: string;
  createdBy?: number;
}

// ==================== 表单测试项目相关 API ====================

// 创建表单测试项目请求
export interface CreateFormTestItemRequest {
  formId: number;
  itemCode: string;
  itemName: string;
  itemUnit: string;
  genderLimit?: Gender;
  isRequired?: boolean;
  sortOrder?: number;
  scoringStandard?: Record<string, any>;
}

// 更新表单测试项目请求
export interface UpdateFormTestItemRequest {
  itemCode?: string;
  itemName?: string;
  itemUnit?: string;
  genderLimit?: Gender;
  isRequired?: boolean;
  sortOrder?: number;
  scoringStandard?: Record<string, any>;
}

// 表单测试项目查询参数
export interface FormTestItemQueryParams extends PaginationParams {
  formId?: number;
  itemCode?: string;
  genderLimit?: Gender;
}

// ==================== 体测记录相关 API ====================

// 创建体测记录请求
export interface CreatePhysicalTestRecordRequest {
  formId: number;
  studentId: number;
  classId: number;
  testData: Record<string, any>;
  scores?: Record<string, any>;
  totalScore?: number;
  gradeLevel?: string;
}

// 更新体测记录请求
export interface UpdatePhysicalTestRecordRequest {
  testData?: Record<string, any>;
  scores?: Record<string, any>;
  totalScore?: number;
  gradeLevel?: string;
}

// 体测记录查询参数
export interface PhysicalTestRecordQueryParams extends PaginationParams, SortParams {
  formId?: number;
  studentId?: number;
  classId?: number;
  academicYear?: string;
  gradeLevel?: string;
  submittedBy?: number;
}

// ==================== 学生班级关系相关 API ====================

// 创建学生班级关系请求
export interface CreateStudentClassRelationRequest {
  studentId: number;
  classId: number;
  academicYear: string;
  isActive?: boolean;
}

// 更新学生班级关系请求
export interface UpdateStudentClassRelationRequest {
  isActive?: boolean;
}

// 学生班级关系查询参数
export interface StudentClassRelationQueryParams extends PaginationParams {
  studentId?: number;
  classId?: number;
  academicYear?: string;
  isActive?: boolean;
}

// ==================== 批量操作 ====================

// 批量导入学生请求
export interface BatchImportStudentsRequest {
  students: CreateStudentRequest[];
  classId?: number;
  academicYear?: string;
}

// 批量导入学生响应
export interface BatchImportStudentsResponse {
  success: number;
  failed: number;
  errors?: Array<{
    row: number;
    error: string;
    data: any;
  }>;
}

// 批量提交体测记录请求
export interface BatchSubmitTestRecordsRequest {
  formId: number;
  records: Array<{
    studentId: number;
    classId: number;
    testData: Record<string, any>;
  }>;
}

// ==================== 统计分析相关 API ====================

// 统计查询参数
export interface StatisticsQueryParams {
  academicYear?: string;
  formId?: number;
  classId?: number;
  gradeLevel?: string;
}

// 班级统计数据
export interface ClassStatistics {
  classId: number;
  className: string;
  totalStudents: number;
  submittedCount: number;
  averageScore: number;
  passRate: number;
  excellentRate: number;
}

// 项目统计数据
export interface ItemStatistics {
  itemCode: string;
  itemName: string;
  averageScore: number;
  passRate: number;
  maxValue: number;
  minValue: number;
}

// 成绩分布
export interface GradeDistribution {
  excellent: number;
  good: number;
  pass: number;
  fail: number;
}

// 整体统计响应（Dashboard 用）
export interface OverallStatsResponse {
  totalStudents: number;
  totalClasses: number;
  totalForms: number;
  totalRecords: number;
  yearStats?: {
    forms: number;
    records: number;
  };
}

// 统计汇总响应
export interface StatisticsSummaryResponse {
  totalStudents: number;
  submittedCount: number;
  submissionRate: number;
  averageScore: number;
  gradeDistribution: GradeDistribution;
  classSummaries?: ClassStatistics[];
  itemSummaries?: ItemStatistics[];
}
