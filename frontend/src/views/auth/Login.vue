<template>
  <div
    class="relative min-h-screen overflow-hidden bg-cover bg-center bg-no-repeat px-4 sm:px-6 lg:px-8"
    :class="homeImageUrl ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100'"
    :style="homeImageUrl ? { backgroundImage: `url(${homeImageUrl})` } : undefined"
  >
    <div
      v-if="homeImageUrl"
      class="absolute inset-0 bg-white/18 backdrop-blur-md"
      aria-hidden="true"
    ></div>

    <div class="relative z-10 flex min-h-screen items-center justify-center py-10">
      <div class="w-full max-w-md space-y-8">
        <div class="text-center">
          <img
            v-if="showSiteLogo"
            :src="siteLogoUrl"
            :alt="appTitle"
            class="mx-auto h-20 max-w-64 object-contain"
            @error="siteLogoLoadFailed = true"
          />
          <BuildingLibraryIcon v-else class="mx-auto h-14 w-14 text-indigo-600" />

          <h2
            :class="[
              'mt-6 text-3xl font-extrabold',
              homeImageUrl ? 'text-white drop-shadow' : 'text-gray-900'
            ]"
          >
            {{ appTitle }}
          </h2>
          <p :class="['mt-2 text-sm', homeImageUrl ? 'text-white drop-shadow' : 'text-gray-600']">
            请登录以继续使用系统
          </p>
        </div>

        <div class="bg-white rounded-lg shadow-xl p-8">
          <form @submit.prevent="handleLogin" class="space-y-6">
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

        <div class="text-center">
          <p :class="['text-xs', homeImageUrl ? 'text-white drop-shadow' : 'text-gray-500']">
            &copy; {{ todayYear }} {{ appTitle }}. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSettingsStore } from '@/stores'
import { UserIcon, LockClosedIcon, BuildingLibraryIcon } from '@heroicons/vue/24/outline'

const router = useRouter()
const authStore = useAuthStore()
const settingsStore = useSettingsStore()

const appTitle = computed(() => settingsStore.appTitle)
const siteLogoUrl = computed(() => settingsStore.siteLogoUrl)
const homeImageUrl = computed(() => settingsStore.homeImageUrl)
const siteLogoLoadFailed = ref(false)
const showSiteLogo = computed(() => Boolean(siteLogoUrl.value) && !siteLogoLoadFailed.value)
const todayYear = new Date().getFullYear()

watch(siteLogoUrl, () => {
  siteLogoLoadFailed.value = false
})

const formData = reactive({
  username: '',
  password: ''
})

const loading = ref(false)
const errors = reactive<{
  username?: string
  password?: string
  global?: string
}>({})

const validateForm = (): boolean => {
  errors.username = undefined
  errors.password = undefined
  errors.global = undefined

  let isValid = true

  if (!formData.username.trim()) {
    errors.username = '请输入用户名'
    isValid = false
  }

  if (!formData.password) {
    errors.password = '请输入密码'
    isValid = false
  } else if (formData.password.length < 6) {
    errors.password = '密码至少需要 6 位'
    isValid = false
  }

  return isValid
}

const clearFieldError = (field: 'username' | 'password') => {
  errors[field] = undefined
  errors.global = undefined
}

const handleLogin = async () => {
  if (!validateForm()) return

  try {
    loading.value = true
    errors.global = undefined
    await authStore.login(formData.username, formData.password)
    router.push('/dashboard')
  } catch (error: any) {
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

onMounted(() => {
  if (authStore.isAuthenticated) {
    router.push('/dashboard')
  }

  authStore.clearError()
})
</script>
