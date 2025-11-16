<script setup lang="ts">
import { computed } from 'vue'

interface BadgeProps {
  variant?: 'success' | 'warning' | 'danger' | 'info'
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<BadgeProps>(), {
  variant: 'info',
  size: 'md'
})

const badgeClasses = computed(() => {
  const baseClasses = 'inline-flex items-center font-medium rounded-full'

  const variantClasses = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800'
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
    lg: 'px-3 py-1 text-base'
  }

  return `${baseClasses} ${variantClasses[props.variant]} ${sizeClasses[props.size]}`
})
</script>

<template>
  <span :class="badgeClasses">
    <slot />
  </span>
</template>
