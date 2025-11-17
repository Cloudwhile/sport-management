<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useUsersStore } from '@/stores/users'
import { useToast } from '@/composables/useToast'
import type { User, UserQueryParams, CreateUserRequest, UpdateUserRequest } from '@/types'
import { UserRole } from '@/types'
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

// Store & Toast
const usersStore = useUsersStore()
const toast = useToast()

// 分页状态
const currentPage = ref(1)
const pageSize = ref(20)

// 搜索和筛选
const searchQuery = reactive({
  username: '',
  realName: '',
  role: '' as UserRole | ''
})

// 弹窗状态
const showFormModal = ref(false)
const showPasswordModal = ref(false)
const showDeleteModal = ref(false)
const showDetailModal = ref(false)
const isEditing = ref(false)

// 当前操作的用户
const currentUser = ref<User | null>(null)
const newPassword = ref('')

// 表单数据
const formData = reactive({
  username: '',
  password: '',
  role: '' as UserRole | '',
  realName: ''
})

// 修改密码表单
const passwordFormData = reactive({
  password: '',
  confirmPassword: ''
})

// 表单验证错误
const formErrors = reactive({
  username: '',
  password: '',
  role: '',
  realName: ''
})

const passwordErrors = reactive({
  password: '',
  confirmPassword: ''
})

// 表格列定义
const columns: TableColumn[] = [
  { key: 'id', label: 'ID', width: '80px' },
  { key: 'username', label: '用户名', width: '150px' },
  { key: 'realName', label: '真实姓名', width: '150px' },
  { key: 'role', label: '角色', width: '120px' },
  { key: 'createdAt', label: '创建时间', width: '180px' },
  { key: 'actions', label: '操作', width: '320px' }
]

// 角色选项
const roleOptions: SelectOption[] = [
  { label: '全部角色', value: '' },
  { label: '管理员', value: UserRole.ADMIN },
  { label: '教师', value: UserRole.TEACHER },
  { label: '班级账户', value: UserRole.CLASS }
]

// 角色创建选项（不含"全部"）
const roleCreateOptions: SelectOption[] = [
  { label: '管理员', value: UserRole.ADMIN },
  { label: '教师', value: UserRole.TEACHER },
  { label: '班级账户', value: UserRole.CLASS }
]

// 计算总页数
const totalPages = computed(() => {
  return Math.ceil(usersStore.total / pageSize.value) || 1
})

// 角色徽章样式
const getRoleBadgeVariant = (role: UserRole) => {
  if (role === UserRole.ADMIN) return 'danger'
  if (role === UserRole.CLASS) return 'warning'
  return 'info'
}

// 角色显示文本
const getRoleText = (role: UserRole) => {
  if (role === UserRole.ADMIN) return '管理员'
  if (role === UserRole.CLASS) return '班级账户'
  return '教师'
}

// 格式化时间
const formatDate = (dateString?: string) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 构建查询参数
const buildQueryParams = (): UserQueryParams => {
  const params: UserQueryParams = {
    page: currentPage.value,
    pageSize: pageSize.value,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  }

  if (searchQuery.username) {
    params.username = searchQuery.username
  }
  if (searchQuery.realName) {
    params.realName = searchQuery.realName
  }
  if (searchQuery.role) {
    params.role = searchQuery.role as UserRole
  }

  return params
}

// 加载用户列表
const loadUsers = async () => {
  try {
    await usersStore.fetchList(buildQueryParams())
  } catch (error: any) {
    toast.error(error.message || '加载用户列表失败')
  }
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  loadUsers()
}

// 重置搜索
const resetSearch = () => {
  searchQuery.username = ''
  searchQuery.realName = ''
  searchQuery.role = ''
  currentPage.value = 1
  loadUsers()
}

// 分页改变
const handlePageChange = (page: number) => {
  currentPage.value = page
  loadUsers()
}

const handlePageSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  loadUsers()
}

// 验证表单
const validateForm = (): boolean => {
  let isValid = true

  // 重置错误
  formErrors.username = ''
  formErrors.password = ''
  formErrors.role = ''
  formErrors.realName = ''

  // 验证用户名
  if (!formData.username) {
    formErrors.username = '请输入用户名'
    isValid = false
  } else if (formData.username.length < 3) {
    formErrors.username = '用户名至少需要3个字符'
    isValid = false
  }

  // 验证密码（仅创建时）
  if (!isEditing.value && !formData.password) {
    formErrors.password = '请输入密码'
    isValid = false
  } else if (!isEditing.value && formData.password.length < 6) {
    formErrors.password = '密码至少需要6个字符'
    isValid = false
  }

  // 验证角色
  if (!formData.role) {
    formErrors.role = '请选择角色'
    isValid = false
  }

  return isValid
}

// 验证密码表单
const validatePasswordForm = (): boolean => {
  let isValid = true

  passwordErrors.password = ''
  passwordErrors.confirmPassword = ''

  if (!passwordFormData.password) {
    passwordErrors.password = '请输入新密码'
    isValid = false
  } else if (passwordFormData.password.length < 6) {
    passwordErrors.password = '密码至少需要6个字符'
    isValid = false
  }

  if (!passwordFormData.confirmPassword) {
    passwordErrors.confirmPassword = '请再次输入密码'
    isValid = false
  } else if (passwordFormData.password !== passwordFormData.confirmPassword) {
    passwordErrors.confirmPassword = '两次输入的密码不一致'
    isValid = false
  }

  return isValid
}

// 打开创建弹窗
const openCreateModal = () => {
  isEditing.value = false
  formData.username = ''
  formData.password = ''
  formData.role = ''
  formData.realName = ''
  formErrors.username = ''
  formErrors.password = ''
  formErrors.role = ''
  formErrors.realName = ''
  showFormModal.value = true
}

// 打开编辑弹窗
const openEditModal = (user: User) => {
  isEditing.value = true
  currentUser.value = user
  formData.username = user.username
  formData.password = ''
  formData.role = user.role
  formData.realName = user.realName || ''
  formErrors.username = ''
  formErrors.password = ''
  formErrors.role = ''
  formErrors.realName = ''
  showFormModal.value = true
}

// 提交表单
const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }

  try {
    if (isEditing.value && currentUser.value) {
      // 编辑
      const updateData: UpdateUserRequest = {
        username: formData.username,
        role: formData.role as UserRole,
        realName: formData.realName
      }
      await usersStore.update(currentUser.value.id, updateData)
      toast.success('用户信息更新成功')
    } else {
      // 创建
      const createData: CreateUserRequest = {
        username: formData.username,
        password: formData.password,
        role: formData.role as UserRole,
        realName: formData.realName
      }
      await usersStore.create(createData)
      toast.success('用户创建成功')
    }
    showFormModal.value = false
    loadUsers()
  } catch (error: any) {
    toast.error(error.message || `${isEditing.value ? '更新' : '创建'}用户失败`)
  }
}

// 打开修改密码弹窗
const openPasswordModal = (user: User) => {
  currentUser.value = user
  passwordFormData.password = ''
  passwordFormData.confirmPassword = ''
  passwordErrors.password = ''
  passwordErrors.confirmPassword = ''
  showPasswordModal.value = true
}

// 修改密码
const handleUpdatePassword = async () => {
  if (!validatePasswordForm() || !currentUser.value) {
    return
  }

  try {
    await usersStore.updatePassword(currentUser.value.id, passwordFormData.password)
    toast.success('密码修改成功')
    showPasswordModal.value = false
  } catch (error: any) {
    toast.error(error.message || '修改密码失败')
  }
}

// 打开删除确认弹窗
const openDeleteModal = (user: User) => {
  currentUser.value = user
  showDeleteModal.value = true
}

// 删除用户
const handleDelete = async () => {
  if (!currentUser.value) return

  try {
    await usersStore.remove(currentUser.value.id)
    toast.success('用户删除成功')
    showDeleteModal.value = false
    loadUsers()
  } catch (error: any) {
    toast.error(error.message || '删除用户失败')
  }
}

// 查看用户详情
const viewUserDetails = (user: User) => {
  currentUser.value = user
  showDetailModal.value = true
}

// 初始化
onMounted(() => {
  loadUsers()
})
</script>

<template>
  <div class="space-y-6">
    <!-- 页面标题 -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">用户管理</h1>
        <p class="mt-1 text-sm text-gray-500">管理系统用户和权限</p>
      </div>
      <Button variant="primary" @click="openCreateModal">
        <template #icon>
          <PlusIcon class="h-5 w-5" />
        </template>
        创建用户
      </Button>
    </div>

    <!-- 搜索和筛选 -->
    <div class="bg-white rounded-lg shadow p-6">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- 用户名搜索 -->
        <Input
          v-model="searchQuery.username"
          placeholder="搜索用户名"
          @keyup.enter="handleSearch"
        >
          <template #icon>
            <MagnifyingGlassIcon class="h-5 w-5 text-gray-400" />
          </template>
        </Input>

        <!-- 真实姓名搜索 -->
        <Input
          v-model="searchQuery.realName"
          placeholder="搜索真实姓名"
          @keyup.enter="handleSearch"
        />

        <!-- 角色筛选 -->
        <Select
          v-model="searchQuery.role"
          :options="roleOptions"
          placeholder="选择角色"
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

    <!-- 用户列表 -->
    <div class="bg-white rounded-lg shadow">
      <Table :columns="columns" :data="usersStore.items" :loading="usersStore.loading">
        <!-- ID -->
        <template #cell-id="{ value }">
          <span class="text-gray-600 font-mono text-sm">{{ value }}</span>
        </template>

        <!-- 用户名 -->
        <template #cell-username="{ value }">
          <span class="font-medium text-gray-900">{{ value }}</span>
        </template>

        <!-- 真实姓名 -->
        <template #cell-realName="{ value }">
          <span class="text-gray-900">{{ value || '-' }}</span>
        </template>

        <!-- 角色 -->
        <template #cell-role="{ value }">
          <Badge :variant="getRoleBadgeVariant(value)">
            {{ getRoleText(value) }}
          </Badge>
        </template>

        <!-- 创建时间 -->
        <template #cell-createdAt="{ value }">
          <span class="text-gray-600 text-sm">{{ formatDate(value) }}</span>
        </template>

        <!-- 操作 -->
        <template #cell-actions="{ row }">
          <div class="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              @click="viewUserDetails(row)"
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
              @click="openPasswordModal(row)"
            >
              <template #icon>
                <KeyIcon class="h-4 w-4" />
              </template>
              修改密码
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
        :total-items="usersStore.total"
        :page-size="pageSize"
        @page-change="handlePageChange"
        @size-change="handlePageSizeChange"
      />
    </div>

    <!-- 创建/编辑用户弹窗 -->
    <Modal
      v-model="showFormModal"
      :title="isEditing ? '编辑用户' : '创建用户'"
      size="md"
    >
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- 用户名 -->
        <Input
          v-model="formData.username"
          label="用户名"
          placeholder="请输入用户名（至少3个字符）"
          :error="formErrors.username"
          :disabled="isEditing"
        />

        <!-- 密码（仅创建时显示） -->
        <div v-if="!isEditing">
          <Input
            v-model="formData.password"
            type="password"
            label="密码"
            placeholder="请输入密码（至少6个字符）"
            :error="formErrors.password"
          />
        </div>

        <!-- 角色 -->
        <Select
          v-model="formData.role"
          :options="roleCreateOptions"
          label="角色"
          placeholder="请选择角色"
        />
        <p v-if="formErrors.role" class="mt-1 text-sm text-red-600">
          {{ formErrors.role }}
        </p>

        <!-- 真实姓名 -->
        <Input
          v-model="formData.realName"
          label="真实姓名（可选）"
          placeholder="请输入真实姓名"
          :error="formErrors.realName"
        />
      </form>

      <template #footer>
        <div class="flex justify-end gap-3">
          <Button variant="secondary" @click="showFormModal = false">
            取消
          </Button>
          <Button
            variant="primary"
            :loading="usersStore.loading"
            @click="handleSubmit"
          >
            {{ isEditing ? '保存' : '创建' }}
          </Button>
        </div>
      </template>
    </Modal>

    <!-- 修改密码弹窗 -->
    <Modal
      v-model="showPasswordModal"
      title="修改用户密码"
      size="sm"
    >
      <div class="space-y-4">
        <p class="text-sm text-gray-600">
          修改用户
          <span class="font-medium text-gray-900">
            {{ currentUser?.username }}
          </span>
          的密码
        </p>

        <Input
          v-model="passwordFormData.password"
          type="password"
          label="新密码"
          placeholder="请输入新密码（至少6个字符）"
          :error="passwordErrors.password"
        />

        <Input
          v-model="passwordFormData.confirmPassword"
          type="password"
          label="确认密码"
          placeholder="请再次输入新密码"
          :error="passwordErrors.confirmPassword"
        />
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <Button variant="secondary" @click="showPasswordModal = false">
            取消
          </Button>
          <Button
            variant="primary"
            :loading="usersStore.loading"
            @click="handleUpdatePassword"
          >
            确认修改
          </Button>
        </div>
      </template>
    </Modal>

    <!-- 删除确认弹窗 -->
    <Modal
      v-model="showDeleteModal"
      title="删除用户"
      size="sm"
    >
      <div class="space-y-4">
        <p class="text-sm text-gray-600">
          确定要删除用户
          <span class="font-medium text-gray-900">
            {{ currentUser?.username }}
          </span>
          吗？
        </p>
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
          <p class="text-sm text-red-800">
            警告：删除用户后，该用户将无法登录系统，且相关操作记录将保留。此操作不可恢复！
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
            :loading="usersStore.loading"
            @click="handleDelete"
          >
            确认删除
          </Button>
        </div>
      </template>
    </Modal>

    <!-- 用户详情弹窗 -->
    <Modal
      v-model="showDetailModal"
      title="用户详情"
      size="md"
    >
      <div v-if="currentUser" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-sm text-gray-500">用户ID</p>
            <p class="mt-1 text-sm font-medium text-gray-900">{{ currentUser.id }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">用户名</p>
            <p class="mt-1 text-sm font-medium text-gray-900">{{ currentUser.username }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">真实姓名</p>
            <p class="mt-1 text-sm font-medium text-gray-900">{{ currentUser.realName || '-' }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">角色</p>
            <div class="mt-1">
              <Badge :variant="getRoleBadgeVariant(currentUser.role)">
                {{ getRoleText(currentUser.role) }}
              </Badge>
            </div>
          </div>
          <div>
            <p class="text-sm text-gray-500">创建时间</p>
            <p class="mt-1 text-sm font-medium text-gray-900">{{ formatDate(currentUser.createdAt) }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">更新时间</p>
            <p class="mt-1 text-sm font-medium text-gray-900">{{ formatDate(currentUser.updatedAt) }}</p>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end">
          <Button variant="secondary" @click="showDetailModal = false">
            关闭
          </Button>
        </div>
      </template>
    </Modal>
  </div>
</template>
