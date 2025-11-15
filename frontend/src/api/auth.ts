import request from '@/utils/request'
import type { LoginCredentials, LoginResponse, User } from '@/types/api'

/**
 * 认证 API
 */

/**
 * 用户登录
 */
export const login = (credentials: LoginCredentials) => {
  return request<LoginResponse>({
    url: '/auth/login',
    method: 'post',
    data: credentials,
  })
}

/**
 * 退出登录
 */
export const logout = () => {
  return request({
    url: '/auth/logout',
    method: 'post',
  })
}

/**
 * 获取当前用户信息
 */
export const getMe = () => {
  return request<User>({
    url: '/auth/me',
    method: 'get',
  })
}
