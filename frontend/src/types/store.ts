/**
 * Store 类型定义
 */

import type { User } from './models'

/** 用户 Store 状态 */
export interface UserState {
  token: string
  userInfo: User | null
}

/** 用户 Store 方法 */
export interface UserStore extends UserState {
  setToken: (token: string) => void
  setUserInfo: (userInfo: User) => void
  logout: () => void
}
