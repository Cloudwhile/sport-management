import http from '@/utils/http'
import type {
  Student,
  CreateStudentRequest,
  UpdateStudentRequest,
  StudentQueryParams,
  PaginatedResponse
} from '@/types'

/**
 * 学生管理 API
 */
const studentsAPI = {
  /**
   * 获取学生列表
   * @param params 查询参数（分页、排序、筛选）
   * @returns 学生列表（分页）
   */
  getStudents(params?: StudentQueryParams): Promise<PaginatedResponse<Student>> {
    return http.get('/students', { params })
  },

  /**
   * 获取学生详情
   * @param id 学生ID
   * @returns 学生详细信息
   */
  getStudentById(id: number): Promise<Student> {
    return http.get(`/students/${id}`)
  },

  /**
   * 创建学生
   * @param data 学生信息
   * @returns 创建的学生
   */
  createStudent(data: CreateStudentRequest): Promise<Student> {
    return http.post('/students', data)
  },

  /**
   * 更新学生信息
   * @param id 学生ID
   * @param data 更新的学生信息
   * @returns 更新后的学生
   */
  updateStudent(id: number, data: UpdateStudentRequest): Promise<Student> {
    return http.put(`/students/${id}`, data)
  },

  /**
   * 删除学生
   * @param id 学生ID
   */
  deleteStudent(id: number): Promise<void> {
    return http.delete(`/students/${id}`)
  },

  /**
   * 学生转班
   * @param id 学生ID
   * @param classId 目标班级ID
   * @param academicYear 学年（简化格式，如 "2024"）
   */
  transferStudent(
    id: number,
    classId: number,
    academicYear: string
  ): Promise<void> {
    return http.post(`/students/${id}/transfer`, {
      classId,
      academicYear
    })
  },

  /**
   * 批量导入学生
   * @param file Excel文件
   */
  batchImport(file: File): Promise<any> {
    const formData = new FormData()
    formData.append('file', file)

    return http.post('/students/batch-import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }
}

export default studentsAPI
