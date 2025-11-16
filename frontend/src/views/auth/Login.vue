<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <!-- Logo 和标题 -->
      <div class="text-center">
        <div class="flex justify-center">
          <div class="bg-indigo-600 rounded-full p-3">
            <BuildingLibraryIcon class="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 class="mt-6 text-3xl font-extrabold text-gray-900">
          {{ appTitle }}
        </h2>
        <p class="mt-2 text-sm text-gray-600">
          请登录以继续使用系统
        </p>
      </div>

      <!-- 登录表单卡片 -->
      <div class="bg-white rounded-lg shadow-xl p-8">
        <form @submit.prevent="handleLogin" class="space-y-6">
          <!-- 用户名输入框 -->
          <div>
            <label for="username" class="block text-sm font-medium text-gray-700">
              用户名
            </label>
            <div class="mt-1 relative rounded-md shadow-sm">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserIcon class="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="username"
                v-model="formData.username"
                type="text"
                autocomplete="username"
                required
                class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                :class="{ 'border-red-300': errors.username }"
                placeholder="请输入用户名"
                :disabled="loading"
                @input="clearFieldError('username')"
              />
            </div>
            <p v-if="errors.username" class="mt-1 text-sm text-red-600">
              {{ errors.username }}
            </p>
          </div>

          <!-- 密码输入框 -->
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700">
              密码
            </label>
            <div class="mt-1 relative rounded-md shadow-sm">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LockClosedIcon class="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                v-model="formData.password"
                type="password"
                autocomplete="current-password"
                required
                class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                :class="{ 'border-red-300': errors.password }"
                placeholder="请输入密码"
                :disabled="loading"
                @input="clearFieldError('password')"
              />
            </div>
            <p v-if="errors.password" class="mt-1 text-sm text-red-600">
              {{ errors.password }}
            </p>
          </div>

          <!-- 全局错误提示 -->
          <div
            v-if="errors.global"
            class="rounded-md bg-red-50 p-4 border border-red-200"
          >
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <p class="text-sm font-medium text-red-800">
                  {{ errors.global }}
                </p>
              </div>
            </div>
          </div>

          <!-- 登录按钮 -->
          <div>
            <button
              type="submit"
              :disabled="loading"
              class="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <span v-if="!loading">登录</span>
              <span v-else class="flex items-center">
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                登录中...
              </span>
            </button>
          </div>
        </form>
      </div>

      <!-- 底部版权信息 -->
      <div class="text-center">
        <p class="text-xs text-gray-500">
          &copy; {{ todayYear }} {{ appTitle }}. All rights reserved.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { UserIcon, LockClosedIcon, BuildingLibraryIcon } from '@heroicons/vue/24/outline'

// ==================== 初始化 ====================
const router = useRouter()
const authStore = useAuthStore()

// 获取应用标题
const appTitle = import.meta.env.VITE_APP_TITLE || '学校体测数据管理系统'
const todayYear = new Date().getFullYear()

// ==================== 表单数据 ====================
const formData = reactive({
  username: '',
  password: ''
})

// ==================== 表单状态 ====================
const loading = ref(false)
const errors = reactive<{
  username?: string
  password?: string
  global?: string
}>({})

// ==================== 表单验证 ====================
/**
 * 验证表单
 */
const validateForm = (): boolean => {
  // 清空之前的错误
  errors.username = undefined
  errors.password = undefined
  errors.global = undefined

  let isValid = true

  // 验证用户名
  if (!formData.username.trim()) {
    errors.username = '请输入用户名'
    isValid = false
  }

  // 验证密码
  if (!formData.password) {
    errors.password = '请输入密码'
    isValid = false
  } else if (formData.password.length < 6) {
    errors.password = '密码至少需要6位'
    isValid = false
  }

  return isValid
}

/**
 * 清除单个字段的错误
 */
const clearFieldError = (field: 'username' | 'password') => {
  errors[field] = undefined
  errors.global = undefined
}

// ==================== 登录处理 ====================
/**
 * 处理登录
 */
const handleLogin = async () => {
  // 验证表单
  if (!validateForm()) {
    return
  }

  try {
    loading.value = true
    errors.global = undefined

    // 调用 store 的 login 方法
    await authStore.login(formData.username, formData.password)

    // 登录成功，跳转到 dashboard
    router.push('/dashboard')
  } catch (error: any) {
    // 显示错误信息
    if (error.response?.data?.message) {
      errors.global = error.response.data.message
    } else if (error.message) {
      errors.global = error.message
    } else {
      errors.global = '登录失败，请检查用户名和密码'
    }
  } finally {
    loading.value = false
  }
}

// ==================== 生命周期 ====================
onMounted(() => {
  // 如果已经登录，直接跳转到 dashboard
  if (authStore.isAuthenticated) {
    router.push('/dashboard')
  }

  // 清除之前的错误信息
  authStore.clearError()
})
</script>

<style scoped>
/* 添加一些自定义样式以增强动画效果 */
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
