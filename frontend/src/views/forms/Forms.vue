<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useFormsStore } from '@/stores/forms'
import { useAuthStore } from '@/stores/auth'
import { useClassesStore } from '@/stores/classes'
import { useToast } from '@/composables/useToast'
import Modal from '@/components/common/Modal.vue'
import Input from '@/components/common/Input.vue'
import Select from '@/components/common/Select.vue'
import Button from '@/components/common/Button.vue'
import Badge from '@/components/common/Badge.vue'
import Pagination from '@/components/common/Pagination.vue'
import type {
  PhysicalTestForm,
  FormTestItem,
  CreatePhysicalTestFormRequest,
  UpdatePhysicalTestFormRequest,
  UpdateFormTestItemRequest,
  FormStatus,
  Gender
} from '@/types'
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  Cog6ToothIcon
} from '@heroicons/vue/24/outline'

// Stores
const formsStore = useFormsStore()
const authStore = useAuthStore()
const classesStore = useClassesStore()
const toast = useToast()

// State
const searchName = ref('')
const searchYear = ref('')
const filterStatus = ref<FormStatus | ''>('')
const currentPage = ref(1)
const pageSize = ref(10)

// Form Modal
const showFormModal = ref(false)
const isEditing = ref(false)
const editingFormId = ref<number | null>(null)
const formData = ref<CreatePhysicalTestFormRequest>({
  formName: '',
  academicYear: '',
  participatingCohorts: [],
  testDate: '',
  startTime: '',
  endTime: '',
  description: ''
})
const formErrors = ref<Record<string, string>>({})

// Available Cohorts
const availableCohorts = ref<string[]>([])
const showCohortsDropdown = ref(false)

// Test Items Modal
const showTestItemsModal = ref(false)
const currentFormId = ref<number | null>(null)
const testItems = ref<FormTestItem[]>([])
const testItemsLoading = ref(false)

// Confirm Modal
const showConfirmModal = ref(false)
const confirmAction = ref<'publish' | 'close' | 'delete' | null>(null)
const confirmFormId = ref<number | null>(null)
const confirmFormName = ref('')

// Computed
const filteredForms = computed(() => {
  let forms = formsStore.items

  // 搜索过滤
  if (searchName.value) {
    forms = forms.filter(form =>
      form.formName.toLowerCase().includes(searchName.value.toLowerCase())
    )
  }

  if (searchYear.value) {
    forms = forms.filter(form =>
      form.academicYear.includes(searchYear.value)
    )
  }

  // 状态过滤
  if (filterStatus.value) {
    forms = forms.filter(form => form.status === filterStatus.value)
  }

  return forms
})

const totalPages = computed(() =>
  Math.ceil(formsStore.total / pageSize.value)
)

const statusOptions = [
  { label: '全部状态', value: '' },
  { label: '草稿', value: 'draft' },
  { label: '已发布', value: 'published' },
  { label: '已关闭', value: 'closed' }
]

const genderOptions = [
  { label: '不限', value: '' },
  { label: '男生', value: 'male' },
  { label: '女生', value: 'female' }
]

// Methods
const loadForms = async () => {
  try {
    await formsStore.fetchList({
      page: currentPage.value,
      pageSize: pageSize.value,
      formName: searchName.value || undefined,
      academicYear: searchYear.value || undefined,
      status: filterStatus.value || undefined
    })
  } catch (err: any) {
    toast.error(err.message || '加载表单列表失败')
  }
}

const fetchAvailableCohorts = async () => {
  try {
    const response = await classesStore.fetchList()
    // 从班级列表中提取所有 cohort,去重并排序
    const cohorts = [...new Set(response.data.map(c => c.cohort))]
    availableCohorts.value = cohorts.sort().reverse() // 降序,最新年级在前
  } catch (err: any) {
    toast.error(err.message || '加载年级列表失败')
  }
}

const handleSearch = () => {
  currentPage.value = 1
  loadForms()
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  loadForms()
}

const handlePageSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  loadForms()
}

// 下拉菜单控制
const toggleCohortsDropdown = () => {
  showCohortsDropdown.value = !showCohortsDropdown.value
}

const removeCohort = (cohort: string) => {
  const index = formData.value.participatingCohorts.indexOf(cohort)
  if (index > -1) {
    formData.value.participatingCohorts.splice(index, 1)
  }
}

// 点击外部关闭下拉菜单
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.relative')) {
    showCohortsDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const openCreateModal = async () => {
  isEditing.value = false
  editingFormId.value = null

  // 获取当前年份
  const currentYear = new Date().getFullYear()

  // 加载可用年级
  await fetchAvailableCohorts()

  // 计算默认参与年级（今年和前两年，共三年）
  const defaultCohorts: string[] = []
  for (let i = 0; i <= 2; i++) {
    const cohort = (currentYear - i).toString()
    // 只添加存在的年级
    if (availableCohorts.value.includes(cohort)) {
      defaultCohorts.push(cohort)
    }
  }

  // 获取今天的日期（YYYY-MM-DD格式）
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  const todayStr = `${year}-${month}-${day}`

  formData.value = {
    formName: `${currentYear}年国家体质测试数据收集`,
    academicYear: currentYear.toString(),
    participatingCohorts: defaultCohorts,
    testDate: todayStr,
    startTime: '',
    endTime: '',
    description: ''
  }
  formErrors.value = {}
  showCohortsDropdown.value = false
  showFormModal.value = true
}

const openEditModal = async (form: PhysicalTestForm) => {
  // 只有草稿状态可以编辑
  if (form.status !== 'draft') {
    toast.warning('只有草稿状态的表单可以编辑')
    return
  }

  isEditing.value = true
  editingFormId.value = form.id
  formData.value = {
    formName: form.formName,
    academicYear: form.academicYear,
    participatingCohorts: form.participatingCohorts || [],
    testDate: form.testDate,
    startTime: form.startTime || '',
    endTime: form.endTime || '',
    description: form.description || ''
  }
  formErrors.value = {}
  showCohortsDropdown.value = false
  await fetchAvailableCohorts()
  showFormModal.value = true
}

const validateForm = (): boolean => {
  formErrors.value = {}

  if (!formData.value.formName.trim()) {
    formErrors.value.formName = '请输入表单名称'
  }

  if (!formData.value.academicYear.trim()) {
    formErrors.value.academicYear = '请输入学年'
  }

  // 学年格式验证 (例如: 2025)
  const yearPattern = /^\d{4}$/
  if (formData.value.academicYear && !yearPattern.test(formData.value.academicYear)) {
    formErrors.value.academicYear = '学年格式不正确，例如：2025'
  }

  // 验证参与年级
  if (!formData.value.participatingCohorts || formData.value.participatingCohorts.length === 0) {
    formErrors.value.participatingCohorts = '请至少选择一个参与年级'
  }

  return Object.keys(formErrors.value).length === 0
}

const handleSubmitForm = async () => {
  if (!validateForm()) {
    return
  }

  try {
    if (isEditing.value && editingFormId.value) {
      await formsStore.update(editingFormId.value, formData.value)
      toast.success('表单更新成功')
    } else {
      await formsStore.create(formData.value)
      toast.success('表单创建成功')
    }
    showFormModal.value = false
    loadForms()
  } catch (err: any) {
    toast.error(err.message || '操作失败')
  }
}

const openTestItemsModal = async (formId: number) => {
  currentFormId.value = formId
  testItemsLoading.value = true
  showTestItemsModal.value = true

  try {
    testItems.value = await formsStore.getTestItems(formId)
  } catch (err: any) {
    toast.error(err.message || '加载测试项目失败')
    showTestItemsModal.value = false
  } finally {
    testItemsLoading.value = false
  }
}

const handleUpdateTestItems = async () => {
  if (!currentFormId.value) return

  try {
    const updates: UpdateFormTestItemRequest[] = testItems.value.map(item => ({
      itemCode: item.itemCode,
      itemName: item.itemName,
      itemUnit: item.itemUnit,
      genderLimit: item.genderLimit || undefined,
      isRequired: item.isRequired,
      sortOrder: item.sortOrder,
      scoringStandard: item.scoringStandard
    }))

    await formsStore.updateTestItems(currentFormId.value, updates)
    toast.success('测试项目更新成功')
    showTestItemsModal.value = false
  } catch (err: any) {
    toast.error(err.message || '更新测试项目失败')
  }
}

const openConfirmModal = (action: 'publish' | 'close' | 'delete', form: PhysicalTestForm) => {
  confirmAction.value = action
  confirmFormId.value = form.id
  confirmFormName.value = form.formName
  showConfirmModal.value = true
}

const handleConfirm = async () => {
  if (!confirmFormId.value || !confirmAction.value) return

  try {
    switch (confirmAction.value) {
      case 'publish':
        await formsStore.publishForm(confirmFormId.value)
        toast.success('表单发布成功')
        break
      case 'close':
        await formsStore.closeForm(confirmFormId.value)
        toast.success('表单关闭成功')
        break
      case 'delete':
        await formsStore.remove(confirmFormId.value)
        toast.success('表单删除成功')
        break
    }
    showConfirmModal.value = false
    loadForms()
  } catch (err: any) {
    toast.error(err.message || '操作失败')
  }
}

const getStatusBadge = (status: FormStatus) => {
  const config = {
    draft: { variant: 'info' as const, label: '草稿' },
    published: { variant: 'success' as const, label: '已发布' },
    closed: { variant: 'danger' as const, label: '已关闭' }
  }
  return config[status]
}

const getConfirmMessage = computed(() => {
  if (!confirmAction.value) return ''

  const messages = {
    publish: `确定要发布表单"${confirmFormName.value}"吗？发布后将无法修改测试项目配置。`,
    close: `确定要关闭表单"${confirmFormName.value}"吗？关闭后数据将冻结，仅供查询。`,
    delete: `确定要删除表单"${confirmFormName.value}"吗？此操作无法撤销。`
  }

  return messages[confirmAction.value]
})

const getGenderLabel = (gender: Gender | null | undefined): string => {
  if (!gender) return '不限'
  return gender === 'male' ? '男生' : '女生'
}

const formatDate = (dateString: string): string => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('zh-CN')
}

const formatDateTime = (dateTimeString: string | undefined): string => {
  if (!dateTimeString) return '-'
  return new Date(dateTimeString).toLocaleString('zh-CN')
}

// Lifecycle
onMounted(() => {
  loadForms()
})
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-6">
      <!-- Header -->
      <div class="bg-white shadow rounded-lg p-6">
        <div class="flex items-center justify-between mb-4">
          <h1 class="text-2xl font-bold text-gray-900">体测表单管理</h1>
          <Button variant="primary" @click="openCreateModal">
            <template #icon>
              <PlusIcon class="h-5 w-5" />
            </template>
            创建表单
          </Button>
        </div>

        <!-- Search & Filter -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            v-model="searchName"
            placeholder="搜索表单名称"
            @keyup.enter="handleSearch"
          >
            <template #icon>
              <MagnifyingGlassIcon class="h-5 w-5 text-gray-400" />
            </template>
          </Input>

          <Input
            v-model="searchYear"
            type="number"
            placeholder="搜索学年 (如: 2025)"
            @keyup.enter="handleSearch"
          />

          <Select
            v-model="filterStatus"
            :options="statusOptions"
            placeholder="选择状态"
          />

          <Button variant="primary" @click="handleSearch">
            <MagnifyingGlassIcon class="h-5 w-5" />
            搜索
          </Button>
        </div>
      </div>

      <!-- Table -->
      <div class="bg-white shadow rounded-lg overflow-hidden">
        <div v-if="formsStore.loading" class="flex items-center justify-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>

        <div v-else-if="filteredForms.length === 0" class="text-center py-12">
          <p class="text-gray-500">暂无表单数据</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  表单名称
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  学年
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  参与年级
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  测试日期
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  开始时间
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  结束时间
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="form in filteredForms" :key="form.id" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">{{ form.formName }}</div>
                  <div v-if="form.description" class="text-sm text-gray-500">{{ form.description }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ form.academicYear }}
                </td>
                <td class="px-6 py-4">
                  <div class="flex gap-1 flex-wrap">
                    <Badge v-for="cohort in form.participatingCohorts" :key="cohort" variant="info">
                      {{ cohort }}级
                    </Badge>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ formatDate(form.testDate) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ formatDateTime(form.startTime) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ formatDateTime(form.endTime) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <Badge :variant="getStatusBadge(form.status).variant">
                    {{ getStatusBadge(form.status).label }}
                  </Badge>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    class="text-blue-600 hover:text-blue-900"
                    title="配置测试项目"
                    @click="openTestItemsModal(form.id)"
                  >
                    <Cog6ToothIcon class="h-5 w-5" />
                  </button>

                  <button
                    v-if="form.status === 'draft'"
                    class="text-indigo-600 hover:text-indigo-900"
                    title="编辑"
                    @click="openEditModal(form)"
                  >
                    <PencilIcon class="h-5 w-5" />
                  </button>

                  <button
                    v-if="form.status === 'draft'"
                    class="text-green-600 hover:text-green-900"
                    title="发布"
                    @click="openConfirmModal('publish', form)"
                  >
                    <CheckCircleIcon class="h-5 w-5" />
                  </button>

                  <button
                    v-if="form.status === 'published'"
                    class="text-orange-600 hover:text-orange-900"
                    title="关闭"
                    @click="openConfirmModal('close', form)"
                  >
                    <XCircleIcon class="h-5 w-5" />
                  </button>

                  <button
                    v-if="form.status === 'draft'"
                    class="text-red-600 hover:text-red-900"
                    title="删除"
                    @click="openConfirmModal('delete', form)"
                  >
                    <TrashIcon class="h-5 w-5" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <Pagination
          v-if="filteredForms.length > 0"
          :current-page="currentPage"
          :total-pages="totalPages"
          :total-items="formsStore.total"
          :page-size="pageSize"
          @page-change="handlePageChange"
          @size-change="handlePageSizeChange"
        />
      </div>
    </div>

    <!-- Form Modal -->
    <Modal
      v-model="showFormModal"
      :title="isEditing ? '编辑表单' : '创建表单'"
      size="lg"
    >
      <div class="space-y-4">
        <Input
          v-model="formData.formName"
          label="表单名称 *"
          placeholder="例如：2024年秋季体测"
          :error="formErrors.formName"
        />

        <Input
          v-model="formData.academicYear"
          type="number"
          label="学年 *"
          placeholder="例如：2025"
          :error="formErrors.academicYear"
        />

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            参与年级 *
          </label>
          <!-- 下拉多选框 -->
          <div class="relative">
            <div
              @click="toggleCohortsDropdown"
              class="min-h-[42px] w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm cursor-pointer hover:border-gray-400 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white"
            >
              <!-- 已选择的标签 -->
              <div v-if="formData.participatingCohorts.length > 0" class="flex flex-wrap gap-1.5">
                <span
                  v-for="cohort in formData.participatingCohorts"
                  :key="cohort"
                  class="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium bg-blue-100 text-blue-800"
                >
                  {{ cohort }}级
                  <button
                    type="button"
                    @click.stop="removeCohort(cohort)"
                    class="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-blue-200 focus:outline-none"
                  >
                    <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                    </svg>
                  </button>
                </span>
              </div>
              <!-- 占位文字 -->
              <div v-else class="text-gray-400">
                请选择参与年级
              </div>
              <!-- 下拉箭头 -->
              <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
              </div>
            </div>

            <!-- 下拉选项列表 -->
            <div
              v-if="showCohortsDropdown"
              class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto"
            >
              <label
                v-for="cohort in availableCohorts"
                :key="cohort"
                class="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  :value="cohort"
                  v-model="formData.participatingCohorts"
                  class="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                />
                <span class="text-sm">{{ cohort }}级</span>
              </label>
              <div v-if="availableCohorts.length === 0" class="px-3 py-2 text-sm text-gray-500">
                暂无可选年级
              </div>
            </div>
          </div>
          <p v-if="formErrors.participatingCohorts" class="text-sm text-red-600 mt-1">
            {{ formErrors.participatingCohorts }}
          </p>
        </div>

        <Input
          v-model="formData.testDate"
          type="text"
          label="测试日期"
          placeholder="YYYY-MM-DD"
        />

        <Input
          v-model="formData.startTime"
          type="text"
          label="开始时间"
          placeholder="YYYY-MM-DD HH:mm:ss"
        />

        <Input
          v-model="formData.endTime"
          type="text"
          label="结束时间"
          placeholder="YYYY-MM-DD HH:mm:ss"
        />

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">描述</label>
          <textarea
            v-model="formData.description"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows="3"
            placeholder="表单描述（可选）"
          />
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <Button variant="secondary" @click="showFormModal = false">
            取消
          </Button>
          <Button variant="primary" :loading="formsStore.loading" @click="handleSubmitForm">
            {{ isEditing ? '更新' : '创建' }}
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Test Items Modal -->
    <Modal
      v-model="showTestItemsModal"
      title="测试项目配置"
      size="xl"
    >
      <div v-if="testItemsLoading" class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>

      <div v-else class="space-y-4">
        <div class="text-sm text-gray-600 mb-4">
          共 {{ testItems.length }} 个测试项目
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">排序</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">项目名称</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">单位</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">性别限制</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">必填</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="item in testItems" :key="item.id">
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {{ item.sortOrder }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                  {{ item.itemName }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {{ item.itemUnit || '-' }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {{ getGenderLabel(item.genderLimit) }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm">
                  <Badge :variant="item.isRequired ? 'danger' : 'info'">
                    {{ item.isRequired ? '必填' : '可选' }}
                  </Badge>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
          <p class="text-sm text-blue-800">
            <strong>提示：</strong>创建表单时会自动生成 11 个国标测试项目。如需修改配置，请联系系统管理员。
          </p>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end">
          <Button variant="secondary" @click="showTestItemsModal = false">
            关闭
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Confirm Modal -->
    <Modal
      v-model="showConfirmModal"
      title="确认操作"
      size="md"
    >
      <div class="py-4">
        <p class="text-gray-700">{{ getConfirmMessage }}</p>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <Button variant="secondary" @click="showConfirmModal = false">
            取消
          </Button>
          <Button
            :variant="confirmAction === 'delete' ? 'danger' : 'primary'"
            :loading="formsStore.loading"
            @click="handleConfirm"
          >
            确认
          </Button>
        </div>
      </template>
    </Modal>
  </div>
</template>
