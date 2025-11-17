import http from '@/utils/http'

/**
 * 系统设置数据结构
 */
export interface SettingData {
  value: string
  description?: string
  category: string
}

export interface SettingsResponse {
  [key: string]: SettingData
}

/**
 * 系统设置 API
 */
const settingsAPI = {
  /**
   * 获取公开设置（无需认证）
   * @returns 公开设置数据
   */
  getPublicSettings(): Promise<SettingsResponse> {
    return http.get('/settings/public')
  },

  /**
   * 获取所有设置（需认证）
   * @param category 可选的分类筛选
   * @returns 所有设置数据
   */
  getSettings(category?: string): Promise<SettingsResponse> {
    return http.get('/settings', { params: { category } })
  },

  /**
   * 获取单个设置（需认证）
   * @param key 设置键名
   * @returns 设置数据
   */
  getSetting(key: string): Promise<{ key: string; value: string; description?: string; category: string; isPublic: boolean }> {
    return http.get(`/settings/${key}`)
  },

  /**
   * 更新单个设置（仅管理员）
   * @param key 设置键名
   * @param value 设置值
   * @returns 更新后的数据
   */
  updateSetting(key: string, value: string): Promise<{ key: string; value: string }> {
    return http.put(`/settings/${key}`, { value })
  },

  /**
   * 批量更新设置（仅管理员）
   * @param settings 设置对象 { key: value, ... }
   * @returns 成功消息
   */
  batchUpdateSettings(settings: Record<string, string>): Promise<{ message: string }> {
    return http.put('/settings', { settings })
  }
}

export default settingsAPI
