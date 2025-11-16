// 通用类型定义

// 用户角色枚举
export enum UserRole {
  ADMIN = 'admin',
  TEACHER = 'teacher',
  CLASS = 'class'
}

// 表单状态枚举
export enum FormStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  CLOSED = 'closed'
}

// 性别枚举
export enum Gender {
  MALE = 'male',
  FEMALE = 'female'
}

// 成绩等级枚举
export enum GradeLevel {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  PASS = 'pass',
  FAIL = 'fail'
}

// 分页参数
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  limit?: number;
}

// 分页响应
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 标准API响应
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  success: boolean;
}

// 排序参数
export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 查询过滤器
export interface FilterParams {
  [key: string]: any;
}
