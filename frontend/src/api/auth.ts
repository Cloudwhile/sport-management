import http from '@/utils/http'
import type { LoginRequest, LoginResponse } from '@/types'
import type { User } from '@/types'

/**
 * 认证 API
 */
const authAPI = {
  /**
   * 用户登录
   * @param data 登录信息
   * @returns 登录响应（包含 token 和用户信息）
   */
  login(data: LoginRequest): Promise<LoginResponse> {
    return http.post('/auth/login', data)
  },

  /**
   * 用户登出
   */
  logout(): Promise<void> {
    return http.post('/auth/logout')
  },

  /**
   * 获取当前登录用户信息
   * @returns 当前用户信息
   */
  getCurrentUser(): Promise<User> {
    return http.get('/auth/me')
  }
}

export default authAPI
