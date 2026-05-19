import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import settingsAPI, { type SettingsResponse } from '@/api/settings'

export type SchoolLevel = 'primary' | 'junior' | 'senior'

export const schoolLevelLabels: Record<SchoolLevel, string> = {
  primary: '小学',
  junior: '初中',
  senior: '高中'
}

export const useSettingsStore = defineStore('settings', () => {
  // 状态
  const settings = ref<SettingsResponse>({})
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const appTitle = computed(() => {
    return settings.value.app_title?.value || import.meta.env.VITE_APP_TITLE || '学校体测数据管理系统'
  })

  const siteLogoUrl = computed(() => settings.value.site_logo_url?.value || '')
  const homeImageUrl = computed(() => settings.value.home_image_url?.value || '')
  const schoolLevel = computed<SchoolLevel>(() => {
    const value = settings.value.school_level?.value as SchoolLevel | undefined
    return value && schoolLevelLabels[value] ? value : 'senior'
  })
  const schoolLevelLabel = computed(() => schoolLevelLabels[schoolLevel.value])

  const getSetting = (key: string, defaultValue: string = '') => {
    return settings.value[key]?.value || defaultValue
  }

  const getSettingCategory = (key: string) => {
    return key === 'school_level' || key === 'app_title' ? 'system' : 'appearance'
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
      } else {
        settings.value[key] = {
          value,
          category: getSettingCategory(key)
        }
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
        } else {
          settings.value[key] = {
            value,
            category: getSettingCategory(key)
          }
        }
      })
    } catch (err: any) {
      error.value = err.message || '批量更新设置失败'
      console.error('批量更新设置失败:', err)
      throw err
    }
  }

  const uploadSettingImage = async (key: string, file: File) => {
    try {
      const result = await settingsAPI.uploadSettingImage(key, file)
      if (settings.value[key]) {
        settings.value[key].value = result.value
      } else {
        settings.value[key] = {
          value: result.value,
          category: getSettingCategory(key)
        }
      }
      return result
    } catch (err: any) {
      error.value = err.message || '上传图片失败'
      console.error('上传设置图片失败:', err)
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
    siteLogoUrl,
    homeImageUrl,
    schoolLevel,
    schoolLevelLabel,
    getSetting,

    // Actions
    loadPublicSettings,
    loadSettings,
    updateSetting,
    batchUpdateSettings,
    uploadSettingImage
  }
})
