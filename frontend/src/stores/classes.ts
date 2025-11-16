import { defineStore } from 'pinia'
import { ref } from 'vue'
import { classesAPI } from '@/api'
import type {
  Class,
  ClassQueryParams,
  CreateClassRequest,
  UpdateClassRequest
} from '@/types'

export const useClassesStore = defineStore('classes', () => {
  // State
  const items = ref<Class[]>([])
  const total = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Actions
  /**
   * 获取班级列表
   * @param params 查询参数
   */
  async function fetchList(params?: ClassQueryParams) {
    try {
      loading.value = true
      error.value = null

      const response = await classesAPI.getClasses(params)

      items.value = response.data
      total.value = response.total

      return response
    } catch (err: any) {
      error.value = err.message || '获取班级列表失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 根据ID获取班级详情
   * @param id 班级ID
   */
  async function fetchById(id: number) {
    try {
      loading.value = true
      error.value = null

      const classData = await classesAPI.getClassById(id)

      return classData
    } catch (err: any) {
      error.value = err.message || '获取班级详情失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 创建班级
   * @param data 班级数据
   */
  async function create(data: CreateClassRequest) {
    try {
      loading.value = true
      error.value = null

      const classData = await classesAPI.createClass(data)

      // 将新班级添加到列表
      items.value.unshift(classData)
      total.value++

      return classData
    } catch (err: any) {
      error.value = err.message || '创建班级失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新班级
   * @param id 班级ID
   * @param data 更新的数据
   */
  async function update(id: number, data: UpdateClassRequest) {
    try {
      loading.value = true
      error.value = null

      const classData = await classesAPI.updateClass(id, data)

      // 更新列表中的班级
      const index = items.value.findIndex(item => item.id === id)
      if (index !== -1) {
        items.value[index] = classData
      }

      return classData
    } catch (err: any) {
      error.value = err.message || '更新班级失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 删除班级
   * @param id 班级ID
   */
  async function remove(id: number) {
    try {
      loading.value = true
      error.value = null

      await classesAPI.deleteClass(id)

      // 从列表中移除班级
      const index = items.value.findIndex(item => item.id === id)
      if (index !== -1) {
        items.value.splice(index, 1)
        total.value--
      }
    } catch (err: any) {
      error.value = err.message || '删除班级失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 重置班级密码
   * @param id 班级ID
   * @param password 新密码
   */
  async function resetPassword(id: number, password: string) {
    try {
      loading.value = true
      error.value = null

      const result = await classesAPI.resetPassword(id, password)

      return result
    } catch (err: any) {
      error.value = err.message || '重置班级密码失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 添加学生到班级
   * @param id 班级ID
   * @param studentId 学生ID
   * @param academicYear 学年
   */
  async function addStudent(id: number, studentId: number, academicYear: string) {
    try {
      loading.value = true
      error.value = null

      await classesAPI.addStudent(id, studentId, academicYear)
    } catch (err: any) {
      error.value = err.message || '添加学生到班级失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 从班级移除学生
   * @param id 班级ID
   * @param studentId 学生ID
   */
  async function removeStudent(id: number, studentId: number) {
    try {
      loading.value = true
      error.value = null

      await classesAPI.removeStudent(id, studentId)
    } catch (err: any) {
      error.value = err.message || '从班级移除学生失败'
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
    resetPassword,
    addStudent,
    removeStudent,
    clearError
  }
})
