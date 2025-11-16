/**
 * 体测数据验证工具
 */

export interface ValidationRule {
  min?: number
  max?: number
  decimals?: number
  required?: boolean
}

export interface ValidationResult {
  valid: boolean
  message?: string
}

/**
 * 根据测试项目的单位推断验证规则
 */
export function inferValidationRules(unit: string): ValidationRule {
  const rules: ValidationRule = {}

  switch (unit) {
    case '秒':
    case 's':
      rules.min = 0
      rules.max = 999.99
      rules.decimals = 2
      break
    case '分钟':
    case 'min':
      rules.min = 0
      rules.max = 99.99
      rules.decimals = 2
      break
    case '厘米':
    case 'cm':
      rules.min = 0
      rules.max = 999
      rules.decimals = 1
      break
    case '米':
    case 'm':
      rules.min = 0
      rules.max = 99.99
      rules.decimals = 2
      break
    case '次':
    case '个':
      rules.min = 0
      rules.max = 9999
      rules.decimals = 0
      break
    case '公斤':
    case 'kg':
      rules.min = 0
      rules.max = 999.9
      rules.decimals = 1
      break
    case '分':
      rules.min = 0
      rules.max = 100
      rules.decimals = 1
      break
    default:
      rules.min = 0
      rules.max = 99999
      rules.decimals = 2
  }

  return rules
}

/**
 * 验证测试数据值
 */
export function validateTestValue(
  value: any,
  rules: ValidationRule
): ValidationResult {
  // 空值检查
  if (value === null || value === undefined || value === '') {
    if (rules.required) {
      return { valid: false, message: '该项目为必填项' }
    }
    return { valid: true }
  }

  // 转换为数字
  const numValue = Number(value)

  // 数字格式检查
  if (isNaN(numValue)) {
    return { valid: false, message: '请输入有效的数字' }
  }

  // 范围检查
  if (rules.min !== undefined && numValue < rules.min) {
    return { valid: false, message: `数值不能小于 ${rules.min}` }
  }

  if (rules.max !== undefined && numValue > rules.max) {
    return { valid: false, message: `数值不能大于 ${rules.max}` }
  }

  // 小数位数检查
  if (rules.decimals !== undefined) {
    const decimals = (value.toString().split('.')[1] || '').length
    if (decimals > rules.decimals) {
      return {
        valid: false,
        message: `小数位数不能超过 ${rules.decimals} 位`
      }
    }
  }

  return { valid: true }
}

/**
 * 格式化数值（限制小数位数）
 */
export function formatTestValue(value: any, decimals: number): string {
  if (value === null || value === undefined || value === '') {
    return ''
  }

  const numValue = Number(value)
  if (isNaN(numValue)) {
    return value.toString()
  }

  return numValue.toFixed(decimals)
}

/**
 * 只允许输入数字、小数点和负号
 * 自动将中文句号转换为英文小数点
 */
export function filterNumericInput(event: KeyboardEvent): void {
  const allowedKeys = [
    'Backspace',
    'Delete',
    'ArrowLeft',
    'ArrowRight',
    'Tab',
    'Enter'
  ]

  const key = event.key

  // 允许的控制键
  if (allowedKeys.includes(key)) {
    return
  }

  // 允许数字
  if (/^\d$/.test(key)) {
    return
  }

  // 允许负号（只能在开头）
  if (key === '-') {
    const input = event.target as HTMLInputElement
    // 只允许在开头输入负号，且当前没有负号
    if (input.selectionStart === 0 && !input.value.includes('-')) {
      return
    }
  }

  // 允许小数点（只能有一个）
  if (key === '.') {
    const input = event.target as HTMLInputElement
    if (!input.value.includes('.')) {
      return
    }
  }

  // 允许中文句号，自动转换为英文小数点
  if (key === '。') {
    event.preventDefault()
    const input = event.target as HTMLInputElement
    // 只有当前没有小数点时才插入
    if (!input.value.includes('.')) {
      const start = input.selectionStart || 0
      const end = input.selectionEnd || 0
      const newValue = input.value.substring(0, start) + '.' + input.value.substring(end)
      input.value = newValue
      input.setSelectionRange(start + 1, start + 1)

      // 触发 input 事件，让 Vue 知道值已改变
      input.dispatchEvent(new Event('input', { bubbles: true }))
    }
    return
  }

  // 其他键都阻止
  event.preventDefault()
}

/**
 * 将时间格式 (2:23) 转换为总秒数
 * 支持多种格式：2:23, 2'23, 143
 * @param timeStr 时间字符串
 * @returns 总秒数，如果格式无效返回 null
 */
export function timeToSeconds(timeStr: string | number): number | null {
  if (!timeStr && timeStr !== 0) return null

  // 如果已经是数字，直接返回
  if (typeof timeStr === 'number') return timeStr

  // 字符串处理
  const str = timeStr.toString().trim()

  // 纯数字格式（143）
  if (/^\d+(\.\d+)?$/.test(str)) {
    return Number(str)
  }

  // 时间格式（2:23 或 2'23）
  const match = str.match(/^(\d+)[':](\d+)$/)
  if (match && match[1] && match[2]) {
    const minutes = parseInt(match[1], 10)
    const seconds = parseInt(match[2], 10)

    if (seconds >= 60) {
      return null // 秒数不能大于等于60
    }

    return minutes * 60 + seconds
  }

  return null
}

/**
 * 将总秒数转换为时间格式 (2:23)
 * @param seconds 总秒数
 * @returns 时间字符串，格式: 2:23
 */
export function secondsToTime(seconds: number): string {
  if (seconds === null || seconds === undefined || isNaN(seconds)) {
    return ''
  }

  const minutes = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)

  return `${minutes}:${secs.toString().padStart(2, '0')}`
}
