<template>
  <div class="p-6">
    <!-- 页面标题 -->
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-800">学生管理</h2>
      <p class="text-sm text-gray-500 mt-1">管理学生信息、班级归属和转班操作</p>
    </div>

    <!-- 筛选和操作栏 -->
    <div class="bg-white rounded-lg shadow-sm p-4 mb-4">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <!-- 搜索框 -->
        <el-input
          v-model="searchQuery"
          placeholder="搜索姓名、学籍号、学校学号"
          clearable
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <!-- 年级筛选 -->
        <el-select
          v-model="filters.gradeId"
          placeholder="选择年级"
          clearable
          @change="handleFilterChange"
        >
          <el-option
            v-for="grade in grades"
            :key="grade.id"
            :label="grade.gradeName"
            :value="grade.id"
          />
        </el-select>

        <!-- 班级筛选 -->
        <el-select
          v-model="filters.classId"
          placeholder="选择班级"
          clearable
          @change="handleFilterChange"
        >
          <el-option
            v-for="cls in classes"
            :key="cls.id"
            :label="cls.className"
            :value="cls.id"
          />
        </el-select>

        <!-- 学年筛选 -->
        <el-select
          v-model="filters.academicYear"
          placeholder="选择学年"
          clearable
          @change="handleFilterChange"
        >
          <el-option
            v-for="year in academicYears"
            :key="year"
            :label="year"
            :value="year"
          />
        </el-select>
      </div>

      <div class="flex justify-between items-center">
        <el-button type="primary" @click="handleSearch">
          <el-icon class="mr-1"><Search /></el-icon>
          搜索
        </el-button>
        <el-button type="success" @click="handleAdd">
          <el-icon class="mr-1"><Plus /></el-icon>
          新增学生
        </el-button>
      </div>
    </div>

    <!-- 学生列表表格 -->
    <div class="bg-white rounded-lg shadow-sm">
      <el-table
        :data="students"
        v-loading="loading"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="studentIdNational" label="学籍号" min-width="140" />
        <el-table-column prop="studentIdSchool" label="学校学号" min-width="120" />
        <el-table-column prop="name" label="姓名" min-width="100" />
        <el-table-column prop="gender" label="性别" width="80">
          <template #default="{ row }">
            <el-tag :type="row.gender === 'male' ? 'primary' : 'danger'" size="small">
              {{ row.gender === 'male' ? '男' : '女' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="birthDate" label="出生日期" min-width="110" />
        <el-table-column label="当前班级" min-width="180">
          <template #default="{ row }">
            <div v-if="row.currentClass">
              <div class="text-sm">
                {{ row.currentClass.grade.gradeName }} - {{ row.currentClass.className }}
              </div>
              <div class="text-xs text-gray-500">{{ row.currentClass.academicYear }}</div>
            </div>
            <span v-else class="text-gray-400">未分配班级</span>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="联系电话" min-width="120" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              text
              @click="handleEdit(row)"
            >
              编辑
            </el-button>
            <el-button
              type="warning"
              size="small"
              text
              @click="handleTransfer(row)"
            >
              转班
            </el-button>
            <el-button
              type="danger"
              size="small"
              text
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="p-4 flex justify-end">
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
    </div>

    <!-- 新增/编辑学生对话框 -->
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
        <el-form-item label="学籍号" prop="studentIdNational">
          <el-input
            v-model="formData.studentIdNational"
            placeholder="请输入学籍号（全国统一）"
            :disabled="isEdit"
          />
        </el-form-item>

        <el-form-item label="学校学号" prop="studentIdSchool">
          <el-input
            v-model="formData.studentIdSchool"
            placeholder="请输入学校学号"
            :disabled="isEdit"
          />
        </el-form-item>

        <el-form-item label="姓名" prop="name">
          <el-input
            v-model="formData.name"
            placeholder="请输入姓名"
          />
        </el-form-item>

        <el-form-item label="性别" prop="gender">
          <el-radio-group v-model="formData.gender">
            <el-radio value="male">男</el-radio>
            <el-radio value="female">女</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="出生日期" prop="birthDate">
          <el-date-picker
            v-model="formData.birthDate"
            type="date"
            placeholder="选择出生日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="身份证号" prop="idCardNumber">
          <el-input
            v-model="formData.idCardNumber"
            placeholder="请输入身份证号（可选）"
          />
        </el-form-item>

        <el-form-item label="联系电话" prop="phone">
          <el-input
            v-model="formData.phone"
            placeholder="请输入联系电话（可选）"
          />
        </el-form-item>

        <el-divider v-if="!isEdit" />

        <template v-if="!isEdit">
          <el-form-item label="选择年级" prop="gradeId">
            <el-select
              v-model="formData.gradeId"
              placeholder="请选择年级"
              @change="handleGradeChange"
              style="width: 100%"
            >
              <el-option
                v-for="grade in grades"
                :key="grade.id"
                :label="grade.gradeName"
                :value="grade.id"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="选择班级" prop="classId">
            <el-select
              v-model="formData.classId"
              placeholder="请选择班级"
              style="width: 100%"
              :disabled="!formData.gradeId"
            >
              <el-option
                v-for="cls in filteredClasses"
                :key="cls.id"
                :label="`${cls.className} (${cls.academicYear})`"
                :value="cls.id"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="学年" prop="academicYear">
            <el-select
              v-model="formData.academicYear"
              placeholder="请选择学年"
              style="width: 100%"
            >
              <el-option
                v-for="year in academicYears"
                :key="year"
                :label="year"
                :value="year"
              />
            </el-select>
          </el-form-item>
        </template>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 转班对话框 -->
    <el-dialog
      v-model="transferDialogVisible"
      title="转班操作"
      width="500px"
      @close="handleTransferDialogClose"
    >
      <div class="mb-4">
        <p class="text-sm text-gray-600">学生：<span class="font-medium">{{ transferData.studentName }}</span></p>
        <p class="text-sm text-gray-600">
          当前班级：
          <span class="font-medium" v-if="transferData.currentClass">
            {{ transferData.currentClass.grade.gradeName }} - {{ transferData.currentClass.className }}
          </span>
          <span v-else class="text-gray-400">未分配班级</span>
        </p>
      </div>

      <el-form
        ref="transferFormRef"
        :model="transferFormData"
        :rules="transferFormRules"
        label-width="100px"
      >
        <el-form-item label="选择年级" prop="gradeId">
          <el-select
            v-model="transferFormData.gradeId"
            placeholder="请选择年级"
            @change="handleTransferGradeChange"
            style="width: 100%"
          >
            <el-option
              v-for="grade in grades"
              :key="grade.id"
              :label="grade.gradeName"
              :value="grade.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="目标班级" prop="classId">
          <el-select
            v-model="transferFormData.classId"
            placeholder="请选择班级"
            style="width: 100%"
            :disabled="!transferFormData.gradeId"
          >
            <el-option
              v-for="cls in transferFilteredClasses"
              :key="cls.id"
              :label="`${cls.className} (${cls.academicYear})`"
              :value="cls.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="学年" prop="academicYear">
          <el-select
            v-model="transferFormData.academicYear"
            placeholder="请选择学年"
            style="width: 100%"
          >
            <el-option
              v-for="year in academicYears"
              :key="year"
              :label="year"
              :value="year"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="transferDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleTransferSubmit" :loading="submitting">
          确定转班
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Plus } from '@element-plus/icons-vue';
import {
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  transferStudent,
} from '@/api/students';
import { getClasses } from '@/api/classes';
import { getGrades } from '@/api/grades';

// 数据状态
const loading = ref(false);
const submitting = ref(false);
const students = ref([]);
const grades = ref([]);
const classes = ref([]);

// 搜索和筛选
const searchQuery = ref('');
const filters = reactive({
  gradeId: null,
  classId: null,
  academicYear: null,
});

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
});

// 学年列表
const academicYears = ref([
  '2023-2024',
  '2024-2025',
  '2025-2026',
]);

// 对话框
const dialogVisible = ref(false);
const dialogTitle = computed(() => (isEdit.value ? '编辑学生' : '新增学生'));
const isEdit = ref(false);
const formRef = ref(null);

// 表单数据
const formData = reactive({
  id: null,
  studentIdNational: '',
  studentIdSchool: '',
  name: '',
  gender: 'male',
  birthDate: '',
  idCardNumber: '',
  phone: '',
  gradeId: null,
  classId: null,
  academicYear: '',
});

// 表单验证规则
const formRules = {
  studentIdNational: [
    { required: true, message: '请输入学籍号', trigger: 'blur' },
  ],
  studentIdSchool: [
    { required: true, message: '请输入学校学号', trigger: 'blur' },
  ],
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
  ],
  gender: [
    { required: true, message: '请选择性别', trigger: 'change' },
  ],
  classId: [
    { required: true, message: '请选择班级', trigger: 'change' },
  ],
  academicYear: [
    { required: true, message: '请选择学年', trigger: 'change' },
  ],
};

// 转班对话框
const transferDialogVisible = ref(false);
const transferFormRef = ref(null);
const transferData = reactive({
  studentId: null,
  studentName: '',
  currentClass: null,
});

const transferFormData = reactive({
  gradeId: null,
  classId: null,
  academicYear: '',
});

const transferFormRules = {
  classId: [
    { required: true, message: '请选择目标班级', trigger: 'change' },
  ],
  academicYear: [
    { required: true, message: '请选择学年', trigger: 'change' },
  ],
};

// 计算属性 - 根据选择的年级筛选班级
const filteredClasses = computed(() => {
  if (!formData.gradeId) return [];
  return classes.value.filter(cls => cls.gradeId === formData.gradeId);
});

const transferFilteredClasses = computed(() => {
  if (!transferFormData.gradeId) return [];
  return classes.value.filter(cls => cls.gradeId === transferFormData.gradeId);
});

// 加载年级列表
const loadGrades = async () => {
  try {
    const response = await getGrades({ page: 1, pageSize: 1000 });
    grades.value = response.data || [];
  } catch (error) {
    console.error('加载年级列表失败:', error);
  }
};

// 加载班级列表
const loadClasses = async () => {
  try {
    const response = await getClasses({ page: 1, limit: 1000 });
    classes.value = response.data || [];
  } catch (error) {
    console.error('加载班级列表失败:', error);
  }
};

// 加载学生列表
const loadStudents = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      search: searchQuery.value,
      ...filters,
    };

    const response = await getStudents(params);
    students.value = response.data;
    pagination.total = response.pagination.total;
  } catch (error) {
    ElMessage.error('加载学生列表失败');
    console.error('加载学生列表失败:', error);
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  pagination.page = 1;
  loadStudents();
};

// 筛选变化
const handleFilterChange = () => {
  pagination.page = 1;
  loadStudents();
};

// 分页变化
const handlePageChange = (page) => {
  pagination.page = page;
  loadStudents();
};

const handleSizeChange = (size) => {
  pagination.pageSize = size;
  pagination.page = 1;
  loadStudents();
};

// 年级变化时清空班级选择
const handleGradeChange = () => {
  formData.classId = null;
};

const handleTransferGradeChange = () => {
  transferFormData.classId = null;
};

// 新增学生
const handleAdd = () => {
  isEdit.value = false;
  dialogVisible.value = true;
};

// 编辑学生
const handleEdit = (row) => {
  isEdit.value = true;
  formData.id = row.id;
  formData.studentIdNational = row.studentIdNational;
  formData.studentIdSchool = row.studentIdSchool;
  formData.name = row.name;
  formData.gender = row.gender;
  formData.birthDate = row.birthDate;
  formData.idCardNumber = row.idCardNumber || '';
  formData.phone = row.phone || '';
  dialogVisible.value = true;
};

// 提交表单
const handleSubmit = async () => {
  const valid = await formRef.value.validate();
  if (!valid) return;

  submitting.value = true;
  try {
    if (isEdit.value) {
      await updateStudent(formData.id, {
        studentIdNational: formData.studentIdNational,
        studentIdSchool: formData.studentIdSchool,
        name: formData.name,
        gender: formData.gender,
        birthDate: formData.birthDate,
        idCardNumber: formData.idCardNumber,
        phone: formData.phone,
      });
      ElMessage.success('学生信息更新成功');
    } else {
      await createStudent(formData);
      ElMessage.success('学生创建成功');
    }
    dialogVisible.value = false;
    loadStudents();
  } catch (error) {
    ElMessage.error(error.response?.data?.error || '操作失败');
  } finally {
    submitting.value = false;
  }
};

// 删除学生
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除学生 "${row.name}" 吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );

    await deleteStudent(row.id);
    ElMessage.success('学生删除成功');
    loadStudents();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.error || '删除失败');
    }
  }
};

// 转班
const handleTransfer = (row) => {
  transferData.studentId = row.id;
  transferData.studentName = row.name;
  transferData.currentClass = row.currentClass;
  transferFormData.gradeId = null;
  transferFormData.classId = null;
  transferFormData.academicYear = row.currentAcademicYear || '';
  transferDialogVisible.value = true;
};

// 提交转班
const handleTransferSubmit = async () => {
  const valid = await transferFormRef.value.validate();
  if (!valid) return;

  submitting.value = true;
  try {
    await transferStudent(transferData.studentId, {
      classId: transferFormData.classId,
      academicYear: transferFormData.academicYear,
    });
    ElMessage.success('转班成功');
    transferDialogVisible.value = false;
    loadStudents();
  } catch (error) {
    ElMessage.error(error.response?.data?.error || '转班失败');
  } finally {
    submitting.value = false;
  }
};

// 对话框关闭时重置表单
const handleDialogClose = () => {
  formRef.value?.resetFields();
  Object.assign(formData, {
    id: null,
    studentIdNational: '',
    studentIdSchool: '',
    name: '',
    gender: 'male',
    birthDate: '',
    idCardNumber: '',
    phone: '',
    gradeId: null,
    classId: null,
    academicYear: '',
  });
};

const handleTransferDialogClose = () => {
  transferFormRef.value?.resetFields();
  Object.assign(transferFormData, {
    gradeId: null,
    classId: null,
    academicYear: '',
  });
};

// 初始化
onMounted(() => {
  loadGrades();
  loadClasses();
  loadStudents();
});
</script>

<style scoped>
</style>
