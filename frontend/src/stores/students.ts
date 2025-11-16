import { defineStore } from 'pinia'
import { ref } from 'vue'
import { studentsAPI } from '@/api'
import type {
  Student,
  StudentQueryParams,
  CreateStudentRequest,
  UpdateStudentRequest
} from '@/types'

export const useStudentsStore = defineStore('students', () => {
  // State
  const items = ref<Student[]>([])
  const total = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Actions
  /**
   * 获取学生列表
   * @param params 查询参数
   */
  async function fetchList(params?: StudentQueryParams) {
    try {
      loading.value = true
      error.value = null

      const response = await studentsAPI.getStudents(params)

      items.value = response.data
      total.value = response.total

      return response
    } catch (err: any) {
      error.value = err.message || '获取学生列表失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 根据ID获取学生详情
   * @param id 学生ID
   */
  async function fetchById(id: number) {
    try {
      loading.value = true
      error.value = null

      const student = await studentsAPI.getStudentById(id)

      return student
    } catch (err: any) {
      error.value = err.message || '获取学生详情失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 创建学生
   * @param data 学生数据
   */
  async function create(data: CreateStudentRequest) {
    try {
      loading.value = true
      error.value = null

      const student = await studentsAPI.createStudent(data)

      // 将新学生添加到列表
      items.value.unshift(student)
      total.value++

      return student
    } catch (err: any) {
      error.value = err.message || '创建学生失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新学生
   * @param id 学生ID
   * @param data 更新的数据
   */
  async function update(id: number, data: UpdateStudentRequest) {
    try {
      loading.value = true
      error.value = null

      const student = await studentsAPI.updateStudent(id, data)

      // 更新列表中的学生
      const index = items.value.findIndex(item => item.id === id)
      if (index !== -1) {
        items.value[index] = student
      }

      return student
    } catch (err: any) {
      error.value = err.message || '更新学生失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 删除学生
   * @param id 学生ID
   */
  async function remove(id: number) {
    try {
      loading.value = true
      error.value = null

      await studentsAPI.deleteStudent(id)

      // 从列表中移除学生
      const index = items.value.findIndex(item => item.id === id)
      if (index !== -1) {
        items.value.splice(index, 1)
        total.value--
      }
    } catch (err: any) {
      error.value = err.message || '删除学生失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 学生转班
   * @param id 学生ID
   * @param classId 目标班级ID
   * @param academicYear 学年
   */
  async function transferStudent(
    id: number,
    classId: number,
    academicYear: string
  ) {
    try {
      loading.value = true
      error.value = null

      await studentsAPI.transferStudent(id, classId, academicYear)
    } catch (err: any) {
      error.value = err.message || '学生转班失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 清除错误信息
   */
  function clearError() {
    error.value = null
  }

  return {
    // State
    items,
    total,
    loading,
    error,
    // Actions
    fetchList,
    fetchById,
    create,
    update,
    remove,
    transferStudent,
    clearError
  }
})
