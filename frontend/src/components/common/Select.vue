<script setup lang="ts">
import { computed } from 'vue'

export interface SelectOption {
  label: string
  value: string | number
}

interface SelectProps {
  modelValue?: string | number
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  label?: string
}

const props = withDefaults(defineProps<SelectProps>(), {
  disabled: false,
  placeholder: '请选择'
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

const selectClasses = computed(() => {
  return 'w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed'
})

const handleChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <div class="w-full">
    <label v-if="label" class="block text-sm font-medium text-gray-700 mb-1">
      {{ label }}
    </label>
    <select
      :class="selectClasses"
      :value="modelValue"
      :disabled="disabled"
      @change="handleChange"
    >
      <option value="" disabled>{{ placeholder }}</option>
      <option
        v-for="option in options"
        :key="option.value"
        :value="option.value"
      >
        {{ option.label }}
      </option>
    </select>
  </div>
</template>
