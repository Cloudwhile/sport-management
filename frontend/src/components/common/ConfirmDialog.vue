<script setup lang="ts">
import { ref, watch } from 'vue'
import Modal from './Modal.vue'
import Button from './Button.vue'

export interface ConfirmOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'primary'
}

interface ConfirmDialogState extends ConfirmOptions {
  resolve?: (value: boolean) => void
}

const isVisible = ref(false)
const state = ref<ConfirmDialogState>({
  title: '',
  message: '',
  confirmText: '确定',
  cancelText: '取消',
  variant: 'danger'
})

// 显示确认对话框
const show = (options: ConfirmOptions): Promise<boolean> => {
  return new Promise((resolve) => {
    state.value = {
      ...options,
      confirmText: options.confirmText || '确定',
      cancelText: options.cancelText || '取消',
      variant: options.variant || 'danger',
      resolve
    }
    isVisible.value = true
  })
}

// 确认操作
const handleConfirm = () => {
  state.value.resolve?.(true)
  isVisible.value = false
}

// 取消操作
const handleCancel = () => {
  state.value.resolve?.(false)
  isVisible.value = false
}

// 监听 isVisible 变化，如果被外部关闭（如点击背景或按ESC），视为取消
watch(isVisible, (newValue) => {
  if (!newValue && state.value.resolve) {
    state.value.resolve(false)
  }
})

// 暴露 show 方法供外部调用
defineExpose({
  show
})
</script>

<template>
  <Modal
    v-model="isVisible"
    :title="state.title"
    size="sm"
  >
    <div class="text-gray-700">
      {{ state.message }}
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <Button
          variant="secondary"
          @click="handleCancel"
        >
          {{ state.cancelText }}
        </Button>
        <Button
          :variant="state.variant"
          @click="handleConfirm"
        >
          {{ state.confirmText }}
        </Button>
      </div>
    </template>
  </Modal>
</template>
