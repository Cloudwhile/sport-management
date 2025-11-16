import http from '@/utils/http'
import type {
  PhysicalTestRecord,
  PhysicalTestRecordWithDetails,
  CreatePhysicalTestRecordRequest,
  UpdatePhysicalTestRecordRequest,
  Student
} from '@/types'

/**
 * 体测记录 API
 */
const recordsAPI = {
  /**
   * 获取班级学生列表（用于体测录入）
   * @param formId 表单ID
   * @param classId 班级ID
   * @returns 学生列表
   */
  getClassStudentsForForm(formId: number, classId: number): Promise<Student[]> {
    return http.get(`/records/forms/${formId}/classes/${classId}/students`)
  },

  /**
   * 获取学生的体测记录
   * @param formId 表单ID
   * @param studentId 学生ID
   * @returns 体测记录详情
   */
  getStudentRecord(formId: number, studentId: number): Promise<PhysicalTestRecordWithDetails | null> {
    return http.get(`/records/forms/${formId}/students/${studentId}/record`)
  },

  /**
   * 创建或更新学生的体测记录
   * @param formId 表单ID
   * @param studentId 学生ID
   * @param data 体测记录数据
   * @returns 保存的体测记录
   */
  createOrUpdateRecord(
    formId: number,
    studentId: number,
    data: Omit<CreatePhysicalTestRecordRequest, 'formId' | 'studentId'>
  ): Promise<PhysicalTestRecord> {
    return http.post(`/records/forms/${formId}/students/${studentId}/record`, data)
  },

  /**
   * 批量保存体测记录
   * @param formId 表单ID
   * @param records 体测记录数组
   */
  batchSaveRecords(
    formId: number,
    records: Array<{
      studentId: number
      classId: number
      testData: Record<string, any>
    }>
  ): Promise<void> {
    return http.post(`/records/forms/${formId}/records/batch`, { records })
  },

  /**
   * 删除体测记录
   * @param formId 表单ID
   * @param studentId 学生ID
   */
  deleteRecord(formId: number, studentId: number): Promise<void> {
    return http.delete(`/records/forms/${formId}/students/${studentId}/record`)
  }
}

export default recordsAPI
