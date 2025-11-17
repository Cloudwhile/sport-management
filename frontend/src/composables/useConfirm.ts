import { inject, type InjectionKey } from 'vue'
import type { ConfirmOptions } from '@/components/common/ConfirmDialog.vue'

export type ConfirmFunction = (options: ConfirmOptions) => Promise<boolean>

export const ConfirmKey: InjectionKey<ConfirmFunction> = Symbol('confirm')

/**
 * 使用全局确认对话框
 * @returns confirm 函数
 */
export function useConfirm(): ConfirmFunction {
  const confirm = inject(ConfirmKey)

  if (!confirm) {
    throw new Error('useConfirm() must be used within a component that provides ConfirmKey')
  }

  return confirm
}
