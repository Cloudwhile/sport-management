import { defineStore } from 'pinia'
import { ref } from 'vue'
import { usersAPI } from '@/api'
import type {
  User,
  UserQueryParams,
  CreateUserRequest,
  UpdateUserRequest
} from '@/types'

export const useUsersStore = defineStore('users', () => {
  // State
  const items = ref<User[]>([])
  const total = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Actions
  /**
   * 获取用户列表
   * @param params 查询参数
   */
  async function fetchList(params?: UserQueryParams) {
    try {
      loading.value = true
      error.value = null

      const response = await usersAPI.getUsers(params)

      items.value = response.data
      total.value = response.total

      return response
    } catch (err: any) {
      error.value = err.message || '获取用户列表失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 根据ID获取用户详情
   * @param id 用户ID
   */
  async function fetchById(id: number) {
    try {
      loading.value = true
      error.value = null

      const user = await usersAPI.getUserById(id)

      return user
    } catch (err: any) {
      error.value = err.message || '获取用户详情失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 创建用户
   * @param data 用户数据
   */
  async function create(data: CreateUserRequest) {
    try {
      loading.value = true
      error.value = null

      const user = await usersAPI.createUser(data)

      // 将新用户添加到列表
      items.value.unshift(user)
      total.value++

      return user
    } catch (err: any) {
      error.value = err.message || '创建用户失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新用户
   * @param id 用户ID
   * @param data 更新的数据
   */
  async function update(id: number, data: UpdateUserRequest) {
    try {
      loading.value = true
      error.value = null

      const user = await usersAPI.updateUser(id, data)

      // 更新列表中的用户
      const index = items.value.findIndex(item => item.id === id)
      if (index !== -1) {
        items.value[index] = user
      }

      return user
    } catch (err: any) {
      error.value = err.message || '更新用户失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 删除用户
   * @param id 用户ID
   */
  async function remove(id: number) {
    try {
      loading.value = true
      error.value = null

      await usersAPI.deleteUser(id)

      // 从列表中移除用户
      const index = items.value.findIndex(item => item.id === id)
      if (index !== -1) {
        items.value.splice(index, 1)
        total.value--
      }
    } catch (err: any) {
      error.value = err.message || '删除用户失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 修改用户密码
   * @param id 用户ID
   * @param password 新密码
   */
  async function updatePassword(id: number, password: string) {
    try {
      loading.value = true
      error.value = null

      await usersAPI.updatePassword(id, password)
    } catch (err: any) {
      error.value = err.message || '修改密码失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取教师管理的班级列表
   * @param id 教师用户ID
   */
  async function getTeacherClasses(id: number) {
    try {
      loading.value = true
      error.value = null

      const classes = await usersAPI.getTeacherClasses(id)

      return classes
    } catch (err: any) {
      error.value = err.message || '获取教师班级列表失败'
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
    updatePassword,
    getTeacherClasses,
    clearError
  }
})
