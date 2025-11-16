<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import Navbar from './Navbar.vue'
import Sidebar from './Sidebar.vue'

const authStore = useAuthStore()

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
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 顶部导航栏 -->
    <Navbar />

    <!-- 左侧边栏 -->
    <Sidebar />

    <!-- 主内容区 -->
    <main class="pt-16 pl-64">
      <div class="p-6">
        <router-view />
      </div>
    </main>
  </div>
</template>
