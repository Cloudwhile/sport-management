/**
 * 数据模型类型定义
 */

/** 性别枚举 */
export type Gender = 'male' | 'female'

/** 用户角色 */
export type UserRole = 'admin' | 'teacher' | 'student'

/** 学生信息 */
export interface Student {
  id: number
  studentIdNational: string // 学籍号
  studentIdSchool: string // 学校学号
  name: string
  gender: Gender
  birthDate: string
  idCardNumber?: string
  phone?: string
  classId: number
  academicYear: string
  createdAt?: string
  updatedAt?: string
}

/** 班级信息 */
export interface Class {
  id: number
  gradeId: number
  className: string
  academicYear: string
  createdAt?: string
  updatedAt?: string
}

/** 年级信息 */
export interface Grade {
  id: number
  gradeName: string
  gradeLevel: number
  createdAt?: string
  updatedAt?: string
}

/** 用户信息 */
export interface User {
  id: number
  username: string
  role: UserRole
  email?: string
  createdAt?: string
  updatedAt?: string
}

/** 表单状态 */
export type FormStatus = 'draft' | 'published' | 'closed'

/** 测试项目性别限制 */
export type GenderLimit = 'male' | 'female' | null

/** 体测表单项 */
export interface FormTestItem {
  id: number
  formId: number
  itemCode: string
  itemName: string
  itemUnit?: string
  genderLimit?: GenderLimit
  isRequired: boolean
  sortOrder: number
  scoringStandard?: Record<string, any>
  created_at?: string
}

/** 体测表单 */
export interface PhysicalTestForm {
  id: number
  formName: string
  academicYear: string
  testDate?: string
  startTime?: string
  endTime?: string
  status: FormStatus
  description?: string
  createdBy?: number
  testItems?: FormTestItem[]
  created_at?: string
  updated_at?: string
}

/** 体测记录 */
export interface PhysicalTestRecord {
  id: number
  studentId: number
  formId: number
  testDate: string
  testResults: Record<string, number>
  totalScore?: number
  createdAt?: string
  updatedAt?: string
}
