<template>
  <div class="space-y-6">
    <!-- 页面标题 -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">系统设置</h1>
        <p class="mt-1 text-sm text-gray-600">管理系统配置和参数</p>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="flex justify-center py-12">
      <Loading />
    </div>

    <!-- 设置表单 -->
    <Card v-else title="基本设置">
      <form @submit.prevent="handleSave" class="space-y-6">
        <!-- 系统标题 -->
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
            {{ settingsStore.settings.app_title?.description }}
          </p>
        </div>

        <!-- 预览 -->
        <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 class="text-sm font-medium text-gray-700 mb-2">预览</h3>
          <div class="space-y-2">
            <div class="flex items-center space-x-2">
              <span class="text-sm text-gray-600">浏览器标签：</span>
              <span class="text-sm font-medium text-gray-900">{{ formData.app_title }}</span>
            </div>
            <div class="flex items-center space-x-2">
              <span class="text-sm text-gray-600">页面标题：</span>
              <span class="text-sm font-medium text-gray-900">系统设置 - {{ formData.app_title }}</span>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="secondary"
            @click="handleReset"
            :disabled="saving"
          >
            重置
          </Button>
          <Button
            type="submit"
            variant="primary"
            :loading="saving"
            :disabled="!hasChanges"
          >
            保存设置
          </Button>
        </div>

        <!-- 提示信息 -->
        <div v-if="hasChanges" class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div class="flex items-start">
            <ExclamationTriangleIcon class="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 class="text-sm font-medium text-yellow-800">有未保存的更改</h4>
              <p class="mt-1 text-sm text-yellow-700">
                您修改了系统设置，请点击"保存设置"按钮保存更改。
              </p>
            </div>
          </div>
        </div>
      </form>
    </Card>

    <!-- 使用说明 -->
    <Card title="使用说明">
      <div class="prose prose-sm max-w-none">
        <ul class="space-y-2 text-gray-600">
          <li>
            <strong>系统标题：</strong>显示在浏览器标签页、登录页面和系统顶部导航栏
          </li>
          <li>
            <strong>保存后立即生效：</strong>修改保存后，所有用户刷新页面即可看到新标题
          </li>
          <li>
            <strong>权限要求：</strong>只有管理员可以修改系统设置
          </li>
        </ul>
      </div>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useSettingsStore } from '@/stores'
import { useToast } from '@/composables/useToast'
import Card from '@/components/common/Card.vue'
import Button from '@/components/common/Button.vue'
import Loading from '@/components/common/Loading.vue'
import { ExclamationTriangleIcon } from '@heroicons/vue/24/outline'

const settingsStore = useSettingsStore()
const toast = useToast()

// 状态
const loading = ref(false)
const saving = ref(false)

// 表单数据
const formData = reactive({
  app_title: ''
})

// 原始数据（用于检测变化）
const originalData = reactive({
  app_title: ''
})

// 是否有未保存的更改
const hasChanges = computed(() => {
  return formData.app_title !== originalData.app_title
})

// 加载设置
const loadSettings = async () => {
  loading.value = true
  try {
    await settingsStore.loadSettings()

    // 初始化表单数据
    formData.app_title = settingsStore.settings.app_title?.value || ''
    originalData.app_title = formData.app_title
  } catch (error: any) {
    toast.error(error.message || '加载设置失败')
  } finally {
    loading.value = false
  }
}

// 保存设置
const handleSave = async () => {
  if (!hasChanges.value) {
    toast.info('没有需要保存的更改')
    return
  }

  saving.value = true
  try {
    await settingsStore.updateSetting('app_title', formData.app_title)

    // 更新原始数据
    originalData.app_title = formData.app_title

    toast.success('设置保存成功')
  } catch (error: any) {
    toast.error(error.message || '保存设置失败')
  } finally {
    saving.value = false
  }
}

// 重置表单
const handleReset = () => {
  formData.app_title = originalData.app_title
  toast.info('已重置为上次保存的值')
}

// 初始化
onMounted(() => {
  loadSettings()
})
</script>
