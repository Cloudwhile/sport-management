<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import type { ClassStatisticsResponse } from '@/types'
import { classesAPI } from '@/api'
import Button from '@/components/common/Button.vue'
import Badge from '@/components/common/Badge.vue'
import Loading from '@/components/common/Loading.vue'
import Card from '@/components/common/Card.vue'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'

const route = useRoute()
const router = useRouter()
const toast = useToast()

// 班级详情数据
const loading = ref(true)
const classDetail = ref<ClassStatisticsResponse | null>(null)

// 加载班级详情
const loadClassDetail = async () => {
  try {
    loading.value = true
    const classId = parseInt(route.params.id as string)
    const response = await classesAPI.getClassStatistics(classId)
    classDetail.value = response
  } catch (error: any) {
    toast.error(error.message || '获取班级详情失败')
    router.push('/classes')
  } finally {
    loading.value = false
  }
}

// 返回列表
const goBack = () => {
  router.push('/classes')
}

// 跳转到学生详情
const navigateToStudent = (studentId: number) => {
  router.push({ name: 'StudentDetail', params: { id: studentId } })
}

onMounted(() => {
  loadClassDetail()
})
</script>

<template>
  <div class="space-y-6">
    <!-- 页面头部 -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <Button variant="ghost" @click="goBack">
          <template #icon>
            <ArrowLeftIcon class="h-5 w-5" />
          </template>
          返回
        </Button>
        <div>
          <h1 class="text-2xl font-bold text-gray-900">
            班级详情
            <span v-if="classDetail" class="text-blue-600">
              - {{ classDetail.classInfo.cohort }} {{ classDetail.classInfo.className }}
            </span>
          </h1>
          <p class="mt-1 text-sm text-gray-500">查看班级的详细信息、学生名单和体测统计</p>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="py-12">
      <Loading />
    </div>

    <!-- 班级详情内容 -->
    <div v-else-if="classDetail" class="space-y-6">
      <!-- 班级基本信息卡片 -->
      <Card>
        <template #header>
          <h2 class="text-lg font-semibold text-gray-900">班级信息</h2>
        </template>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-500 mb-1">入学年份</label>
            <p class="text-base font-semibold text-gray-900">{{ classDetail.classInfo.cohort }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-500 mb-1">班级名称</label>
            <p class="text-base font-semibold text-gray-900">{{ classDetail.classInfo.className }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-500 mb-1">当前年级</label>
            <p class="text-base font-semibold text-gray-900">{{ classDetail.classInfo.currentGradeName }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-500 mb-1">毕业状态</label>
            <div>
              <Badge v-if="classDetail.classInfo.graduated" variant="success" size="lg">已毕业</Badge>
              <Badge v-else variant="info" size="lg">在读</Badge>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-500 mb-1">学生人数</label>
            <p class="text-base font-semibold text-gray-900">{{ classDetail.classInfo.studentCount }} 人</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-500 mb-1">班级账号</label>
            <p class="text-base font-mono font-semibold text-gray-900">{{ classDetail.classInfo.classAccount }}</p>
          </div>
        </div>
      </Card>

      <!-- 体测统计卡片 -->
      <Card>
        <template #header>
          <h2 class="text-lg font-semibold text-gray-900">体测统计</h2>
        </template>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="text-center p-6 bg-blue-50 rounded-lg">
            <div class="text-4xl font-bold text-blue-600 mb-2">
              {{ classDetail.testStatistics.participatedFormsCount }}
            </div>
            <div class="text-sm font-medium text-gray-700">参与体测次数</div>
            <div class="text-xs text-gray-500 mt-1">该班级参与的体测表单数量</div>
          </div>
          <div class="text-center p-6 bg-green-50 rounded-lg">
            <div class="text-4xl font-bold text-green-600 mb-2">
              {{ classDetail.testStatistics.totalRecordsCount }}
            </div>
            <div class="text-sm font-medium text-gray-700">体测记录总数</div>
            <div class="text-xs text-gray-500 mt-1">所有学生的体测记录总和</div>
          </div>
          <div class="text-center p-6 bg-purple-50 rounded-lg">
            <div class="text-4xl font-bold text-purple-600 mb-2">
              {{ classDetail.testStatistics.completionRate }}%
            </div>
            <div class="text-sm font-medium text-gray-700">完成率</div>
            <div class="text-xs text-gray-500 mt-1">体测任务的完成百分比</div>
          </div>
        </div>
      </Card>

      <!-- 学生列表卡片 -->
      <Card>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-gray-900">
              学生名单
              <span class="ml-2 text-sm font-normal text-gray-500">({{ classDetail.students.length }}人)</span>
            </h2>
          </div>
        </template>

        <div v-if="classDetail.students.length === 0" class="text-center py-12">
          <p class="text-gray-500">该班级暂无学生</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  序号
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  学号
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  姓名
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  性别
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  出生日期
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  国家学籍号
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr
                v-for="(student, index) in classDetail.students"
                :key="student.id"
                @click="navigateToStudent(student.id)"
                class="hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ index + 1 }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-gray-900">
                  {{ student.studentIdSchool }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {{ student.name }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                  <Badge :variant="student.gender === 'male' ? 'info' : 'warning'">
                    {{ student.gender === 'male' ? '男' : '女' }}
                  </Badge>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {{ student.birthDate }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                  {{ student.studentIdNational }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  </div>
</template>
