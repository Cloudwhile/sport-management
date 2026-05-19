<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { Bar, Line, Doughnut, Radar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
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
import Select, { type SelectOption } from '@/components/common/Select.vue'
import Button from '@/components/common/Button.vue'
import Loading from '@/components/common/Loading.vue'
import statisticsAPI from '@/api/statistics'
import formsAPI from '@/api/forms'
import classesAPI from '@/api/classes'
import { useToast } from '@/composables/useToast'
import { formatHighSchoolClassName, formatSchoolGradeName } from '@/utils/classNameFormatter'
import { useSettingsStore } from '@/stores'
import type { StatisticsSummaryResponse, PhysicalTestForm, Class } from '@/types'
import {
  ChartBarIcon,
  AcademicCapIcon,
  UserGroupIcon,
  TrophyIcon,
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
)

const toast = useToast()
const settingsStore = useSettingsStore()
const schoolLevelLabel = computed(() => settingsStore.schoolLevelLabel)

enum StatsDimension {
  SCHOOL = 'school',
  GRADE = 'grade',
  CLASS = 'class'
}

const chartColors = [
  'rgb(37, 99, 235)',
  'rgb(16, 185, 129)',
  'rgb(245, 158, 11)',
  'rgb(239, 68, 68)',
  'rgb(139, 92, 246)',
  'rgb(14, 165, 233)'
]

const getChartColor = (index: number): string => chartColors[index % chartColors.length] || 'rgb(37, 99, 235)'


const forms = ref<PhysicalTestForm[]>([])
const classes = ref<Class[]>([])
const loading = ref(false)
const dataLoading = ref(false)
const statsData = ref<StatisticsSummaryResponse | null>(null)

const filters = reactive({
  formId: undefined as number | undefined,
  dimension: StatsDimension.SCHOOL as StatsDimension,
  gradeLevel: undefined as string | undefined,
  classId: undefined as number | undefined
})

const appliedFilters = reactive({
  formId: undefined as number | undefined,
  dimension: StatsDimension.SCHOOL as StatsDimension,
  gradeLevel: undefined as string | undefined,
  classId: undefined as number | undefined
})

const studentHistory = reactive({
  studentId: '',
  loading: false,
  data: null as any
})

const formOptions = computed<SelectOption[]>(() => {
  return forms.value.map(form => ({
    label: `${form.formName} (${form.academicYear})`,
    value: form.id
  }))
})

const dimensionOptions: SelectOption[] = [
  { label: '全校统计', value: StatsDimension.SCHOOL },
  { label: '级部统计', value: StatsDimension.GRADE },
  { label: '班级统计', value: StatsDimension.CLASS }
]

const selectedForm = computed(() => forms.value.find(form => Number(form.id) === Number(filters.formId)))


const availableCohortsForForm = computed(() => {
  const form = selectedForm.value
  const cohorts = new Set<string>()

  classes.value.forEach(cls => {
    if (cls.cohort) cohorts.add(String(cls.cohort))
  })

  form?.participatingCohorts?.forEach(cohort => {
    if (cohort) cohorts.add(String(cohort))
  })

  return [...cohorts]
    .sort((a, b) => Number(b) - Number(a))
})

const gradeOptions = computed<SelectOption[]>(() => {
  return availableCohortsForForm.value.map(cohort => ({
    label: `${schoolLevelLabel.value}${cohort}级`,
    value: cohort
  }))
})

const classOptions = computed<SelectOption[]>(() => {
  const cohorts = new Set(availableCohortsForForm.value.map(String))
  return classes.value
    .filter(cls => !selectedForm.value || cohorts.has(String(cls.cohort)))
    .map(cls => ({
      label: formatHighSchoolClassName(cls.cohort, cls.className, schoolLevelLabel.value),
      value: cls.id
    }))
})

const activeDimension = computed(() => statsData.value ? appliedFilters.dimension : filters.dimension)
const isSchoolScope = computed(() => activeDimension.value === StatsDimension.SCHOOL)
const isGradeScope = computed(() => activeDimension.value === StatsDimension.GRADE)
const isClassScope = computed(() => activeDimension.value === StatsDimension.CLASS)
const clampPercent = (value: number): number => {
  return Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0))
}

const formatPercent = (value: number, digits = 1): string => `${clampPercent(value).toFixed(digits)}%`
const formatRatio = (value: number, digits = 1): string => formatPercent((Number.isFinite(value) ? value : 0) * 100, digits)
const formatPercentFromCounts = (numerator: number, denominator: number, digits = 1): string => {
  return denominator > 0 ? formatPercent((numerator / denominator) * 100, digits) : formatPercent(0, digits)
}
const formatSigned = (value?: number, suffix = ''): string => {
  if (value === undefined || value === null || !Number.isFinite(value)) return '暂无环比'
  if (value === 0) return `持平${suffix}`
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}${suffix}`
}
const deltaClass = (value?: number): string => {
  if (value === undefined || value === null || value === 0) return 'text-gray-500 bg-gray-100'
  return value > 0 ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'
}
const heatmapCellClass = (value: number | null): string => {
  if (value === null) return 'bg-gray-50 text-gray-400'
  if (value >= 90) return 'bg-green-100 text-green-900'
  if (value >= 80) return 'bg-blue-100 text-blue-900'
  if (value >= 60) return 'bg-yellow-100 text-yellow-900'
  return 'bg-red-100 text-red-900'
}

const passRate = computed(() => {
  if (!statsData.value) return '0.0%'
  return formatPercentFromCounts(
    statsData.value.submittedCount - statsData.value.gradeDistribution.fail,
    statsData.value.submittedCount
  )
})

const excellentRate = computed(() => {
  if (!statsData.value) return '0.0%'
  return formatPercentFromCounts(statsData.value.gradeDistribution.excellent, statsData.value.submittedCount)
})

const scoreDistributionBarData = computed<ChartData<'bar'>>(() => {
  const dist = statsData.value?.gradeDistribution
  return {
    labels: ['不及格', '及格', '良好', '优秀'],
    datasets: [{
      label: '学生人数',
      data: dist ? [dist.fail, dist.pass, dist.good, dist.excellent] : [],
      backgroundColor: ['rgba(239, 68, 68, 0.72)', 'rgba(245, 158, 11, 0.72)', 'rgba(37, 99, 235, 0.72)', 'rgba(16, 185, 129, 0.72)'],
      borderColor: ['rgb(239, 68, 68)', 'rgb(245, 158, 11)', 'rgb(37, 99, 235)', 'rgb(16, 185, 129)'],
      borderWidth: 1
    }]
  }
})

const scoreDistributionDoughnutData = computed<ChartData<'doughnut'>>(() => {
  const dist = statsData.value?.gradeDistribution
  return {
    labels: ['优秀', '良好', '及格', '不及格'],
    datasets: [{
      data: dist ? [dist.excellent, dist.good, dist.pass, dist.fail] : [],
      backgroundColor: ['rgba(16, 185, 129, 0.86)', 'rgba(37, 99, 235, 0.86)', 'rgba(245, 158, 11, 0.86)', 'rgba(239, 68, 68, 0.86)'],
      borderColor: '#fff',
      borderWidth: 2
    }]
  }
})

const itemAverageData = computed<ChartData<'bar'>>(() => {
  const items = statsData.value?.itemSummaries || []
  return {
    labels: items.map(item => item.itemName),
    datasets: [{
      label: '平均分',
      data: items.map(item => item.averageScore),
      backgroundColor: 'rgba(37, 99, 235, 0.7)',
      borderColor: 'rgb(37, 99, 235)',
      borderWidth: 1
    }]
  }
})

const radarData = computed<ChartData<'radar'>>(() => {
  const radar = statsData.value?.radarSeries
  return {
    labels: radar?.labels || [],
    datasets: (radar?.series || []).map((series, index) => {
      const color = getChartColor(index)
      return {
        label: series.name,
        data: series.data,
        borderColor: color,
        backgroundColor: color.replace('rgb', 'rgba').replace(')', ', 0.16)'),
        pointBackgroundColor: color,
        pointBorderColor: '#fff',
        borderWidth: 2
      }
    })
  }
})

const trendData = computed<ChartData<'line'>>(() => {
  const trend = statsData.value?.trendSeries
  return {
    labels: trend?.labels || [],
    datasets: (trend?.series || []).map((series, index) => {
      const color = getChartColor(index)
      return {
        label: series.name,
        data: series.data,
        borderColor: color,
        backgroundColor: color.replace('rgb', 'rgba').replace(')', ', 0.12)'),
        tension: 0.28,
        fill: false,
        pointRadius: 3,
        pointHoverRadius: 5
      }
    })
  }
})

const trendMetricData = computed<ChartData<'line'>>(() => {
  const trend = statsData.value?.trendMetricSeries
  return {
    labels: trend?.labels || [],
    datasets: (trend?.series || []).map((series, index) => {
      const color = getChartColor(index)
      return {
        label: series.name,
        data: series.data,
        borderColor: color,
        backgroundColor: color.replace('rgb', 'rgba').replace(')', ', 0.1)'),
        tension: 0.28,
        fill: false,
        pointRadius: 3,
        pointHoverRadius: 5
      }
    })
  }
})

const itemTrendData = computed<ChartData<'line'>>(() => {
  const trend = statsData.value?.itemTrendSeries
  return {
    labels: trend?.labels || [],
    datasets: (trend?.series || []).slice(0, 6).map((series, index) => {
      const color = getChartColor(index)
      return {
        label: series.name,
        data: series.data,
        borderColor: color,
        backgroundColor: color.replace('rgb', 'rgba').replace(')', ', 0.1)'),
        tension: 0.28,
        fill: false,
        pointRadius: 3,
        pointHoverRadius: 5
      }
    })
  }
})

const classComparisonData = computed<ChartData<'bar'>>(() => {
  const classes = statsData.value?.classSummaries || []
  return {
    labels: classes.map(item => item.className),
    datasets: [
      {
        label: '平均分',
        data: classes.map(item => item.averageScore),
        backgroundColor: 'rgba(37, 99, 235, 0.7)'
      },
      {
        label: '及格率',
        data: classes.map(item => item.passRate),
        backgroundColor: 'rgba(16, 185, 129, 0.7)'
      },
      {
        label: '优秀率',
        data: classes.map(item => item.excellentRate),
        backgroundColor: 'rgba(139, 92, 246, 0.7)'
      }
    ]
  }
})

const classStackedDistributionData = computed<ChartData<'bar'>>(() => {
  const classes = statsData.value?.classSummaries || []
  return {
    labels: classes.map(item => item.className),
    datasets: [
      {
        label: '优秀',
        data: classes.map(item => item.gradeDistribution?.excellent || 0),
        backgroundColor: 'rgba(16, 185, 129, 0.78)'
      },
      {
        label: '良好',
        data: classes.map(item => item.gradeDistribution?.good || 0),
        backgroundColor: 'rgba(37, 99, 235, 0.78)'
      },
      {
        label: '及格',
        data: classes.map(item => item.gradeDistribution?.pass || 0),
        backgroundColor: 'rgba(245, 158, 11, 0.78)'
      },
      {
        label: '不及格',
        data: classes.map(item => item.gradeDistribution?.fail || 0),
        backgroundColor: 'rgba(239, 68, 68, 0.78)'
      }
    ]
  }
})

const genderComparisonData = computed<ChartData<'bar'>>(() => {
  const genders = statsData.value?.genderSummaries || []
  return {
    labels: genders.map(item => item.genderName),
    datasets: [
      {
        label: '平均分',
        data: genders.map(item => item.averageScore),
        backgroundColor: 'rgba(37, 99, 235, 0.72)'
      },
      {
        label: '优秀率',
        data: genders.map(item => item.excellentRate),
        backgroundColor: 'rgba(139, 92, 246, 0.72)'
      },
      {
        label: '及格率',
        data: genders.map(item => item.passRate),
        backgroundColor: 'rgba(16, 185, 129, 0.72)'
      }
    ]
  }
})

const classChartHeight = computed(() => {
  const count = statsData.value?.classSummaries?.length || 0
  return `${Math.max(384, count * 34)}px`
})
const studentHistoryData = computed<ChartData<'line'>>(() => {
  const history = studentHistory.data?.history || []
  return {
    labels: history.map((record: any) => record.formName || record.academicYear),
    datasets: [{
      label: '总分',
      data: history.map((record: any) => Number(record.totalScore) || 0),
      borderColor: 'rgb(37, 99, 235)',
      backgroundColor: 'rgba(37, 99, 235, 0.1)',
      tension: 0.3,
      fill: true
    }]
  }
})

const commonBarOptions: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom' },
    tooltip: { mode: 'index', intersect: false }
  },
  scales: {
    y: { beginAtZero: true, max: 100 }
  }
}

const classComparisonOptions: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y',
  plugins: {
    legend: { position: 'bottom' },
    tooltip: { mode: 'index', intersect: false }
  },
  scales: {
    x: { beginAtZero: true, max: 100 }
  }
}
const stackedBarOptions: ChartOptions<'bar'> = {
  responsive: true,
  indexAxis: 'y',
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom' },
    tooltip: { mode: 'index', intersect: false }
  },
  scales: {
    x: { stacked: true, beginAtZero: true, ticks: { stepSize: 1 } },
    y: { stacked: true }
  }
}

const scoreDistributionBarOptions: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: { beginAtZero: true, ticks: { stepSize: 1 } }
  }
}

const itemAverageOptions: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y',
  plugins: { legend: { display: false } },
  scales: {
    x: { beginAtZero: true, max: 100 }
  }
}

const doughnutOptions: ChartOptions<'doughnut'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'bottom' } },
  cutout: '62%'
}

const radarOptions: ChartOptions<'radar'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'bottom' } },
  scales: {
    r: {
      beginAtZero: true,
      max: 100,
      ticks: { stepSize: 20 },
      pointLabels: { font: { size: 12 } }
    }
  }
}

const trendOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'bottom' } },
  scales: {
    y: { beginAtZero: true, max: 100 }
  }
}

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

const queryStats = async () => {
  if (!filters.formId) {
    toast.warning('请选择体测表单')
    return
  }

  dataLoading.value = true
  try {
    let response: StatisticsSummaryResponse

    switch (filters.dimension) {
      case StatsDimension.GRADE:
        if (!filters.gradeLevel) {
          toast.warning(gradeOptions.value.length ? `请选择${schoolLevelLabel.value}入学级` : '当前表单没有可统计的入学级班级')
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
      case StatsDimension.SCHOOL:
      default:
        response = await statisticsAPI.getFormStats(filters.formId)
    }

    statsData.value = response
    appliedFilters.formId = filters.formId
    appliedFilters.dimension = filters.dimension
    appliedFilters.gradeLevel = filters.gradeLevel
    appliedFilters.classId = filters.classId
    toast.success('统计数据加载成功')
  } catch (error: any) {
    toast.error(error.message || '查询统计数据失败')
    statsData.value = null
  } finally {
    dataLoading.value = false
  }
}

const queryStudentHistory = async () => {
  if (!studentHistory.studentId) {
    toast.warning('请输入学生ID')
    return
  }

  studentHistory.loading = true
  try {
    studentHistory.data = await statisticsAPI.getStudentHistory(Number(studentHistory.studentId))
    toast.success('学生历史数据加载成功')
  } catch (error: any) {
    toast.error(error.message || '查询学生历史数据失败')
    studentHistory.data = null
  } finally {
    studentHistory.loading = false
  }
}

watch(() => filters.dimension, () => {
  filters.gradeLevel = undefined
  filters.classId = undefined
})

watch(() => filters.formId, () => {
  filters.gradeLevel = undefined
  filters.classId = undefined
  statsData.value = null
})

onMounted(() => {
  loadFormAndClassData()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">统计分析</h1>
        <p class="mt-1 text-sm text-gray-600">按全校、级部、班级分层查看体测数据，避免不同入学级混合对比</p>
      </div>
    </div>

    <Card title="筛选条件">
      <div v-if="loading" class="flex justify-center py-8">
        <Loading />
      </div>
      <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Select v-model="filters.formId" :options="formOptions" label="体测表单" placeholder="请选择体测表单" />
        <Select v-model="filters.dimension" :options="dimensionOptions" label="统计维度" placeholder="请选择统计维度" />
        <Select
          v-if="filters.dimension === StatsDimension.GRADE"
          v-model="filters.gradeLevel"
          :options="gradeOptions"
          label="选择入学级"
          :placeholder="`请选择${schoolLevelLabel}入学级`"
        />
        <Select
          v-if="filters.dimension === StatsDimension.CLASS"
          v-model="filters.classId"
          :options="classOptions"
          label="选择班级"
          placeholder="请选择班级"
        />
        <div class="flex items-end">
          <Button variant="primary" @click="queryStats" :disabled="dataLoading" class="w-full">
            <ChartBarIcon class="mr-2 h-5 w-5" />
            {{ dataLoading ? '查询中...' : '查询统计' }}
          </Button>
        </div>
      </div>
    </Card>

    <div v-if="dataLoading" class="flex justify-center py-12">
      <Loading />
    </div>

    <template v-else-if="statsData">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <div class="flex items-center">
            <div class="flex-shrink-0 rounded-lg bg-blue-100 p-3"><UserGroupIcon class="h-8 w-8 text-blue-600" /></div>
            <div class="ml-4"><p class="text-sm font-medium text-gray-600">参与人数</p><p class="text-2xl font-bold text-gray-900">{{ statsData.totalStudents }}</p><p class="mt-1 text-xs text-gray-500">已提交 {{ statsData.submittedCount }} 人</p></div>
          </div>
        </Card>
        <Card>
          <div class="flex items-center">
            <div class="flex-shrink-0 rounded-lg bg-green-100 p-3"><CheckCircleIcon class="h-8 w-8 text-green-600" /></div>
            <div class="ml-4"><p class="text-sm font-medium text-gray-600">提交率</p><p class="text-2xl font-bold text-gray-900">{{ formatRatio(statsData.submissionRate) }}</p><p :class="deltaClass(statsData.comparison?.submissionRateDelta)" class="mt-1 inline-flex rounded px-1.5 py-0.5 text-xs">较上次 {{ formatSigned(statsData.comparison?.submissionRateDelta, '个百分点') }}</p></div>
          </div>
        </Card>
        <Card>
          <div class="flex items-center">
            <div class="flex-shrink-0 rounded-lg bg-indigo-100 p-3"><AcademicCapIcon class="h-8 w-8 text-indigo-600" /></div>
            <div class="ml-4"><p class="text-sm font-medium text-gray-600">平均分</p><p class="text-2xl font-bold text-gray-900">{{ statsData.averageScore.toFixed(2) }}</p><p :class="deltaClass(statsData.comparison?.averageScoreDelta)" class="mt-1 inline-flex rounded px-1.5 py-0.5 text-xs">较上次 {{ formatSigned(statsData.comparison?.averageScoreDelta, '分') }}</p></div>
          </div>
        </Card>
        <Card>
          <div class="flex items-center">
            <div class="flex-shrink-0 rounded-lg bg-yellow-100 p-3"><TrophyIcon class="h-8 w-8 text-yellow-600" /></div>
            <div class="ml-4"><p class="text-sm font-medium text-gray-600">优秀率</p><p class="text-2xl font-bold text-gray-900">{{ excellentRate }}</p><p :class="deltaClass(statsData.comparison?.excellentRateDelta)" class="mt-1 inline-flex rounded px-1.5 py-0.5 text-xs">较上次 {{ formatSigned(statsData.comparison?.excellentRateDelta, '个百分点') }}</p></div>
          </div>
        </Card>
        <Card>
          <div class="flex items-center">
            <div class="flex-shrink-0 rounded-lg bg-teal-100 p-3"><ClipboardDocumentCheckIcon class="h-8 w-8 text-teal-600" /></div>
            <div class="ml-4"><p class="text-sm font-medium text-gray-600">及格率</p><p class="text-2xl font-bold text-gray-900">{{ passRate }}</p><p :class="deltaClass(statsData.comparison?.passRateDelta)" class="mt-1 inline-flex rounded px-1.5 py-0.5 text-xs">较上次 {{ formatSigned(statsData.comparison?.passRateDelta, '个百分点') }}</p></div>
          </div>
        </Card>
      </div>

      <div class="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card title="成绩等级占比">
          <div class="h-80"><Doughnut :data="scoreDistributionDoughnutData" :options="doughnutOptions" /></div>
        </Card>
        <Card title="成绩分布人数">
          <div class="h-80"><Bar :data="scoreDistributionBarData" :options="scoreDistributionBarOptions" /></div>
        </Card>
        <Card title="风险提示">
          <div class="space-y-4">
            <div v-if="statsData.riskSummary?.mostFailedItem" class="rounded-md border border-red-100 bg-red-50 px-3 py-2">
              <div class="flex items-center justify-between gap-3">
                <div class="flex min-w-0 items-center gap-2">
                  <ExclamationTriangleIcon class="h-4 w-4 flex-shrink-0 text-red-600" />
                  <span class="truncate text-sm font-medium text-red-900">{{ statsData.riskSummary.mostFailedItem.itemName }}</span>
                </div>
                <span class="text-sm font-semibold text-red-700">{{ statsData.riskSummary.mostFailedItem.failCount || 0 }} 人不及格</span>
              </div>
              <div class="mt-1 text-xs text-red-700">均分 {{ statsData.riskSummary.mostFailedItem.averageScore.toFixed(2) }}，及格率 {{ formatPercent(statsData.riskSummary.mostFailedItem.passRate) }}</div>
            </div>

            <div v-if="isGradeScope">
              <p class="mb-2 text-xs font-medium text-gray-500">低于当前级部均值最多的班级</p>
              <div class="space-y-2">
                <div v-for="cls in statsData.riskSummary?.belowAverageClasses || []" :key="cls.classId" class="rounded-md border border-amber-100 bg-amber-50 px-3 py-2">
                  <div class="flex items-center justify-between gap-3 text-sm">
                    <span class="font-medium text-amber-900">{{ cls.className }}</span>
                    <span class="font-semibold text-amber-700">{{ cls.gap.toFixed(1) }} 分</span>
                  </div>
                  <div v-if="cls.weakItems?.length" class="mt-1 truncate text-xs text-amber-700">薄弱项：{{ cls.weakItems.map(item => item.itemName).join('、') }}</div>
                </div>
              </div>
            </div>

            <div v-if="!statsData.riskSummary?.mostFailedItem && !statsData.riskSummary?.belowAverageClasses?.length" class="py-10 text-center text-sm text-gray-500">暂无明显风险</div>
          </div>
        </Card>
      </div>

      <Card v-if="isSchoolScope && statsData.gradeSummaries?.length" title="全校入学级概览">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">入学级</th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">班级数</th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">总人数</th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">已提交</th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">提交率</th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">平均分</th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">及格率</th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">优秀率</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 bg-white">
              <tr v-for="grade in statsData.gradeSummaries" :key="grade.cohort" class="hover:bg-gray-50">
                <td class="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{{ formatSchoolGradeName(grade.cohort, schoolLevelLabel) }}</td>
                <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{{ grade.totalClasses }}</td>
                <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{{ grade.totalStudents }}</td>
                <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{{ grade.submittedCount }}</td>
                <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{{ formatPercent(grade.submissionRate) }}</td>
                <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{{ grade.averageScore.toFixed(2) }}</td>
                <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{{ formatPercent(grade.passRate) }}</td>
                <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{{ formatPercent(grade.excellentRate) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card v-if="!isSchoolScope" :title="isClassScope ? '本班项目能力雷达图' : '级部项目能力雷达图'">
          <div class="h-96"><Radar :data="radarData" :options="radarOptions" /></div>
        </Card>
        <Card :title="isSchoolScope ? '各入学级平均分趋势' : isGradeScope ? '当前级部平均分趋势' : '本班平均分趋势'">
          <div class="h-96"><Line :data="trendData" :options="trendOptions" /></div>
        </Card>
        <Card v-if="statsData.trendMetricSeries?.series?.length" title="提交率 / 及格率 / 优秀率趋势">
          <div class="h-96"><Line :data="trendMetricData" :options="trendOptions" /></div>
        </Card>
        <Card v-if="!isSchoolScope && statsData.itemTrendSeries?.series?.length" title="单项目历次变化">
          <div class="h-96"><Line :data="itemTrendData" :options="trendOptions" /></div>
        </Card>
      </div>

      <div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card v-if="!isSchoolScope && statsData.itemSummaries?.length" title="各项目平均分">
          <div class="h-96"><Bar :data="itemAverageData" :options="itemAverageOptions" /></div>
        </Card>
        <Card v-if="!isSchoolScope && statsData.genderSummaries?.length" title="男女生对比">
          <div class="h-96"><Bar :data="genderComparisonData" :options="commonBarOptions" /></div>
        </Card>
      </div>

      <Card v-if="isGradeScope && statsData.classSummaries?.length" title="本级部班级对比">
        <div :style="{ height: classChartHeight }"><Bar :data="classComparisonData" :options="classComparisonOptions" /></div>
      </Card>

      <div v-if="isGradeScope && statsData.classSummaries?.length" class="space-y-6">
        <Card title="班级等级分布">
          <div :style="{ height: classChartHeight }"><Bar :data="classStackedDistributionData" :options="stackedBarOptions" /></div>
        </Card>
        <Card v-if="statsData.classItemHeatmap?.rows?.length" title="班级 × 项目均分热力图">
          <div class="overflow-x-auto">
            <table class="min-w-full border-separate border-spacing-1 text-sm">
              <thead>
                <tr>
                  <th class="sticky left-0 bg-white px-3 py-2 text-left font-medium text-gray-600">班级</th>
                  <th v-for="column in statsData.classItemHeatmap.columns" :key="column.itemCode" class="whitespace-nowrap px-3 py-2 text-center font-medium text-gray-600">{{ column.itemName }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in statsData.classItemHeatmap.rows" :key="row.classId">
                  <td class="sticky left-0 whitespace-nowrap bg-white px-3 py-2 font-medium text-gray-900">{{ row.className }}</td>
                  <td v-for="(value, index) in row.values" :key="index" :class="heatmapCellClass(value)" class="min-w-20 rounded px-3 py-2 text-center font-semibold">
                    {{ value === null ? '-' : value.toFixed(1) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Card v-if="isGradeScope && statsData.classSummaries?.length" title="本级部班级统计详情">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">班级名称</th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">总人数</th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">已提交</th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">未提交</th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">提交率</th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">平均分</th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">及格率</th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">优秀率</th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">薄弱项目 Top 3</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 bg-white">
              <tr v-for="cls in statsData.classSummaries" :key="cls.classId" class="hover:bg-gray-50">
                <td class="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{{ cls.className }}</td>
                <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{{ cls.totalStudents }}</td>
                <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{{ cls.submittedCount }}</td>
                <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{{ cls.unsubmittedCount || 0 }}</td>
                <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{{ formatPercent(cls.submissionRate || 0) }}</td>
                <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{{ cls.averageScore.toFixed(2) }}</td>
                <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{{ formatPercent(cls.passRate) }}</td>
                <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{{ formatPercent(cls.excellentRate) }}</td>
                <td class="min-w-48 px-6 py-4 text-sm text-gray-500">{{ cls.weakItems?.length ? cls.weakItems.map(item => item.itemName).join('、') : '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <Card v-if="!isSchoolScope && statsData.itemSummaries?.length" title="项目统计详情">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">项目名称</th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">平均分</th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">及格率</th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">最高分</th>
                <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">最低分</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 bg-white">
              <tr v-for="item in statsData.itemSummaries" :key="item.itemCode" class="hover:bg-gray-50">
                <td class="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{{ item.itemName }}</td>
                <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{{ item.averageScore.toFixed(2) }}</td>
                <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{{ formatPercent(item.passRate) }}</td>
                <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{{ item.maxValue }}</td>
                <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{{ item.minValue }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </template>

    <Card title="学生历史成绩查询">
      <div class="space-y-4">
        <div class="flex gap-4">
          <input
            v-model="studentHistory.studentId"
            type="text"
            placeholder="请输入学生ID"
            class="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            @keyup.enter="queryStudentHistory"
          />
          <Button variant="primary" @click="queryStudentHistory" :disabled="studentHistory.loading">
            {{ studentHistory.loading ? '查询中...' : '查询' }}
          </Button>
        </div>

        <div v-if="studentHistory.data" class="space-y-4">
          <div class="rounded-lg bg-gray-50 p-4">
            <h4 class="mb-2 text-sm font-semibold text-gray-700">学生信息</h4>
            <div class="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
              <div><span class="text-gray-600">姓名：</span><span class="font-medium">{{ studentHistory.data.student?.name }}</span></div>
              <div><span class="text-gray-600">学号：</span><span class="font-medium">{{ studentHistory.data.student?.studentIdSchool }}</span></div>
              <div><span class="text-gray-600">性别：</span><span class="font-medium">{{ studentHistory.data.student?.gender === 'male' ? '男' : '女' }}</span></div>
              <div><span class="text-gray-600">记录数：</span><span class="font-medium">{{ studentHistory.data.history?.length || 0 }} 次</span></div>
            </div>
          </div>

          <div v-if="studentHistory.data.history?.length" class="h-80">
            <Line :data="studentHistoryData" :options="trendOptions" />
          </div>
        </div>
      </div>
    </Card>
  </div>
</template>
