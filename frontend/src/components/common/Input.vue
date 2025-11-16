<script setup lang="ts">
import { computed } from 'vue'

interface InputProps {
  modelValue?: string | number
  type?: 'text' | 'number' | 'email' | 'password' | 'tel' | 'url'
  placeholder?: string
  disabled?: boolean
  error?: string
  label?: string
}

const props = withDefaults(defineProps<InputProps>(), {
  type: 'text',
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

const inputClasses = computed(() => {
  const baseClasses = 'w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed'

  if (props.error) {
    return `${baseClasses} border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500`
  }

  return `${baseClasses} border-gray-300 focus:ring-blue-500 focus:border-blue-500`
})

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <div class="w-full">
    <label v-if="label" class="block text-sm font-medium text-gray-700 mb-1">
      {{ label }}
    </label>
    <input
      :class="inputClasses"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      @input="handleInput"
    />
    <p v-if="error" class="mt-1 text-sm text-red-600">
      {{ error }}
    </p>
  </div>
</template>
