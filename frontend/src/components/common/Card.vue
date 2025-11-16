<script setup lang="ts">
interface CardProps {
  title?: string
  subtitle?: string
}

defineProps<CardProps>()
</script>

<template>
  <div class="bg-white rounded-lg shadow-md overflow-hidden">
    <div v-if="$slots.header || title || subtitle" class="px-6 py-4 border-b border-gray-200">
      <slot name="header">
        <h3 v-if="title" class="text-lg font-semibold text-gray-900">
          {{ title }}
        </h3>
        <p v-if="subtitle" class="mt-1 text-sm text-gray-600">
          {{ subtitle }}
        </p>
      </slot>
    </div>

    <div class="px-6 py-4">
      <slot />
    </div>

    <div v-if="$slots.footer" class="px-6 py-4 bg-gray-50 border-t border-gray-200">
      <slot name="footer" />
    </div>
  </div>
</template>
