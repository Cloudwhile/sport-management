import request from '@/utils/request'
import type {
  GetStudentsParams,
  CreateStudentData,
  UpdateStudentData,
  TransferStudentData,
  PaginatedResponse,
} from '@/types/api'
import type { Student } from '@/types/models'

/**
 * 学生管理 API
 */

/**
 * 获取学生列表
 */
export const getStudents = (params: GetStudentsParams) => {
  return request<PaginatedResponse<Student>>({
    url: '/students',
    method: 'get',
    params,
  })
}

/**
 * 获取学生详情
 */
export const getStudentById = (id: number) => {
  return request<Student>({
    url: `/students/${id}`,
    method: 'get',
  })
}

/**
 * 创建学生
 */
export const createStudent = (data: CreateStudentData) => {
  return request<Student>({
    url: '/students',
    method: 'post',
    data,
  })
}

/**
 * 更新学生信息
 */
export const updateStudent = (id: number, data: UpdateStudentData) => {
  return request<Student>({
    url: `/students/${id}`,
    method: 'put',
    data,
  })
}

/**
 * 删除学生
 */
export const deleteStudent = (id: number) => {
  return request({
    url: `/students/${id}`,
    method: 'delete',
  })
}

/**
 * 转班操作
 */
export const transferStudent = (id: number, data: TransferStudentData) => {
  return request<Student>({
    url: `/students/${id}/transfer`,
    method: 'post',
    data,
  })
}
