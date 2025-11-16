import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { UserRole } from '@/types/common'

/**
 * 路由守卫：权限控制
 */
export const authGuard = (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) => {
  const authStore = useAuthStore()

  // 检查路由是否需要认证（包括父路由的 meta）
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const requiredRoles = to.meta.roles as UserRole[] | undefined

  // 已登录但访问登录页，重定向
  if (to.path === '/login' && authStore.isAuthenticated) {
    // 如果有 redirect 参数，重定向到原页面，否则去首页
    const redirectPath = to.query.redirect as string || '/dashboard'
    next(redirectPath)
    return
  }

  // 需要认证但未登录
  if (requiresAuth && !authStore.isAuthenticated) {
    next({
      path: '/login',
      query: { redirect: to.fullPath }
    })
    return
  }

  // 不需要认证的路由直接放行
  if (!requiresAuth) {
    next()
    return
  }

  // 检查角色权限
  if (requiredRoles && requiredRoles.length > 0) {
    if (!authStore.hasRole(requiredRoles)) {
      // 无权限访问，重定向到首页并提示
      console.warn(`权限不足：需要 ${requiredRoles.join(', ')} 角色`)
      // TODO: 可以集成消息提示组件
      next('/dashboard')
      return
    }
  }

  // 所有检查通过，放行
  next()
}
