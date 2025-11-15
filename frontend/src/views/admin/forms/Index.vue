<template>
  <div class="p-6">
    <!-- 头部 -->
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-gray-800">体测表单管理</h2>
      <el-button type="primary" @click="handleAdd">
        <el-icon class="mr-1"><Plus /></el-icon>
        新增表单
      </el-button>
    </div>

    <!-- 筛选栏 -->
    <el-card shadow="never" class="border-0 mb-4">
      <div class="flex gap-4 items-center">
        <div class="flex items-center gap-2">
          <span class="text-gray-600">状态:</span>
          <el-radio-group v-model="filters.status" @change="handleStatusChange">
            <el-radio-button value="all">全部</el-radio-button>
            <el-radio-button value="draft">草稿</el-radio-button>
            <el-radio-button value="published">已发布</el-radio-button>
            <el-radio-button value="closed">已关闭</el-radio-button>
          </el-radio-group>
        </div>
      </div>
    </el-card>

    <!-- 数据表格 -->
    <el-card shadow="never" class="border-0">
      <el-table
        v-loading="loading"
        :data="tableData"
        stripe
        style="width: 100%"
        class="custom-table"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="formName" label="表单名称" min-width="200" />
        <el-table-column prop="academicYear" label="学年" width="120" />
        <el-table-column prop="testDate" label="测试日期" width="120">
          <template #default="{ row }">
            {{ row.testDate || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="填报时间" width="200">
          <template #default="{ row }">
            <div v-if="row.startTime && row.endTime" class="text-xs">
              <div>{{ formatDate(row.startTime) }}</div>
              <div>至 {{ formatDate(row.endTime) }}</div>
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              link
              @click="handleView(row)"
            >
              查看
            </el-button>
            <el-button
              v-if="row.status === 'draft'"
              type="primary"
              size="small"
              link
              @click="handleEdit(row)"
            >
              编辑
            </el-button>
            <el-button
              v-if="row.status === 'draft'"
              type="success"
              size="small"
              link
              @click="handlePublish(row)"
            >
              发布
            </el-button>
            <el-button
              v-if="row.status === 'published'"
              type="warning"
              size="small"
              link
              @click="handleClose(row)"
            >
              关闭
            </el-button>
            <el-button
              v-if="row.status === 'draft'"
              type="danger"
              size="small"
              link
              @click="handleDelete(row)"
            >
              删除
            </el-button>
            <el-button
              v-if="row.status === 'draft'"
              type="info"
              size="small"
              link
              @click="handleConfigItems(row)"
            >
              配置项目
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="flex justify-end mt-4">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
      >
        <el-form-item label="表单名称" prop="formName">
          <el-input
            v-model="formData.formName"
            placeholder="如：2024年秋季体测"
            clearable
          />
        </el-form-item>
        <el-form-item label="学年" prop="academicYear">
          <el-input
            v-model="formData.academicYear"
            placeholder="如：2024-2025"
            clearable
          />
        </el-form-item>
        <el-form-item label="测试日期" prop="testDate">
          <el-date-picker
            v-model="formData.testDate"
            type="date"
            placeholder="选择测试日期"
            value-format="YYYY-MM-DD"
            class="w-full"
          />
        </el-form-item>
        <el-form-item label="填报时间" prop="timeRange">
          <el-date-picker
            v-model="formData.timeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            class="w-full"
          />
        </el-form-item>
        <el-form-item label="说明" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入表单说明"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="flex justify-end gap-2">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">
            确定
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 查看详情对话框 -->
    <el-dialog
      v-model="viewDialogVisible"
      title="表单详情"
      width="800px"
    >
      <div v-if="currentForm" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <div class="text-gray-500 text-sm mb-1">表单名称</div>
            <div class="font-medium">{{ currentForm.formName }}</div>
          </div>
          <div>
            <div class="text-gray-500 text-sm mb-1">学年</div>
            <div class="font-medium">{{ currentForm.academicYear }}</div>
          </div>
          <div>
            <div class="text-gray-500 text-sm mb-1">测试日期</div>
            <div class="font-medium">{{ currentForm.testDate || '-' }}</div>
          </div>
          <div>
            <div class="text-gray-500 text-sm mb-1">状态</div>
            <el-tag :type="getStatusType(currentForm.status)">
              {{ getStatusText(currentForm.status) }}
            </el-tag>
          </div>
          <div class="col-span-2">
            <div class="text-gray-500 text-sm mb-1">填报时间</div>
            <div class="font-medium">
              {{ currentForm.startTime ? formatDate(currentForm.startTime) : '-' }}
              {{ currentForm.endTime ? '至 ' + formatDate(currentForm.endTime) : '' }}
            </div>
          </div>
          <div class="col-span-2">
            <div class="text-gray-500 text-sm mb-1">说明</div>
            <div class="font-medium">{{ currentForm.description || '-' }}</div>
          </div>
        </div>

        <el-divider />

        <div>
          <div class="text-lg font-semibold mb-3">测试项目</div>
          <el-table :data="currentForm.testItems" stripe border>
            <el-table-column prop="sortOrder" label="序号" width="70" />
            <el-table-column prop="itemName" label="项目名称" width="150" />
            <el-table-column prop="itemUnit" label="单位" width="80" />
            <el-table-column label="性别限制" width="100">
              <template #default="{ row }">
                <el-tag v-if="row.genderLimit === 'male'" type="primary" size="small">仅男生</el-tag>
                <el-tag v-else-if="row.genderLimit === 'female'" type="danger" size="small">仅女生</el-tag>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column label="是否必填" width="100">
              <template #default="{ row }">
                <el-tag :type="row.isRequired ? 'success' : 'info'" size="small">
                  {{ row.isRequired ? '必填' : '选填' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-dialog>

    <!-- 配置测试项目对话框 -->
    <el-dialog
      v-model="itemsDialogVisible"
      title="配置测试项目"
      width="900px"
      @close="handleItemsDialogClose"
    >
      <el-alert
        type="info"
        :closable="false"
        class="mb-4"
      >
        <template #title>
          <div class="text-sm">
            可以调整项目的必填状态和排序，评分标准为JSON格式（高级功能）
          </div>
        </template>
      </el-alert>

      <el-table :data="testItems" border>
        <el-table-column prop="itemName" label="项目名称" width="150" />
        <el-table-column prop="itemUnit" label="单位" width="80" />
        <el-table-column label="性别限制" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.genderLimit === 'male'" type="primary" size="small">仅男生</el-tag>
            <el-tag v-else-if="row.genderLimit === 'female'" type="danger" size="small">仅女生</el-tag>
            <span v-else>通用</span>
          </template>
        </el-table-column>
        <el-table-column label="是否必填" width="100">
          <template #default="{ row }">
            <el-switch v-model="row.isRequired" />
          </template>
        </el-table-column>
        <el-table-column label="排序" width="100">
          <template #default="{ row }">
            <el-input-number v-model="row.sortOrder" :min="1" size="small" />
          </template>
        </el-table-column>
      </el-table>

      <template #footer>
        <div class="flex justify-end gap-2">
          <el-button @click="itemsDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSaveItems" :loading="savingItems">
            保存
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import {
  getForms,
  getForm,
  createForm,
  updateForm,
  deleteForm,
  publishForm,
  closeForm,
  getFormTestItems,
  updateFormTestItems,
} from '@/api/forms'
import type { PhysicalTestForm, FormTestItem } from '@/types/models'

// 表格数据
const loading = ref(false)
const tableData = ref<PhysicalTestForm[]>([])

// 筛选条件
const filters = reactive({
  status: 'all' as 'all' | 'draft' | 'published' | 'closed',
})

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
})

// 新增/编辑对话框
const dialogVisible = ref(false)
const dialogTitle = ref('新增表单')
const formRef = ref()
const submitting = ref(false)

// 表单数据
const formData = reactive({
  id: null as number | null,
  formName: '',
  academicYear: '',
  testDate: '',
  timeRange: [] as string[],
  description: '',
})

// 表单验证规则
const formRules = {
  formName: [
    { required: true, message: '请输入表单名称', trigger: 'blur' },
    { min: 2, max: 200, message: '表单名称长度在 2 到 200 个字符', trigger: 'blur' },
  ],
  academicYear: [
    { required: true, message: '请输入学年', trigger: 'blur' },
    { pattern: /^\d{4}-\d{4}$/, message: '学年格式不正确，如：2024-2025', trigger: 'blur' },
  ],
}

// 查看详情
const viewDialogVisible = ref(false)
const currentForm = ref<PhysicalTestForm | null>(null)

// 配置测试项目
const itemsDialogVisible = ref(false)
const testItems = ref<FormTestItem[]>([])
const currentFormId = ref<number | null>(null)
const savingItems = ref(false)

// 获取表单列表
const fetchForms = async () => {
  loading.value = true
  try {
    const res = await getForms({
      page: pagination.page,
      pageSize: pagination.pageSize,
      status: filters.status,
      sortBy: 'created_at',
      order: 'DESC',
    })

    if (res.success) {
      tableData.value = res.data || []
      pagination.total = res.pagination?.total || 0
    }
  } catch (error) {
    console.error('获取表单列表失败:', error)
    ElMessage.error('获取表单列表失败')
  } finally {
    loading.value = false
  }
}

// 格式化日期
const formatDate = (date: string | undefined) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 获取状态类型
const getStatusType = (status: string) => {
  const types: Record<string, any> = {
    draft: 'info',
    published: 'success',
    closed: 'warning',
  }
  return types[status] || 'info'
}

// 获取状态文本
const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    draft: '草稿',
    published: '已发布',
    closed: '已关闭',
  }
  return texts[status] || status
}

// 状态筛选变化
const handleStatusChange = () => {
  pagination.page = 1
  fetchForms()
}

// 新增表单
const handleAdd = () => {
  dialogTitle.value = '新增表单'
  Object.assign(formData, {
    id: null,
    formName: '',
    academicYear: '',
    testDate: '',
    timeRange: [],
    description: '',
  })
  dialogVisible.value = true
}

// 编辑表单
const handleEdit = (row: PhysicalTestForm) => {
  dialogTitle.value = '编辑表单'
  Object.assign(formData, {
    id: row.id,
    formName: row.formName,
    academicYear: row.academicYear,
    testDate: row.testDate || '',
    timeRange: row.startTime && row.endTime ? [row.startTime, row.endTime] : [],
    description: row.description || '',
  })
  dialogVisible.value = true
}

// 查看表单
const handleView = async (row: PhysicalTestForm) => {
  try {
    const res = await getForm(row.id)
    if (res.success && res.data) {
      currentForm.value = res.data
      viewDialogVisible.value = true
    }
  } catch (error) {
    console.error('获取表单详情失败:', error)
    ElMessage.error('获取表单详情失败')
  }
}

// 发布表单
const handlePublish = (row: PhysicalTestForm) => {
  ElMessageBox.confirm(
    `确定要发布"${row.formName}"吗？发布后将不能编辑！`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(async () => {
      try {
        const res = await publishForm(row.id)
        if (res.success) {
          ElMessage.success('发布成功')
          fetchForms()
        }
      } catch (error) {
        console.error('发布表单失败:', error)
        ElMessage.error('发布表单失败')
      }
    })
    .catch(() => {})
}

// 关闭表单
const handleClose = (row: PhysicalTestForm) => {
  ElMessageBox.confirm(
    `确定要关闭"${row.formName}"吗？关闭后将停止接收数据！`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(async () => {
      try {
        const res = await closeForm(row.id)
        if (res.success) {
          ElMessage.success('关闭成功')
          fetchForms()
        }
      } catch (error) {
        console.error('关闭表单失败:', error)
        ElMessage.error('关闭表单失败')
      }
    })
    .catch(() => {})
}

// 删除表单
const handleDelete = (row: PhysicalTestForm) => {
  ElMessageBox.confirm(
    `确定要删除"${row.formName}"吗？删除后无法恢复！`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(async () => {
      try {
        const res = await deleteForm(row.id)
        if (res.success) {
          ElMessage.success('删除成功')
          fetchForms()
        }
      } catch (error) {
        console.error('删除表单失败:', error)
        ElMessage.error('删除表单失败')
      }
    })
    .catch(() => {})
}

// 配置测试项目
const handleConfigItems = async (row: PhysicalTestForm) => {
  currentFormId.value = row.id
  try {
    const res = await getFormTestItems(row.id)
    if (res.success && res.data) {
      testItems.value = res.data
      itemsDialogVisible.value = true
    }
  } catch (error) {
    console.error('获取测试项目失败:', error)
    ElMessage.error('获取测试项目失败')
  }
}

// 保存测试项目配置
const handleSaveItems = async () => {
  if (!currentFormId.value) return

  savingItems.value = true
  try {
    const res = await updateFormTestItems(currentFormId.value, {
      items: testItems.value.map(item => ({
        id: item.id,
        isRequired: item.isRequired,
        sortOrder: item.sortOrder,
        scoringStandard: item.scoringStandard,
      })),
    })

    if (res.success) {
      ElMessage.success('保存成功')
      itemsDialogVisible.value = false
      fetchForms()
    }
  } catch (error) {
    console.error('保存测试项目失败:', error)
    ElMessage.error('保存测试项目失败')
  } finally {
    savingItems.value = false
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid: boolean) => {
    if (!valid) return

    submitting.value = true
    try {
      const data = {
        formName: formData.formName,
        academicYear: formData.academicYear,
        testDate: formData.testDate || undefined,
        startTime: formData.timeRange[0] || undefined,
        endTime: formData.timeRange[1] || undefined,
        description: formData.description || undefined,
      }

      let res
      if (formData.id) {
        // 编辑
        res = await updateForm(formData.id, data)
      } else {
        // 新增
        res = await createForm(data)
      }

      if (res.success) {
        ElMessage.success(res.message || '操作成功')
        dialogVisible.value = false
        fetchForms()
      }
    } catch (error) {
      console.error('提交失败:', error)
      ElMessage.error('操作失败')
    } finally {
      submitting.value = false
    }
  })
}

// 关闭对话框
const handleDialogClose = () => {
  formRef.value?.resetFields()
}

// 关闭测试项目对话框
const handleItemsDialogClose = () => {
  testItems.value = []
  currentFormId.value = null
}

// 分页变化
const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
  fetchForms()
}

const handlePageChange = (page: number) => {
  pagination.page = page
  fetchForms()
}

// 初始化
onMounted(() => {
  fetchForms()
})
</script>

<style scoped>
.custom-table {
  --el-table-border-color: #f0f0f0;
}

:deep(.el-table) {
  border-radius: 8px;
}

:deep(.el-table th) {
  background-color: #f5f7fa;
  color: #606266;
  font-weight: 600;
}

:deep(.el-pagination) {
  margin-top: 16px;
}

.el-card {
  border-radius: 8px;
}
</style>
