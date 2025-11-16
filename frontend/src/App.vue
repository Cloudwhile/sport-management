<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores'

const authStore = useAuthStore()

onMounted(async () => {
  await authStore.initAuth()
})
</script>

<template>
  <router-view />
</template>
