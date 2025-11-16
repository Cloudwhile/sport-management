<template>
  <div class="time-input-wrapper">
    <input
      ref="minutesInput"
      v-model.number="minutes"
      type="number"
      min="0"
      max="10"
      placeholder="0"
      :disabled="disabled"
      :class="[
        'time-input minutes',
        hasError ? 'error' : ''
      ]"
      @input="handleMinutesInput"
      @blur="handleBlur"
      @keydown.tab="handleTab"
      @keydown.enter="handleEnter"
    />
    <span class="separator">:</span>
    <input
      ref="secondsInput"
      v-model.number="seconds"
      type="number"
      min="0"
      max="59"
      placeholder="00"
      :disabled="disabled"
      :class="[
        'time-input seconds',
        hasError ? 'error' : ''
      ]"
      @input="handleSecondsInput"
      @blur="handleBlur"
      @keydown.tab="handleTab"
      @keydown.enter="handleEnter"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Props {
  modelValue?: number | null // 总秒数
  disabled?: boolean
  min?: number // 最小秒数
  max?: number // 最大秒数
}

interface Emits {
  (e: 'update:modelValue', value: number | null): void
  (e: 'enter'): void
  (e: 'error', message: string | null): void // 新增：错误消息
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  disabled: false,
  min: 0,
  max: 600 // 默认最大10分钟
})

const emit = defineEmits<Emits>()

// 将秒数转换为时间格式字符串
const secondsToTimeString = (totalSecs: number): string => {
  const m = Math.floor(totalSecs / 60)
  const s = totalSecs % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

// 内部状态
const minutes = ref<number | null>(null)
const seconds = ref<number | null>(null)
const minutesInput = ref<HTMLInputElement>()
const secondsInput = ref<HTMLInputElement>()

// 计算总秒数
const totalSeconds = computed(() => {
  const m = minutes.value || 0
  const s = seconds.value || 0
  return m * 60 + s
})

// 是否有错误和错误消息
const hasError = computed(() => {
  const total = totalSeconds.value
  if (total === 0) {
    emit('error', null)
    return false
  }

  if (props.min !== undefined && total < props.min) {
    emit('error', `时间不能小于 ${secondsToTimeString(props.min)}`)
    return true
  }

  if (props.max !== undefined && total > props.max) {
    emit('error', `时间不能大于 ${secondsToTimeString(props.max)}`)
    return true
  }

  emit('error', null)
  return false
})

// 监听外部值变化（初始化和更新）
watch(() => props.modelValue, (newValue) => {
  if (newValue === null || newValue === undefined || newValue === 0) {
    minutes.value = null
    seconds.value = null
    return
  }

  // 将秒数转换为分钟和秒
  const totalSecs = Number(newValue)
  if (!isNaN(totalSecs)) {
    minutes.value = Math.floor(totalSecs / 60)
    seconds.value = totalSecs % 60
  }
}, { immediate: true })

// 处理分钟输入
const handleMinutesInput = () => {
  // 限制范围
  if (minutes.value !== null) {
    if (minutes.value < 0) minutes.value = 0
    if (minutes.value > 10) minutes.value = 10
  }

  emitValue()
}

// 处理秒数输入
const handleSecondsInput = () => {
  // 自动进位：如果秒数>=60，自动转换为分钟
  if (seconds.value !== null && seconds.value >= 60) {
    const extraMinutes = Math.floor(seconds.value / 60)
    seconds.value = seconds.value % 60
    minutes.value = (minutes.value || 0) + extraMinutes

    // 限制分钟数不超过10
    if (minutes.value > 10) {
      minutes.value = 10
      seconds.value = 0
    }
  }

  // 限制秒数范围
  if (seconds.value !== null) {
    if (seconds.value < 0) seconds.value = 0
    if (seconds.value > 59) seconds.value = 59
  }

  emitValue()
}

// 失焦时自动补零（显示优化）
const handleBlur = () => {
  emitValue()
}

// 发出值更新事件
const emitValue = () => {
  const m = minutes.value || 0
  const s = seconds.value || 0
  const total = m * 60 + s

  // 如果两个输入框都为空，发出 null
  if (minutes.value === null && seconds.value === null) {
    emit('update:modelValue', null)
    return
  }

  emit('update:modelValue', total)
}

// 处理Tab键（用于快速切换）
const handleTab = (event: KeyboardEvent) => {
  // Tab 从分钟框 → 秒框，允许默认行为
  // Tab 从秒框 → 下一个元素，也允许默认行为
  // 这里不做特殊处理，保持原生Tab行为即可
}

// 处理Enter键
const handleEnter = (event: KeyboardEvent) => {
  event.preventDefault()
  emit('enter')
}

// 暴露方法供父组件调用
defineExpose({
  focus: () => {
    minutesInput.value?.focus()
  }
})
</script>

<style scoped>
.time-input-wrapper {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.time-input {
  width: 2.5rem;
  padding: 0.25rem 0.5rem;
  text-align: center;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  transition: all 0.15s ease-in-out;
}

.time-input:focus {
  outline: none;
  border-color: #3b82f6;
  ring: 2px;
  ring-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.time-input.error {
  border-color: #ef4444;
}

.time-input.error:focus {
  border-color: #ef4444;
  ring-color: #ef4444;
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
}

.time-input:disabled {
  background-color: #f3f4f6;
  color: #9ca3af;
  cursor: not-allowed;
}

.separator {
  font-weight: 600;
  color: #6b7280;
  font-size: 0.875rem;
  user-select: none;
}

/* 移除数字输入框的上下箭头 */
.time-input::-webkit-outer-spin-button,
.time-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.time-input[type=number] {
  -moz-appearance: textfield;
}
</style>
