<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useClassesStore } from '@/stores/classes'
import { useToast } from '@/composables/useToast'
import type { Class, ClassQueryParams } from '@/types'
import Table, { type TableColumn } from '@/components/common/Table.vue'
import Pagination from '@/components/common/Pagination.vue'
import Button from '@/components/common/Button.vue'
import Input from '@/components/common/Input.vue'
import Select, { type SelectOption } from '@/components/common/Select.vue'
import Badge from '@/components/common/Badge.vue'
import Modal from '@/components/common/Modal.vue'
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  KeyIcon,
  TrashIcon,
  EyeIcon
} from '@heroicons/vue/24/outline'

// Router, Store & Toast
const router = useRouter()
const classesStore = useClassesStore()
const toast = useToast()

// 分页状态
const currentPage = ref(1)
const pageSize = ref(20)

// 搜索和筛选
const searchQuery = reactive({
  className: '',
  classAccount: '',
  cohort: '',
  gradeLevel: undefined as number | undefined,
  graduated: '' as string
})

// 弹窗状态
const showFormModal = ref(false)
const showPasswordModal = ref(false)
const showDeleteModal = ref(false)
const isEditing = ref(false)

// 当前操作的班级
const currentClass = ref<Class | null>(null)
const newPassword = ref('')

// 表单数据
const formData = reactive({
  cohort: '',
  className: '',
  classAccount: '',
  password: ''
})

// 表单验证错误
const formErrors = reactive({
  cohort: '',
  className: '',
  classAccount: '',
  password: ''
})

// 表格列定义
const columns: TableColumn[] = [
  { key: 'cohort', label: '入学年份', width: '120px' },
  { key: 'className', label: '班级名称', width: '120px' },
  { key: 'classAccount', label: '班级账号', width: '150px' },
  { key: 'currentGrade', label: '当前年级', width: '120px' },
  { key: 'graduated', label: '毕业状态', width: '100px' },
  { key: 'studentCount', label: '学生人数', width: '100px' },
  { key: 'actions', label: '操作', width: '280px' }
]

// 年级选项（1-9年级）
const gradeOptions = computed((): SelectOption[] => {
  const options: SelectOption[] = [{ label: '全部年级', value: '' }]
  for (let i = 1; i <= 9; i++) {
    options.push({ label: `${i}年级`, value: i })
  }
  return options
})

// 毕业状态选项
const graduatedOptions: SelectOption[] = [
  { label: '全部状态', value: '' },
  { label: '未毕业', value: 'false' },
  { label: '已毕业', value: 'true' }
]

// 入学年份选项（动态生成近10年）
const cohortOptions = computed((): SelectOption[] => {
  const currentYear = new Date().getFullYear()
  const options: SelectOption[] = [{ label: '全部年份', value: '' }]
  for (let i = 0; i < 10; i++) {
    const year = currentYear - i
    options.push({ label: `${year}`, value: `${year}` })
  }
  return options
})

// 计算总页数
const totalPages = computed(() => {
  return Math.ceil(classesStore.total / pageSize.value) || 1
})

// 构建查询参数
const buildQueryParams = (): ClassQueryParams => {
  const params: ClassQueryParams = {
    page: currentPage.value,
    pageSize: pageSize.value,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  }

  if (searchQuery.className) {
    params.className = searchQuery.className
  }
  if (searchQuery.classAccount) {
    params.classAccount = searchQuery.classAccount
  }
  if (searchQuery.cohort) {
    params.cohort = searchQuery.cohort
  }
  if (searchQuery.gradeLevel) {
    params.gradeLevel = searchQuery.gradeLevel
  }
  if (searchQuery.graduated && searchQuery.graduated !== '') {
    params.graduated = searchQuery.graduated === 'true'
  }

  return params
}

// 加载班级列表
const loadClasses = async () => {
  try {
    await classesStore.fetchList(buildQueryParams())
  } catch (error: any) {
    toast.error(error.message || '加载班级列表失败')
  }
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  loadClasses()
}

// 重置搜索
const resetSearch = () => {
  searchQuery.className = ''
  searchQuery.classAccount = ''
  searchQuery.cohort = ''
  searchQuery.gradeLevel = undefined
  searchQuery.graduated = ''
  currentPage.value = 1
  loadClasses()
}

// 分页改变
const handlePageChange = (page: number) => {
  currentPage.value = page
  loadClasses()
}

const handlePageSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  loadClasses()
}

// 验证表单
const validateForm = (): boolean => {
  let isValid = true

  // 重置错误
  formErrors.cohort = ''
  formErrors.className = ''
  formErrors.classAccount = ''
  formErrors.password = ''

  // 验证入学年份
  if (!formData.cohort) {
    formErrors.cohort = '请输入入学年份'
    isValid = false
  } else if (!/^\d{4}$/.test(formData.cohort)) {
    formErrors.cohort = '格式应为"2024"（纯数字年份）'
    isValid = false
  }

  // 验证班级名称
  if (!formData.className) {
    formErrors.className = '请输入班级名称'
    isValid = false
  }

  // 验证班级账号
  if (!formData.classAccount) {
    formErrors.classAccount = '请输入班级账号'
    isValid = false
  }

  // 创建时验证密码
  if (!isEditing.value && !formData.password) {
    formErrors.password = '请输入班级密码'
    isValid = false
  }

  return isValid
}

// 打开创建弹窗
const openCreateModal = () => {
  isEditing.value = false
  formData.cohort = ''
  formData.className = ''
  formData.classAccount = ''
  formData.password = ''
  formErrors.cohort = ''
  formErrors.className = ''
  formErrors.classAccount = ''
  formErrors.password = ''
  showFormModal.value = true
}

// 打开编辑弹窗
const openEditModal = (classItem: Class) => {
  isEditing.value = true
  currentClass.value = classItem
  formData.cohort = classItem.cohort
  formData.className = classItem.className
  formData.classAccount = classItem.classAccount
  formData.password = ''
  formErrors.cohort = ''
  formErrors.className = ''
  formErrors.classAccount = ''
  formErrors.password = ''
  showFormModal.value = true
}

// 提交表单
const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }

  try {
    if (isEditing.value && currentClass.value) {
      // 编辑（毕业状态自动计算，无需提交）
      await classesStore.update(currentClass.value.id, {
        cohort: formData.cohort,
        className: formData.className,
        classAccount: formData.classAccount
      })
      toast.success('班级信息更新成功')
    } else {
      // 创建（毕业状态自动计算，无需提交）
      await classesStore.create({
        cohort: formData.cohort,
        className: formData.className,
        classAccount: formData.classAccount
      })
      toast.success('班级创建成功')
    }
    showFormModal.value = false
    loadClasses()
  } catch (error: any) {
    toast.error(error.message || `${isEditing.value ? '更新' : '创建'}班级失败`)
  }
}

// 打开重置密码弹窗
const openResetPasswordModal = (classItem: Class) => {
  currentClass.value = classItem
  newPassword.value = ''
  showPasswordModal.value = true
}

// 重置密码
const handleResetPassword = async () => {
  if (!currentClass.value) return

  try {
    const result = await classesStore.resetPassword(currentClass.value.id)
    newPassword.value = result.password
    toast.success('密码重置成功')
  } catch (error: any) {
    toast.error(error.message || '重置密码失败')
    showPasswordModal.value = false
  }
}

// 复制密码到剪贴板
const copyPassword = async () => {
  try {
    await window.navigator.clipboard.writeText(newPassword.value)
    toast.success('密码已复制到剪贴板')
  } catch (error) {
    toast.error('复制失败')
  }
}

// 打开删除确认弹窗
const openDeleteModal = (classItem: Class) => {
  currentClass.value = classItem
  showDeleteModal.value = true
}

// 删除班级
const handleDelete = async () => {
  if (!currentClass.value) return

  try {
    await classesStore.remove(currentClass.value.id)
    toast.success('班级删除成功')
    showDeleteModal.value = false
    loadClasses()
  } catch (error: any) {
    toast.error(error.message || '删除班级失败')
  }
}

// 查看班级详情（跳转到详情页面）
const viewClassDetails = (classItem: Class) => {
  router.push({ name: 'ClassDetail', params: { id: classItem.id } })
}

// 生成班级账号建议
const generateClassAccount = () => {
  if (formData.cohort && formData.className) {
    const classNum = formData.className.replace(/[^\d]/g, '') || '1'
    formData.classAccount = `class_${formData.cohort}_${classNum}`
  }
}

// 初始化
onMounted(() => {
  loadClasses()
})
</script>

<template>
  <div class="space-y-6">
    <!-- 页面标题 -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">班级管理</h1>
        <p class="mt-1 text-sm text-gray-500">管理所有班级信息</p>
      </div>
      <Button variant="primary" @click="openCreateModal">
        <template #icon>
          <PlusIcon class="h-5 w-5" />
        </template>
        创建班级
      </Button>
    </div>

    <!-- 搜索和筛选 -->
    <div class="bg-white rounded-lg shadow p-6">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <!-- 班级名称搜索 -->
        <Input
          v-model="searchQuery.className"
          placeholder="搜索班级名称"
          @keyup.enter="handleSearch"
        >
          <template #icon>
            <MagnifyingGlassIcon class="h-5 w-5 text-gray-400" />
          </template>
        </Input>

        <!-- 入学年份筛选 -->
        <Select
          v-model="searchQuery.cohort"
          :options="cohortOptions"
          placeholder="选择入学年份"
        />

        <!-- 年级筛选 -->
        <Select
          v-model="searchQuery.gradeLevel"
          :options="gradeOptions"
          placeholder="选择年级"
        />

        <!-- 毕业状态筛选 -->
        <Select
          v-model="searchQuery.graduated"
          :options="graduatedOptions"
          placeholder="选择毕业状态"
        />

        <!-- 操作按钮 -->
        <div class="flex gap-2">
          <Button variant="primary" class="flex-1" @click="handleSearch">
            搜索
          </Button>
          <Button variant="secondary" class="flex-1" @click="resetSearch">
            重置
          </Button>
        </div>
      </div>
    </div>

    <!-- 班级列表 -->
    <div class="bg-white rounded-lg shadow">
      <Table :columns="columns" :data="classesStore.items" :loading="classesStore.loading">
        <!-- 入学年份 -->
        <template #cell-cohort="{ value }">
          <span class="font-medium text-gray-900">{{ value }}</span>
        </template>

        <!-- 班级名称 -->
        <template #cell-className="{ value }">
          <span class="text-gray-900">{{ value }}</span>
        </template>

        <!-- 班级账号 -->
        <template #cell-classAccount="{ value }">
          <span class="text-gray-600 font-mono text-sm">{{ value }}</span>
        </template>

        <!-- 当前年级 -->
        <template #cell-currentGrade="{ row }">
          <span v-if="row.graduated" class="text-gray-400">-</span>
          <span v-else-if="row.currentGradeName" class="text-gray-900">
            {{ row.currentGradeName }}
          </span>
          <span v-else class="text-gray-400">-</span>
        </template>

        <!-- 毕业状态 -->
        <template #cell-graduated="{ row }">
          <Badge v-if="row.graduated" variant="success">已毕业</Badge>
          <Badge v-else variant="info">在读</Badge>
        </template>

        <!-- 学生人数 -->
        <template #cell-studentCount="{ row }">
          <span class="text-gray-900">{{ row.studentCount || 0 }}</span>
        </template>

        <!-- 操作 -->
        <template #cell-actions="{ row }">
          <div class="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              @click="viewClassDetails(row)"
            >
              <template #icon>
                <EyeIcon class="h-4 w-4" />
              </template>
              查看
            </Button>
            <Button
              variant="ghost"
              size="sm"
              @click="openEditModal(row)"
            >
              <template #icon>
                <PencilIcon class="h-4 w-4" />
              </template>
              编辑
            </Button>
            <Button
              variant="ghost"
              size="sm"
              @click="openResetPasswordModal(row)"
            >
              <template #icon>
                <KeyIcon class="h-4 w-4" />
              </template>
              重置密码
            </Button>
            <Button
              variant="danger"
              size="sm"
              @click="openDeleteModal(row)"
            >
              <template #icon>
                <TrashIcon class="h-4 w-4" />
              </template>
              删除
            </Button>
          </div>
        </template>
      </Table>

      <!-- 分页 -->
      <Pagination
        :current-page="currentPage"
        :total-pages="totalPages"
        :total-items="classesStore.total"
        :page-size="pageSize"
        @page-change="handlePageChange"
        @size-change="handlePageSizeChange"
      />
    </div>

    <!-- 创建/编辑班级弹窗 -->
    <Modal
      v-model="showFormModal"
      :title="isEditing ? '编辑班级' : '创建班级'"
      size="md"
    >
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- 入学年份 -->
        <div>
          <Input
            v-model="formData.cohort"
            label="入学年份"
            placeholder="例如：2024"
            :error="formErrors.cohort"
            @blur="generateClassAccount"
          />
          <p class="mt-1 text-xs text-gray-500">格式：YYYY，如"2024"</p>
        </div>

        <!-- 班级名称 -->
        <div>
          <Input
            v-model="formData.className"
            label="班级名称"
            placeholder="例如：一班"
            :error="formErrors.className"
            @blur="generateClassAccount"
          />
        </div>

        <!-- 班级账号 -->
        <div>
          <Input
            v-model="formData.classAccount"
            label="班级账号"
            placeholder="例如：class_2024_1"
            :error="formErrors.classAccount"
          />
          <p class="mt-1 text-xs text-gray-500">
            建议格式：class_年份_班级序号
          </p>
        </div>

        <!-- 班级密码（仅创建时） -->
        <div v-if="!isEditing">
          <Input
            v-model="formData.password"
            type="password"
            label="班级密码"
            placeholder="请输入密码"
            :error="formErrors.password"
          />
        </div>

        <!-- 说明：毕业状态将根据入学年份自动计算 -->
        <div class="text-sm text-gray-500">
          <p>💡 提示：毕业状态和毕业年份将根据入学年份自动计算</p>
        </div>
      </form>

      <template #footer>
        <div class="flex justify-end gap-3">
          <Button variant="secondary" @click="showFormModal = false">
            取消
          </Button>
          <Button
            variant="primary"
            :loading="classesStore.loading"
            @click="handleSubmit"
          >
            {{ isEditing ? '保存' : '创建' }}
          </Button>
        </div>
      </template>
    </Modal>

    <!-- 重置密码弹窗 -->
    <Modal
      v-model="showPasswordModal"
      title="重置班级密码"
      size="sm"
    >
      <div class="space-y-4">
        <p class="text-sm text-gray-600">
          确定要重置班级
          <span class="font-medium text-gray-900">
            {{ currentClass?.cohort }} {{ currentClass?.className }}
          </span>
          的密码吗？
        </p>

        <div v-if="newPassword" class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p class="text-sm text-blue-800 mb-2">新密码已生成：</p>
          <div class="flex items-center gap-2">
            <code class="flex-1 bg-white px-3 py-2 rounded border border-blue-300 text-blue-900 font-mono text-sm">
              {{ newPassword }}
            </code>
            <Button
              variant="secondary"
              size="sm"
              @click="copyPassword"
            >
              复制
            </Button>
          </div>
          <p class="text-xs text-blue-600 mt-2">请妥善保存此密码，关闭后将无法再次查看</p>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <Button variant="secondary" @click="showPasswordModal = false">
            {{ newPassword ? '关闭' : '取消' }}
          </Button>
          <Button
            v-if="!newPassword"
            variant="primary"
            :loading="classesStore.loading"
            @click="handleResetPassword"
          >
            确认重置
          </Button>
        </div>
      </template>
    </Modal>

    <!-- 删除确认弹窗 -->
    <Modal
      v-model="showDeleteModal"
      title="删除班级"
      size="sm"
    >
      <div class="space-y-4">
        <p class="text-sm text-gray-600">
          确定要删除班级
          <span class="font-medium text-gray-900">
            {{ currentClass?.cohort }} {{ currentClass?.className }}
          </span>
          吗？
        </p>
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
          <p class="text-sm text-red-800">
            警告：删除班级将同时删除该班级的所有学生关联信息，此操作不可恢复！
          </p>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <Button variant="secondary" @click="showDeleteModal = false">
            取消
          </Button>
          <Button
            variant="danger"
            :loading="classesStore.loading"
            @click="handleDelete"
          >
            确认删除
          </Button>
        </div>
      </template>
    </Modal>
  </div>
</template>
