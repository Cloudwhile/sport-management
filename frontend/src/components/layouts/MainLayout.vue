<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'
import Navbar from './Navbar.vue'
import Sidebar from './Sidebar.vue'

const authStore = useAuthStore()
const uiStore = useUIStore()

// 初始化时确保已加载用户信息
onMounted(async () => {
  if (!authStore.user && authStore.token) {
    try {
      await authStore.fetchCurrentUser()
    } catch (err) {
      console.error('获取用户信息失败:', err)
    }
  }
})

// 计算主内容区域的左边距
const contentPadding = computed(() => {
  return uiStore.sidebarCollapsed ? 'pl-16' : 'pl-64'
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 顶部导航栏 -->
    <Navbar />

    <!-- 左侧边栏 -->
    <Sidebar />

    <!-- 主内容区 -->
    <main :class="['pt-16 transition-all duration-300', contentPadding]">
      <div class="p-6">
        <router-view />
      </div>
    </main>
  </div>
</template>
