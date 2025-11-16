<script setup lang="ts">
import { computed } from 'vue'

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
}

const props = withDefaults(defineProps<LoadingProps>(), {
  size: 'md'
})

const spinnerSize = computed(() => {
  const sizes = {
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-16 w-16'
  }
  return sizes[props.size]
})

const textSize = computed(() => {
  const sizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }
  return sizes[props.size]
})
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-3">
    <svg
      :class="[spinnerSize, 'animate-spin text-blue-600']"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        class="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="4"
      />
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
    <p v-if="text" :class="[textSize, 'text-gray-600']">
      {{ text }}
    </p>
  </div>
</template>
