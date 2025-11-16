import http from '@/utils/http'
import type {
  Class,
  CreateClassRequest,
  UpdateClassRequest,
  ClassQueryParams,
  ClassStatisticsResponse,
  PaginatedResponse,
  Student
} from '@/types'

/**
 * 班级管理 API
 */
const classesAPI = {
  /**
   * 获取班级列表
   * @param params 查询参数（分页、排序、筛选）
   * @returns 班级列表（分页）
   */
  getClasses(params?: ClassQueryParams): Promise<PaginatedResponse<Class>> {
    return http.get('/classes', { params })
  },

  /**
   * 获取班级详情
   * @param id 班级ID
   * @returns 班级详细信息
   */
  getClassById(id: number): Promise<Class> {
    return http.get(`/classes/${id}`)
  },

  /**
   * 创建班级
   * @param data 班级信息
   * @returns 创建的班级
   */
  createClass(data: CreateClassRequest): Promise<Class> {
    return http.post('/classes', data)
  },

  /**
   * 更新班级信息
   * @param id 班级ID
   * @param data 更新的班级信息
   * @returns 更新后的班级
   */
  updateClass(id: number, data: UpdateClassRequest): Promise<Class> {
    return http.put(`/classes/${id}`, data)
  },

  /**
   * 删除班级
   * @param id 班级ID
   */
  deleteClass(id: number): Promise<void> {
    return http.delete(`/classes/${id}`)
  },

  /**
   * 重置班级密码
   * @param id 班级ID
   * @returns 新密码
   */
  resetPassword(id: number): Promise<{ password: string }> {
    return http.post(`/classes/${id}/reset-password`)
  },

  /**
   * 添加学生到班级
   * @param id 班级ID
   * @param studentId 学生ID
   * @param academicYear 学年
   */
  addStudent(id: number, studentId: number, academicYear: string): Promise<void> {
    return http.post(`/classes/${id}/students`, { studentId, academicYear })
  },

  /**
   * 从班级移除学生
   * @param id 班级ID
   * @param studentId 学生ID
   */
  removeStudent(id: number, studentId: number): Promise<void> {
    return http.delete(`/classes/${id}/students/${studentId}`)
  },

  /**
   * 获取班级统计详情
   * @param id 班级ID
   * @returns 班级统计信息（包含班级信息、学生列表、体测统计）
   */
  getClassStatistics(id: number): Promise<ClassStatisticsResponse> {
    return http.get(`/classes/${id}/statistics`)
  }
}

export default classesAPI
