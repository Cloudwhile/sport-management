<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">系统设置</h1>
        <p class="mt-1 text-sm text-gray-600">管理系统标题、首页图片和站点 Logo</p>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <Loading />
    </div>

    <template v-else>
      <Card title="基本设置">
        <form @submit.prevent="handleSave" class="space-y-6">
          <div>
            <label for="app_title" class="block text-sm font-medium text-gray-700 mb-2">
              系统标题
            </label>
            <input
              id="app_title"
              v-model="formData.app_title"
              type="text"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="请输入系统标题"
              required
            />
            <p class="mt-1 text-sm text-gray-500">
              {{ settingsStore.settings.app_title?.description || '显示在浏览器标签页、顶部导航和系统相关页面。' }}
            </p>
          </div>

          <div>
            <label for="school_level" class="block text-sm font-medium text-gray-700 mb-2">
              学校等级
            </label>
            <select
              id="school_level"
              v-model="formData.school_level"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="primary">小学</option>
              <option value="junior">初中</option>
              <option value="senior">高中</option>
            </select>
            <p class="mt-1 text-sm text-gray-500">
              用于入学级、班级名称等展示，后续可按学段扩展不同规则。
            </p>
          </div>

          <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div
              v-for="item in imageSettingItems"
              :key="item.key"
              class="rounded-lg border border-gray-200 bg-gray-50 p-4"
            >
              <div class="flex items-start justify-between gap-4">
                <div>
                  <h3 class="text-sm font-semibold text-gray-900">{{ item.label }}</h3>
                  <p class="mt-1 text-sm text-gray-500">{{ item.description }}</p>
                </div>
                <Button
                  v-if="formData[item.key]"
                  type="button"
                  size="sm"
                  variant="secondary"
                  @click="clearImage(item.key)"
                >
                  移除
                </Button>
              </div>

              <div class="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white">
                <img
                  v-if="imagePreview(item.key)"
                  :src="imagePreview(item.key)"
                  :alt="item.label"
                  :class="item.previewClass"
                />
                <div
                  v-else
                  :class="[
                    'flex items-center justify-center text-sm text-gray-400',
                    item.emptyClass
                  ]"
                >
                  暂无图片
                </div>
              </div>

              <label class="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-blue-300 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700 hover:bg-blue-100">
                <ArrowUpTrayIcon class="h-5 w-5" />
                <span>选择图片</span>
                <input
                  type="file"
                  class="hidden"
                  accept="image/png,image/jpeg,image/webp,image/gif,image/x-icon,image/vnd.microsoft.icon"
                  @change="handleImageSelect(item.key, $event)"
                />
              </label>
            </div>
          </div>

          <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 class="text-sm font-medium text-gray-700 mb-3">预览</h3>
            <div class="space-y-3">
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                  <img
                    v-if="imagePreview('site_logo_url')"
                    :src="imagePreview('site_logo_url')"
                    alt="站点 Logo"
                    class="h-full w-full object-cover"
                  />
                  <span v-else class="text-sm font-bold text-white">体测</span>
                </div>
                <span class="text-sm font-medium text-gray-900">{{ formData.app_title }}</span>
                <span class="rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                  {{ schoolLevelLabel }}
                </span>
              </div>
              <div class="flex items-center space-x-2">
                <span class="text-sm text-gray-600">页面标题：</span>
                <span class="text-sm font-medium text-gray-900">系统设置 - {{ formData.app_title }}</span>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
            <Button type="button" variant="secondary" @click="handleReset" :disabled="saving">
              重置
            </Button>
            <Button type="submit" variant="primary" :loading="saving" :disabled="!hasChanges">
              保存设置
            </Button>
          </div>

          <div v-if="hasChanges" class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div class="flex items-start">
              <ExclamationTriangleIcon class="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 class="text-sm font-medium text-yellow-800">有未保存的更改</h4>
                <p class="mt-1 text-sm text-yellow-700">
                  修改标题或图片后，请保存设置让所有用户看到新配置。
                </p>
              </div>
            </div>
          </div>
        </form>
      </Card>

      <Card title="使用说明">
        <div class="prose prose-sm max-w-none">
          <ul class="space-y-2 text-gray-600">
            <li><strong>站点 Logo：</strong>显示在顶部导航左侧，并同步作为浏览器标签页图标。</li>
            <li><strong>首页图片：</strong>显示在登录页背景，图片会按原图清晰展示，不做模糊处理。</li>
            <li><strong>图片格式：</strong>支持 PNG、JPG、WebP、GIF 和 ICO，单张不超过 5MB。</li>
          </ul>
        </div>
      </Card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import { useSettingsStore } from '@/stores'
import { useToast } from '@/composables/useToast'
import Card from '@/components/common/Card.vue'
import Button from '@/components/common/Button.vue'
import Loading from '@/components/common/Loading.vue'
import { ArrowUpTrayIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline'

type ImageSettingKey = 'site_logo_url' | 'home_image_url'
type TextSettingKey = 'app_title' | 'school_level'
type SettingKey = TextSettingKey | ImageSettingKey

const schoolLevelOptions = {
  primary: '小学',
  junior: '初中',
  senior: '高中'
} as const

const settingsStore = useSettingsStore()
const toast = useToast()

const loading = ref(false)
const saving = ref(false)

const formData = reactive<Record<SettingKey, string>>({
  app_title: '',
  school_level: 'senior',
  site_logo_url: '',
  home_image_url: ''
})

const originalData = reactive<Record<SettingKey, string>>({
  app_title: '',
  school_level: 'senior',
  site_logo_url: '',
  home_image_url: ''
})

const selectedFiles = reactive<Record<ImageSettingKey, File | null>>({
  site_logo_url: null,
  home_image_url: null
})

const previewUrls = reactive<Record<ImageSettingKey, string>>({
  site_logo_url: '',
  home_image_url: ''
})

const imageSettingItems: Array<{
  key: ImageSettingKey
  label: string
  description: string
  previewClass: string
  emptyClass: string
}> = [
  {
    key: 'site_logo_url',
    label: '站点 Logo',
    description: '用于顶部导航左上角和浏览器标签页图标，建议使用方形图片。',
    previewClass: 'h-32 w-full object-contain p-4',
    emptyClass: 'h-32'
  },
  {
    key: 'home_image_url',
    label: '首页图片',
    description: '用于登录页背景展示，建议使用横向高清图片。',
    previewClass: 'h-40 w-full object-cover',
    emptyClass: 'h-40'
  }
]

const hasChanges = computed(() => {
  return formData.app_title !== originalData.app_title ||
    formData.school_level !== originalData.school_level ||
    formData.site_logo_url !== originalData.site_logo_url ||
    formData.home_image_url !== originalData.home_image_url ||
    Boolean(selectedFiles.site_logo_url) ||
    Boolean(selectedFiles.home_image_url)
})

const schoolLevelLabel = computed(() => {
  return schoolLevelOptions[formData.school_level as keyof typeof schoolLevelOptions] || '高中'
})

const imagePreview = (key: ImageSettingKey) => previewUrls[key] || formData[key]

const revokePreviewUrl = (key: ImageSettingKey) => {
  if (previewUrls[key]) {
    URL.revokeObjectURL(previewUrls[key])
    previewUrls[key] = ''
  }
}

const loadSettings = async () => {
  loading.value = true
  try {
    await settingsStore.loadSettings()
    formData.app_title = settingsStore.settings.app_title?.value || ''
    formData.school_level = settingsStore.settings.school_level?.value || 'senior'
    formData.site_logo_url = settingsStore.settings.site_logo_url?.value || ''
    formData.home_image_url = settingsStore.settings.home_image_url?.value || ''
    syncOriginalData()
  } catch (error: any) {
    toast.error(error.message || '加载设置失败')
  } finally {
    loading.value = false
  }
}

const syncOriginalData = () => {
  originalData.app_title = formData.app_title
  originalData.school_level = formData.school_level
  originalData.site_logo_url = formData.site_logo_url
  originalData.home_image_url = formData.home_image_url
}

const handleImageSelect = (key: ImageSettingKey, event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  if (!file.type.startsWith('image/') && file.type !== 'image/x-icon') {
    toast.error('请选择图片文件')
    input.value = ''
    return
  }

  revokePreviewUrl(key)
  selectedFiles[key] = file
  previewUrls[key] = URL.createObjectURL(file)
  input.value = ''
}

const clearImage = (key: ImageSettingKey) => {
  revokePreviewUrl(key)
  selectedFiles[key] = null
  formData[key] = ''
}

const handleSave = async () => {
  if (!hasChanges.value) {
    toast.info('没有需要保存的更改')
    return
  }

  saving.value = true
  try {
    if (formData.app_title !== originalData.app_title) {
      await settingsStore.updateSetting('app_title', formData.app_title)
    }
    if (formData.school_level !== originalData.school_level) {
      await settingsStore.updateSetting('school_level', formData.school_level)
    }

    for (const key of ['site_logo_url', 'home_image_url'] as ImageSettingKey[]) {
      const file = selectedFiles[key]
      if (file) {
        const result = await settingsStore.uploadSettingImage(key, file)
        formData[key] = result.value
        selectedFiles[key] = null
        revokePreviewUrl(key)
      } else if (formData[key] !== originalData[key]) {
        await settingsStore.updateSetting(key, formData[key])
      }
    }

    syncOriginalData()
    await settingsStore.loadPublicSettings()
    toast.success('设置保存成功')
  } catch (error: any) {
    toast.error(error.message || '保存设置失败')
  } finally {
    saving.value = false
  }
}

const handleReset = () => {
  revokePreviewUrl('site_logo_url')
  revokePreviewUrl('home_image_url')
  selectedFiles.site_logo_url = null
  selectedFiles.home_image_url = null
  formData.app_title = originalData.app_title
  formData.school_level = originalData.school_level
  formData.site_logo_url = originalData.site_logo_url
  formData.home_image_url = originalData.home_image_url
  toast.info('已重置为上次保存的设置')
}

onMounted(() => {
  loadSettings()
})
</script>
