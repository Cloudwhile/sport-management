<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';

onMounted(() => {
  console.log('学校体测数据管理系统启动');
});
</script>

<style scoped>
</style>
