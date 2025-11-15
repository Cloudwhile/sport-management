/**
 * 路由类型定义
 */

import type { RouteLocationNormalized, NavigationGuardNext } from 'vue-router'

/** 扩展路由元信息 */
declare module 'vue-router' {
  interface RouteMeta {
    /** 是否需要认证 */
    requiresAuth?: boolean
    /** 页面标题 */
    title?: string
    /** 图标 */
    icon?: string
    /** 是否在菜单中隐藏 */
    hidden?: boolean
  }
}

/** 路由守卫参数类型 */
export type RouteGuard = (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) => void
