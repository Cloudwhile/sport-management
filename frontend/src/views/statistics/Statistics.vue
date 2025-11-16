<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { Bar, Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions
} from 'chart.js'
import Card from '@/components/common/Card.vue'
import Select, { type SelectOption } from '@/components/common/Select.vue'
import Button from '@/components/common/Button.vue'
import Loading from '@/components/common/Loading.vue'
import statisticsAPI from '@/api/statistics'
import formsAPI from '@/api/forms'
import classesAPI from '@/api/classes'
import { useToast } from '@/composables/useToast'
import type { StatisticsSummaryResponse, PhysicalTestForm, Class } from '@/types'
import {
  ChartBarIcon,
  AcademicCapIcon,
  UserGroupIcon,
  TrophyIcon,
  CheckCircleIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/vue/24/outline'

// 注册 Chart.js 组件
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

const toast = useToast()

// 统计维度枚举
enum StatsDimension {
  SCHOOL = 'school',
  GRADE = 'grade',
  CLASS = 'class'
}

// 表单状态
const forms = ref<PhysicalTestForm[]>([])
const classes = ref<Class[]>([])
const loading = ref(false)
const dataLoading = ref(false)

// 筛选条件
const filters = reactive({
  formId: undefined as number | undefined,
  dimension: StatsDimension.SCHOOL as StatsDimension,
  gradeLevel: undefined as string | undefined,
  classId: undefined as number | undefined
})

// 统计数据
const statsData = ref<StatisticsSummaryResponse | null>(null)

// 学生历史查询
const studentHistory = reactive({
  studentId: '',
  loading: false,
  data: null as any
})

// 表单选项
const formOptions = computed<SelectOption[]>(() => {
  return forms.value.map(form => ({
    label: `${form.formName} (${form.academicYear})`,
    value: form.id
  }))
})

// 维度选项
const dimensionOptions: SelectOption[] = [
  { label: '全校统计', value: StatsDimension.SCHOOL },
  { label: '年级统计', value: StatsDimension.GRADE },
  { label: '班级统计', value: StatsDimension.CLASS }
]

// 年级选项
const gradeOptions: SelectOption[] = [
  { label: '一年级', value: '1' },
  { label: '二年级', value: '2' },
  { label: '三年级', value: '3' },
  { label: '四年级', value: '4' },
  { label: '五年级', value: '5' },
  { label: '六年级', value: '6' },
  { label: '七年级', value: '7' },
  { label: '八年级', value: '8' },
  { label: '九年级', value: '9' }
]

// 班级选项
const classOptions = computed<SelectOption[]>(() => {
  return classes.value.map(cls => ({
    label: `${cls.cohort} ${cls.className}`,
    value: cls.id
  }))
})

// 分数分布图表数据
const scoreDistributionData = computed<ChartData<'bar'>>(() => {
  if (!statsData.value) {
    return {
      labels: [],
      datasets: []
    }
  }

  const dist = statsData.value.gradeDistribution
  return {
    labels: ['不及格 (0-59)', '及格 (60-79)', '良好 (80-89)', '优秀 (90-100)'],
    datasets: [
      {
        label: '学生人数',
        data: [dist.fail, dist.pass, dist.good, dist.excellent],
        backgroundColor: [
          'rgba(239, 68, 68, 0.7)',   // 红色 - 不及格
          'rgba(251, 191, 36, 0.7)',  // 黄色 - 及格
          'rgba(59, 130, 246, 0.7)',  // 蓝色 - 良好
          'rgba(34, 197, 94, 0.7)'    // 绿色 - 优秀
        ],
        borderColor: [
          'rgb(239, 68, 68)',
          'rgb(251, 191, 36)',
          'rgb(59, 130, 246)',
          'rgb(34, 197, 94)'
        ],
        borderWidth: 2
      }
    ]
  }
})

// 分数分布图表配置
const scoreDistributionOptions: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    title: {
      display: true,
      text: '成绩分布统计',
      font: {
        size: 16,
        weight: 'bold'
      }
    },
    tooltip: {
      callbacks: {
        label: (context) => {
          return `学生人数: ${context.parsed.y} 人`
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        stepSize: 1
      },
      title: {
        display: true,
        text: '人数'
      }
    },
    x: {
      title: {
        display: true,
        text: '分数段'
      }
    }
  }
}

// 各项目平均成绩图表数据
const itemAverageData = computed<ChartData<'bar'>>(() => {
  if (!statsData.value?.itemSummaries) {
    return {
      labels: [],
      datasets: []
    }
  }

  const items = statsData.value.itemSummaries
  return {
    labels: items.map(item => item.itemName),
    datasets: [
      {
        label: '平均成绩',
        data: items.map(item => item.averageScore),
        backgroundColor: 'rgba(99, 102, 241, 0.7)',
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 2
      }
    ]
  }
})

// 各项目平均成绩图表配置
const itemAverageOptions: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y',
  plugins: {
    legend: {
      display: false
    },
    title: {
      display: true,
      text: '各项目平均成绩',
      font: {
        size: 16,
        weight: 'bold'
      }
    },
    tooltip: {
      callbacks: {
        label: (context) => {
          return `平均分: ${context.parsed.x?.toFixed(2) || '0'}`
        }
      }
    }
  },
  scales: {
    x: {
      beginAtZero: true,
      max: 100,
      title: {
        display: true,
        text: '平均分'
      }
    }
  }
}

// 学生历史成绩图表数据
const studentHistoryData = computed<ChartData<'line'>>(() => {
  if (!studentHistory.data?.records) {
    return {
      labels: [],
      datasets: []
    }
  }

  const records = studentHistory.data.records
  return {
    labels: records.map((r: any) => r.academicYear),
    datasets: [
      {
        label: '总分',
        data: records.map((r: any) => r.totalScore),
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.3,
        fill: true
      }
    ]
  }
})

// 学生历史成绩图表配置
const studentHistoryOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    title: {
      display: true,
      text: '学生历年成绩趋势',
      font: {
        size: 16,
        weight: 'bold'
      }
    },
    tooltip: {
      callbacks: {
        label: (context) => {
          return `总分: ${context.parsed.y?.toFixed(2) || '0'}`
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      max: 100,
      title: {
        display: true,
        text: '总分'
      }
    },
    x: {
      title: {
        display: true,
        text: '学年'
      }
    }
  }
}

// 加载表单和班级列表
const loadFormAndClassData = async () => {
  loading.value = true
  try {
    const [formsRes, classesRes] = await Promise.all([
      formsAPI.getForms({ pageSize: 100 }),
      classesAPI.getClasses({ pageSize: 1000 })
    ])
    forms.value = formsRes.data
    classes.value = classesRes.data
  } catch (error: any) {
    toast.error(error.message || '加载数据失败')
  } finally {
    loading.value = false
  }
}

// 查询统计数据
const queryStats = async () => {
  if (!filters.formId) {
    toast.warning('请选择体测表单')
    return
  }

  dataLoading.value = true
  try {
    let response: StatisticsSummaryResponse

    switch (filters.dimension) {
      case StatsDimension.SCHOOL:
        response = await statisticsAPI.getFormStats(filters.formId)
        break
      case StatsDimension.GRADE:
        if (!filters.gradeLevel) {
          toast.warning('请选择年级')
          return
        }
        response = await statisticsAPI.getGradeStats(filters.formId, filters.gradeLevel)
        break
      case StatsDimension.CLASS:
        if (!filters.classId) {
          toast.warning('请选择班级')
          return
        }
        response = await statisticsAPI.getClassStats(filters.formId, filters.classId)
        break
      default:
        response = await statisticsAPI.getFormStats(filters.formId)
    }

    statsData.value = response
    toast.success('统计数据加载成功')
  } catch (error: any) {
    toast.error(error.message || '查询统计数据失败')
    statsData.value = null
  } finally {
    dataLoading.value = false
  }
}

// 查询学生历史成绩
const queryStudentHistory = async () => {
  if (!studentHistory.studentId) {
    toast.warning('请输入学生ID')
    return
  }

  studentHistory.loading = true
  try {
    const response = await statisticsAPI.getStudentHistory(Number(studentHistory.studentId))
    studentHistory.data = response
    toast.success('学生历史数据加载成功')
  } catch (error: any) {
    toast.error(error.message || '查询学生历史数据失败')
    studentHistory.data = null
  } finally {
    studentHistory.loading = false
  }
}

// 重置维度相关的筛选条件
watch(() => filters.dimension, () => {
  filters.gradeLevel = undefined
  filters.classId = undefined
})

// 组件挂载时加载数据
onMounted(() => {
  loadFormAndClassData()
})
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-6">
      <!-- 页面标题 -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">统计分析</h1>
          <p class="mt-1 text-sm text-gray-600">多维度数据统计与可视化分析</p>
        </div>
      </div>

      <!-- 筛选区域 -->
      <Card title="筛选条件">
        <div v-if="loading" class="flex justify-center py-8">
          <Loading />
        </div>
        <div v-else class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <!-- 选择体测表单 -->
          <Select
            v-model="filters.formId"
            :options="formOptions"
            label="体测表单"
            placeholder="请选择体测表单"
          />

          <!-- 选择统计维度 -->
          <Select
            v-model="filters.dimension"
            :options="dimensionOptions"
            label="统计维度"
            placeholder="请选择统计维度"
          />

          <!-- 选择年级（年级统计时显示） -->
          <Select
            v-if="filters.dimension === StatsDimension.GRADE"
            v-model="filters.gradeLevel"
            :options="gradeOptions"
            label="选择年级"
            placeholder="请选择年级"
          />

          <!-- 选择班级（班级统计时显示） -->
          <Select
            v-if="filters.dimension === StatsDimension.CLASS"
            v-model="filters.classId"
            :options="classOptions"
            label="选择班级"
            placeholder="请选择班级"
          />

          <!-- 查询按钮 -->
          <div class="flex items-end">
            <Button
              variant="primary"
              @click="queryStats"
              :disabled="dataLoading"
              class="w-full"
            >
              <ChartBarIcon class="h-5 w-5 mr-2" />
              {{ dataLoading ? '查询中...' : '查询统计' }}
            </Button>
          </div>
        </div>
      </Card>

      <!-- 数据加载中 -->
      <div v-if="dataLoading" class="flex justify-center py-12">
        <Loading />
      </div>

      <!-- 统计数据展示 -->
      <template v-else-if="statsData">
        <!-- 整体统计卡片 -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <!-- 参与学生总数 -->
          <Card>
            <div class="flex items-center">
              <div class="flex-shrink-0 p-3 bg-blue-100 rounded-lg">
                <UserGroupIcon class="h-8 w-8 text-blue-600" />
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">参与学生</p>
                <p class="text-2xl font-bold text-gray-900">{{ statsData.totalStudents }}</p>
              </div>
            </div>
          </Card>

          <!-- 完成率 -->
          <Card>
            <div class="flex items-center">
              <div class="flex-shrink-0 p-3 bg-green-100 rounded-lg">
                <CheckCircleIcon class="h-8 w-8 text-green-600" />
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">完成率</p>
                <p class="text-2xl font-bold text-gray-900">{{ (statsData.submissionRate * 100).toFixed(1) }}%</p>
              </div>
            </div>
          </Card>

          <!-- 平均分 -->
          <Card>
            <div class="flex items-center">
              <div class="flex-shrink-0 p-3 bg-purple-100 rounded-lg">
                <AcademicCapIcon class="h-8 w-8 text-purple-600" />
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">平均分</p>
                <p class="text-2xl font-bold text-gray-900">{{ statsData.averageScore.toFixed(2) }}</p>
              </div>
            </div>
          </Card>

          <!-- 优秀率 -->
          <Card>
            <div class="flex items-center">
              <div class="flex-shrink-0 p-3 bg-yellow-100 rounded-lg">
                <TrophyIcon class="h-8 w-8 text-yellow-600" />
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">优秀率</p>
                <p class="text-2xl font-bold text-gray-900">
                  {{ ((statsData.gradeDistribution.excellent / statsData.submittedCount) * 100).toFixed(1) }}%
                </p>
              </div>
            </div>
          </Card>

          <!-- 及格率 -->
          <Card>
            <div class="flex items-center">
              <div class="flex-shrink-0 p-3 bg-indigo-100 rounded-lg">
                <ClipboardDocumentCheckIcon class="h-8 w-8 text-indigo-600" />
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">及格率</p>
                <p class="text-2xl font-bold text-gray-900">
                  {{ (((statsData.submittedCount - statsData.gradeDistribution.fail) / statsData.submittedCount) * 100).toFixed(1) }}%
                </p>
              </div>
            </div>
          </Card>
        </div>

        <!-- 图表区域 -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- 分数分布图 -->
          <Card>
            <div class="h-80">
              <Bar
                :data="scoreDistributionData"
                :options="scoreDistributionOptions"
              />
            </div>
          </Card>

          <!-- 各项目平均成绩 -->
          <Card v-if="statsData.itemSummaries && statsData.itemSummaries.length > 0">
            <div class="h-80">
              <Bar
                :data="itemAverageData"
                :options="itemAverageOptions"
              />
            </div>
          </Card>
        </div>

        <!-- 班级统计详情表格（全校/年级统计时显示） -->
        <Card
          v-if="statsData.classSummaries && statsData.classSummaries.length > 0"
          title="班级统计详情"
        >
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    班级名称
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    总人数
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    已提交
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    平均分
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    及格率
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    优秀率
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr
                  v-for="cls in statsData.classSummaries"
                  :key="cls.classId"
                  class="hover:bg-gray-50"
                >
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {{ cls.className }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ cls.totalStudents }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ cls.submittedCount }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ cls.averageScore.toFixed(2) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ (cls.passRate * 100).toFixed(1) }}%
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ (cls.excellentRate * 100).toFixed(1) }}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        <!-- 项目统计详情表格 -->
        <Card
          v-if="statsData.itemSummaries && statsData.itemSummaries.length > 0"
          title="项目统计详情"
        >
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    项目名称
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    项目代码
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    平均分
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    及格率
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    最高值
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    最低值
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr
                  v-for="item in statsData.itemSummaries"
                  :key="item.itemCode"
                  class="hover:bg-gray-50"
                >
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {{ item.itemName }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ item.itemCode }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ item.averageScore.toFixed(2) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ (item.passRate * 100).toFixed(1) }}%
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ item.maxValue }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ item.minValue }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </template>

      <!-- 学生历史查询 -->
      <Card title="学生历史成绩查询">
        <div class="space-y-4">
          <div class="flex gap-4">
            <div class="flex-1">
              <input
                v-model="studentHistory.studentId"
                type="text"
                placeholder="请输入学生ID"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                @keyup.enter="queryStudentHistory"
              />
            </div>
            <Button
              variant="primary"
              @click="queryStudentHistory"
              :disabled="studentHistory.loading"
            >
              {{ studentHistory.loading ? '查询中...' : '查询' }}
            </Button>
          </div>

          <!-- 学生历史数据展示 -->
          <div v-if="studentHistory.data" class="space-y-4">
            <!-- 学生基本信息 -->
            <div class="p-4 bg-gray-50 rounded-lg">
              <h4 class="text-sm font-semibold text-gray-700 mb-2">学生信息</h4>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span class="text-gray-600">姓名：</span>
                  <span class="font-medium">{{ studentHistory.data.student?.name }}</span>
                </div>
                <div>
                  <span class="text-gray-600">学号：</span>
                  <span class="font-medium">{{ studentHistory.data.student?.studentIdSchool }}</span>
                </div>
                <div>
                  <span class="text-gray-600">性别：</span>
                  <span class="font-medium">{{ studentHistory.data.student?.gender === 'male' ? '男' : '女' }}</span>
                </div>
                <div>
                  <span class="text-gray-600">记录数：</span>
                  <span class="font-medium">{{ studentHistory.data.records?.length || 0 }} 次</span>
                </div>
              </div>
            </div>

            <!-- 成绩趋势图 -->
            <div v-if="studentHistory.data.records && studentHistory.data.records.length > 0" class="h-80">
              <Line
                :data="studentHistoryData"
                :options="studentHistoryOptions"
              />
            </div>

            <!-- 历史记录表格 -->
            <div v-if="studentHistory.data.records && studentHistory.data.records.length > 0" class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      学年
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      表单名称
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      总分
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      年级
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr
                    v-for="record in studentHistory.data.records"
                    :key="record.id"
                    class="hover:bg-gray-50"
                  >
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {{ record.academicYear }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {{ record.formName }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {{ record.totalScore?.toFixed(2) || '-' }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {{ record.gradeLevel || '-' }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>
