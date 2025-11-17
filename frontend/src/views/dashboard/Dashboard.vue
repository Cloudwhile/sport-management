<template>
  <!-- 加载状态 -->
  <div v-if="loading" class="flex items-center justify-center py-12">
    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
  </div>

  <!-- 错误状态 -->
  <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
    <div class="flex">
      <ExclamationCircleIcon class="h-5 w-5 text-red-400" aria-hidden="true" />
      <div class="ml-3">
        <p class="text-sm text-red-800">{{ error }}</p>
      </div>
    </div>
  </div>

  <!-- 数据已加载 -->
  <div v-else>
    <!-- 欢迎信息 -->
    <div class="bg-white shadow rounded-lg p-6 mb-6">
      <div class="flex items-center">
        <UserCircleIcon class="h-12 w-12 text-indigo-600" aria-hidden="true" />
        <div class="ml-4">
          <h2 class="text-2xl font-semibold text-gray-900">
            欢迎回来，{{ user?.realName || user?.username }}
          </h2>
          <p class="text-sm text-gray-500 mt-1">{{ roleText }}</p>
        </div>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
      <!-- 学生总数 -->
      <div class="bg-white shadow rounded-lg p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <UsersIcon class="h-8 w-8 text-blue-600" aria-hidden="true" />
          </div>
          <div class="ml-4 flex-1">
            <p class="text-sm font-medium text-gray-500">学生总数</p>
            <p class="text-2xl font-semibold text-gray-900">
              {{ studentCount }}
            </p>
          </div>
        </div>
      </div>

      <!-- 班级总数 -->
      <div class="bg-white shadow rounded-lg p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <AcademicCapIcon class="h-8 w-8 text-green-600" aria-hidden="true" />
          </div>
          <div class="ml-4 flex-1">
            <p class="text-sm font-medium text-gray-500">班级总数</p>
            <p class="text-2xl font-semibold text-gray-900">
              {{ classCount }}
            </p>
          </div>
        </div>
      </div>

      <!-- 体测表单总数 -->
      <div class="bg-white shadow rounded-lg p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <DocumentTextIcon class="h-8 w-8 text-purple-600" aria-hidden="true" />
          </div>
          <div class="ml-4 flex-1">
            <p class="text-sm font-medium text-gray-500">体测表单总数</p>
            <p class="text-2xl font-semibold text-gray-900">
              {{ formCount }}
            </p>
          </div>
        </div>
      </div>

      <!-- 体测记录总数 -->
      <div class="bg-white shadow rounded-lg p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <ClipboardDocumentCheckIcon class="h-8 w-8 text-orange-600" aria-hidden="true" />
          </div>
          <div class="ml-4 flex-1">
            <p class="text-sm font-medium text-gray-500">体测记录总数</p>
            <p class="text-2xl font-semibold text-gray-900">
              {{ recordCount }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 快捷操作 -->
    <div class="bg-white shadow rounded-lg p-6 mb-8">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">快捷操作</h3>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <!-- 管理员操作 -->
        <template v-if="isAdmin">
          <button
            @click="navigateTo('/forms')"
            class="flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition"
          >
            <DocumentPlusIcon class="h-5 w-5 mr-2" aria-hidden="true" />
            管理填报表单
          </button>
          <button
            @click="navigateTo('/users')"
            class="flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition"
          >
            <UserPlusIcon class="h-5 w-5 mr-2" aria-hidden="true" />
            管理用户
          </button>
        </template>

        <!-- 教师操作 -->
        <template v-if="isTeacher">
          <button
            @click="navigateTo('/classes')"
            class="flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
          >
            <AcademicCapIcon class="h-5 w-5 mr-2" aria-hidden="true" />
            查看班级
          </button>
          <button
            @click="navigateTo('/records')"
            class="flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition"
          >
            <PencilSquareIcon class="h-5 w-5 mr-2" aria-hidden="true" />
            数据录入
          </button>
          <button
            @click="navigateTo('/statistics')"
            class="flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition"
          >
            <ChartBarIcon class="h-5 w-5 mr-2" aria-hidden="true" />
            查看统计
          </button>
        </template>

        <!-- 班级账号操作 -->
        <template v-if="!isAdmin && !isTeacher">
          <button
            @click="navigateTo('/records')"
            class="flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition"
          >
            <PencilSquareIcon class="h-5 w-5 mr-2" aria-hidden="true" />
            数据录入
          </button>
        </template>
      </div>
    </div>

    <!-- 提示信息 -->
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
      <div class="flex">
        <svg class="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
        </svg>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-blue-800">系统提示</h3>
          <div class="mt-2 text-sm text-blue-700">
            <p>欢迎使用{{ appTitle }}！当前系统中已有 {{ overallStats?.totalStudents || 0 }} 名学生和 {{ overallStats?.totalClasses || 0 }} 个班级。</p>
            <p class="mt-1">请通过上方快捷操作开始使用系统功能。</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import statisticsAPI from '@/api/statistics'
import type { OverallStatsResponse } from '@/types'
import {
  UserCircleIcon,
  UsersIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  ClipboardDocumentCheckIcon,
  UserPlusIcon,
  PlusCircleIcon,
  DocumentPlusIcon,
  PencilSquareIcon,
  ChartBarIcon,
  ExclamationCircleIcon
} from '@heroicons/vue/24/outline'

// Router
const router = useRouter()

// Auth Store
const authStore = useAuthStore()
const user = computed(() => authStore.user)
const isAdmin = computed(() => authStore.isAdmin)

// 获取设置 store
import { useSettingsStore } from '@/stores'
const settingsStore = useSettingsStore()

// 获取应用标题
const appTitle = computed(() => settingsStore.appTitle)
const isTeacher = computed(() => authStore.isTeacher)

// State
const loading = ref(false)
const error = ref<string | null>(null)
const overallStats = ref<OverallStatsResponse | null>(null)
const studentCount = ref(0)
const classCount = ref(0)
const formCount = ref(0)
const recordCount = ref(0)

// Computed
const roleText = computed(() => {
  if (isAdmin.value) return '管理员'
  if (isTeacher.value) return '教师'
  return '班级账号'
})

// Methods
/**
 * 加载统计数据
 */
async function loadStats() {
  try {
    loading.value = true
    error.value = null

    // 获取整体统计数据
    const response = await statisticsAPI.getOverallStats()
    overallStats.value = response

    // 更新统计数据
    studentCount.value = response.totalStudents || 0
    classCount.value = response.totalClasses || 0
    formCount.value = response.totalForms || 0
    recordCount.value = response.totalRecords || 0
  } catch (err: any) {
    console.error('加载统计数据失败:', err)
    error.value = err.message || '加载统计数据失败'
  } finally {
    loading.value = false
  }
}

/**
 * 导航到指定页面
 * @param path 路径
 */
function navigateTo(path: string) {
  router.push(path)
}

// Lifecycle
onMounted(() => {
  loadStats()
})
</script>
