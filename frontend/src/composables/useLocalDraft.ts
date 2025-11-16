import { ref, watch } from 'vue'

/**
 * 本地草稿数据结构
 */
export interface RecordDraft {
  formId: number
  classId: number
  records: Array<{
    studentId: number
    testData: Record<string, any>
  }>
  timestamp: number
}

/**
 * 本地草稿管理 Composable
 * 用于体测数据录入的自动保存和恢复
 */
export function useLocalDraft() {
  const STORAGE_KEY_PREFIX = 'record_draft_'
  const AUTO_SAVE_INTERVAL = 30000 // 30秒

  /**
   * 生成存储key
   */
  const getDraftKey = (formId: number, classId: number): string => {
    return `${STORAGE_KEY_PREFIX}${formId}_${classId}`
  }

  /**
   * 保存草稿到 localStorage
   */
  const saveDraft = (draft: RecordDraft): void => {
    try {
      const key = getDraftKey(draft.formId, draft.classId)
      draft.timestamp = Date.now()
      localStorage.setItem(key, JSON.stringify(draft))
    } catch (error) {
      console.error('保存草稿失败:', error)
    }
  }

  /**
   * 从 localStorage 加载草稿
   */
  const loadDraft = (formId: number, classId: number): RecordDraft | null => {
    try {
      const key = getDraftKey(formId, classId)
      const stored = localStorage.getItem(key)
      if (!stored) return null

      const draft = JSON.parse(stored) as RecordDraft
      return draft
    } catch (error) {
      console.error('加载草稿失败:', error)
      return null
    }
  }

  /**
   * 删除草稿
   */
  const clearDraft = (formId: number, classId: number): void => {
    try {
      const key = getDraftKey(formId, classId)
      localStorage.removeItem(key)
    } catch (error) {
      console.error('删除草稿失败:', error)
    }
  }

  /**
   * 检查是否存在草稿
   */
  const hasDraft = (formId: number, classId: number): boolean => {
    const key = getDraftKey(formId, classId)
    return localStorage.getItem(key) !== null
  }

  /**
   * 获取草稿的时间戳
   */
  const getDraftTimestamp = (formId: number, classId: number): number | null => {
    const draft = loadDraft(formId, classId)
    return draft ? draft.timestamp : null
  }

  /**
   * 格式化时间戳为可读格式
   */
  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  /**
   * 格式化为相对时间（多久之前）
   */
  const formatRelativeTime = (timestamp: number): string => {
    const now = Date.now()
    const diff = now - timestamp
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (seconds < 60) {
      return '刚刚'
    } else if (minutes < 60) {
      return `${minutes}分钟前`
    } else if (hours < 24) {
      return `${hours}小时前`
    } else if (days < 7) {
      return `${days}天前`
    } else {
      return formatTimestamp(timestamp)
    }
  }

  /**
   * 统计草稿中已填写的学生数量
   */
  const countFilledStudents = (draft: RecordDraft | null): number => {
    if (!draft) return 0
    return draft.records.filter(record =>
      Object.keys(record.testData).length > 0
    ).length
  }

  /**
   * 计算草稿填写完整度（百分比）
   */
  const calculateCompleteness = (draft: RecordDraft | null, totalStudents: number): number => {
    if (!draft || totalStudents === 0) return 0
    const filled = countFilledStudents(draft)
    return Math.round((filled / totalStudents) * 100)
  }

  /**
   * 设置自动保存
   */
  const setupAutoSave = (
    formId: number,
    classId: number,
    getRecordsData: () => RecordDraft['records']
  ) => {
    const timer = ref<number | null>(null)

    const startAutoSave = () => {
      if (timer.value) {
        clearInterval(timer.value)
      }

      timer.value = window.setInterval(() => {
        const records = getRecordsData()
        if (records && records.length > 0) {
          saveDraft({
            formId,
            classId,
            records,
            timestamp: Date.now()
          })
          console.log('自动保存草稿成功')
        }
      }, AUTO_SAVE_INTERVAL)
    }

    const stopAutoSave = () => {
      if (timer.value) {
        clearInterval(timer.value)
        timer.value = null
      }
    }

    return {
      startAutoSave,
      stopAutoSave
    }
  }

  return {
    saveDraft,
    loadDraft,
    clearDraft,
    hasDraft,
    getDraftTimestamp,
    formatTimestamp,
    formatRelativeTime,
    countFilledStudents,
    calculateCompleteness,
    setupAutoSave
  }
}
