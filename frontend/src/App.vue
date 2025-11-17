<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore, useSettingsStore } from '@/stores'

const authStore = useAuthStore()
const settingsStore = useSettingsStore()

onMounted(async () => {
  // 先加载公开设置，这样系统标题等信息可以立即使用
  await settingsStore.loadPublicSettings()
  // 然后初始化认证
  await authStore.initAuth()
})
</script>

<template>
  <router-view />
</template>
