<template>
  <div class="p-6">
    <h2 class="text-2xl font-bold mb-4">体测数据录入</h2>

    <!-- 选择表单 -->
    <el-card class="mb-4">
      <template #header>
        <div class="flex items-center justify-between">
          <span class="font-bold">选择表单</span>
        </div>
      </template>

      <el-select
        v-model="selectedFormId"
        placeholder="请选择体测表单"
        class="w-full"
        @change="handleFormChange"
      >
        <el-option
          v-for="form in availableForms"
          :key="form.id"
          :label="`${form.formName} (${form.academicYear})`"
          :value="form.id"
        >
          <div class="flex items-center justify-between">
            <span>{{ form.formName }}</span>
            <el-tag size="small" type="success">{{ form.academicYear }}</el-tag>
          </div>
        </el-option>
      </el-select>
    </el-card>

    <!-- 学生列表和数据录入 -->
    <el-card v-if="selectedFormId && studentsData.length > 0" v-loading="loading">
      <template #header>
        <div class="flex items-center justify-between">
          <span class="font-bold">学生体测数据</span>
          <div class="space-x-2">
            <el-button type="primary" @click="handleBatchSave">批量保存</el-button>
          </div>
        </div>
      </template>

      <el-table :data="studentsData" border style="width: 100%">
        <el-table-column prop="student.studentIdSchool" label="学号" width="120" fixed />
        <el-table-column prop="student.name" label="姓名" width="100" fixed />
        <el-table-column prop="student.gender" label="性别" width="60" fixed>
          <template #default="scope">
            <el-tag :type="scope.row.student.gender === 'male' ? 'primary' : 'danger'" size="small">
              {{ scope.row.student.gender === 'male' ? '男' : '女' }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 动态测试项目列  -->
        <el-table-column
          v-for="item in getTestItems(studentsData[0])"
          :key="item.itemCode"
          :label="`${item.itemName}${item.itemUnit ? `(${item.itemUnit})` : ''}`"
          min-width="150"
        >
          <template #default="scope">
            <el-input-number
              v-model="getRecordData(scope.row)[item.itemCode]"
              :min="0"
              :precision="2"
              :controls="false"
              size="small"
              style="width: 100%"
              @change="handleDataChange(scope.row)"
            />
          </template>
        </el-table-column>

        <!-- 总分列 -->
        <el-table-column label="总分" width="80" fixed="right">
          <template #default="scope">
            <span class="font-bold text-blue-600">
              {{ scope.row.record?.totalScore || '-' }}
            </span>
          </template>
        </el-table-column>

        <!-- 操作列 -->
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button
              type="primary"
              size="small"
              @click="handleSaveSingle(scope.row)"
            >
              保存
            </el-button>
            <el-button
              v-if="scope.row.record"
              type="danger"
              size="small"
              @click="handleDelete(scope.row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-empty v-else-if="selectedFormId && studentsData.length === 0" description="暂无学生数据" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getForms } from '@/api/forms';
import {
  getClassStudentsForForm,
  createOrUpdateRecord,
  batchCreateOrUpdateRecords,
  deleteRecord
} from '@/api/records';
import { useUserStore } from '@/stores/user';
import type { PhysicalTestForm } from '@/types/models';

const userStore = useUserStore();

// 可用的表单列表
const availableForms = ref<PhysicalTestForm[]>([]);
const selectedFormId = ref<number | null>(null);

// 学生数据
const studentsData = ref<any[]>([]);
const loading = ref(false);

// 当前班级信息
const classInfo = ref<any>(null);

// 录入的数据（以学生ID为键）
const recordsData = reactive<Record<number, Record<string, number>>>({});

/**
 * 获取可用的表单列表
 */
const fetchAvailableForms = async () => {
  try {
    const res = await getForms({ status: 'published' });
    if (res.success) {
      availableForms.value = res.data || [];
    }
  } catch (error: any) {
    ElMessage.error('获取表单列表失败');
  }
};

/**
 * 当选择表单时，获取学生列表
 */
const handleFormChange = async () => {
  if (!selectedFormId.value) return;

  // 获取当前登录用户的班级信息
  const userInfo = userStore.userInfo;
  if (!userInfo || !userInfo.classId) {
    ElMessage.error('无法获取班级信息');
    return;
  }

  try {
    loading.value = true;
    const res = await getClassStudentsForForm(
      selectedFormId.value,
      userInfo.classId
    );

    if (res.success) {
      studentsData.value = res.data.students || [];
      classInfo.value = res.data.class;

      // 初始化录入数据
      studentsData.value.forEach(student => {
        if (!recordsData[student.student.id]) {
          recordsData[student.student.id] = {};
        }

        // 如果有已存在的记录，填充数据
        if (student.record && student.record.testData) {
          recordsData[student.student.id] = { ...student.record.testData };
        }
      });
    }
  } catch (error: any) {
    ElMessage.error('获取学生列表失败');
  } finally {
    loading.value = false;
  }
};

/**
 * 获取学生的测试项目（根据性别过滤）
 */
const getTestItems = (studentData: any) => {
  if (!studentData || !studentData.testItems) return [];
  return studentData.testItems;
};

/**
 * 获取学生的录入数据
 */
const getRecordData = (studentData: any) => {
  const studentId = studentData.student.id;
  if (!recordsData[studentId]) {
    recordsData[studentId] = {};
  }
  return recordsData[studentId];
};

/**
 * 当数据改变时
 */
const handleDataChange = (studentData: any) => {
  // 可以在这里实时计算分数（如果需要前端显示预估分数）
};

/**
 * 保存单个学生的数据
 */
const handleSaveSingle = async (studentData: any) => {
  const studentId = studentData.student.id;
  const testData = recordsData[studentId];

  if (!testData || Object.keys(testData).length === 0) {
    ElMessage.warning('请先录入数据');
    return;
  }

  try {
    loading.value = true;
    const res = await createOrUpdateRecord(
      selectedFormId.value!,
      studentId,
      { testData }
    );

    if (res.success) {
      ElMessage.success('保存成功');
      // 重新获取数据以更新分数
      await handleFormChange();
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '保存失败');
  } finally {
    loading.value = false;
  }
};

/**
 * 批量保存所有学生的数据
 */
const handleBatchSave = async () => {
  const records = studentsData.value
    .map(student => ({
      studentId: student.student.id,
      testData: recordsData[student.student.id] || {}
    }))
    .filter(record => Object.keys(record.testData).length > 0);

  if (records.length === 0) {
    ElMessage.warning('没有可保存的数据');
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确定要保存 ${records.length} 名学生的体测数据吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );

    loading.value = true;
    const res = await batchCreateOrUpdateRecords(selectedFormId.value!, {
      records
    });

    if (res.success) {
      ElMessage.success(res.message || '批量保存成功');
      // 重新获取数据
      await handleFormChange();
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '批量保存失败');
    }
  } finally {
    loading.value = false;
  }
};

/**
 * 删除记录
 */
const handleDelete = async (studentData: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除 ${studentData.student.name} 的体测记录吗？`,
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );

    loading.value = true;
    const res = await deleteRecord(
      selectedFormId.value!,
      studentData.student.id
    );

    if (res.success) {
      ElMessage.success('删除成功');
      // 清空本地数据
      recordsData[studentData.student.id] = {};
      // 重新获取数据
      await handleFormChange();
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '删除失败');
    }
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchAvailableForms();
});
</script>

<style scoped lang="scss">
:deep(.el-input-number) {
  width: 100%;

  .el-input__inner {
    text-align: left;
  }
}
</style>
