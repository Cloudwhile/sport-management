<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useStudentsStore } from '@/stores/students'
import { useClassesStore } from '@/stores/classes'
import { useToast } from '@/composables/useToast'
import studentsAPI from '@/api/students'
import { Gender } from '@/types'
import type { Student, CreateStudentRequest, UpdateStudentRequest, Class } from '@/types'
import Table, { type TableColumn } from '@/components/common/Table.vue'
import Pagination from '@/components/common/Pagination.vue'
import Modal from '@/components/common/Modal.vue'
import Input from '@/components/common/Input.vue'
import Select, { type SelectOption } from '@/components/common/Select.vue'
import Button from '@/components/common/Button.vue'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  ArrowsRightLeftIcon,
  FunnelIcon,
  ArrowUpTrayIcon
} from '@heroicons/vue/24/outline'

const studentsStore = useStudentsStore()
const classesStore = useClassesStore()
const toast = useToast()

// 分页状态
const pagination = reactive({
  page: 1,
  pageSize: 20
})

// 搜索和筛选状态
const filters = reactive({
  name: '',
  studentIdNational: '',
  studentIdSchool: '',
  gender: '' as '' | Gender,
  classId: undefined as number | undefined
})

// UI 状态
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const showTransferModal = ref(false)
const showFilters = ref(false)
const showBatchImportModal = ref(false)
const currentStudent = ref<Student | null>(null)

// 批量导入状态
const selectedFile = ref<File | null>(null)
const isUploading = ref(false)
const importResults = ref<any>(null)
const isDragging = ref(false)
const importAcademicYear = ref<string>(new Date().getFullYear().toString()) // 批量导入的学年

// 表单数据
const formData = reactive<CreateStudentRequest>({
  studentIdNational: '',
  studentIdSchool: '',
  name: '',
  gender: Gender.MALE,
  birthDate: '',
  idCardNumber: ''
})

// 表单验证错误
const formErrors = reactive({
  studentIdNational: '',
  studentIdSchool: '',
  name: '',
  gender: '',
  birthDate: ''
})

// 转班表单数据
const transferFormData = reactive({
  currentClassName: '',  // 当前班级名称（只读显示）
  toClassId: 0,          // 目标班级ID
  academicYear: new Date().getFullYear().toString()  // 简化为年份格式
})

// 表格列定义
const columns: TableColumn[] = [
  { key: 'studentIdSchool', label: '学号', width: '120px' },
  { key: 'studentIdNational', label: '全国学籍号', width: '150px' },
  { key: 'name', label: '姓名', width: '100px' },
  { key: 'gender', label: '性别', width: '80px' },
  { key: 'birthDate', label: '出生日期', width: '120px' },
  { key: 'currentClass', label: '当前班级', width: '120px' },
  { key: 'actions', label: '操作', width: '200px' }
]

// 性别选项
const genderOptions: SelectOption[] = [
  { label: '男', value: Gender.MALE },
  { label: '女', value: Gender.FEMALE }
]

// 班级选项
const classOptions = computed<SelectOption[]>(() => {
  return classesStore.items.map(cls => ({
    label: `${cls.cohort} ${cls.className}`,
    value: cls.id
  }))
})

// 处理班级筛选变更（字符串转数字）
const handleClassFilterChange = (value: string | number) => {
  filters.classId = value ? Number(value) : undefined
}

// 处理转班目标班级变更
const handleTransferToClassChange = (value: string | number) => {
  transferFormData.toClassId = Number(value)
}

// 计算分页信息
const totalPages = computed(() => {
  return Math.ceil(studentsStore.total / pagination.pageSize)
})

// 性别显示文本
const getGenderText = (gender: Gender) => {
  return gender === Gender.MALE ? '男' : '女'
}

// 格式化日期
const formatDate = (date?: string) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('zh-CN')
}

// 加载数据
const loadData = async () => {
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      name: filters.name || undefined,
      studentIdNational: filters.studentIdNational || undefined,
      studentIdSchool: filters.studentIdSchool || undefined,
      gender: filters.gender || undefined,
      classId: filters.classId
    }
    await studentsStore.fetchList(params)
  } catch (error: any) {
    toast.error(error.message || '加载学生列表失败')
  }
}

// 加载班级列表
const loadClasses = async () => {
  try {
    await classesStore.fetchList({ page: 1, pageSize: 1000 })
  } catch (error: any) {
    console.error('加载班级列表失败:', error)
  }
}

// 搜索处理
const handleSearch = () => {
  pagination.page = 1
  loadData()
}

// 重置搜索
const handleReset = () => {
  filters.name = ''
  filters.studentIdNational = ''
  filters.studentIdSchool = ''
  filters.gender = '' as ''
  filters.classId = undefined
  pagination.page = 1
  loadData()
}

// 分页变更
const handlePageChange = (page: number) => {
  pagination.page = page
  loadData()
}

const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
  loadData()
}

// 验证表单
const validateForm = (): boolean => {
  let isValid = true

  // 重置错误
  formErrors.studentIdNational = ''
  formErrors.studentIdSchool = ''
  formErrors.name = ''
  formErrors.gender = ''
  formErrors.birthDate = ''

  // 全国学籍号
  if (!formData.studentIdNational.trim()) {
    formErrors.studentIdNational = '请输入全国学籍号'
    isValid = false
  }

  // 学校学号
  if (!formData.studentIdSchool.trim()) {
    formErrors.studentIdSchool = '请输入学校学号'
    isValid = false
  }

  // 姓名
  if (!formData.name.trim()) {
    formErrors.name = '请输入姓名'
    isValid = false
  }

  return isValid
}

// 重置表单
const resetForm = () => {
  formData.studentIdNational = ''
  formData.studentIdSchool = ''
  formData.name = ''
  formData.gender = Gender.MALE
  formData.birthDate = ''
  formData.idCardNumber = ''

  formErrors.studentIdNational = ''
  formErrors.studentIdSchool = ''
  formErrors.name = ''
  formErrors.gender = ''
  formErrors.birthDate = ''
}

// 打开创建对话框
const openCreateModal = () => {
  resetForm()
  showCreateModal.value = true
}

// 创建学生
const handleCreate = async () => {
  if (!validateForm()) {
    return
  }

  try {
    await studentsStore.create(formData)
    toast.success('创建学生成功')
    showCreateModal.value = false
    loadData()
  } catch (error: any) {
    toast.error(error.message || '创建学生失败')
  }
}

// 打开编辑对话框
const openEditModal = (student: Student) => {
  currentStudent.value = student
  formData.studentIdNational = student.studentIdNational
  formData.studentIdSchool = student.studentIdSchool
  formData.name = student.name
  formData.gender = student.gender
  formData.birthDate = student.birthDate
  formData.idCardNumber = student.idCardNumber || ''

  resetFormErrors()
  showEditModal.value = true
}

const resetFormErrors = () => {
  formErrors.studentIdNational = ''
  formErrors.studentIdSchool = ''
  formErrors.name = ''
  formErrors.gender = ''
  formErrors.birthDate = ''
}

// 更新学生
const handleUpdate = async () => {
  if (!validateForm() || !currentStudent.value) {
    return
  }

  try {
    const updateData: UpdateStudentRequest = {
      studentIdNational: formData.studentIdNational,
      studentIdSchool: formData.studentIdSchool,
      name: formData.name,
      gender: formData.gender,
      birthDate: formData.birthDate || undefined,
      idCardNumber: formData.idCardNumber || undefined
    }

    await studentsStore.update(currentStudent.value.id, updateData)
    toast.success('更新学生成功')
    showEditModal.value = false
    loadData()
  } catch (error: any) {
    toast.error(error.message || '更新学生失败')
  }
}

// 打开删除确认对话框
const openDeleteModal = (student: Student) => {
  currentStudent.value = student
  showDeleteModal.value = true
}

// 删除学生
const handleDelete = async () => {
  if (!currentStudent.value) return

  try {
    await studentsStore.remove(currentStudent.value.id)
    toast.success('删除学生成功')
    showDeleteModal.value = false
    loadData()
  } catch (error: any) {
    toast.error(error.message || '删除学生失败')
  }
}

// 打开转班对话框
const openTransferModal = (student: Student) => {
  currentStudent.value = student
  // 自动填充当前班级信息（从学生数据中获取）
  transferFormData.currentClassName = (student as any).class?.className || '未分配班级'
  transferFormData.toClassId = 0
  transferFormData.academicYear = new Date().getFullYear().toString()
  showTransferModal.value = true
}

// 学生转班
const handleTransfer = async () => {
  if (!currentStudent.value) return

  if (!transferFormData.toClassId) {
    toast.error('请选择目标班级')
    return
  }

  try {
    await studentsStore.transferStudent(
      currentStudent.value.id,
      transferFormData.toClassId,
      transferFormData.academicYear
    )
    toast.success('转班成功')
    showTransferModal.value = false
    loadData()
  } catch (error: any) {
    toast.error(error.message || '转班失败')
  }
}

// 打开批量导入对话框
const openBatchImportModal = () => {
  selectedFile.value = null
  importResults.value = null
  importAcademicYear.value = new Date().getFullYear().toString() // 重置为当前年份
  showBatchImportModal.value = true
}

// 处理文件选择
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    selectedFile.value = target.files[0]
  }
}

// 处理拖拽进入
const handleDragEnter = (event: DragEvent) => {
  event.preventDefault()
  isDragging.value = true
}

// 处理拖拽离开
const handleDragLeave = (event: DragEvent) => {
  event.preventDefault()
  isDragging.value = false
}

// 处理拖拽悬停
const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
}

// 处理文件拖放
const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragging.value = false

  const files = event.dataTransfer?.files
  if (files && files.length > 0) {
    const file = files[0]
    // 检查文件类型
    const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel']
    const validExtensions = ['.xlsx', '.xls']
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()

    if (validTypes.includes(file.type) || validExtensions.includes(fileExtension)) {
      selectedFile.value = file
    } else {
      toast.error('仅支持 .xlsx 和 .xls 格式的文件')
    }
  }
}

// 执行批量导入
const handleBatchImport = async () => {
  if (!selectedFile.value) {
    toast.error('请选择要上传的文件')
    return
  }

  if (!importAcademicYear.value) {
    toast.error('请输入学年')
    return
  }

  try {
    isUploading.value = true
    // 传递文件和学年参数
    const result = await studentsAPI.batchImport(selectedFile.value, importAcademicYear.value)

    // 确保 result 存在且有效
    if (!result || typeof result !== 'object') {
      console.error('批量导入返回数据异常:', result)
      toast.error('批量导入失败：服务器返回数据异常')
      return
    }

    importResults.value = result

    // 根据结果显示不同的提示
    const { success = 0, failed = 0, warnings = 0 } = result
    if (failed === 0 && warnings === 0) {
      toast.success(`批量导入成功！共导入 ${success} 条数据`)
    } else if (failed > 0 && success > 0) {
      toast.warning(`批量导入完成，成功 ${success} 条，失败 ${failed} 条，请查看详情`)
    } else if (failed > 0) {
      toast.error(`批量导入失败，共 ${failed} 条数据存在问题，请查看详情`)
    } else {
      toast.warning(`批量导入完成，成功 ${success} 条，有 ${warnings} 条警告`)
    }

    // 只在有成功导入的数据时才重新加载列表
    if (success > 0) {
      loadData()
    }
  } catch (error: any) {
    console.error('批量导入错误:', error)
    toast.error(error.message || '批量导入失败')
  } finally {
    isUploading.value = false
  }
}

// 关闭批量导入对话框
const closeBatchImportModal = () => {
  showBatchImportModal.value = false
  selectedFile.value = null
  importResults.value = null
}

// 初始化
onMounted(() => {
  loadData()
  loadClasses()
})
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-6">
      <!-- 页面标题 -->
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900">学生管理</h1>
        <div class="flex gap-2">
          <Button variant="secondary" size="md" @click="openBatchImportModal">
            <template #icon>
              <ArrowUpTrayIcon class="h-5 w-5" />
            </template>
            批量导入
          </Button>
          <Button variant="primary" size="md" @click="openCreateModal">
            <template #icon>
              <PlusIcon class="h-5 w-5" />
            </template>
            创建学生
          </Button>
        </div>
      </div>

      <!-- 搜索和筛选区域 -->
      <div class="bg-white rounded-lg shadow p-6 space-y-4">
        <!-- 搜索栏 -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            v-model="filters.name"
            placeholder="搜索学生姓名"
            @keyup.enter="handleSearch"
          >
            <template #icon>
              <MagnifyingGlassIcon class="h-5 w-5 text-gray-400" />
            </template>
          </Input>

          <Input
            v-model="filters.studentIdNational"
            placeholder="搜索全国学籍号"
            @keyup.enter="handleSearch"
          />

          <Input
            v-model="filters.studentIdSchool"
            placeholder="搜索学校学号"
            @keyup.enter="handleSearch"
          />

          <div class="flex gap-2">
            <Button variant="primary" size="md" class="flex-1" @click="handleSearch">
              <template #icon>
                <MagnifyingGlassIcon class="h-5 w-5" />
              </template>
              搜索
            </Button>
            <Button variant="secondary" size="md" @click="() => showFilters = !showFilters">
              <template #icon>
                <FunnelIcon class="h-5 w-5" />
              </template>
              筛选
            </Button>
          </div>
        </div>

        <!-- 筛选器（可折叠） -->
        <div v-if="showFilters" class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
          <Select
            v-model="filters.gender"
            :options="[{ label: '全部性别', value: '' }, ...genderOptions]"
            label="性别"
          />

          <Select
            :model-value="filters.classId"
            :options="[{ label: '全部班级', value: '' }, ...classOptions]"
            label="班级"
            @update:model-value="handleClassFilterChange"
          />

          <div class="flex items-end">
            <Button variant="secondary" size="md" class="w-full" @click="handleReset">
              重置筛选
            </Button>
          </div>
        </div>
      </div>

      <!-- 学生列表 -->
      <div class="bg-white rounded-lg shadow">
        <Table :columns="columns" :data="studentsStore.items" :loading="studentsStore.loading">
          <!-- 性别列 -->
          <template #cell-gender="{ row }">
            <span :class="[
              'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
              row.gender === Gender.MALE ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
            ]">
              {{ getGenderText(row.gender) }}
            </span>
          </template>

          <!-- 出生日期列 -->
          <template #cell-birthDate="{ row }">
            {{ formatDate(row.birthDate) }}
          </template>

          <!-- 当前班级列 -->
          <template #cell-currentClass="{ row }">
            <span v-if="row.currentClass">
              {{ row.currentClass.cohort }} {{ row.currentClass.className }}
            </span>
            <span v-else class="text-gray-500">未分配</span>
          </template>

          <!-- 操作列 -->
          <template #cell-actions="{ row }">
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="text-blue-600 hover:text-blue-800 transition-colors"
                title="编辑"
                @click="openEditModal(row)"
              >
                <PencilIcon class="h-5 w-5" />
              </button>

              <button
                type="button"
                class="text-green-600 hover:text-green-800 transition-colors"
                title="转班"
                @click="openTransferModal(row)"
              >
                <ArrowsRightLeftIcon class="h-5 w-5" />
              </button>

              <button
                type="button"
                class="text-red-600 hover:text-red-800 transition-colors"
                title="删除"
                @click="openDeleteModal(row)"
              >
                <TrashIcon class="h-5 w-5" />
              </button>
            </div>
          </template>
        </Table>

        <!-- 分页 -->
        <Pagination
          :current-page="pagination.page"
          :total-pages="totalPages"
          :total-items="studentsStore.total"
          :page-size="pagination.pageSize"
          @page-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </div>

    <!-- 创建学生对话框 -->
    <Modal v-model="showCreateModal" title="创建学生" size="lg">
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <Input
            v-model="formData.studentIdNational"
            label="全国学籍号"
            placeholder="请输入全国学籍号"
            :error="formErrors.studentIdNational"
          />

          <Input
            v-model="formData.studentIdSchool"
            label="学校学号"
            placeholder="请输入学校学号"
            :error="formErrors.studentIdSchool"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <Input
            v-model="formData.name"
            label="姓名"
            placeholder="请输入姓名"
            :error="formErrors.name"
          />

          <Select
            v-model="formData.gender"
            :options="genderOptions"
            label="性别"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <Input
            v-model="formData.birthDate"
            type="text"
            label="出生日期"
            placeholder="YYYY-MM-DD"
          />

          <Input
            v-model="formData.idCardNumber"
            label="身份证号"
            placeholder="请输入身份证号（可选）"
          />
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <Button variant="secondary" @click="showCreateModal = false">
            取消
          </Button>
          <Button variant="primary" :loading="studentsStore.loading" @click="handleCreate">
            创建
          </Button>
        </div>
      </template>
    </Modal>

    <!-- 编辑学生对话框 -->
    <Modal v-model="showEditModal" title="编辑学生" size="lg">
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <Input
            v-model="formData.studentIdNational"
            label="全国学籍号"
            placeholder="请输入全国学籍号"
            :error="formErrors.studentIdNational"
          />

          <Input
            v-model="formData.studentIdSchool"
            label="学校学号"
            placeholder="请输入学校学号"
            :error="formErrors.studentIdSchool"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <Input
            v-model="formData.name"
            label="姓名"
            placeholder="请输入姓名"
            :error="formErrors.name"
          />

          <Select
            v-model="formData.gender"
            :options="genderOptions"
            label="性别"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <Input
            v-model="formData.birthDate"
            type="text"
            label="出生日期"
            placeholder="YYYY-MM-DD"
          />

          <Input
            v-model="formData.idCardNumber"
            label="身份证号"
            placeholder="请输入身份证号（可选）"
          />
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <Button variant="secondary" @click="showEditModal = false">
            取消
          </Button>
          <Button variant="primary" :loading="studentsStore.loading" @click="handleUpdate">
            保存
          </Button>
        </div>
      </template>
    </Modal>

    <!-- 删除确认对话框 -->
    <Modal v-model="showDeleteModal" title="删除学生" size="sm">
      <p class="text-gray-600">
        确定要删除学生 <span class="font-semibold text-gray-900">{{ currentStudent?.name }}</span> 吗？
        此操作不可恢复。
      </p>

      <template #footer>
        <div class="flex justify-end gap-3">
          <Button variant="secondary" @click="showDeleteModal = false">
            取消
          </Button>
          <Button variant="danger" :loading="studentsStore.loading" @click="handleDelete">
            删除
          </Button>
        </div>
      </template>
    </Modal>

    <!-- 转班对话框 -->
    <Modal v-model="showTransferModal" title="学生转班" size="md">
      <div class="space-y-4">
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p class="text-sm text-blue-800">
            学生：<span class="font-semibold">{{ currentStudent?.name }}</span>
          </p>
          <p class="text-sm text-blue-800 mt-1">
            学号：{{ currentStudent?.studentIdSchool }}
          </p>
        </div>

        <!-- 当前班级（只读显示） -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">当前班级</label>
          <div class="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700">
            {{ transferFormData.currentClassName }}
          </div>
        </div>

        <!-- 目标班级（用户选择） -->
        <Select
          :model-value="transferFormData.toClassId"
          :options="classOptions"
          label="目标班级 *"
          placeholder="请选择目标班级"
          @update:model-value="handleTransferToClassChange"
        />

        <!-- 学年（简化格式） -->
        <Input
          v-model="transferFormData.academicYear"
          type="number"
          label="学年 *"
          placeholder="例如：2024"
        />
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <Button variant="secondary" @click="showTransferModal = false">
            取消
          </Button>
          <Button variant="primary" :loading="studentsStore.loading" @click="handleTransfer">
            确认转班
          </Button>
        </div>
      </template>
    </Modal>

    <!-- 批量导入对话框 -->
    <Modal v-model="showBatchImportModal" title="批量导入学生" size="lg" @close="closeBatchImportModal">
      <div class="space-y-4">
        <!-- 导入中状态 -->
        <div v-if="isUploading" class="flex flex-col items-center justify-center py-12">
          <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
          <p class="mt-4 text-lg font-medium text-gray-900">正在导入数据...</p>
          <p class="mt-2 text-sm text-gray-500">请稍候，正在处理您的文件</p>
        </div>

        <!-- 导入结果 -->
        <div v-else-if="importResults" class="space-y-4">
          <!-- 总体状态提示 -->
          <div
            :class="[
              'rounded-lg p-4 border-l-4',
              importResults.failed === 0 && importResults.warnings === 0
                ? 'bg-green-50 border-green-500'
                : importResults.failed > 0
                ? 'bg-red-50 border-red-500'
                : 'bg-yellow-50 border-yellow-500'
            ]"
          >
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <svg
                  v-if="importResults.failed === 0 && importResults.warnings === 0"
                  class="h-5 w-5 text-green-500 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <svg
                  v-else-if="importResults.failed > 0"
                  class="h-5 w-5 text-red-500 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <svg
                  v-else
                  class="h-5 w-5 text-yellow-500 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h3
                  :class="[
                    'text-sm font-semibold',
                    importResults.failed === 0 && importResults.warnings === 0
                      ? 'text-green-800'
                      : importResults.failed > 0
                      ? 'text-red-800'
                      : 'text-yellow-800'
                  ]"
                >
                  <template v-if="importResults.failed === 0 && importResults.warnings === 0">
                    导入完成，所有数据成功导入！
                  </template>
                  <template v-else-if="importResults.failed > 0 && importResults.success > 0">
                    导入完成，但有 {{ importResults.failed }} 条数据导入失败
                  </template>
                  <template v-else-if="importResults.failed > 0">
                    导入失败，共 {{ importResults.failed }} 条数据存在问题
                  </template>
                  <template v-else>
                    导入完成，有 {{ importResults.warnings }} 条数据存在警告
                  </template>
                </h3>
              </div>
              <div
                :class="[
                  'text-sm',
                  importResults.failed === 0 && importResults.warnings === 0
                    ? 'text-green-700'
                    : importResults.failed > 0
                    ? 'text-red-700'
                    : 'text-yellow-700'
                ]"
              >
                共处理 {{ importResults.success + importResults.failed }} 条数据，成功 {{ importResults.success }} 条<template v-if="importResults.failed > 0">，失败 {{ importResults.failed }} 条</template><template v-if="importResults.warnings > 0">，警告 {{ importResults.warnings }} 条</template>
              </div>
            </div>
          </div>

          <!-- 统计卡片 -->
          <div class="grid grid-cols-3 gap-4">
            <div class="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <div class="text-3xl font-bold text-green-600">{{ importResults.success }}</div>
              <div class="text-sm text-green-700 mt-1">成功导入</div>
            </div>
            <div class="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <div class="text-3xl font-bold text-red-600">{{ importResults.failed }}</div>
              <div class="text-sm text-red-700 mt-1">导入失败</div>
            </div>
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
              <div class="text-3xl font-bold text-yellow-600">{{ importResults.warnings || 0 }}</div>
              <div class="text-sm text-yellow-700 mt-1">数据警告</div>
            </div>
          </div>

          <!-- 错误列表 -->
          <div v-if="importResults.errors && importResults.errors.length > 0" class="space-y-2">
            <div class="flex items-center justify-between">
              <h4 class="text-sm font-semibold text-gray-900">
                问题详情 (共 {{ importResults.errors.length }} 条)
              </h4>
              <span class="text-xs text-gray-500">
                显示前 {{ Math.min(importResults.errors.length, 50) }} 条
              </span>
            </div>
            <div class="max-h-64 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-3 bg-gray-50">
              <div
                v-for="(error, index) in importResults.errors.slice(0, 50)"
                :key="index"
                :class="[
                  'p-3 rounded-md text-sm',
                  error.type === 'warning'
                    ? 'bg-yellow-50 border-l-4 border-l-yellow-400'
                    : 'bg-red-50 border-l-4 border-l-red-400'
                ]"
              >
                <div class="space-y-1">
                  <div class="flex items-start gap-2">
                    <span
                      :class="[
                        'inline-block px-2 py-0.5 rounded text-xs font-medium flex-shrink-0',
                        error.type === 'warning' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                      ]"
                    >
                      {{ error.type === 'warning' ? '警告' : '错误' }}
                    </span>
                    <div :class="[error.type === 'warning' ? 'text-yellow-900' : 'text-red-900']">
                      <strong>第 {{ error.row }} 行：</strong>{{ error.error }}
                    </div>
                  </div>
                  <div v-if="error.data" class="text-xs text-gray-600 font-mono pl-14">
                    {{ error.data['姓名'] || '' }} | {{ error.data['学籍号'] || '' }} | {{ error.data['班级名称'] || '' }}
                  </div>
                </div>
              </div>
              <div v-if="importResults.errors.length > 50" class="text-center py-2 text-sm text-gray-500">
                还有 {{ importResults.errors.length - 50 }} 条问题未显示
              </div>
            </div>
          </div>
        </div>

        <!-- 上传区域（未导入时显示） -->
        <template v-else>
          <!-- 说明信息 -->
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 class="text-sm font-semibold text-blue-900 mb-2">Excel 格式要求：</h3>
            <ul class="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li><strong>班级名称</strong>：格式为"高中2024级1班"（必填）</li>
              <li><strong>学籍号</strong>：全国学籍号，支持英文字符（必填）</li>
              <li><strong>民族代码</strong>：数字代码（可选）</li>
              <li><strong>姓名</strong>：学生姓名（必填）</li>
              <li><strong>性别</strong>：1=男，2=女（必填）</li>
              <li><strong>出生日期</strong>：格式为 2009/08/08（可选）</li>
              <li><strong>身份证号</strong>：支持数字和字符串（可选）</li>
            </ul>
          </div>

          <!-- 学年输入 -->
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div class="flex items-start gap-3">
              <svg class="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div class="flex-1">
                <label class="block text-sm font-medium text-blue-900 mb-2">
                  导入数据所属学年<span class="text-red-500">*</span>
                </label>
                <input
                  v-model="importAcademicYear"
                  type="text"
                  placeholder="例如：2024"
                  class="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p class="mt-2 text-xs text-blue-700">
                  请输入导入数据所属的学年。例如：2024 表示学生在 2024 学年所在的班级
                </p>
                <p class="mt-1 text-xs text-blue-600">
                  <strong>说明：</strong>班级名称"高中2023级1班"中的"2023"是入学年份（级别），学年是学生在该班级学习的年份
                </p>
              </div>
            </div>
          </div>

          <!-- 文件上传区域 -->
          <div
            :class="[
              'border-2 border-dashed rounded-lg p-12 text-center transition-all cursor-pointer',
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
            ]"
            @dragenter="handleDragEnter"
            @dragleave="handleDragLeave"
            @dragover="handleDragOver"
            @drop="handleDrop"
            @click="() => $refs.fileInput && ($refs.fileInput as HTMLInputElement).click()"
          >
            <ArrowUpTrayIcon :class="[
              'mx-auto h-16 w-16 transition-colors',
              isDragging ? 'text-blue-500' : 'text-gray-400'
            ]" />
            <div class="mt-6">
              <p :class="[
                'text-lg font-semibold transition-colors',
                isDragging ? 'text-blue-600' : 'text-gray-900'
              ]">
                {{ isDragging ? '松开鼠标上传文件' : '点击选择或拖拽 Excel 文件到此处' }}
              </p>
              <p class="mt-2 text-sm text-gray-500">
                支持 .xlsx 和 .xls 格式，文件大小不超过 5MB
              </p>
            </div>
            <input
              ref="fileInput"
              type="file"
              class="hidden"
              accept=".xlsx,.xls"
              @change="handleFileSelect"
              @click.stop
            />
            <div v-if="selectedFile" class="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
              <svg class="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span class="text-sm font-medium text-green-800">{{ selectedFile.name }}</span>
              <span class="text-xs text-green-600">({{ (selectedFile.size / 1024).toFixed(1) }} KB)</span>
            </div>
          </div>
        </template>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <Button variant="secondary" @click="closeBatchImportModal">
            关闭
          </Button>
          <Button
            v-if="!importResults"
            variant="primary"
            :loading="isUploading"
            :disabled="!selectedFile || isUploading"
            @click="handleBatchImport"
          >
            {{ isUploading ? '导入中...' : '开始导入' }}
          </Button>
          <Button
            v-else
            variant="primary"
            @click="importResults = null"
          >
            重新导入
          </Button>
        </div>
      </template>
    </Modal>
  </div>
</template>
