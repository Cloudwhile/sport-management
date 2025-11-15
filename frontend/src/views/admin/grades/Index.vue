<template>
  <div class="p-6">
    <!-- 头部 -->
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-gray-800">年级管理</h2>
      <el-button type="primary" @click="handleAdd">
        <el-icon class="mr-1"><Plus /></el-icon>
        新增年级
      </el-button>
    </div>

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
        <el-table-column prop="gradeLevel" label="年级" width="120">
          <template #default="{ row }">
            <el-tag>{{ row.gradeLevel }}年级</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="gradeName" label="年级名称" />
        <el-table-column prop="createdAt" label="创建时间" width="200">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              link
              @click="handleEdit(row)"
            >
              编辑
            </el-button>
            <el-button
              type="danger"
              size="small"
              link
              @click="handleDelete(row)"
            >
              删除
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
      width="500px"
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="年级名称" prop="gradeName">
          <el-input
            v-model="formData.gradeName"
            placeholder="请输入年级名称，如：一年级、二年级"
            clearable
          />
        </el-form-item>
        <el-form-item label="年级数字" prop="gradeLevel">
          <el-input-number
            v-model="formData.gradeLevel"
            :min="1"
            :max="12"
            placeholder="请输入年级数字"
            class="w-full"
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { getGrades, createGrade, updateGrade, deleteGrade } from '@/api/grades';

// 表格数据
const loading = ref(false);
const tableData = ref([]);

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
});

// 对话框
const dialogVisible = ref(false);
const dialogTitle = ref('新增年级');
const formRef = ref(null);
const submitting = ref(false);

// 表单数据
const formData = reactive({
  id: null,
  gradeName: '',
  gradeLevel: null,
});

// 表单验证规则
const formRules = {
  gradeName: [
    { required: true, message: '请输入年级名称', trigger: 'blur' },
    { min: 2, max: 50, message: '年级名称长度在 2 到 50 个字符', trigger: 'blur' },
  ],
  gradeLevel: [
    { required: true, message: '请输入年级数字', trigger: 'change' },
    { type: 'number', message: '年级数字必须为数字', trigger: 'change' },
  ],
};

// 获取年级列表
const fetchGrades = async () => {
  loading.value = true;
  try {
    const res = await getGrades({
      page: pagination.page,
      pageSize: pagination.pageSize,
      sortBy: 'gradeLevel',
      order: 'ASC',
    });

    if (res.success) {
      tableData.value = res.data;
      pagination.total = res.pagination.total;
    }
  } catch (error) {
    console.error('获取年级列表失败:', error);
  } finally {
    loading.value = false;
  }
};

// 格式化日期
const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleString('zh-CN');
};

// 新增年级
const handleAdd = () => {
  dialogTitle.value = '新增年级';
  Object.assign(formData, {
    id: null,
    gradeName: '',
    gradeLevel: null,
  });
  dialogVisible.value = true;
};

// 编辑年级
const handleEdit = (row) => {
  dialogTitle.value = '编辑年级';
  Object.assign(formData, {
    id: row.id,
    gradeName: row.gradeName,
    gradeLevel: row.gradeLevel,
  });
  dialogVisible.value = true;
};

// 删除年级
const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除"${row.gradeName}"吗？删除后无法恢复！`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(async () => {
      try {
        const res = await deleteGrade(row.id);
        if (res.success) {
          ElMessage.success('删除成功');
          fetchGrades();
        }
      } catch (error) {
        console.error('删除年级失败:', error);
      }
    })
    .catch(() => {
      // 用户取消删除
    });
};

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    submitting.value = true;
    try {
      let res;
      if (formData.id) {
        // 编辑
        res = await updateGrade(formData.id, {
          gradeName: formData.gradeName,
          gradeLevel: formData.gradeLevel,
        });
      } else {
        // 新增
        res = await createGrade({
          gradeName: formData.gradeName,
          gradeLevel: formData.gradeLevel,
        });
      }

      if (res.success) {
        ElMessage.success(res.message || '操作成功');
        dialogVisible.value = false;
        fetchGrades();
      }
    } catch (error) {
      console.error('提交失败:', error);
    } finally {
      submitting.value = false;
    }
  });
};

// 关闭对话框
const handleDialogClose = () => {
  formRef.value?.resetFields();
};

// 分页变化
const handleSizeChange = (size) => {
  pagination.pageSize = size;
  pagination.page = 1;
  fetchGrades();
};

const handlePageChange = (page) => {
  pagination.page = page;
  fetchGrades();
};

// 初始化
onMounted(() => {
  fetchGrades();
});
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
