<script setup lang="ts">
import { ref, onMounted, provide } from 'vue'
import { useAuthStore, useSettingsStore } from '@/stores'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import { ConfirmKey } from '@/composables/useConfirm'
import type { ConfirmOptions } from '@/components/common/ConfirmDialog.vue'

const authStore = useAuthStore()
const settingsStore = useSettingsStore()

// 全局确认对话框
const confirmDialogRef = ref<InstanceType<typeof ConfirmDialog>>()

// 提供全局确认函数
provide(ConfirmKey, (options: ConfirmOptions) =>
  confirmDialogRef.value?.show(options) ?? Promise.resolve(false)
)

onMounted(async () => {
  // 先加载公开设置，这样系统标题等信息可以立即使用
  await settingsStore.loadPublicSettings()
  // 然后初始化认证
  await authStore.initAuth()
})
</script>

<template>
  <router-view />
  <ConfirmDialog ref="confirmDialogRef" />
</template>
