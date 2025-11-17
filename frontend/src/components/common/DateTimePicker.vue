<script setup lang="ts">
import { ref, computed } from 'vue'
import { CalendarIcon } from '@heroicons/vue/24/outline'

interface DateTimePickerProps {
  modelValue?: string
  label?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  error?: string
  min?: string  // 最小日期时间 YYYY-MM-DDTHH:mm
  max?: string  // 最大日期时间 YYYY-MM-DDTHH:mm
}

const props = withDefaults(defineProps<DateTimePickerProps>(), {
  placeholder: '选择日期和时间',
  required: false,
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const inputRef = ref<HTMLInputElement | null>(null)

// 处理日期时间输入
const handleInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  emit('update:modelValue', target.value)
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
        type="datetime-local"
        :value="modelValue || ''"
        :placeholder="placeholder"
        :required="required"
        :disabled="disabled"
        :min="min"
        :max="max"
        :class="inputClasses"
        @input="handleInput"
      />
    </div>

    <p v-if="error" class="mt-1 text-sm text-red-600">
      {{ error }}
    </p>
  </div>
</template>
