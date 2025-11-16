<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon
} from '@heroicons/vue/24/solid'

export interface ToastProps {
  id?: string
  type?: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
}

const props = withDefaults(defineProps<ToastProps>(), {
  type: 'info',
  duration: 3000
})

const emit = defineEmits<{
  close: [id?: string]
}>()

const visible = ref(false)

const typeConfig = computed(() => {
  const configs = {
    success: {
      icon: CheckCircleIcon,
      bgClass: 'bg-green-50',
      iconClass: 'text-green-400',
      textClass: 'text-green-800'
    },
    error: {
      icon: XCircleIcon,
      bgClass: 'bg-red-50',
      iconClass: 'text-red-400',
      textClass: 'text-red-800'
    },
    warning: {
      icon: ExclamationTriangleIcon,
      bgClass: 'bg-yellow-50',
      iconClass: 'text-yellow-400',
      textClass: 'text-yellow-800'
    },
    info: {
      icon: InformationCircleIcon,
      bgClass: 'bg-blue-50',
      iconClass: 'text-blue-400',
      textClass: 'text-blue-800'
    }
  }
  return configs[props.type]
})

const close = () => {
  visible.value = false
  setTimeout(() => {
    emit('close', props.id)
  }, 300)
}

onMounted(() => {
  visible.value = true
  if (props.duration > 0) {
    setTimeout(() => {
      close()
    }, props.duration)
  }
})
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-300"
    enter-from-class="opacity-0 translate-y-2"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition-all duration-300"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 translate-y-2"
  >
    <div
      v-if="visible"
      :class="[
        'max-w-sm w-full shadow-lg rounded-lg pointer-events-auto overflow-hidden',
        typeConfig.bgClass
      ]"
    >
      <div class="p-4">
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <component :is="typeConfig.icon" :class="['h-6 w-6', typeConfig.iconClass]" />
          </div>
          <div class="ml-3 flex-1 pt-0.5">
            <p :class="['text-sm font-medium break-words', typeConfig.textClass]">
              {{ message }}
            </p>
          </div>
          <div class="ml-4 flex-shrink-0 flex">
            <button
              type="button"
              :class="[
                'inline-flex rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2',
                typeConfig.iconClass
              ]"
              @click="close"
            >
              <XMarkIcon class="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>
