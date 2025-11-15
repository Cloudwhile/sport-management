/**
 * API 请求和响应类型定义
 */

import type { Student, Class, Grade, User as UserModel, PhysicalTestForm, FormTestItem } from './models'

// 重新导出 User 类型
export type User = UserModel

/** 统一的 API 响应格式 */
export interface ApiResponse<T = any> {
  success?: boolean
  data?: T
  error?: string
  message?: string
  pagination?: {
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}

/** 分页数据响应 */
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

/** 登录请求参数 */
export interface LoginCredentials {
  username: string
  password: string
}

/** 登录响应数据 */
export interface LoginResponse {
  token: string
  user: User
}

/** 获取学生列表参数 */
export interface GetStudentsParams {
  page?: number
  pageSize?: number
  search?: string
  classId?: number
  gradeId?: number
  academicYear?: string
}

/** 创建学生数据 */
export interface CreateStudentData {
  studentIdNational: string
  studentIdSchool: string
  name: string
  gender: 'male' | 'female'
  birthDate: string
  idCardNumber?: string
  phone?: string
  classId: number
  academicYear: string
}

/** 更新学生数据 */
export type UpdateStudentData = Partial<CreateStudentData>

/** 转班数据 */
export interface TransferStudentData {
  classId: number
  academicYear: string
}

/** 获取班级列表参数 */
export interface GetClassesParams {
  gradeId?: number
  academicYear?: string
  page?: number
  limit?: number
}

/** 创建班级数据 */
export interface CreateClassData {
  gradeId: number
  className: string
  academicYear: string
}

/** 更新班级数据 */
export type UpdateClassData = Partial<CreateClassData>

/** 获取年级列表参数 */
export interface GetGradesParams {
  page?: number
  pageSize?: number
  sortBy?: string
  order?: 'asc' | 'desc'
}

/** 创建年级数据 */
export interface CreateGradeData {
  gradeName: string
  gradeLevel: number
}

/** 更新年级数据 */
export type UpdateGradeData = Partial<CreateGradeData>

/** 获取表单列表参数 */
export interface GetFormsParams {
  page?: number
  pageSize?: number
  status?: 'all' | 'draft' | 'published' | 'closed'
  sortBy?: string
  order?: 'ASC' | 'DESC'
}

/** 创建表单数据 */
export interface CreateFormData {
  formName: string
  academicYear: string
  testDate?: string
  startTime?: string
  endTime?: string
  description?: string
}

/** 更新表单数据 */
export type UpdateFormData = Partial<CreateFormData>

/** 更新测试项目数据 */
export interface UpdateTestItemsData {
  items: Array<{
    id: number
    isRequired: boolean
    sortOrder: number
    scoringStandard?: Record<string, any>
  }>
}

