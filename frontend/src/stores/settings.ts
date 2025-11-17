import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import settingsAPI, { type SettingsResponse } from '@/api/settings'

export const useSettingsStore = defineStore('settings', () => {
  // 状态
  const settings = ref<SettingsResponse>({})
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const appTitle = computed(() => {
    return settings.value.app_title?.value || import.meta.env.VITE_APP_TITLE || '学校体测数据管理系统'
  })

  const getSetting = (key: string, defaultValue: string = '') => {
    return settings.value[key]?.value || defaultValue
  }

  // Actions
  const loadPublicSettings = async () => {
    loading.value = true
    error.value = null
    try {
      const data = await settingsAPI.getPublicSettings()
      settings.value = data
    } catch (err: any) {
      error.value = err.message || '加载设置失败'
      console.error('加载公开设置失败:', err)
      // 失败时不抛出错误，使用默认值
    } finally {
      loading.value = false
    }
  }

  const loadSettings = async (category?: string) => {
    loading.value = true
    error.value = null
    try {
      const data = await settingsAPI.getSettings(category)
      settings.value = data
    } catch (err: any) {
      error.value = err.message || '加载设置失败'
      console.error('加载设置失败:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateSetting = async (key: string, value: string) => {
    try {
      await settingsAPI.updateSetting(key, value)
      // 更新本地状态
      if (settings.value[key]) {
        settings.value[key].value = value
      }
    } catch (err: any) {
      error.value = err.message || '更新设置失败'
      console.error('更新设置失败:', err)
      throw err
    }
  }

  const batchUpdateSettings = async (updates: Record<string, string>) => {
    try {
      await settingsAPI.batchUpdateSettings(updates)
      // 更新本地状态
      Object.entries(updates).forEach(([key, value]) => {
        if (settings.value[key]) {
          settings.value[key].value = value
        }
      })
    } catch (err: any) {
      error.value = err.message || '批量更新设置失败'
      console.error('批量更新设置失败:', err)
      throw err
    }
  }

  return {
    // State
    settings,
    loading,
    error,

    // Getters
    appTitle,
    getSetting,

    // Actions
    loadPublicSettings,
    loadSettings,
    updateSetting,
    batchUpdateSettings
  }
})
