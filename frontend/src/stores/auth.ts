import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authAPI } from '@/api'
import type { User, UserRole } from '@/types'

const TOKEN_KEY = 'auth_token'

export const useAuthStore = defineStore('auth', () => {
  // State
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY))
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const userRole = computed(() => user.value?.role || null)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isTeacher = computed(() => user.value?.role === 'teacher')

  // Actions
  /**
   * 用户登录
   * @param username 用户名
   * @param password 密码
   */
  async function login(username: string, password: string) {
    try {
      loading.value = true
      error.value = null

      const response = await authAPI.login({ username, password })

      // 保存 token 到 localStorage
      token.value = response.token
      localStorage.setItem(TOKEN_KEY, response.token)

      // 保存用户信息
      user.value = response.user

      return response
    } catch (err: any) {
      error.value = err.message || '登录失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 用户登出
   */
  async function logout() {
    try {
      loading.value = true
      error.value = null

      await authAPI.logout()

      // 清除 token 和用户信息
      token.value = null
      user.value = null
      localStorage.removeItem(TOKEN_KEY)
    } catch (err: any) {
      error.value = err.message || '登出失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取当前用户信息
   */
  async function fetchCurrentUser() {
    try {
      loading.value = true
      error.value = null

      const userData = await authAPI.getCurrentUser()
      user.value = userData

      return userData
    } catch (err: any) {
      error.value = err.message || '获取用户信息失败'
      // 如果获取用户信息失败，清除 token
      token.value = null
      user.value = null
      localStorage.removeItem(TOKEN_KEY)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 初始化认证状态
   * 从 localStorage 恢复 token 并获取用户信息
   */
  async function initAuth() {
    const savedToken = localStorage.getItem(TOKEN_KEY)
    if (savedToken) {
      token.value = savedToken
      try {
        await fetchCurrentUser()
      } catch (err) {
        // 如果获取用户信息失败，清除 token
        token.value = null
        user.value = null
        localStorage.removeItem(TOKEN_KEY)
      }
    }
  }

  /**
   * 清除错误信息
   */
  function clearError() {
    error.value = null
  }

  /**
   * 检查用户是否具有指定角色
   * @param role 角色
   */
  function hasRole(role: UserRole | UserRole[]): boolean {
    if (!user.value) return false

    if (Array.isArray(role)) {
      return role.includes(user.value.role)
    }

    return user.value.role === role
  }

  return {
    // State
    token,
    user,
    loading,
    error,
    // Getters
    isAuthenticated,
    userRole,
    isAdmin,
    isTeacher,
    // Actions
    login,
    logout,
    fetchCurrentUser,
    initAuth,
    clearError,
    hasRole
  }
})
