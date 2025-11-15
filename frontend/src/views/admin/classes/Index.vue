<template>
  <div class="p-6">
    <!-- 页面标题 -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-800">班级管理</h1>
      <p class="text-sm text-gray-600 mt-1">管理所有班级信息，包括新增、编辑、删除和重置密码</p>
    </div>

    <!-- 操作栏 -->
    <div class="bg-white rounded-lg shadow-sm p-4 mb-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <!-- 年级筛选 -->
          <el-select
            v-model="filters.gradeId"
            placeholder="请选择年级"
            clearable
            @change="handleFilter"
            class="w-48"
          >
            <el-option
              v-for="grade in grades"
              :key="grade.id"
              :label="grade.gradeName"
              :value="grade.id"
            />
          </el-select>

          <!-- 学年筛选 -->
          <el-input
            v-model="filters.academicYear"
            placeholder="学年筛选（如：2024-2025）"
            clearable
            @change="handleFilter"
            class="w-60"
          />
        </div>

        <!-- 新增按钮 -->
        <el-button type="primary" @click="handleAdd">
          <span class="i-ep-plus mr-1"></span>
          新增班级
        </el-button>
      </div>
    </div>

    <!-- 班级列表 -->
    <div class="bg-white rounded-lg shadow-sm">
      <el-table
        :data="classList"
        v-loading="loading"
        stripe
        class="w-full"
      >
        <el-table-column prop="id" label="ID" width="80" />

        <el-table-column label="年级" width="120">
          <template #default="{ row }">
            <el-tag>{{ row.grade?.gradeName }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="className" label="班级名称" width="150" />

        <el-table-column prop="academicYear" label="学年" width="130" />

        <el-table-column prop="classAccount" label="班级账号" min-width="180">
          <template #default="{ row }">
            <div class="flex items-center gap-2">
              <code class="px-2 py-1 bg-gray-100 rounded text-sm">{{ row.classAccount }}</code>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="280" fixed="right">
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
              type="warning"
              size="small"
              link
              @click="handleResetPassword(row)"
            >
              重置密码
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
      <div class="flex justify-end p-4">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchClasses"
          @current-change="fetchClasses"
        />
      </div>
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="年级" prop="gradeId">
          <el-select
            v-model="formData.gradeId"
            placeholder="请选择年级"
            class="w-full"
          >
            <el-option
              v-for="grade in grades"
              :key="grade.id"
              :label="grade.gradeName"
              :value="grade.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="班级名称" prop="className">
          <el-input
            v-model="formData.className"
            placeholder="请输入班级名称（如：一班、二班）"
          />
        </el-form-item>

        <el-form-item label="学年" prop="academicYear">
          <el-input
            v-model="formData.academicYear"
            placeholder="请输入学年（如：2024-2025）"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 密码显示对话框 -->
    <el-dialog
      v-model="passwordDialogVisible"
      title="班级账号信息"
      width="450px"
    >
      <div class="space-y-4">
        <div>
          <div class="text-sm text-gray-600 mb-2">班级账号</div>
          <div class="p-3 bg-gray-50 rounded-lg">
            <code class="text-base font-mono">{{ currentAccount }}</code>
          </div>
        </div>
        <div>
          <div class="text-sm text-gray-600 mb-2">初始密码</div>
          <div class="p-3 bg-blue-50 rounded-lg">
            <code class="text-base font-mono text-blue-600">{{ currentPassword }}</code>
          </div>
        </div>
        <el-alert
          type="warning"
          :closable="false"
          show-icon
        >
          <template #title>
            请妥善保管账号密码，并及时通知班级管理员修改密码
          </template>
        </el-alert>
      </div>
      <template #footer>
        <el-button type="primary" @click="passwordDialogVisible = false">
          知道了
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  getClasses,
  createClass,
  updateClass,
  deleteClass,
  resetClassPassword,
} from '@/api/classes';
import { getGrades } from '@/api/grades';

// 年级列表
const grades = ref([]);

// 筛选条件
const filters = reactive({
  gradeId: '',
  academicYear: '',
});

// 班级列表
const classList = ref([]);
const loading = ref(false);

// 分页
const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0,
});

// 对话框
const dialogVisible = ref(false);
const dialogMode = ref('add'); // 'add' | 'edit'
const dialogTitle = computed(() => {
  return dialogMode.value === 'add' ? '新增班级' : '编辑班级';
});

// 表单数据
const formRef = ref();
const formData = reactive({
  id: null,
  gradeId: '',
  className: '',
  academicYear: '',
});

// 表单验证规则
const formRules = {
  gradeId: [
    { required: true, message: '请选择年级', trigger: 'change' },
  ],
  className: [
    { required: true, message: '请输入班级名称', trigger: 'blur' },
    { min: 1, max: 50, message: '班级名称长度在 1 到 50 个字符', trigger: 'blur' },
  ],
  academicYear: [
    { required: true, message: '请输入学年', trigger: 'blur' },
    { pattern: /^\d{4}-\d{4}$/, message: '学年格式不正确（如：2024-2025）', trigger: 'blur' },
  ],
};

const submitting = ref(false);

// 密码对话框
const passwordDialogVisible = ref(false);
const currentAccount = ref('');
const currentPassword = ref('');

// 获取年级列表
const fetchGrades = async () => {
  try {
    const res = await getGrades();
    if (res.success) {
      grades.value = res.data || [];
    }
  } catch (error) {
    console.error('获取年级列表失败:', error);
  }
};

// 获取班级列表
const fetchClasses = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
    };

    if (filters.gradeId) {
      params.gradeId = filters.gradeId;
    }
    if (filters.academicYear) {
      params.academicYear = filters.academicYear;
    }

    const res = await getClasses(params);
    if (res.success) {
      classList.value = res.data || [];
      pagination.total = res.pagination?.total || 0;
    }
  } catch (error) {
    console.error('获取班级列表失败:', error);
  } finally {
    loading.value = false;
  }
};

// 处理筛选
const handleFilter = () => {
  pagination.page = 1;
  fetchClasses();
};

// 处理新增
const handleAdd = () => {
  dialogMode.value = 'add';
  dialogVisible.value = true;
  resetForm();
};

// 处理编辑
const handleEdit = (row) => {
  dialogMode.value = 'edit';
  dialogVisible.value = true;
  formData.id = row.id;
  formData.gradeId = row.gradeId;
  formData.className = row.className;
  formData.academicYear = row.academicYear;
};

// 处理提交
const handleSubmit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    submitting.value = true;
    try {
      const data = {
        gradeId: formData.gradeId,
        className: formData.className,
        academicYear: formData.academicYear,
      };

      let res;
      if (dialogMode.value === 'add') {
        res = await createClass(data);
      } else {
        res = await updateClass(formData.id, data);
      }

      if (res.success) {
        ElMessage.success(dialogMode.value === 'add' ? '创建成功' : '更新成功');
        dialogVisible.value = false;

        // 如果是新增，显示账号密码
        if (dialogMode.value === 'add' && res.data) {
          currentAccount.value = res.data.classAccount || '';
          currentPassword.value = res.initialPassword || '123456';
          passwordDialogVisible.value = true;
        }

        fetchClasses();
      }
    } catch (error) {
      console.error('提交失败:', error);
    } finally {
      submitting.value = false;
    }
  });
};

// 处理删除
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除班级"${row.grade?.gradeName} ${row.className}"吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );

    const res = await deleteClass(row.id);
    if (res.success) {
      ElMessage.success('删除成功');
      fetchClasses();
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error);
    }
  }
};

// 处理重置密码
const handleResetPassword = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要重置班级"${row.grade?.gradeName} ${row.className}"的密码吗？`,
      '重置密码确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );

    const res = await resetClassPassword(row.id);
    if (res.success) {
      ElMessage.success('密码重置成功');
      currentAccount.value = row.classAccount || '';
      currentPassword.value = res.newPassword || '123456';
      passwordDialogVisible.value = true;
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('重置密码失败:', error);
    }
  }
};

// 重置表单
const resetForm = () => {
  formData.id = null;
  formData.gradeId = '';
  formData.className = '';
  formData.academicYear = '';
  if (formRef.value) {
    formRef.value.resetFields();
  }
};

// 格式化日期
const formatDate = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

// 页面加载时获取数据
onMounted(() => {
  fetchGrades();
  fetchClasses();
});
</script>

<style scoped>
/* 使用 Tailwind CSS，无需额外样式 */
</style>
