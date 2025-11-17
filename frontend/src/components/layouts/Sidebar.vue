<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'
import { UserRole } from '@/types/common'
import {
  HomeIcon,
  UsersIcon,
  AcademicCapIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  InformationCircleIcon
} from '@heroicons/vue/24/outline'
import {
  HomeIcon as HomeIconSolid,
  UsersIcon as UsersIconSolid,
  AcademicCapIcon as AcademicCapIconSolid,
  UserGroupIcon as UserGroupIconSolid,
  DocumentTextIcon as DocumentTextIconSolid,
  ClipboardDocumentListIcon as ClipboardDocumentListIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid,
  InformationCircleIcon as InformationCircleIconSolid
} from '@heroicons/vue/24/solid'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const uiStore = useUIStore()

// 获取设置 store
import { useSettingsStore } from '@/stores'
const settingsStore = useSettingsStore()

// 获取应用标题
const appTitle = computed(() => settingsStore.appTitle)
const todayYear = new Date().getFullYear()

// 恢复侧边栏状态
onMounted(() => {
  uiStore.restoreSidebarState()
})

// 计算侧边栏宽度
const sidebarWidth = computed(() => {
  return uiStore.sidebarCollapsed ? 'w-16' : 'w-64'
})

// 菜单项类型
interface MenuItem {
  name: string
  label: string
  icon: any
  iconSolid: any
  roles?: UserRole[]
}

// 所有菜单项
const allMenuItems: MenuItem[] = [
  {
    name: 'Dashboard',
    label: '控制台',
    icon: HomeIcon,
    iconSolid: HomeIconSolid
  },
  {
    name: 'UserManagement',
    label: '用户管理',
    icon: UsersIcon,
    iconSolid: UsersIconSolid,
    roles: [UserRole.ADMIN]
  },
  {
    name: 'ClassManagement',
    label: '班级管理',
    icon: AcademicCapIcon,
    iconSolid: AcademicCapIconSolid,
    roles: [UserRole.ADMIN, UserRole.TEACHER]
  },
  {
    name: 'StudentManagement',
    label: '学生管理',
    icon: UserGroupIcon,
    iconSolid: UserGroupIconSolid,
    roles: [UserRole.ADMIN, UserRole.TEACHER]
  },
  {
    name: 'FormManagement',
    label: '表单管理',
    icon: DocumentTextIcon,
    iconSolid: DocumentTextIconSolid,
    roles: [UserRole.ADMIN, UserRole.TEACHER]
  },
  {
    name: 'RecordManagement',
    label: '数据录入',
    icon: ClipboardDocumentListIcon,
    iconSolid: ClipboardDocumentListIconSolid
  },
  {
    name: 'Statistics',
    label: '统计分析',
    icon: ChartBarIcon,
    iconSolid: ChartBarIconSolid,
    roles: [UserRole.ADMIN, UserRole.TEACHER]
  },
  {
    name: 'SystemSettings',
    label: '系统设置',
    icon: Cog6ToothIcon,
    iconSolid: Cog6ToothIconSolid,
    roles: [UserRole.ADMIN]
  },
  {
    name: 'About',
    label: '关于我们',
    icon: InformationCircleIcon,
    iconSolid: InformationCircleIconSolid
  }
]

// 根据用户角色过滤菜单项
const menuItems = computed(() => {
  const userRole = authStore.userRole
  if (!userRole) return []

  return allMenuItems.filter(item => {
    if (!item.roles) return true
    return item.roles.includes(userRole)
  })
})

// 检查菜单项是否激活
const isActive = (itemName: string) => {
  return route.name === itemName
}

// 导航到指定页面
const navigateTo = (itemName: string) => {
  router.push({ name: itemName })
}
</script>

<template>
  <aside
    :class="[
      'fixed top-16 left-0 bottom-0 bg-white border-r border-gray-200 z-30 transition-all duration-300 flex flex-col',
      sidebarWidth
    ]"
  >
    <nav class="flex-1 overflow-y-auto py-4">
      <ul class="space-y-1 px-3">
        <li v-for="item in menuItems" :key="item.name">
          <button
            @click="navigateTo(item.name)"
            :class="[
              'w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 group relative',
              uiStore.sidebarCollapsed ? 'justify-center' : 'space-x-3',
              isActive(item.name)
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            ]"
            :title="uiStore.sidebarCollapsed ? item.label : ''"
          >
            <component
              :is="isActive(item.name) ? item.iconSolid : item.icon"
              class="w-5 h-5 flex-shrink-0"
            />
            <span
              v-show="!uiStore.sidebarCollapsed"
              class="transition-opacity duration-200"
            >
              {{ item.label }}
            </span>

            <!-- 收缩时的提示框 -->
            <div
              v-if="uiStore.sidebarCollapsed"
              class="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-50"
            >
              {{ item.label }}
            </div>
          </button>
        </li>
      </ul>
    </nav>

    <!-- 版本信息 -->
    <div
      :class="[
        'border-t border-gray-200 py-3 px-3',
        uiStore.sidebarCollapsed ? 'text-center' : ''
      ]"
    >
      <div
        v-if="!uiStore.sidebarCollapsed"
        class="text-xs text-gray-500"
      >
        <p class="font-medium">Version 1.0.0</p>
        <p class="mt-0.5">&copy; {{ todayYear }} {{ appTitle }}</p>
      </div>
      <div
        v-else
        class="text-xs text-gray-500 font-medium"
        title="Version 1.0.0"
      >
        v1.0
      </div>
    </div>
  </aside>
</template>
