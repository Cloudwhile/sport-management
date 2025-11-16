<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'
import { ArrowRightOnRectangleIcon, Bars3Icon } from '@heroicons/vue/24/outline'
import { UserRole } from '@/types/common'

const router = useRouter()
const authStore = useAuthStore()
const uiStore = useUIStore()

// 获取应用标题
const appTitle = import.meta.env.VITE_APP_TITLE || '学校体测数据管理系统'

// 计算角色显示名称
const roleLabel = computed(() => {
  if (!authStore.user) return ''
  switch (authStore.user.role) {
    case UserRole.ADMIN:
      return '管理员'
    case UserRole.TEACHER:
      return '教师'
    case UserRole.CLASS:
      return '班级账号'
    default:
      return '未知'
  }
})

// 计算角色徽章样式
const roleBadgeClass = computed(() => {
  if (!authStore.user) return 'bg-gray-100 text-gray-800'
  switch (authStore.user.role) {
    case UserRole.ADMIN:
      return 'bg-purple-100 text-purple-800'
    case UserRole.TEACHER:
      return 'bg-blue-100 text-blue-800'
    case UserRole.CLASS:
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
})

// 退出登录
const handleLogout = async () => {
  try {
    await authStore.logout()
    router.push('/login')
  } catch (err) {
    console.error('退出登录失败:', err)
  }
}
</script>

<template>
  <nav class="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-40">
    <div class="h-full flex items-center justify-between px-6">
      <!-- Logo 和标题 -->
      <div class="flex items-center space-x-3">
        <!-- 侧边栏切换按钮 -->
        <button
          @click="uiStore.toggleSidebar"
          class="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors duration-200"
          title="收缩/展开侧边栏"
        >
          <Bars3Icon class="w-6 h-6" />
        </button>

        <div class="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
          <span class="text-white font-bold text-lg">体测</span>
        </div>
        <h1 class="text-xl font-semibold text-gray-900">{{ appTitle }}</h1>
      </div>

      <!-- 用户信息和操作 -->
      <div class="flex items-center space-x-4">
        <!-- 用户信息 -->
        <div class="flex items-center space-x-3">
          <div class="text-right">
            <div class="text-sm font-medium text-gray-900">
              {{ authStore.user?.realName || authStore.user?.username }}
            </div>
            <div class="text-xs text-gray-500">
              {{ authStore.user?.username }}
            </div>
          </div>

          <!-- 角色徽章 -->
          <span
            :class="[
              'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
              roleBadgeClass
            ]"
          >
            {{ roleLabel }}
          </span>
        </div>

        <!-- 分隔线 -->
        <div class="h-8 w-px bg-gray-300"></div>

        <!-- 退出按钮 -->
        <button
          @click="handleLogout"
          class="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
          title="退出登录"
        >
          <ArrowRightOnRectangleIcon class="w-5 h-5" />
          <span>退出</span>
        </button>
      </div>
    </div>
  </nav>
</template>
