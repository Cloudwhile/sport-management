/**
 * Pinia Stores 统一导出
 *
 * 使用方式：
 * import { useAuthStore, useUsersStore } from '@/stores'
 *
 * 或者：
 * import { useAuthStore } from '@/stores/auth'
 */

export { useAuthStore } from './auth'
export { useUsersStore } from './users'
export { useClassesStore } from './classes'
export { useStudentsStore } from './students'
export { useFormsStore } from './forms'
export { useUIStore } from './ui'
