<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">完整数据导入</h1>
        <p class="mt-1 text-sm text-gray-600">
          按入学年导入系统启用前已整理完成的完整体测数据
        </p>
      </div>
    </div>

    <Card title="导入配置" subtitle="用于生成或更新体测表单、学生、班级、班级关系和体测记录">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label class="mb-2 block text-sm font-medium text-gray-700">导入表单名称</label>
          <input v-model="importOptions.formName" type="text" :disabled="isImportLocked"
            class="w-full rounded-lg border border-gray-300 px-4 py-2 transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500"
            :class="{ 'cursor-not-allowed bg-gray-100 text-gray-500': isImportLocked }" />
        </div>
        <div>
          <label class="mb-2 block text-sm font-medium text-gray-700">数据学年</label>
          <input v-model="importOptions.academicYear" type="text" :disabled="isImportLocked"
            class="w-full rounded-lg border border-gray-300 px-4 py-2 transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500"
            :class="{ 'cursor-not-allowed bg-gray-100 text-gray-500': isImportLocked }" />
        </div>
      </div>
    </Card>

    <Card>
      <template #header>
        <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 class="text-lg font-semibold text-gray-900">入学年数据</h3>
            <p class="mt-1 text-sm text-gray-600">
              三个选项分别对应可能存在的三个入学年，每行独立选择文件和工作表
            </p>
          </div>
          <div class="w-full rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-blue-800 lg:max-w-xl">
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0">
                <div class="text-sm font-semibold text-blue-900">{{ progressStatusText }}</div>
                <div class="mt-1 truncate text-sm">{{ currentProgressText }}</div>
              </div>
              <div class="shrink-0 text-lg font-bold text-blue-900">{{ uploadProgress }}%</div>
            </div>
            <div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
              <span>预计剩余：{{ importTimeSummaryText }}</span>
              <span v-if="importJob">已处理：{{ importJob.processedRows }} / {{ importJob.totalRows }} 行</span>
              <span v-else>已上传：{{ formatFileSize(uploadedBytes) }} / {{ formatFileSize(totalSelectedBytes) }}</span>
            </div>
            <div class="mt-3 h-2 overflow-hidden rounded-full bg-blue-100">
              <div class="h-full rounded-full bg-blue-600 transition-all duration-500"
                :style="{ width: `${uploadProgress}%` }" />
            </div>
          </div>
        </div>
      </template>

      <div class="space-y-4">
        <div v-for="slot in cohortSlots" :key="slot.id"
          class="relative overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div class="pointer-events-none absolute inset-y-0 left-0 transition-all duration-300"
            :class="slotProgressFillClass(slot)" :style="{ width: `${slotProgress(slot).progress}%` }" />

          <div class="relative grid grid-cols-1 gap-4 p-4 lg:grid-cols-[170px_1.15fr_1.35fr_150px] lg:items-start">
            <div>
              <div class="flex items-center gap-2">
                <span
                  class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-700">
                  {{ slot.order }}
                </span>
                <div>
                  <h4 class="text-base font-semibold text-gray-900">
                    {{ slot.cohort || '未指定' }}级
                  </h4>
                  <p class="text-xs text-gray-500">入学年</p>
                </div>
              </div>
              <input v-model="slot.cohort" type="text" :disabled="isImportLocked"
                class="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500"
                :class="{ 'cursor-not-allowed bg-gray-100 text-gray-500': isImportLocked }" placeholder="例如：2024"
                @input="resetPreviewState" />
            </div>

            <div>
              <div class="mb-2 flex items-center justify-between gap-3">
                <label class="block text-sm font-medium text-gray-700">上传文档</label>
                <input :id="`file-${slot.id}`" type="file" accept=".xlsx,.xls" class="hidden" :disabled="isImportLocked"
                  @change="event => handleSlotFileChange(slot.id, event)" />
                <label :for="`file-${slot.id}`"
                  class="inline-flex items-center justify-center rounded-lg bg-gray-200 px-3 py-1.5 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-300"
                  :class="isImportLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'">
                  选择文件
                </label>
              </div>

              <div class="rounded-lg border border-dashed p-3"
                :class="slot.file ? 'border-blue-300 bg-blue-50/70' : 'border-gray-300 bg-gray-50'">
                <div v-if="slot.file">
                  <div class="truncate text-sm font-medium text-gray-900">{{ slot.file.name }}</div>
                  <div class="mt-1 text-xs text-gray-500">{{ formatFileSize(slot.file.size) }}</div>
                </div>
                <div v-else class="text-sm text-gray-500">未选择文件</div>
              </div>
            </div>

            <div>
              <div class="mb-2 flex items-center justify-between">
                <label class="block text-sm font-medium text-gray-700">选择表格</label>
                <span class="text-xs text-gray-500">{{ sheetHint(slot) }}</span>
              </div>

              <div v-if="previewFileForSlot(slot)" class="grid grid-cols-1 gap-3 xl:grid-cols-2">
                <div>
                  <label class="mb-1 block text-xs font-medium text-gray-500">原始数据表</label>
                  <select v-model="slot.rawSheetName" :disabled="isImportLocked"
                    class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    :class="{ 'cursor-not-allowed bg-gray-100 text-gray-500': isImportLocked }">
                    <option v-for="sheetName in previewFileForSlot(slot)?.sheetNames || []"
                      :key="`${slot.id}-raw-${sheetName}`" :value="sheetName">
                      {{ sheetName }}
                    </option>
                  </select>
                </div>
                <div>
                  <label class="mb-1 block text-xs font-medium text-gray-500">分析结果表</label>
                  <select v-model="slot.analysisSheetName" :disabled="isImportLocked"
                    class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    :class="{ 'cursor-not-allowed bg-gray-100 text-gray-500': isImportLocked }">
                    <option value="">不导入分析表</option>
                    <option v-for="sheetName in previewFileForSlot(slot)?.sheetNames || []"
                      :key="`${slot.id}-analysis-${sheetName}`" :value="sheetName">
                      {{ sheetName }}
                    </option>
                  </select>
                </div>
              </div>

              <div v-else class="grid grid-cols-1 gap-3 xl:grid-cols-2">
                <select disabled
                  class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-400">
                  <option>{{ slot.file ? '请先预检查读取工作表' : '请选择 Excel 文件' }}</option>
                </select>
                <select disabled
                  class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-400">
                  <option>不导入分析表</option>
                </select>
              </div>

              <div v-if="previewFileForSlot(slot)" class="mt-3 grid grid-cols-3 gap-2 text-center">
                <div class="rounded-md bg-gray-50 px-2 py-2">
                  <div class="text-base font-semibold text-gray-900">{{ previewFileForSlot(slot)?.totalRows }}</div>
                  <div class="text-xs text-gray-500">行</div>
                </div>
                <div class="rounded-md bg-gray-50 px-2 py-2">
                  <div class="text-base font-semibold text-gray-900">{{ previewFileForSlot(slot)?.studentCount }}</div>
                  <div class="text-xs text-gray-500">学生</div>
                </div>
                <div class="rounded-md bg-gray-50 px-2 py-2">
                  <div class="text-base font-semibold text-gray-900">{{ previewFileForSlot(slot)?.classCount }}</div>
                  <div class="text-xs text-gray-500">班级</div>
                </div>
              </div>

              <div v-if="previewFileForSlot(slot)?.issues.length"
                class="mt-3 rounded-md border border-red-200 bg-red-50 p-3">
                <div class="mb-2 text-sm font-medium text-red-800">问题明细</div>
                <ul class="space-y-1 text-sm text-red-700">
                  <li v-for="issue in previewFileForSlot(slot)!.issues.slice(0, 4)"
                    :key="`${slot.id}-${issue.row}-${issue.message}`">
                    第 {{ issue.row }} 行：{{ issue.message }}
                  </li>
                </ul>
              </div>
            </div>

            <div class="flex flex-row items-center justify-between gap-3 lg:flex-col lg:items-end">
              <span class="inline-flex items-center rounded-md px-2.5 py-1 text-sm font-medium"
                :class="slotStatusClass(slotProgress(slot).status)">
                {{ slotProgress(slot).status }}
              </span>
              <div class="text-right text-sm">
                <div class="font-semibold text-gray-900">{{ slotProgress(slot).progress }}%</div>
                <div class="text-xs text-gray-500">{{ slotProgressLabel(slot) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>

    <Card>
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div class="grid grid-cols-2 gap-3 md:grid-cols-4 lg:flex-1">
          <div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div class="text-2xl font-bold text-gray-900">{{ selectedSlots.length }}</div>
            <div class="mt-1 text-sm text-gray-600">文件</div>
          </div>
          <div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div class="text-2xl font-bold text-gray-900">{{ selectedCohorts.length }}</div>
            <div class="mt-1 text-sm text-gray-600">入学年</div>
          </div>
          <div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div class="text-2xl font-bold text-gray-900">{{ previewResult?.totals.rows || 0 }}</div>
            <div class="mt-1 text-sm text-gray-600">数据行</div>
          </div>
          <div class="rounded-lg border p-4"
            :class="previewResult && previewResult.totals.issues > 0 ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'">
            <div class="text-2xl font-bold"
              :class="previewResult && previewResult.totals.issues > 0 ? 'text-red-700' : 'text-green-700'">
              {{ previewResult?.totals.issues || 0 }}
            </div>
            <div class="mt-1 text-sm"
              :class="previewResult && previewResult.totals.issues > 0 ? 'text-red-700' : 'text-green-700'">
              问题
            </div>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <Button type="button" variant="secondary" :loading="previewing"
            :disabled="selectedFiles.length === 0 || importing || importCompleted" @click="handlePreviewImport">
            预检查
          </Button>
          <Button type="button" variant="primary" :loading="importing" :disabled="primaryImportDisabled"
            @click="handlePrimaryImportAction">
            {{ primaryImportButtonText }}
          </Button>
          <Button v-if="busy" type="button" variant="danger" @click="cancelActiveRequest">
            {{ cancelButtonText }}
          </Button>
          <Button v-if="selectedFiles.length > 0 || previewResult || importResult || failedResult" type="button"
            variant="ghost" :disabled="busy" @click="clearImportState">
            清空
          </Button>
        </div>
      </div>
    </Card>

    <Card v-if="importResult || failedResult">
      <div v-if="importResult" class="rounded-lg border border-green-200 bg-green-50 p-4">
        <div class="flex items-start">
          <CheckCircleIcon class="mr-3 mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
          <div class="flex-1">
            <h3 class="text-sm font-medium text-green-900">完整数据导入完成</h3>
            <p class="mt-1 text-sm text-green-800">
              已处理 {{ importResult.rows }} 行，新增学生 {{ importResult.studentsCreated }} 人，更新学生
              {{ importResult.studentsUpdated }} 人，新增记录 {{ importResult.recordsCreated }} 条，更新记录
              {{ importResult.recordsUpdated }} 条。
            </p>
          </div>
        </div>
      </div>

      <div v-if="failedResult" class="rounded-lg border border-red-200 bg-red-50 p-4">
        <div class="flex items-start">
          <ExclamationTriangleIcon class="mr-3 mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
          <div class="flex-1">
            <h3 class="text-sm font-medium text-red-900">导入已回滚</h3>
            <p class="mt-1 text-sm text-red-800">
              共 {{ failedResult.failed }} 行失败。以下显示前 {{ Math.min(failedResult.errors.length, 50) }} 条错误。
            </p>
            <div class="mt-3 max-h-72 overflow-y-auto rounded-md border border-red-200 bg-white">
              <div v-for="error in failedResult.errors.slice(0, 50)"
                :key="`${error.fileName}-${error.row}-${error.message}`"
                class="border-b border-red-100 px-3 py-2 text-sm text-red-800 last:border-b-0">
                {{ error.fileName }} 第 {{ error.row }} 行：{{ error.message }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, reactive, ref } from 'vue'
import { completeDataImportAPI } from '@/api'
import type {
  CompleteDataImportJob,
  CompleteDataImportPreview,
  CompleteDataImportPreviewFile,
  CompleteDataImportResult
} from '@/api/completeDataImport'
import { useToast } from '@/composables/useToast'
import Card from '@/components/common/Card.vue'
import Button from '@/components/common/Button.vue'
import {
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'

type FileStatus = '待选择文件' | '待预检' | '待导入' | '上传中' | '解析中' | '导入中' | '导入成功' | '取消导入' | '失败'
type ImportOperation = 'preview' | 'import' | null

interface CohortSlot {
  id: string
  order: number
  cohort: string
  file: File | null
  rawSheetName: string
  analysisSheetName: string
}

interface FileProgressItem {
  uploaded: number
  remaining: number
  progress: number
  status: FileStatus
}

const toast = useToast()
const currentYear = new Date().getFullYear()

const importOptions = reactive({
  formName: `${currentYear}学年完整体质测试数据`,
  academicYear: currentYear.toString()
})

const cohortSlots = ref<CohortSlot[]>([
  { id: 'cohort-a', order: 1, cohort: currentYear.toString(), file: null, rawSheetName: '', analysisSheetName: '' },
  { id: 'cohort-b', order: 2, cohort: (currentYear - 1).toString(), file: null, rawSheetName: '', analysisSheetName: '' },
  { id: 'cohort-c', order: 3, cohort: (currentYear - 2).toString(), file: null, rawSheetName: '', analysisSheetName: '' }
])

const previewing = ref(false)
const importing = ref(false)
const uploadProgress = ref(0)
const uploadedBytes = ref(0)
const uploadTotalBytes = ref(0)
const remainingSeconds = ref<number | null>(null)
const operationStartedAt = ref<number | null>(null)
const processingOnServer = ref(false)
const cancelRequested = ref(false)
const activeRequestController = ref<AbortController | null>(null)
const activeOperation = ref<ImportOperation>(null)
const progressTitle = ref('')
const progressDescription = ref('')
const previewResult = ref<CompleteDataImportPreview | null>(null)
const importResult = ref<CompleteDataImportResult | null>(null)
const failedResult = ref<CompleteDataImportResult | null>(null)
const importJob = ref<CompleteDataImportJob | null>(null)
const importJobPoller = ref<number | null>(null)

const busy = computed(() => previewing.value || importing.value)
const isImportLocked = computed(() => importing.value || previewing.value)
const importCompleted = computed(() => importJob.value?.status === 'completed')
const importCanceled = computed(() => importJob.value?.status === 'canceled' || cancelRequested.value)

const primaryImportButtonText = computed(() => {
  if (importCompleted.value || importCanceled.value || importJob.value?.status === 'failed') return '重新导入'
  return '正式导入'
})

const primaryImportDisabled = computed(() => {
  if (importCompleted.value || importCanceled.value || importJob.value?.status === 'failed') return false
  return selectedFiles.value.length === 0 || !previewResult.value || previewResult.value.totals.issues > 0 || previewing.value
})

const selectedSlots = computed(() => {
  return cohortSlots.value.filter(slot => slot.file)
})

const selectedFiles = computed(() => {
  return selectedSlots.value.map(slot => slot.file).filter((file): file is File => !!file)
})

const selectedCohorts = computed(() => {
  return selectedSlots.value.map(slot => slot.cohort.trim()).filter(Boolean)
})

const totalSelectedBytes = computed(() => {
  return selectedFiles.value.reduce((sum, file) => sum + file.size, 0)
})

const currentSlot = computed(() => {
  if (selectedSlots.value.length === 0) return null

  const uploading = selectedSlots.value.find(slot => slotProgress(slot).status === '上传中')
  if (uploading) return uploading

  if (processingOnServer.value) {
    return selectedSlots.value[0]
  }

  return selectedSlots.value.find(slot => slotProgress(slot).status === '待导入') || selectedSlots.value[0]
})

const currentProgressText = computed(() => {
  if (!currentSlot.value) {
    return '未选择文件'
  }

  if (importJob.value && importJob.value.status !== 'queued') {
    return `${importJob.value.message}：${importJob.value.processedRows}/${importJob.value.totalRows} 行`
  }

  if (processingOnServer.value) {
    if (activeOperation.value === 'import' && importJob.value) {
      const file = importJob.value.currentFileName || '当前文件'
      const row = importJob.value.currentRow ? ` 第 ${importJob.value.currentRow} 行` : ''
      return `${file}${row}：${importJob.value.processedRows}/${importJob.value.totalRows} 行`
    }

    return `服务端正在预检查 ${selectedCohorts.value.join('、')} 级数据`
  }

  const cohort = currentSlot.value.cohort ? `${currentSlot.value.cohort}级` : '未指定入学年'
  return `${cohort} ${formatFileSize(uploadedBytes.value)} / ${formatFileSize(totalSelectedBytes.value)}`
})

const remainingTimeText = computed(() => {
  if (cancelRequested.value) return '已取消'
  if (!busy.value && selectedFiles.value.length === 0) return '未开始'
  if (processingOnServer.value) {
    if (activeOperation.value === 'import') {
      return importJob.value?.estimatedSecondsRemaining !== null && importJob.value?.estimatedSecondsRemaining !== undefined
        ? formatDuration(importJob.value.estimatedSecondsRemaining)
        : '计算中'
    }
    return '服务端预检查中'
  }
  if (remainingSeconds.value === null) return busy.value ? '计算中' : '未开始'
  if (remainingSeconds.value <= 1) return '少于 1 秒'

  const minutes = Math.floor(remainingSeconds.value / 60)
  const seconds = Math.round(remainingSeconds.value % 60)
  if (minutes > 0) return `${minutes} 分 ${seconds} 秒`
  return `${seconds} 秒`
})

const estimatedRemainingText = computed(() => {
  if (importJob.value) {
    if (importJob.value.status === 'completed') return '0 秒'
    if (importJob.value.status === 'failed') return '已失败'
    if (importJob.value.status === 'canceled') return '已取消'
    if (importJob.value.estimatedSecondsRemaining !== null) {
      return formatDuration(importJob.value.estimatedSecondsRemaining)
    }
    return importJob.value.processedRows > 0 ? '计算中' : '等待首批数据'
  }

  return remainingTimeText.value
})

const elapsedTimeText = computed(() => {
  if (importJob.value) {
    const startedAt = Date.parse(importJob.value.startedAt)
    const endedAt = importJob.value.completedAt ? Date.parse(importJob.value.completedAt) : Date.now()

    if (Number.isFinite(startedAt) && Number.isFinite(endedAt) && endedAt >= startedAt) {
      return formatDuration(Math.floor((endedAt - startedAt) / 1000))
    }
  }

  if (busy.value && operationStartedAt.value) {
    return formatDuration(Math.floor((Date.now() - operationStartedAt.value) / 1000))
  }

  return '0 秒'
})

const importTimeSummaryText = computed(() => {
  return `${estimatedRemainingText.value} / ${elapsedTimeText.value}`
})

const progressStatusText = computed(() => {
  if (cancelRequested.value) return '已取消'
  if (importJob.value?.status === 'completed') return '导入完成'
  if (importJob.value?.status === 'failed') return '导入失败'
  if (processingOnServer.value) {
    if (activeOperation.value === 'import' && importJob.value) {
      return `服务端导入中 ${importJob.value.progress}%`
    }
    return '服务端预检查中'
  }
  if (busy.value) return `上传中，预计剩余 ${remainingTimeText.value}`
  if (selectedFiles.value.length > 0) return previewResult.value ? '已预检查' : '待预检查'
  return '未开始'
})

const cancelButtonText = computed(() => {
  if (previewing.value) return '取消预检查'
  if (importing.value) return '取消导入'
  return '取消'
})

const getSlotFileKey = (slot: CohortSlot, index: number) => {
  return slot.file ? `${index}:${slot.file.name}:${slot.file.size}` : slot.id
}

const importRequestOptions = computed(() => ({
  formName: importOptions.formName,
  academicYear: importOptions.academicYear,
  participatingCohorts: selectedCohorts.value,
  sheetSelections: selectedSlots.value.map((slot, index) => ({
    fileKey: getSlotFileKey(slot, index),
    fileName: slot.file!.name,
    rawSheetName: slot.rawSheetName,
    analysisSheetName: slot.analysisSheetName
  }))
}))

const handleSlotFileChange = (slotId: string, event: Event) => {
  if (isImportLocked.value) return

  const input = event.target as HTMLInputElement
  const file = input.files?.[0] || null
  const slot = cohortSlots.value.find(item => item.id === slotId)

  if (slot) {
    slot.file = file
    slot.rawSheetName = ''
    slot.analysisSheetName = ''
  }

  resetPreviewState()
}

const resetPreviewState = () => {
  stopImportJobPolling()
  previewResult.value = null
  importResult.value = null
  failedResult.value = null
  importJob.value = null
  uploadedBytes.value = 0
  uploadTotalBytes.value = 0
  uploadProgress.value = 0
  remainingSeconds.value = null
  operationStartedAt.value = null
  processingOnServer.value = false
  cancelRequested.value = false
  activeOperation.value = null
}

const slotProgress = (slot: CohortSlot): FileProgressItem => {
  if (!slot.file) {
    return {
      uploaded: 0,
      remaining: 0,
      progress: 0,
      status: '待选择文件'
    }
  }

  if (importJob.value) {
    const fileProgresses = importJob.value.fileProgresses
    const slotIndex = selectedSlots.value.findIndex(item => item.id === slot.id)
    const slotFileKey = getSlotFileKey(slot, slotIndex)
    const fileProgress = fileProgresses.find(file => file.fileKey === slotFileKey)
    const progress = fileProgress?.progress || 0
    const fileIndex = fileProgresses.findIndex(file => file.fileKey === slotFileKey)
    const currentFileIndex = importJob.value.currentFileKey
      ? fileProgresses.findIndex(file => file.fileKey === importJob.value?.currentFileKey)
      : -1
    let status: FileStatus = progress >= 100 ? '导入成功' : '待导入'

    if (importJob.value.status === 'completed') {
      status = '导入成功'
    } else if (importJob.value.status === 'canceled' || importJob.value.status === 'canceling') {
      status = '取消导入'
    } else if (importJob.value.status === 'failed') {
      status = '失败'
    } else if (currentFileIndex >= 0 && fileIndex >= 0) {
      if (fileIndex < currentFileIndex) {
        status = progress >= 100 ? '导入成功' : '导入中'
      } else if (fileIndex === currentFileIndex) {
        status = '导入中'
      } else {
        status = '待导入'
      }
    } else if (progress > 0) {
      status = '导入中'
    }

    return {
      uploaded: slot.file.size,
      remaining: 0,
      progress,
      status
    }
  }

  const slotIndex = selectedSlots.value.findIndex(item => item.id === slot.id)
  const bytesBeforeSlot = selectedSlots.value
    .slice(0, Math.max(slotIndex, 0))
    .reduce((sum, item) => sum + (item.file?.size || 0), 0)
  const uploaded = Math.min(slot.file.size, Math.max(0, uploadedBytes.value - bytesBeforeSlot))
  const remaining = Math.max(slot.file.size - uploaded, 0)
  const progress = slot.file.size > 0 ? Math.round((uploaded / slot.file.size) * 100) : 0
  let status: FileStatus = previewFileForSlot(slot) ? '待导入' : '待预检'

  if (cancelRequested.value) {
    status = '取消导入'
  } else if (busy.value) {
    if (processingOnServer.value && progress === 100) {
      status = activeOperation.value === 'import' ? '导入中' : '解析中'
    } else if (uploadedBytes.value < bytesBeforeSlot) {
      status = '待导入'
    } else if (progress < 100) {
      status = '上传中'
    } else {
      status = previewing.value ? '解析中' : '待导入'
    }
  }

  return {
    uploaded,
    remaining,
    progress,
    status
  }
}

const slotJobProgress = (slot: CohortSlot) => {
  if (!slot.file || !importJob.value) return null
  const slotIndex = selectedSlots.value.findIndex(item => item.id === slot.id)
  return importJob.value.fileProgresses.find(file => file.fileKey === getSlotFileKey(slot, slotIndex)) || null
}

const slotProcessedRows = (slot: CohortSlot) => {
  return slotJobProgress(slot)?.processedRows || 0
}

const slotTotalRows = (slot: CohortSlot) => {
  return slotJobProgress(slot)?.totalRows || previewFileForSlot(slot)?.totalRows || 0
}

const previewFileForSlot = (slot: CohortSlot): CompleteDataImportPreviewFile | null => {
  if (!slot.file || !previewResult.value) return null
  const slotIndex = selectedSlots.value.findIndex(item => item.id === slot.id)
  return previewResult.value.files.find(file => file.fileKey === getSlotFileKey(slot, slotIndex)) || null
}

const applyDetectedSheets = () => {
  if (!previewResult.value) return

  cohortSlots.value.forEach(slot => {
    const previewFile = previewFileForSlot(slot)
    if (!previewFile) return

    slot.rawSheetName = previewFile.rawSheetName
    slot.analysisSheetName = previewFile.analysisSheetName || ''
  })
}

const formatFileSize = (size: number) => {
  if (size <= 0) return '0 B'
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

const formatDuration = (secondsValue: number) => {
  if (secondsValue <= 1) return '少于 1 秒'

  const minutes = Math.floor(secondsValue / 60)
  const seconds = Math.round(secondsValue % 60)
  if (minutes > 0) return `${minutes} 分 ${seconds} 秒`
  return `${seconds} 秒`
}

const slotRemainingTime = (slot: CohortSlot) => {
  const progress = slotProgress(slot)
  if (progress.status === '导入中') return '导入中'
  if (progress.status === '解析中') return '解析中'
  if (progress.status === '导入成功') return '导入成功'
  if (progress.status === '失败') return '失败'
  if (progress.status !== '上传中') return progress.status
  return remainingTimeText.value
}

const slotStatusClass = (status: FileStatus) => {
  if (status === '上传中' || status === '解析中' || status === '导入中') return 'bg-blue-50 text-blue-700'
  if (status === '导入成功') return importCompleted.value ? 'bg-gray-100 text-gray-600' : 'bg-green-50 text-green-700'
  if (status === '待预检' || status === '待导入') return 'bg-yellow-50 text-yellow-700'
  if (status === '取消导入' || status === '失败') return 'bg-red-50 text-red-700'
  return 'bg-gray-100 text-gray-600'
}

const slotProgressFillClass = (slot: CohortSlot) => {
  const status = slotProgress(slot).status

  if (status === '上传中' || status === '解析中' || status === '导入中') return 'bg-blue-500/10'
  if (status === '导入成功') return importCompleted.value ? 'bg-gray-400/20' : 'bg-green-500/10'
  if (status === '待预检' || status === '待导入') return 'bg-yellow-500/10'
  if (status === '取消导入' || status === '失败') return 'bg-red-500/10'
  return 'bg-gray-400/10'
}

const slotProgressLabel = (slot: CohortSlot) => {
  const status = slotProgress(slot).status
  if (status === '导入中') return '上传完成，导入中'
  if (status === '解析中') return '上传完成，解析中'
  if (status === '导入成功') return '导入成功'
  if (status === '取消导入') return '取消导入'
  if (status === '失败') return '导入失败'
  return status
}

const sheetHint = (slot: CohortSlot) => {
  if (previewFileForSlot(slot)) return '可选择'
  if (slot.file) return '预检查后可选'
  return '未开始'
}

const validateImportForm = () => {
  if (selectedFiles.value.length === 0) {
    toast.error('请至少选择一个完整数据 Excel 文件')
    return false
  }

  if (!importOptions.formName.trim()) {
    toast.error('请输入导入表单名称')
    return false
  }

  if (!importOptions.academicYear.trim()) {
    toast.error('请输入数据学年')
    return false
  }

  const emptyCohortWithFile = selectedSlots.value.find(slot => !slot.cohort.trim())
  if (emptyCohortWithFile) {
    toast.error('已选择文件的入学年必须填写')
    return false
  }

  return true
}

const resetProgress = (title: string, description: string) => {
  uploadProgress.value = 0
  uploadedBytes.value = 0
  uploadTotalBytes.value = totalSelectedBytes.value
  remainingSeconds.value = null
  operationStartedAt.value = Date.now()
  processingOnServer.value = false
  cancelRequested.value = false
  progressTitle.value = title
  progressDescription.value = description
}

const updateUploadProgress = (payload: {
  progress: number
  loaded: number
  total: number
  rate?: number
  estimated?: number
}) => {
  uploadProgress.value = payload.progress
  uploadedBytes.value = Math.min(payload.loaded, totalSelectedBytes.value)
  uploadTotalBytes.value = payload.total

  if (payload.estimated !== undefined) {
    remainingSeconds.value = payload.estimated
  } else if (payload.rate && payload.rate > 0) {
    remainingSeconds.value = Math.max((payload.total - payload.loaded) / payload.rate, 0)
  }

  if (payload.progress >= 100) {
    uploadedBytes.value = totalSelectedBytes.value
    processingOnServer.value = true
    progressDescription.value = activeOperation.value === 'import'
      ? '文件已上传，服务端正在写入完整数据。此阶段不会再产生上传字节进度，请保持页面打开。'
      : '文件已上传，服务端正在读取工作表并执行预检查，请保持页面打开。'
  }
}

const extractFailedResult = (error: any) => {
  const data = error?.responseData?.data
  if (data?.errors) {
    failedResult.value = data
  }
}

const stopImportJobPolling = () => {
  if (importJobPoller.value !== null) {
    window.clearInterval(importJobPoller.value)
    importJobPoller.value = null
  }
}

const applyImportJob = (job: CompleteDataImportJob) => {
  importJob.value = job
  uploadProgress.value = job.progress
  processingOnServer.value = job.status === 'queued' || job.status === 'running' || job.status === 'canceling'
  progressTitle.value = job.status === 'canceling' ? '正在取消导入' : '正在导入'
  progressDescription.value = job.message

  if (job.status === 'completed') {
    stopImportJobPolling()
    importing.value = false
    processingOnServer.value = false
    activeOperation.value = null
    uploadProgress.value = 100
    importResult.value = job.result || null
    toast.success('完整数据导入完成')
  } else if (job.status === 'failed') {
    stopImportJobPolling()
    importing.value = false
    processingOnServer.value = false
    activeOperation.value = null
    failedResult.value = job.result || null
    toast.error(job.error || '完整数据导入失败')
  } else if (job.status === 'canceled') {
    stopImportJobPolling()
    importing.value = false
    processingOnServer.value = false
    activeOperation.value = null
    cancelRequested.value = true
    toast.info('已取消导入，事务已回滚')
  }
}

const pollImportJob = async (jobId: string) => {
  try {
    const job = await completeDataImportAPI.getImportJob(jobId)
    applyImportJob(job)
  } catch (error: any) {
    stopImportJobPolling()
    importing.value = false
    processingOnServer.value = false
    toast.error(error.message || '获取导入进度失败')
  }
}

const startImportJobPolling = (jobId: string) => {
  stopImportJobPolling()
  importJobPoller.value = window.setInterval(() => {
    void pollImportJob(jobId)
  }, 1000)
}

const isRequestCanceled = (error: any) => {
  return error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError'
}

const cancelActiveRequest = async () => {
  cancelRequested.value = true
  progressTitle.value = '已取消'
  progressDescription.value = '已请求取消，后端会在当前处理点停止并回滚本次导入。'

  if (importJob.value && processingOnServer.value) {
    progressTitle.value = '正在取消导入'
    progressDescription.value = '正在通知后端取消导入并回滚事务。'
    try {
      const job = await completeDataImportAPI.cancelImportJob(importJob.value.id)
      applyImportJob(job)
    } catch (error: any) {
      toast.error(error.message || '取消导入失败')
    }
    return
  }

  if (activeRequestController.value) {
    processingOnServer.value = false
    activeRequestController.value.abort()
  }
}

const handlePreviewImport = async () => {
  if (!validateImportForm()) return

  previewing.value = true
  activeOperation.value = 'preview'
  importResult.value = null
  failedResult.value = null
  const controller = new AbortController()
  activeRequestController.value = controller
  resetProgress('正在预检查', '预检查需要先上传 Excel 文件，服务器读取工作簿后会返回可选择的表格。')

  try {
    previewResult.value = await completeDataImportAPI.previewPhysicalTests(
      selectedFiles.value,
      importRequestOptions.value,
      {
        signal: controller.signal,
        onUploadProgress: updateUploadProgress
      }
    )
    applyDetectedSheets()

    processingOnServer.value = false
    if (previewResult.value.totals.issues > 0) {
      toast.warning(`预检查完成，发现 ${previewResult.value.totals.issues} 个问题`)
    } else {
      toast.success('预检查通过，可以正式导入')
    }
  } catch (error: any) {
    if (isRequestCanceled(error)) {
      toast.info('已取消预检查')
      return
    }
    extractFailedResult(error)
    toast.error(error.message || '完整数据预检查失败')
  } finally {
    previewing.value = false
    if (activeOperation.value === 'preview') {
      activeOperation.value = null
    }
    if (activeRequestController.value === controller) {
      activeRequestController.value = null
    }
  }
}

const handleImportCompleteData = async () => {
  if (!validateImportForm()) return

  importing.value = true
  activeOperation.value = 'import'
  importResult.value = null
  failedResult.value = null
  importJob.value = null
  const controller = new AbortController()
  activeRequestController.value = controller
  resetProgress('正在导入', '正在上传文件，上传完成后服务器会写入完整数据。')
  let jobStarted = false

  try {
    const job = await completeDataImportAPI.startImportPhysicalTests(
      selectedFiles.value,
      importRequestOptions.value,
      {
        signal: controller.signal,
        onUploadProgress: updateUploadProgress
      }
    )
    jobStarted = true
    uploadedBytes.value = totalSelectedBytes.value
    uploadProgress.value = job.progress
    processingOnServer.value = true
    applyImportJob(job)
    startImportJobPolling(job.id)
  } catch (error: any) {
    if (isRequestCanceled(error)) {
      toast.info('已取消导入')
      return
    }
    extractFailedResult(error)
    toast.error(error.message || '完整数据导入失败')
  } finally {
    if (!jobStarted) {
      importing.value = false
      processingOnServer.value = false
    }
    if (!jobStarted && activeOperation.value === 'import') {
      activeOperation.value = null
    }
    if (activeRequestController.value === controller) {
      activeRequestController.value = null
    }
  }
}

const handlePrimaryImportAction = () => {
  if (importCompleted.value || importCanceled.value || importJob.value?.status === 'failed') {
    importJob.value = null
    importResult.value = null
    failedResult.value = null
    cancelRequested.value = false
    uploadProgress.value = 0
    uploadedBytes.value = 0
    operationStartedAt.value = null
    processingOnServer.value = false
    activeOperation.value = null
    void handleImportCompleteData()
    return
  }

  void handleImportCompleteData()
}

const clearImportState = () => {
  cohortSlots.value = cohortSlots.value.map(slot => ({
    ...slot,
    file: null,
    rawSheetName: '',
    analysisSheetName: ''
  }))
  resetPreviewState()
}

onUnmounted(() => {
  stopImportJobPolling()
  activeRequestController.value?.abort()
  activeRequestController.value = null
  activeOperation.value = null
})
</script>
