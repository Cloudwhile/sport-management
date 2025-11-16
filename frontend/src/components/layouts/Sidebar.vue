<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { UserRole } from '@/types/common'
import {
  HomeIcon,
  UsersIcon,
  AcademicCapIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon
} from '@heroicons/vue/24/outline'
import {
  HomeIcon as HomeIconSolid,
  UsersIcon as UsersIconSolid,
  AcademicCapIcon as AcademicCapIconSolid,
  UserGroupIcon as UserGroupIconSolid,
  DocumentTextIcon as DocumentTextIconSolid,
  ClipboardDocumentListIcon as ClipboardDocumentListIconSolid,
  ChartBarIcon as ChartBarIconSolid
} from '@heroicons/vue/24/solid'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

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
  <aside class="fixed top-16 left-0 bottom-0 w-64 bg-white border-r border-gray-200 z-30">
    <nav class="h-full overflow-y-auto py-4">
      <ul class="space-y-1 px-3">
        <li v-for="item in menuItems" :key="item.name">
          <button
            @click="navigateTo(item.name)"
            :class="[
              'w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200',
              isActive(item.name)
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            ]"
          >
            <component
              :is="isActive(item.name) ? item.iconSolid : item.icon"
              class="w-5 h-5 flex-shrink-0"
            />
            <span>{{ item.label }}</span>
          </button>
        </li>
      </ul>
    </nav>
  </aside>
</template>
