<!--
  通用 UI 组件使用示例
  这个文件展示了如何使用所有通用组件
-->

<script setup lang="ts">
import { ref } from 'vue'
import {
  Button,
  Input,
  Select,
  Modal,
  Table,
  Pagination,
  Card,
  Badge,
  Loading
} from '@/components/common'
import type { SelectOption, TableColumn } from '@/components/common'
import { useToast } from '@/composables/useToast'

const toast = useToast()

// Button 示例
const loading = ref(false)
const handleClick = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    toast.success('操作成功！')
  }, 2000)
}

// Input 示例
const inputValue = ref('')
const inputError = ref('')

// Select 示例
const selectValue = ref('')
const selectOptions: SelectOption[] = [
  { label: '选项一', value: '1' },
  { label: '选项二', value: '2' },
  { label: '选项三', value: '3' }
]

// Modal 示例
const showModal = ref(false)

// Table 示例
const tableLoading = ref(false)
const tableColumns: TableColumn[] = [
  { key: 'id', label: 'ID', width: '80px' },
  { key: 'name', label: '姓名' },
  { key: 'email', label: '邮箱' },
  { key: 'status', label: '状态', width: '100px' }
]
const tableData = ref([
  { id: 1, name: '张三', email: 'zhangsan@example.com', status: 'active' },
  { id: 2, name: '李四', email: 'lisi@example.com', status: 'inactive' },
  { id: 3, name: '王五', email: 'wangwu@example.com', status: 'active' }
])

// Pagination 示例
const currentPage = ref(1)
const totalPages = ref(10)
const totalItems = ref(95)
const pageSize = ref(10)

const handlePageChange = (page: number) => {
  currentPage.value = page
  console.log('切换到第', page, '页')
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  console.log('每页显示', size, '条')
}

// Toast 示例
const showSuccessToast = () => toast.success('这是一个成功消息')
const showErrorToast = () => toast.error('这是一个错误消息')
const showWarningToast = () => toast.warning('这是一个警告消息')
const showInfoToast = () => toast.info('这是一个信息消息')
</script>

<template>
  <div class="p-8 space-y-8 bg-gray-50 min-h-screen">
    <h1 class="text-3xl font-bold text-gray-900">通用 UI 组件示例</h1>

    <!-- Button 示例 -->
    <Card title="Button - 按钮组件">
      <div class="space-y-4">
        <div class="flex gap-4 items-center">
          <Button variant="primary">主要按钮</Button>
          <Button variant="secondary">次要按钮</Button>
          <Button variant="danger">危险按钮</Button>
          <Button variant="ghost">幽灵按钮</Button>
        </div>
        <div class="flex gap-4 items-center">
          <Button size="sm">小按钮</Button>
          <Button size="md">中等按钮</Button>
          <Button size="lg">大按钮</Button>
        </div>
        <div class="flex gap-4 items-center">
          <Button :loading="loading" @click="handleClick">加载中按钮</Button>
          <Button disabled>禁用按钮</Button>
        </div>
      </div>
    </Card>

    <!-- Input 示例 -->
    <Card title="Input - 输入框组件">
      <div class="space-y-4 max-w-md">
        <Input v-model="inputValue" label="用户名" placeholder="请输入用户名" />
        <Input
          v-model="inputValue"
          label="邮箱"
          type="email"
          placeholder="请输入邮箱"
          :error="inputError"
        />
        <Input label="禁用状态" disabled value="不可编辑" />
      </div>
    </Card>

    <!-- Select 示例 -->
    <Card title="Select - 下拉选择组件">
      <div class="max-w-md">
        <Select
          v-model="selectValue"
          label="选择选项"
          :options="selectOptions"
          placeholder="请选择"
        />
        <p class="mt-2 text-sm text-gray-600">选中的值: {{ selectValue }}</p>
      </div>
    </Card>

    <!-- Badge 示例 -->
    <Card title="Badge - 徽章组件">
      <div class="flex gap-4 items-center">
        <Badge variant="success">成功</Badge>
        <Badge variant="warning">警告</Badge>
        <Badge variant="danger">危险</Badge>
        <Badge variant="info">信息</Badge>
      </div>
      <div class="flex gap-4 items-center mt-4">
        <Badge size="sm">小徽章</Badge>
        <Badge size="md">中徽章</Badge>
        <Badge size="lg">大徽章</Badge>
      </div>
    </Card>

    <!-- Loading 示例 -->
    <Card title="Loading - 加载指示器">
      <div class="flex gap-8">
        <Loading size="sm" text="加载中..." />
        <Loading size="md" />
        <Loading size="lg" />
      </div>
    </Card>

    <!-- Modal 示例 -->
    <Card title="Modal - 弹窗组件">
      <Button @click="showModal = true">打开弹窗</Button>
      <Modal v-model="showModal" title="示例弹窗" size="md">
        <p class="text-gray-700">这是弹窗的内容区域。</p>
        <template #footer>
          <div class="flex justify-end gap-3">
            <Button variant="secondary" @click="showModal = false">取消</Button>
            <Button variant="primary" @click="showModal = false">确定</Button>
          </div>
        </template>
      </Modal>
    </Card>

    <!-- Table 示例 -->
    <Card title="Table - 表格组件">
      <Table :columns="tableColumns" :data="tableData" :loading="tableLoading">
        <template #cell-status="{ value }">
          <Badge :variant="value === 'active' ? 'success' : 'danger'">
            {{ value === 'active' ? '激活' : '未激活' }}
          </Badge>
        </template>
      </Table>
    </Card>

    <!-- Pagination 示例 -->
    <Card title="Pagination - 分页组件">
      <Pagination
        :current-page="currentPage"
        :total-pages="totalPages"
        :total-items="totalItems"
        :page-size="pageSize"
        @page-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </Card>

    <!-- Toast 示例 -->
    <Card title="Toast - 消息提示">
      <div class="flex gap-4">
        <Button variant="primary" @click="showSuccessToast">成功消息</Button>
        <Button variant="danger" @click="showErrorToast">错误消息</Button>
        <Button variant="secondary" @click="showWarningToast">警告消息</Button>
        <Button variant="ghost" @click="showInfoToast">信息消息</Button>
      </div>
    </Card>
  </div>
</template>
