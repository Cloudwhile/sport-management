<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'

interface ModalProps {
  modelValue: boolean
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const props = withDefaults(defineProps<ModalProps>(), {
  size: 'md'
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl'
}

const close = () => {
  emit('update:modelValue', false)
}

const handleEscape = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.modelValue) {
    close()
  }
}

const handleClickOutside = (e: MouseEvent) => {
  if ((e.target as HTMLElement).classList.contains('modal-backdrop')) {
    close()
  }
}

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

onMounted(() => {
  document.addEventListener('keydown', handleEscape)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-300"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="modal-backdrop fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        @click="handleClickOutside"
      >
        <Transition
          enter-active-class="transition-all duration-300"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition-all duration-300"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="modelValue"
            :class="['bg-white rounded-lg shadow-xl w-full', sizeClasses[size]]"
            @click.stop
          >
            <!-- Header -->
            <div v-if="$slots.header || title" class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <slot name="header">
                <h3 class="text-lg font-semibold text-gray-900">
                  {{ title }}
                </h3>
              </slot>
              <button
                type="button"
                class="text-gray-400 hover:text-gray-600 transition-colors"
                @click="close"
              >
                <XMarkIcon class="h-6 w-6" />
              </button>
            </div>

            <!-- Body -->
            <div class="px-6 py-4 max-h-[calc(100vh-200px)] overflow-y-auto">
              <slot />
            </div>

            <!-- Footer -->
            <div v-if="$slots.footer" class="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <slot name="footer" />
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
