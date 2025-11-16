import { ref, createApp, h } from 'vue'
import Toast, { type ToastProps } from '@/components/common/Toast.vue'

interface ToastItem extends ToastProps {
  id: string
}

const toasts = ref<ToastItem[]>([])
let container: HTMLElement | null = null

const createContainer = () => {
  if (!container) {
    container = document.createElement('div')
    container.id = 'toast-container'
    container.className = 'fixed top-4 right-4 z-50 flex flex-col gap-2'
    document.body.appendChild(container)
  }
  return container
}

const removeToast = (id: string) => {
  const index = toasts.value.findIndex(t => t.id === id)
  if (index > -1) {
    toasts.value.splice(index, 1)
  }
}

const showToast = (options: Omit<ToastProps, 'id'>) => {
  const id = `toast-${Date.now()}-${Math.random()}`
  const toast: ToastItem = {
    id,
    ...options
  }

  toasts.value.push(toast)

  const toastContainer = createContainer()
  const toastElement = document.createElement('div')
  toastContainer.appendChild(toastElement)

  const app = createApp({
    render() {
      return h(Toast, {
        ...toast,
        onClose: () => {
          removeToast(id)
          app.unmount()
          toastElement.remove()
        }
      })
    }
  })

  app.mount(toastElement)
}

export const useToast = () => {
  return {
    success: (message: string, duration?: number) => {
      showToast({ type: 'success', message, duration })
    },
    error: (message: string, duration?: number) => {
      showToast({ type: 'error', message, duration })
    },
    warning: (message: string, duration?: number) => {
      showToast({ type: 'warning', message, duration })
    },
    info: (message: string, duration?: number) => {
      showToast({ type: 'info', message, duration })
    },
    show: showToast
  }
}
