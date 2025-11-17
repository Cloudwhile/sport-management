<script setup lang="ts">
import { ref, computed } from 'vue'
import { ClockIcon } from '@heroicons/vue/24/outline'

interface TimePickerProps {
  modelValue: string
  label?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  error?: string
}

const props = withDefaults(defineProps<TimePickerProps>(), {
  placeholder: '选择时间',
  required: false,
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const inputRef = ref<HTMLInputElement | null>(null)

// 处理时间输入
const handleInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  emit('update:modelValue', target.value)
}

// 聚焦输入框（触发时间选择器）
const focusInput = () => {
  inputRef.value?.focus()
  inputRef.value?.showPicker?.()
}

// 错误状态类
const inputClasses = computed(() => {
  const base = 'w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed'

  if (props.error) {
    return `${base} border-red-300 focus:border-red-500 focus:ring-red-200`
  }

  return `${base} border-gray-300 focus:border-blue-500 focus:ring-blue-200`
})
</script>

<template>
  <div class="w-full">
    <label
      v-if="label"
      class="block text-sm font-medium text-gray-700 mb-1"
    >
      {{ label }}
      <span v-if="required" class="text-red-500 ml-1">*</span>
    </label>

    <div class="relative">
      <input
        ref="inputRef"
        type="time"
        :value="modelValue"
        :placeholder="placeholder"
        :required="required"
        :disabled="disabled"
        :class="inputClasses"
        @input="handleInput"
      />

      <!-- 时钟图标 -->
      <button
        type="button"
        class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="disabled"
        @click="focusInput"
      >
        <ClockIcon class="h-5 w-5" />
      </button>
    </div>

    <p v-if="error" class="mt-1 text-sm text-red-600">
      {{ error }}
    </p>
  </div>
</template>
