<template>
  <div class="p-6">
    <h2 class="text-2xl font-bold mb-4">数据统计</h2>

    <!-- 整体统计卡片 -->
    <el-row :gutter="20" class="mb-6">
      <el-col :span="6">
        <el-card>
          <div class="stat-card">
            <div class="stat-icon" style="background: #409eff">
              <el-icon :size="30"><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ overallStats.totalStudents }}</div>
              <div class="stat-label">学生总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat-card">
            <div class="stat-icon" style="background: #67c23a">
              <el-icon :size="30"><School /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ overallStats.totalClasses }}</div>
              <div class="stat-label">班级总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat-card">
            <div class="stat-icon" style="background: #e6a23c">
              <el-icon :size="30"><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ overallStats.totalForms }}</div>
              <div class="stat-label">体测表单</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat-card">
            <div class="stat-icon" style="background: #f56c6c">
              <el-icon :size="30"><DataAnalysis /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ overallStats.totalRecords }}</div>
              <div class="stat-label">测试记录</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 选择表单进行分析 -->
    <el-card class="mb-6">
      <template #header>
        <div class="flex items-center justify-between">
          <span class="font-bold">选择表单</span>
        </div>
      </template>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-select
            v-model="selectedFormId"
            placeholder="请选择体测表单"
            class="w-full"
            @change="handleFormChange"
          >
            <el-option
              v-for="form in forms"
              :key="form.id"
              :label="`${form.formName} (${form.academicYear})`"
              :value="form.id"
            />
          </el-select>
        </el-col>
        <el-col :span="12">
          <el-select
            v-model="selectedGradeId"
            placeholder="选择年级（可选）"
            class="w-full"
            clearable
            @change="handleGradeChange"
          >
            <el-option
              v-for="grade in grades"
              :key="grade.id"
              :label="grade.gradeName"
              :value="grade.id"
            />
          </el-select>
        </el-col>
      </el-row>
    </el-card>

    <!-- 表单统计数据 -->
    <div v-if="selectedFormId && formStats" v-loading="loading">
      <!-- 整体统计 -->
      <el-row :gutter="20" class="mb-6">
        <el-col :span="8">
          <el-card>
            <el-statistic title="总记录数" :value="formStats.overall.totalRecords" />
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card>
            <el-statistic title="平均分" :value="formStats.overall.avgScore" :precision="2" />
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card>
            <el-statistic
              title="优秀率"
              :value="excellentRate"
              suffix="%"
              :precision="1"
            />
          </el-card>
        </el-col>
      </el-row>

      <!-- 图表 -->
      <el-row :gutter="20" class="mb-6">
        <!-- 分数分布 -->
        <el-col :span="12">
          <el-card>
            <template #header>
              <span class="font-bold">分数分布</span>
            </template>
            <v-chart :option="scoreDistributionOption" style="height: 300px" />
          </el-card>
        </el-col>

        <!-- 年级对比 -->
        <el-col :span="12">
          <el-card>
            <template #header>
              <span class="font-bold">年级平均分对比</span>
            </template>
            <v-chart :option="gradeComparisonOption" style="height: 300px" />
          </el-card>
        </el-col>
      </el-row>

      <!-- 各项目平均分 -->
      <el-row :gutter="20" class="mb-6">
        <el-col :span="24">
          <el-card>
            <template #header>
              <span class="font-bold">各项目平均分</span>
            </template>
            <v-chart :option="itemStatsOption" style="height: 400px" />
          </el-card>
        </el-col>
      </el-row>

      <!-- 历史趋势 -->
      <el-row :gutter="20">
        <el-col :span="24">
          <el-card>
            <template #header>
              <span class="font-bold">历史趋势</span>
            </template>
            <v-chart :option="trendOption" style="height: 400px" />
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { PieChart, BarChart, LineChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components';
import VChart from 'vue-echarts';
import { ElMessage } from 'element-plus';
import { getOverallStats, getFormStats, getTrendData } from '@/api/statistics';
import { getForms } from '@/api/forms';
import { getGrades } from '@/api/grades';
import type { PhysicalTestForm } from '@/types/models';

// 注册 ECharts 组件
use([
  CanvasRenderer,
  PieChart,
  BarChart,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
]);

const loading = ref(false);
const overallStats = ref<any>({
  totalStudents: 0,
  totalClasses: 0,
  totalForms: 0,
  totalRecords: 0
});

const forms = ref<PhysicalTestForm[]>([]);
const grades = ref<any[]>([]);
const selectedFormId = ref<number | null>(null);
const selectedGradeId = ref<number | null>(null);

const formStats = ref<any>(null);
const trendData = ref<any[]>([]);

// 优秀率
const excellentRate = computed(() => {
  if (!formStats.value) return 0;
  const total = formStats.value.overall.totalRecords;
  const excellent = formStats.value.overall.scoreDistribution.excellent;
  return total > 0 ? (excellent / total * 100) : 0;
});

// 分数分布图表配置
const scoreDistributionOption = computed(() => {
  if (!formStats.value) return {};

  const dist = formStats.value.overall.scoreDistribution;
  return {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        name: '分数分布',
        type: 'pie',
        radius: '50%',
        data: [
          { value: dist.excellent, name: '优秀 (≥90)' },
          { value: dist.good, name: '良好 (80-89)' },
          { value: dist.pass, name: '及格 (60-79)' },
          { value: dist.fail, name: '不及格 (<60)' }
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  };
});

// 年级对比图表配置
const gradeComparisonOption = computed(() => {
  if (!formStats.value || !formStats.value.gradeStats) return {};

  const gradeStats = formStats.value.gradeStats;
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    xAxis: {
      type: 'category',
      data: gradeStats.map((g: any) => g.gradeName)
    },
    yAxis: {
      type: 'value',
      name: '平均分',
      min: 0,
      max: 100
    },
    series: [
      {
        name: '平均分',
        type: 'bar',
        data: gradeStats.map((g: any) => Number(g.avgScore)),
        itemStyle: {
          color: '#409eff'
        }
      }
    ]
  };
});

// 各项目平均分图表配置
const itemStatsOption = computed(() => {
  if (!formStats.value || !formStats.value.itemStats) return {};

  const itemStats = formStats.value.itemStats;
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      name: '平均分',
      min: 0,
      max: 100
    },
    yAxis: {
      type: 'category',
      data: itemStats.map((item: any) => item.itemName)
    },
    series: [
      {
        name: '平均分',
        type: 'bar',
        data: itemStats.map((item: any) => Number(item.avgScore)),
        itemStyle: {
          color: '#67c23a'
        }
      }
    ]
  };
});

// 历史趋势图表配置
const trendOption = computed(() => {
  if (trendData.value.length === 0) return {};

  return {
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: trendData.value.map(t => `${t.academicYear}\n${t.formName}`)
    },
    yAxis: {
      type: 'value',
      name: '平均分',
      min: 0,
      max: 100
    },
    series: [
      {
        name: '平均分',
        type: 'line',
        data: trendData.value.map(t => Number(t.avgScore)),
        smooth: true,
        itemStyle: {
          color: '#e6a23c'
        },
        areaStyle: {
          opacity: 0.3
        }
      }
    ]
  };
});

/**
 * 获取整体统计
 */
const fetchOverallStats = async () => {
  try {
    const res = await getOverallStats();
    if (res.success) {
      overallStats.value = res.data;
    }
  } catch (error: any) {
    ElMessage.error('获取整体统计失败');
  }
};

/**
 * 获取表单列表
 */
const fetchForms = async () => {
  try {
    const res = await getForms({ status: 'published' });
    if (res.success) {
      forms.value = res.data || [];
    }
  } catch (error: any) {
    ElMessage.error('获取表单列表失败');
  }
};

/**
 * 获取年级列表
 */
const fetchGrades = async () => {
  try {
    const res = await getGrades();
    if (res.success) {
      grades.value = res.data || [];
    }
  } catch (error: any) {
    ElMessage.error('获取年级列表失败');
  }
};

/**
 * 当选择表单时
 */
const handleFormChange = async () => {
  if (!selectedFormId.value) return;

  try {
    loading.value = true;
    const res = await getFormStats(selectedFormId.value);
    if (res.success) {
      formStats.value = res.data;
    }

    // 获取历史趋势数据
    await fetchTrendData();
  } catch (error: any) {
    ElMessage.error('获取表单统计失败');
  } finally {
    loading.value = false;
  }
};

/**
 * 当选择年级时
 */
const handleGradeChange = async () => {
  await fetchTrendData();
};

/**
 * 获取历史趋势数据
 */
const fetchTrendData = async () => {
  try {
    const params: any = {};
    if (selectedGradeId.value) {
      params.gradeId = selectedGradeId.value;
    }

    const res = await getTrendData(params);
    if (res.success) {
      trendData.value = res.data || [];
    }
  } catch (error: any) {
    ElMessage.error('获取趋势数据失败');
  }
};

onMounted(() => {
  fetchOverallStats();
  fetchForms();
  fetchGrades();
});
</script>

<style scoped lang="scss">
.stat-card {
  display: flex;
  align-items: center;
  gap: 15px;

  .stat-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 60px;
    height: 60px;
    border-radius: 10px;
    color: white;
  }

  .stat-info {
    flex: 1;

    .stat-value {
      font-size: 28px;
      font-weight: bold;
      color: #333;
    }

    .stat-label {
      font-size: 14px;
      color: #999;
      margin-top: 5px;
    }
  }
}
</style>
