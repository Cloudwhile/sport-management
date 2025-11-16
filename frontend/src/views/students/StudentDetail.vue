<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Line, Radar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartData,
  type ChartOptions
} from 'chart.js'
import Card from '@/components/common/Card.vue'
import Button from '@/components/common/Button.vue'
import Loading from '@/components/common/Loading.vue'
import Modal from '@/components/common/Modal.vue'
import statisticsAPI from '@/api/statistics'
import { useToast } from '@/composables/useToast'
import type { StudentHistoryResponse, StudentTestRecord } from '@/types'
import {
  ArrowLeftIcon,
  UserIcon,
  AcademicCapIcon,
  TrophyIcon,
  ChartBarIcon,
  CalendarIcon,
  EyeIcon
} from '@heroicons/vue/24/outline'

// 注册 Chart.js 组件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
)

const route = useRoute()
const router = useRouter()
const toast = useToast()

// 状态
const loading = ref(false)
const studentData = ref<StudentHistoryResponse | null>(null)
const selectedRecord = ref<StudentTestRecord | null>(null)
const showRecordModal = ref(false)

// 获取学生ID
const studentId = computed(() => Number(route.params.id))

// 格式化性别
const formatGender = (gender: string) => {
  return gender === 'male' ? '男' : '女'
}

// 格式化日期
const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

// 格式化分数
const formatScore = (score: any) => {
  if (score === null || score === undefined) return '-'
  const numScore = Number(score)
  if (isNaN(numScore)) return '-'
  return numScore.toFixed(2)
}

// 格式化等级
const getGradeBadgeClass = (gradeLevel: string) => {
  const grades: Record<string, string> = {
    excellent: 'bg-green-100 text-green-800',
    good: 'bg-blue-100 text-blue-800',
    pass: 'bg-yellow-100 text-yellow-800',
    fail: 'bg-red-100 text-red-800'
  }
  return grades[gradeLevel] || 'bg-gray-100 text-gray-800'
}

const getGradeText = (gradeLevel: string) => {
  const grades: Record<string, string> = {
    excellent: '优秀',
    good: '良好',
    pass: '及格',
    fail: '不及格'
  }
  return grades[gradeLevel] || '未评分'
}

// 统计数据
const statistics = computed(() => {
  if (!studentData.value || !studentData.value.history.length) {
    return {
      totalCount: 0,
      averageScore: 0,
      maxScore: 0,
      minScore: 0,
      gradeDistribution: {
        excellent: 0,
        good: 0,
        pass: 0,
        fail: 0
      }
    }
  }

  const history = studentData.value.history
  // 确保 totalScore 转换为数字
  const scores = history.map(r => Number(r.totalScore) || 0)

  const gradeDistribution = {
    excellent: 0,
    good: 0,
    pass: 0,
    fail: 0
  }

  history.forEach(record => {
    const grade = record.gradeLevel
    if (grade in gradeDistribution) {
      gradeDistribution[grade as keyof typeof gradeDistribution]++
    }
  })

  return {
    totalCount: history.length,
    averageScore: scores.reduce((a, b) => a + b, 0) / scores.length,
    maxScore: Math.max(...scores),
    minScore: Math.min(...scores),
    gradeDistribution
  }
})

// 成绩趋势图数据
const trendChartData = computed<ChartData<'line'>>(() => {
  if (!studentData.value || !studentData.value.history.length) {
    return {
      labels: [],
      datasets: []
    }
  }

  // 按时间排序
  const sortedHistory = [...studentData.value.history].sort((a, b) =>
    new Date(a.testDate).getTime() - new Date(b.testDate).getTime()
  )

  return {
    labels: sortedHistory.map(r => r.formName),
    datasets: [
      {
        label: '总分',
        data: sortedHistory.map(r => Number(r.totalScore) || 0),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.3,
        fill: true
      }
    ]
  }
})

const trendChartOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    title: {
      display: true,
      text: '体测成绩趋势',
      font: {
        size: 16,
        weight: 'bold'
      }
    },
    tooltip: {
      callbacks: {
        label: (context) => `总分: ${context.parsed.y} 分`
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
        text: '体测表单'
      }
    }
  }
}

// 雷达图数据（最近一次体测）
const radarChartData = computed<ChartData<'radar'>>(() => {
  if (!studentData.value || !studentData.value.history.length) {
    return {
      labels: [],
      datasets: []
    }
  }

  // 获取最近一次体测
  const latestRecord = studentData.value.history.reduce((latest, current) => {
    return new Date(current.testDate) > new Date(latest.testDate) ? current : latest
  })

  const scores = latestRecord.scores || {}
  const itemNames: Record<string, string> = {
    bmi: 'BMI',
    lung_capacity: '肺活量',
    sprint_50m: '50米跑',
    standing_jump: '立定跳远',
    sit_reach: '坐位体前屈',
    situp_1min: '仰卧起坐',
    pullup: '引体向上',
    run_800m: '800米跑',
    run_1000m: '1000米跑'
  }

  const labels: string[] = []
  const data: number[] = []

  Object.entries(scores).forEach(([itemCode, score]) => {
    if (itemCode !== 'height' && itemCode !== 'weight' && itemNames[itemCode]) {
      labels.push(itemNames[itemCode])
      data.push(score)
    }
  })

  return {
    labels,
    datasets: [
      {
        label: '各项目得分',
        data,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        pointBackgroundColor: 'rgb(34, 197, 94)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(34, 197, 94)'
      }
    ]
  }
})

const radarChartOptions: ChartOptions<'radar'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    title: {
      display: true,
      text: '最近一次体测各项目得分',
      font: {
        size: 16,
        weight: 'bold'
      }
    }
  },
  scales: {
    r: {
      beginAtZero: true,
      max: 100,
      ticks: {
        stepSize: 20
      }
    }
  }
}

// 加载学生数据
const loadStudentData = async () => {
  loading.value = true
  try {
    const response = await statisticsAPI.getStudentHistory(studentId.value)
    studentData.value = response
  } catch (error: any) {
    toast.error(error.message || '加载学生数据失败')
    // 如果加载失败，返回上一页
    setTimeout(() => {
      router.back()
    }, 1500)
  } finally {
    loading.value = false
  }
}

// 查看体测记录详情
const viewRecordDetail = (record: StudentTestRecord) => {
  selectedRecord.value = record
  showRecordModal.value = true
}

// 返回上一页 - 如果从班级详情页来的，返回班级详情页
const goBack = () => {
  // 尝试从路由历史返回，如果没有历史则跳转到学生管理页
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/students')
  }
}

// 组件挂载时加载数据
onMounted(() => {
  loadStudentData()
})
</script>

<template>
  <div class="space-y-6">
    <!-- 页面标题和导航 -->
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-4">
        <Button variant="secondary" size="sm" @click="goBack">
          <ArrowLeftIcon class="h-5 w-5 mr-1" />
          返回
        </Button>
        <div>
          <h1 class="text-2xl font-bold text-gray-900">
            {{ studentData?.student.name || '学生详情' }}
          </h1>
          <p class="mt-1 text-sm text-gray-600">查看学生的体测历史数据和成绩分析</p>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="flex justify-center py-12">
      <Loading />
    </div>

    <!-- 学生数据 -->
    <template v-else-if="studentData">
      <!-- 学生基本信息 -->
      <Card title="基本信息">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="flex items-center space-x-3">
            <div class="flex-shrink-0 p-2 bg-blue-100 rounded-lg">
              <UserIcon class="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p class="text-sm text-gray-500">姓名</p>
              <p class="font-medium text-gray-900">{{ studentData.student.name }}</p>
            </div>
          </div>
          <div class="flex items-center space-x-3">
            <div class="flex-shrink-0 p-2 bg-purple-100 rounded-lg">
              <UserIcon class="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p class="text-sm text-gray-500">性别</p>
              <p class="font-medium text-gray-900">{{ formatGender(studentData.student.gender) }}</p>
            </div>
          </div>
          <div class="flex items-center space-x-3">
            <div class="flex-shrink-0 p-2 bg-green-100 rounded-lg">
              <CalendarIcon class="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p class="text-sm text-gray-500">出生日期</p>
              <p class="font-medium text-gray-900">{{ formatDate(studentData.student.birthDate) }}</p>
            </div>
          </div>
          <div class="flex items-center space-x-3">
            <div class="flex-shrink-0 p-2 bg-yellow-100 rounded-lg">
              <AcademicCapIcon class="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p class="text-sm text-gray-500">国家学籍号</p>
              <p class="font-medium text-gray-900">{{ studentData.student.studentIdNational }}</p>
            </div>
          </div>
          <div class="flex items-center space-x-3">
            <div class="flex-shrink-0 p-2 bg-indigo-100 rounded-lg">
              <AcademicCapIcon class="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <p class="text-sm text-gray-500">校内学号</p>
              <p class="font-medium text-gray-900">{{ studentData.student.studentIdSchool }}</p>
            </div>
          </div>
        </div>
      </Card>

      <!-- 统计概览 -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div class="flex items-center">
            <div class="flex-shrink-0 p-3 bg-blue-100 rounded-lg">
              <ChartBarIcon class="h-8 w-8 text-blue-600" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">参与次数</p>
              <p class="text-2xl font-bold text-gray-900">{{ statistics.totalCount }}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div class="flex items-center">
            <div class="flex-shrink-0 p-3 bg-purple-100 rounded-lg">
              <AcademicCapIcon class="h-8 w-8 text-purple-600" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">平均分</p>
              <p class="text-2xl font-bold text-gray-900">
                {{ statistics.averageScore.toFixed(2) }}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div class="flex items-center">
            <div class="flex-shrink-0 p-3 bg-green-100 rounded-lg">
              <TrophyIcon class="h-8 w-8 text-green-600" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">最高分</p>
              <p class="text-2xl font-bold text-gray-900">{{ statistics.maxScore.toFixed(2) }}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div class="flex items-center">
            <div class="flex-shrink-0 p-3 bg-red-100 rounded-lg">
              <ChartBarIcon class="h-8 w-8 text-red-600" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">最低分</p>
              <p class="text-2xl font-bold text-gray-900">{{ statistics.minScore.toFixed(2) }}</p>
            </div>
          </div>
        </Card>
      </div>

      <!-- 等级分布 -->
      <Card title="等级分布">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="text-center p-4 bg-green-50 rounded-lg">
            <p class="text-sm text-gray-600 mb-1">优秀</p>
            <p class="text-2xl font-bold text-green-600">{{ statistics.gradeDistribution.excellent }}</p>
            <p class="text-xs text-gray-500 mt-1">
              {{ statistics.totalCount > 0 ? ((statistics.gradeDistribution.excellent / statistics.totalCount) * 100).toFixed(1) : 0 }}%
            </p>
          </div>
          <div class="text-center p-4 bg-blue-50 rounded-lg">
            <p class="text-sm text-gray-600 mb-1">良好</p>
            <p class="text-2xl font-bold text-blue-600">{{ statistics.gradeDistribution.good }}</p>
            <p class="text-xs text-gray-500 mt-1">
              {{ statistics.totalCount > 0 ? ((statistics.gradeDistribution.good / statistics.totalCount) * 100).toFixed(1) : 0 }}%
            </p>
          </div>
          <div class="text-center p-4 bg-yellow-50 rounded-lg">
            <p class="text-sm text-gray-600 mb-1">及格</p>
            <p class="text-2xl font-bold text-yellow-600">{{ statistics.gradeDistribution.pass }}</p>
            <p class="text-xs text-gray-500 mt-1">
              {{ statistics.totalCount > 0 ? ((statistics.gradeDistribution.pass / statistics.totalCount) * 100).toFixed(1) : 0 }}%
            </p>
          </div>
          <div class="text-center p-4 bg-red-50 rounded-lg">
            <p class="text-sm text-gray-600 mb-1">不及格</p>
            <p class="text-2xl font-bold text-red-600">{{ statistics.gradeDistribution.fail }}</p>
            <p class="text-xs text-gray-500 mt-1">
              {{ statistics.totalCount > 0 ? ((statistics.gradeDistribution.fail / statistics.totalCount) * 100).toFixed(1) : 0 }}%
            </p>
          </div>
        </div>
      </Card>

      <!-- 图表区域 -->
      <div v-if="studentData.history.length > 0" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- 成绩趋势图 -->
        <Card>
          <div class="h-80">
            <Line :data="trendChartData" :options="trendChartOptions" />
          </div>
        </Card>

        <!-- 雷达图 -->
        <Card>
          <div class="h-80">
            <Radar :data="radarChartData" :options="radarChartOptions" />
          </div>
        </Card>
      </div>

      <!-- 历史体测记录列表 -->
      <Card title="历史体测记录">
        <div v-if="studentData.history.length === 0" class="text-center py-12 text-gray-500">
          <p>暂无体测记录</p>
        </div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  体测表单
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  学年
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  测试日期
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  班级
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  总分
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  等级
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="record in studentData.history" :key="record.id" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ record.formName }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ record.academicYear }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ formatDate(record.testDate) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ record.cohort }} {{ record.className }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {{ formatScore(record.totalScore) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    :class="getGradeBadgeClass(record.gradeLevel)"
                    class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                  >
                    {{ getGradeText(record.gradeLevel) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                  <Button variant="secondary" size="sm" @click="viewRecordDetail(record)">
                    <EyeIcon class="h-4 w-4 mr-1" />
                    查看详情
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </template>

    <!-- 体测记录详情弹窗 -->
    <Modal
      v-model="showRecordModal"
      :title="`体测记录详情 - ${selectedRecord?.formName || ''}`"
      size="lg"
    >
      <template v-if="selectedRecord">
        <!-- 基本信息 -->
        <div class="mb-6">
          <h3 class="text-sm font-medium text-gray-700 mb-3">基本信息</h3>
          <div class="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
            <div>
              <p class="text-xs text-gray-500">学年</p>
              <p class="text-sm font-medium text-gray-900">{{ selectedRecord.academicYear }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-500">测试日期</p>
              <p class="text-sm font-medium text-gray-900">{{ formatDate(selectedRecord.testDate) }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-500">总分</p>
              <p class="text-sm font-medium text-gray-900">{{ formatScore(selectedRecord.totalScore) }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-500">等级</p>
              <span
                :class="getGradeBadgeClass(selectedRecord.gradeLevel)"
                class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
              >
                {{ getGradeText(selectedRecord.gradeLevel) }}
              </span>
            </div>
          </div>
        </div>

        <!-- 测试数据 -->
        <div>
          <h3 class="text-sm font-medium text-gray-700 mb-3">测试数据</h3>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">项目</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">测试数据</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">得分</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <template v-for="(value, key) in selectedRecord.testData" :key="key">
                  <tr v-if="value !== null && value !== undefined">
                    <td class="px-4 py-2 text-sm text-gray-900">
                      {{ getItemName(key as string) }}
                    </td>
                    <td class="px-4 py-2 text-sm text-gray-500">
                      {{ value }} {{ getItemUnit(key as string) }}
                    </td>
                    <td class="px-4 py-2 text-sm font-medium text-gray-900">
                      {{ formatScore(selectedRecord.scores[key]) }}
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </Modal>
  </div>
</template>

<script lang="ts">
// 获取项目名称
function getItemName(itemCode: string): string {
  const names: Record<string, string> = {
    height: '身高',
    weight: '体重',
    bmi: 'BMI',
    lung_capacity: '肺活量',
    sprint_50m: '50米跑',
    standing_jump: '立定跳远',
    sit_reach: '坐位体前屈',
    situp_1min: '仰卧起坐',
    pullup: '引体向上',
    run_800m: '800米跑',
    run_1000m: '1000米跑'
  }
  return names[itemCode] || itemCode
}

// 获取项目单位
function getItemUnit(itemCode: string): string {
  const units: Record<string, string> = {
    height: 'cm',
    weight: 'kg',
    bmi: '',
    lung_capacity: 'ml',
    sprint_50m: '秒',
    standing_jump: 'cm',
    sit_reach: 'cm',
    situp_1min: '次',
    pullup: '次',
    run_800m: '秒',
    run_1000m: '秒'
  }
  return units[itemCode] || ''
}
</script>
