<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { useLocalDraft } from '@/composables/useLocalDraft'
import { formsAPI, recordsAPI, classesAPI } from '@/api'
import { FormStatus } from '@/types'
import type {
  PhysicalTestForm,
  PhysicalTestFormWithItems,
  Class,
  Student,
  FormTestItem,
  Gender
} from '@/types'
import {
  inferValidationRules,
  validateTestValue,
  filterNumericInput,
  type ValidationRule
} from '@/utils/testDataValidator'
import Card from '@/components/common/Card.vue'
import Button from '@/components/common/Button.vue'
import Input from '@/components/common/Input.vue'
import Loading from '@/components/common/Loading.vue'
import Modal from '@/components/common/Modal.vue'
import TimeInput from '@/components/common/TimeInput.vue'
import {
  ChevronRightIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  UserGroupIcon,
  PencilSquareIcon,
  ArrowPathIcon
} from '@heroicons/vue/24/outline'

// 步骤枚举
enum Step {
  SELECT_FORM = 1,
  SELECT_CLASS = 2,
  INPUT_DATA = 3
}

// Store & Toast & Draft
const authStore = useAuthStore()
const toast = useToast()
const draft = useLocalDraft()

// 状态管理
const currentStep = ref<Step>(Step.SELECT_FORM)
const loading = ref(false)
const saving = ref(false)

// 草稿相关
const showDraftDialog = ref(false)
const showSubmitDialog = ref(false)  // 新增：提交预览对话框
const draftTimestamp = ref<number | null>(null)
const lastSaveTime = ref<number | null>(null)  // 新增：最后保存时间

// 验证错误
const validationErrors = ref<Map<string, string>>(new Map())

// 横向滚动相关
const tableScrollContainer = ref<HTMLElement | null>(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)

// 学号搜索相关
const searchQuery = ref('')
const searchInputRef = ref<HTMLInputElement | null>(null)
const highlightedStudentId = ref<number | null>(null)
const currentMatchIndex = ref(0) // 当前匹配结果的索引

// 表单相关
const forms = ref<PhysicalTestForm[]>([])
const selectedForm = ref<PhysicalTestFormWithItems | null>(null)

// 班级相关
const classes = ref<Class[]>([])
const selectedClass = ref<Class | null>(null)
const cohortFilter = ref<string>('') // 年级筛选
const classProgressMap = ref<Map<number, { total: number; completed: number }>>(new Map()) // 班级完成进度

// 学生和体测数据
const students = ref<Student[]>([])
const testDataMap = ref<Map<number, Record<string, any>>>(new Map())
const existingRecordsMap = ref<Map<number, any>>(new Map())

// 计算属性
const publishedForms = computed(() => {
  return forms.value.filter(form => form.status === 'published')
})

const stepTitle = computed(() => {
  switch (currentStep.value) {
    case Step.SELECT_FORM:
      return '选择体测表单'
    case Step.SELECT_CLASS:
      return '选择班级'
    case Step.INPUT_DATA:
      return '录入体测数据'
    default:
      return ''
  }
})

// 获取表单列表（加载所有已发布的表单）
const fetchForms = async () => {
  try {
    loading.value = true
    // 使用大的 pageSize 来获取所有已发布的表单
    const response = await formsAPI.getForms({
      status: FormStatus.PUBLISHED,
      page: 1,
      pageSize: 1000
    })
    forms.value = response.data
  } catch (error: any) {
    toast.error(error.message || '获取表单列表失败')
  } finally {
    loading.value = false
  }
}

// 选择表单
const selectForm = async (form: PhysicalTestForm) => {
  try {
    loading.value = true
    // 获取表单详情（包含测试项目）
    selectedForm.value = await formsAPI.getFormById(form.id)

    // 如果是班级账号，直接跳到录入步骤
    if (authStore.userRole === 'teacher' && authStore.user?.username.includes('class')) {
      // TODO: 需要从用户信息中获取班级ID
      // 这里暂时假设跳到选择班级步骤
      currentStep.value = Step.SELECT_CLASS
      await fetchClasses()
    } else {
      currentStep.value = Step.SELECT_CLASS
      await fetchClasses()
    }
  } catch (error: any) {
    toast.error(error.message || '获取表单详情失败')
  } finally {
    loading.value = false
  }
}

// 获取班级列表（加载所有班级）
const fetchClasses = async () => {
  try {
    loading.value = true
    // 使用大的 limit 来获取所有班级
    const response = await classesAPI.getClasses({ page: 1, pageSize: 1000 })
    classes.value = response.data

    // 获取每个班级的完成进度
    if (selectedForm.value) {
      await fetchClassesProgress()
    }
  } catch (error: any) {
    toast.error(error.message || '获取班级列表失败')
  } finally {
    loading.value = false
  }
}

// 获取所有班级的完成进度
const fetchClassesProgress = async () => {
  if (!selectedForm.value) return

  const participatingCohorts = selectedForm.value.participatingCohorts || []
  const eligibleClasses = classes.value.filter(cls => participatingCohorts.includes(cls.cohort))

  // 并发获取所有班级的进度
  const progressPromises = eligibleClasses.map(async (cls) => {
    try {
      const studentsData = await recordsAPI.getClassStudentsForForm(
        selectedForm.value!.id,
        cls.id
      )

      const total = studentsData.length
      const completed = studentsData.filter(s => s._record?.submittedAt).length

      classProgressMap.value.set(cls.id, { total, completed })
    } catch (error) {
      // 如果获取失败，设置为0
      classProgressMap.value.set(cls.id, { total: 0, completed: 0 })
    }
  })

  await Promise.all(progressPromises)
}

// 获取班级完成进度
const getClassProgress = (classId: number) => {
  return classProgressMap.value.get(classId) || { total: 0, completed: 0 }
}

// 计算班级完成百分比
const getClassProgressPercent = (classId: number) => {
  const progress = getClassProgress(classId)
  if (progress.total === 0) return 0
  return Math.round((progress.completed / progress.total) * 100)
}

// 过滤符合年级的班级
const filteredClasses = computed(() => {
  if (!selectedForm.value) return []

  const participatingCohorts = selectedForm.value.participatingCohorts || []

  // 先按表单的参与年级过滤
  let filtered = classes.value.filter(cls => participatingCohorts.includes(cls.cohort))

  // 再按用户选择的年级过滤
  if (cohortFilter.value) {
    filtered = filtered.filter(cls => cls.cohort === cohortFilter.value)
  }

  return filtered
})

// 获取所有可选的年级（从参与表单的班级中提取）
const availableCohorts = computed(() => {
  if (!selectedForm.value) return []

  const participatingCohorts = selectedForm.value.participatingCohorts || []
  const cohorts = classes.value
    .filter(cls => participatingCohorts.includes(cls.cohort))
    .map(cls => cls.cohort)

  // 去重并排序
  return [...new Set(cohorts)].sort((a, b) => b.localeCompare(a))
})

// 判断是否没有符合条件的班级
const noEligibleClasses = computed(() =>
  selectedForm.value && filteredClasses.value.length === 0
)

// 计算已填写学生数量
const filledStudentsCount = computed(() => {
  let count = 0
  students.value.forEach(student => {
    if (isStudentDataComplete(student.id, student.gender)) {
      count++
    }
  })
  return count
})

// 判断学生数据是否填写完整
const isStudentDataComplete = (studentId: number, studentGender: Gender): boolean => {
  const data = testDataMap.value.get(studentId)
  if (!data || Object.keys(data).length === 0) return false

  // 获取该学生需要填写的所有必填项目
  const requiredItems = selectedForm.value?.items?.filter(item => {
    // 过滤掉不需要填写的项目（计算项）
    if (item.isCalculated) return false

    // 过滤掉性别不匹配的项目
    if (item.genderLimit && item.genderLimit !== studentGender) return false

    // 只考虑必填项
    return item.isRequired
  }) || []

  // 检查所有必填项是否都已填写
  for (const item of requiredItems) {
    const value = data[item.itemCode]
    // 检查值是否存在且不为空字符串
    if (value === undefined || value === null || value === '') {
      return false
    }
  }

  return true
}

// 计算填写完整度
const completeness = computed(() => {
  if (students.value.length === 0) return 0
  return Math.round((filledStudentsCount.value / students.value.length) * 100)
})

// 判断学生是否已填写数据（任意数据）
const hasDraftData = (studentId: number): boolean => {
  const data = testDataMap.value.get(studentId)
  return data ? Object.keys(data).length > 0 : false
}

// 获取学生数据填写状态
const getStudentDataStatus = (studentId: number, studentGender: Gender): 'complete' | 'partial' | 'empty' => {
  const data = testDataMap.value.get(studentId)
  if (!data || Object.keys(data).length === 0) return 'empty'

  if (isStudentDataComplete(studentId, studentGender)) {
    return 'complete'
  }

  return 'partial'
}

// 获取草稿相对时间
const draftRelativeTime = computed(() => {
  if (!lastSaveTime.value) return ''
  return draft.formatRelativeTime(lastSaveTime.value)
})

// 搜索匹配的学生（模糊匹配）
const matchedStudents = computed(() => {
  if (!searchQuery.value.trim()) return []

  const query = searchQuery.value.trim().toLowerCase()
  return students.value.filter(student => {
    const schoolId = student.studentIdSchool?.toLowerCase() || ''
    const nationalId = student.studentIdNational?.toLowerCase() || ''
    const name = student.name?.toLowerCase() || ''

    return schoolId.includes(query) ||
           nationalId.includes(query) ||
           name.includes(query)
  })
})

// 监听搜索内容变化，重置索引
watch(searchQuery, () => {
  currentMatchIndex.value = 0
  highlightedStudentId.value = null
})

// 搜索学生并跳转（支持循环）
const searchStudent = () => {
  if (!searchQuery.value.trim()) {
    highlightedStudentId.value = null
    currentMatchIndex.value = 0
    return
  }

  const matched = matchedStudents.value
  if (matched.length === 0) {
    toast.warning('未找到匹配的学生')
    highlightedStudentId.value = null
    currentMatchIndex.value = 0
    return
  }

  // 判断是否需要跳转到下一个结果
  // 只有当前有高亮学生，且该学生在匹配列表中时，才跳转到下一个
  const currentHighlightedInMatches = highlightedStudentId.value &&
    matched.find(s => s.id === highlightedStudentId.value)

  if (currentHighlightedInMatches) {
    // 当前有高亮学生，跳转到下一个匹配结果（循环）
    currentMatchIndex.value = (currentMatchIndex.value + 1) % matched.length
  } else {
    // 当前没有高亮学生，或者高亮的学生不在匹配列表中，从第一个开始
    currentMatchIndex.value = 0
  }

  // 跳转到目标学生
  const targetStudent = matched[currentMatchIndex.value]
  highlightedStudentId.value = targetStudent.id

  // 显示提示信息
  if (matched.length > 1) {
    toast.info(`跳转到第 ${currentMatchIndex.value + 1} 个结果（共 ${matched.length} 个）`)
  }

  // 滚动到该学生行
  setTimeout(() => {
    const row = document.querySelector(`[data-student-id="${targetStudent.id}"]`)
    if (row) {
      row.scrollIntoView({ behavior: 'smooth', block: 'center' })

      // 聚焦到该学生的第一个输入框
      setTimeout(() => {
        const firstInput = row.querySelector('input[type="text"]') as HTMLInputElement
        if (firstInput) {
          firstInput.focus()
        }
      }, 300)
    }
  }, 100)

  // 3秒后取消高亮（但保留索引，以便下次按Enter继续循环）
  setTimeout(() => {
    highlightedStudentId.value = null
  }, 3000)
}

// 清空搜索
const clearSearch = () => {
  searchQuery.value = ''
  highlightedStudentId.value = null
  currentMatchIndex.value = 0
}

// 全局快捷键监听
const handleGlobalKeydown = (event: KeyboardEvent) => {
  // Enter 键处理逻辑
  if (event.key === 'Enter' && currentStep.value === Step.INPUT_DATA) {
    const activeElement = document.activeElement
    const isInput = activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA'

    // 如果焦点在搜索框，执行搜索（循环跳转）
    if (activeElement === searchInputRef.value) {
      event.preventDefault()
      searchStudent()
      return
    }

    // 如果当前有高亮学生且有搜索内容，按 Enter 继续循环到下一个
    if (highlightedStudentId.value && searchQuery.value.trim()) {
      event.preventDefault()
      searchStudent()
      return
    }

    // 如果焦点在其他输入框，且当前没有高亮学生，则跳回搜索框
    if (isInput && !highlightedStudentId.value) {
      event.preventDefault()
      searchInputRef.value?.focus()
      searchInputRef.value?.select()
      return
    }

    // 如果焦点不在任何输入框，跳回搜索框
    if (!isInput) {
      event.preventDefault()
      searchInputRef.value?.focus()
      searchInputRef.value?.select()
    }
  }

  // Ctrl/Cmd + F 聚焦搜索框
  if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
    if (currentStep.value === Step.INPUT_DATA) {
      event.preventDefault()
      searchInputRef.value?.focus()
      searchInputRef.value?.select()
    }
  }
}

// 选择班级
const selectClass = async (classItem: Class) => {
  try {
    loading.value = true
    selectedClass.value = classItem

    // 获取该班级的学生列表（已包含体测记录）
    if (selectedForm.value) {
      const studentsData = await recordsAPI.getClassStudentsForForm(
        selectedForm.value.id,
        classItem.id
      )

      // 处理返回的数据，提取学生信息和已有记录
      students.value = studentsData.map((item: any) => ({
        id: item.id,
        studentIdNational: item.studentIdNational,
        studentIdSchool: item.studentIdSchool,
        name: item.name,
        gender: item.gender,
        birthDate: item.birthDate
      }))

      // 从返回数据中提取已有记录，无需再次请求
      existingRecordsMap.value.clear()
      testDataMap.value.clear()

      studentsData.forEach((item: any) => {
        if (item._record) {
          // 有记录：设置到 map 中
          existingRecordsMap.value.set(item.id, item._record)
          testDataMap.value.set(item.id, { ...item._record.testData })
        } else {
          // 无记录：初始化为空对象
          testDataMap.value.set(item.id, {})
        }
      })

      currentStep.value = Step.INPUT_DATA

      // 等待DOM更新后检查滚动状态（增加延迟确保表格已渲染）
      setTimeout(() => {
        updateScrollButtons()
      }, 500)
    }
  } catch (error: any) {
    toast.error(error.message || '获取学生列表失败')
  } finally {
    loading.value = false
  }
}

// 删除 fetchExistingRecords 函数（不再需要）

// 获取学生的测试项目
const getStudentTestItems = (student: Student) => {
  if (!selectedForm.value?.items) return []

  return selectedForm.value.items.filter(item => {
    // 如果项目没有性别限制，所有学生都显示
    if (!item.genderLimit) return true
    // 如果有性别限制，只显示对应性别的项目
    return item.genderLimit === student.gender
  }).sort((a, b) => a.sortOrder - b.sortOrder)
}

// 更新测试数据（带验证）
const updateTestData = (studentId: number, itemCode: string, value: any, item: FormTestItem) => {
  const data = testDataMap.value.get(studentId) || {}

  // 时间格式项目的验证由 TimeInput 组件处理，这里不需要额外验证
  const isTimeFormat = item.itemUnit === '分秒'

  if (!isTimeFormat) {
    // 非时间格式项目：数据验证
    const rules = item.validationRules || inferValidationRules(item.itemUnit)
    const validationResult = validateTestValue(value, rules)

    const errorKey = `${studentId}_${itemCode}`
    if (!validationResult.valid && value !== '' && value !== null) {
      // 显示验证错误
      validationErrors.value.set(errorKey, validationResult.message || '输入无效')
    } else {
      // 清除验证错误
      validationErrors.value.delete(errorKey)
    }
  }

  // 存储值
  data[itemCode] = value
  testDataMap.value.set(studentId, data)

  // 立即保存草稿
  saveDraftNow()
}

// 处理 TimeInput 组件的错误
const handleTimeError = (studentId: number, itemCode: string, errorMessage: string | null) => {
  const errorKey = `${studentId}_${itemCode}`
  if (errorMessage) {
    validationErrors.value.set(errorKey, errorMessage)
  } else {
    validationErrors.value.delete(errorKey)
  }
}

// 立即保存草稿
const saveDraftNow = () => {
  if (!selectedForm.value || !selectedClass.value) return

  const records = getDraftData()
  if (records.length > 0) {
    draft.saveDraft({
      formId: selectedForm.value.id,
      classId: selectedClass.value.id,
      records,
      timestamp: Date.now()
    })
    lastSaveTime.value = Date.now()
  }
}

// 打开提交预览对话框
const openSubmitDialog = () => {
  // 检查是否有数据
  if (filledStudentsCount.value === 0) {
    toast.warning('请填写完所有学生后再提交')
    return
  }

  // 检查是否所有学生都已填写
  if (filledStudentsCount.value < students.value.length) {
    toast.error(`还有 ${students.value.length - filledStudentsCount.value} 名学生未填写数据，请填写完所有学生后再提交`)
    return
  }

  // 检查是否有验证错误
  if (validationErrors.value.size > 0) {
    toast.error('请先修正数据验证错误')
    return
  }

  showSubmitDialog.value = true
}

// 提交所有数据到后端
const submitAllData = async () => {
  if (!selectedForm.value || !selectedClass.value) return

  try {
    saving.value = true
    const records = students.value.map(student => ({
      studentId: student.id,
      classId: selectedClass.value!.id,
      testData: testDataMap.value.get(student.id) || {}
    }))

    await recordsAPI.batchSaveRecords(selectedForm.value.id, records)

    toast.success('提交成功！')

    // 清除草稿
    draft.clearDraft(selectedForm.value.id, selectedClass.value.id)
    lastSaveTime.value = null

    // 重新获取所有记录（使用批量接口）
    const studentsData = await recordsAPI.getClassStudentsForForm(
      selectedForm.value.id,
      selectedClass.value.id
    )

    // 更新已有记录和测试数据
    existingRecordsMap.value.clear()
    testDataMap.value.clear()

    studentsData.forEach((item: any) => {
      if (item._record) {
        // 有记录：保存到 existingRecordsMap，并用服务器返回的数据填充 testDataMap
        existingRecordsMap.value.set(item.id, item._record)
        testDataMap.value.set(item.id, { ...item._record.testData })
      } else {
        // 无记录：初始化为空对象
        testDataMap.value.set(item.id, {})
      }
    })

    showSubmitDialog.value = false
  } catch (error: any) {
    toast.error(error.message || '批量保存失败')
  } finally {
    saving.value = false
  }
}

// 清空学生草稿数据
const clearStudentDraft = (student: Student) => {
  if (!confirm(`确定要清空 ${student.name} 的草稿数据吗？`)) {
    return
  }

  // 清空该学生的输入
  testDataMap.value.set(student.id, {})

  // 清除该学生的验证错误
  validationErrors.value.forEach((_, key) => {
    if (key.startsWith(`${student.id}_`)) {
      validationErrors.value.delete(key)
    }
  })

  // 保存草稿
  saveDraftNow()

  toast.success(`已清空 ${student.name} 的草稿数据`)
}

// 清空所有草稿
const clearAllDrafts = () => {
  if (!selectedForm.value || !selectedClass.value) return

  if (!confirm('确定要清空所有草稿数据吗？此操作不可恢复！')) {
    return
  }

  // 清空所有输入
  testDataMap.value.clear()
  validationErrors.value.clear()

  // 清除草稿
  draft.clearDraft(selectedForm.value.id, selectedClass.value.id)
  lastSaveTime.value = null

  toast.success('已清空所有草稿数据')
}

// 删除已提交的学生记录（从数据库删除）
const deleteStudentRecord = async (student: Student) => {
  if (!selectedForm.value) return

  if (!confirm(`确定要删除 ${student.name} 已提交的体测数据吗？`)) {
    return
  }

  try {
    saving.value = true
    await recordsAPI.deleteRecord(selectedForm.value.id, student.id)

    // 清空本地数据
    testDataMap.value.set(student.id, {})
    existingRecordsMap.value.delete(student.id)

    toast.success(`${student.name} 的体测数据已删除`)
  } catch (error: any) {
    toast.error(error.message || `删除 ${student.name} 的数据失败`)
  } finally {
    saving.value = false
  }
}

// 返回上一步
const goBack = () => {
  if (currentStep.value === Step.SELECT_CLASS) {
    currentStep.value = Step.SELECT_FORM
    selectedForm.value = null
  } else if (currentStep.value === Step.INPUT_DATA) {
    currentStep.value = Step.SELECT_CLASS
    selectedClass.value = null
    students.value = []
    testDataMap.value.clear()
    existingRecordsMap.value.clear()
  }
}

// 横向滚动方法
const updateScrollButtons = () => {
  if (!tableScrollContainer.value) return

  const { scrollLeft, scrollWidth, clientWidth } = tableScrollContainer.value
  canScrollLeft.value = scrollLeft > 0
  canScrollRight.value = scrollLeft < scrollWidth - clientWidth - 1
}

const scrollLeft = () => {
  if (!tableScrollContainer.value) return
  tableScrollContainer.value.scrollBy({
    left: -300,
    behavior: 'smooth'
  })
  // 滚动后延迟更新按钮状态（等待动画完成）
  setTimeout(updateScrollButtons, 350)
}

const scrollRight = () => {
  if (!tableScrollContainer.value) return
  tableScrollContainer.value.scrollBy({
    left: 300,
    behavior: 'smooth'
  })
  // 滚动后延迟更新按钮状态（等待动画完成）
  setTimeout(updateScrollButtons, 350)
}

// 监听滚动事件更新按钮状态
onMounted(() => {
  // 使用 nextTick 确保 DOM 已渲染
  setTimeout(() => {
    if (tableScrollContainer.value) {
      tableScrollContainer.value.addEventListener('scroll', updateScrollButtons)
      updateScrollButtons()
    }
  }, 500)

  // 添加全局快捷键监听
  window.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => {
  if (tableScrollContainer.value) {
    tableScrollContainer.value.removeEventListener('scroll', updateScrollButtons)
  }

  // 移除全局快捷键监听
  window.removeEventListener('keydown', handleGlobalKeydown)
})

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN')
}

// 获取等级样式
const getGradeLevelClass = (gradeLevel?: string) => {
  switch (gradeLevel) {
    case 'excellent':
      return 'text-green-600 font-semibold'
    case 'good':
      return 'text-blue-600 font-semibold'
    case 'pass':
      return 'text-yellow-600 font-semibold'
    case 'fail':
      return 'text-red-600 font-semibold'
    default:
      return 'text-gray-400'
  }
}

// 获取等级文本
const getGradeLevelText = (gradeLevel?: string) => {
  switch (gradeLevel) {
    case 'excellent':
      return '优秀'
    case 'good':
      return '良好'
    case 'pass':
      return '及格'
    case 'fail':
      return '不及格'
    default:
      return '未评分'
  }
}

// 获取性别文本
const getGenderText = (gender: Gender) => {
  return gender === 'male' ? '男' : '女'
}

// 获取验证错误信息
const getValidationError = (studentId: number, itemCode: string): string | undefined => {
  return validationErrors.value.get(`${studentId}_${itemCode}`)
}

// 格式化总分
const formatTotalScore = (score: any): string => {
  if (score === null || score === undefined) return '-'
  const numScore = Number(score)
  if (isNaN(numScore)) return '-'
  return numScore.toFixed(1)
}

// 恢复草稿
const restoreDraft = () => {
  if (!selectedForm.value || !selectedClass.value) return

  const savedDraft = draft.loadDraft(selectedForm.value.id, selectedClass.value.id)
  if (!savedDraft) return

  // 恢复数据到 testDataMap
  savedDraft.records.forEach(record => {
    testDataMap.value.set(record.studentId, record.testData)
  })

  toast.success('已恢复上次保存的草稿')
  showDraftDialog.value = false
}

// 放弃草稿
const discardDraft = () => {
  if (!selectedForm.value || !selectedClass.value) return

  draft.clearDraft(selectedForm.value.id, selectedClass.value.id)
  showDraftDialog.value = false
}

// 检查并显示草稿恢复对话框
const checkDraft = () => {
  if (!selectedForm.value || !selectedClass.value) return

  if (draft.hasDraft(selectedForm.value.id, selectedClass.value.id)) {
    draftTimestamp.value = draft.getDraftTimestamp(selectedForm.value.id, selectedClass.value.id)
    showDraftDialog.value = true
  }
}

// 获取草稿数据（用于自动保存）
const getDraftData = () => {
  if (!selectedForm.value || !selectedClass.value) return []

  return students.value.map(student => ({
    studentId: student.id,
    testData: testDataMap.value.get(student.id) || {}
  })).filter(record => Object.keys(record.testData).length > 0) // 只保存有数据的
}

// 设置自动保存
let autoSaveTimer: number | null = null
const startAutoSave = () => {
  if (!selectedForm.value || !selectedClass.value) return

  stopAutoSave()

  autoSaveTimer = window.setInterval(() => {
    const records = getDraftData()
    if (records.length > 0) {
      draft.saveDraft({
        formId: selectedForm.value!.id,
        classId: selectedClass.value!.id,
        records,
        timestamp: Date.now()
      })
    }
  }, 30000) // 30秒自动保存一次
}

const stopAutoSave = () => {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer)
    autoSaveTimer = null
  }
}

// 快捷键处理
const handleKeydown = (event: KeyboardEvent) => {
  // Ctrl+S 打开提交对话框
  if ((event.ctrlKey || event.metaKey) && event.key === 's') {
    event.preventDefault()
    if (currentStep.value === Step.INPUT_DATA && !saving.value) {
      openSubmitDialog()
    }
  }
}

// 初始化
onMounted(() => {
  fetchForms()
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  stopAutoSave()
  document.removeEventListener('keydown', handleKeydown)
})

// 监听步骤变化
watch(currentStep, (newStep) => {
  if (newStep === Step.INPUT_DATA) {
    // 进入录入步骤，检查草稿并启动自动保存
    checkDraft()
    startAutoSave()
  } else {
    // 离开录入步骤，停止自动保存
    stopAutoSave()
  }
})
</script>

<template>
  <div class="space-y-6">
    <div class="max-w-7xl mx-auto">
      <!-- 页面标题 -->
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900">体测数据录入</h1>
        <p class="mt-2 text-gray-600">选择表单、选择班级，然后批量录入体测数据</p>
      </div>

      <!-- 步骤指示器 -->
      <div class="mb-8">
        <nav class="flex items-center justify-center">
          <ol class="flex items-center space-x-4">
            <!-- 步骤 1 -->
            <li class="flex items-center">
              <div
                :class="[
                  'flex items-center justify-center w-10 h-10 rounded-full border-2',
                  currentStep >= Step.SELECT_FORM
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-gray-300 bg-white text-gray-500'
                ]"
              >
                <DocumentTextIcon v-if="currentStep === Step.SELECT_FORM" class="w-5 h-5" />
                <CheckCircleIcon v-else-if="currentStep > Step.SELECT_FORM" class="w-5 h-5" />
                <span v-else>1</span>
              </div>
              <span
                :class="[
                  'ml-2 text-sm font-medium',
                  currentStep >= Step.SELECT_FORM ? 'text-blue-600' : 'text-gray-500'
                ]"
              >
                选择表单
              </span>
            </li>

            <ChevronRightIcon class="w-5 h-5 text-gray-400" />

            <!-- 步骤 2 -->
            <li class="flex items-center">
              <div
                :class="[
                  'flex items-center justify-center w-10 h-10 rounded-full border-2',
                  currentStep >= Step.SELECT_CLASS
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-gray-300 bg-white text-gray-500'
                ]"
              >
                <UserGroupIcon v-if="currentStep === Step.SELECT_CLASS" class="w-5 h-5" />
                <CheckCircleIcon v-else-if="currentStep > Step.SELECT_CLASS" class="w-5 h-5" />
                <span v-else>2</span>
              </div>
              <span
                :class="[
                  'ml-2 text-sm font-medium',
                  currentStep >= Step.SELECT_CLASS ? 'text-blue-600' : 'text-gray-500'
                ]"
              >
                选择班级
              </span>
            </li>

            <ChevronRightIcon class="w-5 h-5 text-gray-400" />

            <!-- 步骤 3 -->
            <li class="flex items-center">
              <div
                :class="[
                  'flex items-center justify-center w-10 h-10 rounded-full border-2',
                  currentStep >= Step.INPUT_DATA
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-gray-300 bg-white text-gray-500'
                ]"
              >
                <PencilSquareIcon v-if="currentStep === Step.INPUT_DATA" class="w-5 h-5" />
                <span v-else>3</span>
              </div>
              <span
                :class="[
                  'ml-2 text-sm font-medium',
                  currentStep >= Step.INPUT_DATA ? 'text-blue-600' : 'text-gray-500'
                ]"
              >
                录入数据
              </span>
            </li>
          </ol>
        </nav>
      </div>

      <!-- 内容区域 -->
      <Card>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-semibold text-gray-900">{{ stepTitle }}</h2>
            <Button
              v-if="currentStep > Step.SELECT_FORM"
              variant="ghost"
              size="sm"
              @click="goBack"
            >
              返回上一步
            </Button>
          </div>
        </template>

        <!-- 加载状态 -->
        <Loading v-if="loading" />

        <!-- 步骤 1: 选择表单 -->
        <div v-else-if="currentStep === Step.SELECT_FORM">
          <div v-if="publishedForms.length === 0" class="text-center py-12 text-gray-500">
            暂无可用的体测表单
          </div>
          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="form in publishedForms"
              :key="form.id"
              class="border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer"
              @click="selectForm(form)"
            >
              <h3 class="font-semibold text-gray-900 mb-2">{{ form.formName }}</h3>
              <div class="space-y-1 text-sm text-gray-600">
                <p>学年: {{ form.academicYear }}</p>
                <p>测试日期: {{ formatDate(form.testDate) }}</p>
                <p v-if="form.description" class="text-gray-500">{{ form.description }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 步骤 2: 选择班级 -->
        <div v-else-if="currentStep === Step.SELECT_CLASS">
          <!-- 年级筛选 -->
          <div v-if="availableCohorts.length > 0" class="mb-4 flex items-center gap-2">
            <span class="text-sm font-medium text-gray-700">筛选年级：</span>
            <div class="flex items-center gap-2">
              <button
                :class="[
                  'px-3 py-1.5 text-sm rounded-lg transition-colors',
                  !cohortFilter
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                ]"
                @click="cohortFilter = ''"
              >
                全部
              </button>
              <button
                v-for="cohort in availableCohorts"
                :key="cohort"
                :class="[
                  'px-3 py-1.5 text-sm rounded-lg transition-colors',
                  cohortFilter === cohort
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                ]"
                @click="cohortFilter = cohort"
              >
                {{ cohort }} 级
              </button>
            </div>
            <span v-if="cohortFilter" class="text-sm text-gray-500">
              （显示 {{ filteredClasses.length }} 个班级）
            </span>
          </div>

          <div v-if="noEligibleClasses" class="text-center py-12">
            <p class="text-gray-500 mb-2">该表单没有符合条件的班级可以录入数据</p>
            <p class="text-sm text-gray-400">
              适用年级: {{ selectedForm?.participatingCohorts.map(c => c + '级').join('、') }}
            </p>
          </div>
          <div v-else-if="filteredClasses.length === 0" class="text-center py-12 text-gray-500">
            暂无班级
          </div>
          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="classItem in filteredClasses"
              :key="classItem.id"
              class="border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer"
              @click="selectClass(classItem)"
            >
              <h3 class="font-semibold text-gray-900 mb-2">
                {{ classItem.cohort }} {{ classItem.className }}
              </h3>
              <div class="space-y-2 text-sm text-gray-600">
                <p v-if="classItem.graduated" class="text-red-500">已毕业</p>

                <!-- 完成进度 -->
                <div class="space-y-1">
                  <div class="flex items-center justify-between text-xs">
                    <span class="text-gray-500">完成进度</span>
                    <span class="font-medium text-gray-700">
                      {{ getClassProgress(classItem.id).completed }} / {{ getClassProgress(classItem.id).total }}
                      ({{ getClassProgressPercent(classItem.id) }}%)
                    </span>
                  </div>
                  <div class="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      class="h-full rounded-full transition-all duration-300"
                      :class="[
                        getClassProgressPercent(classItem.id) === 100
                          ? 'bg-green-500'
                          : getClassProgressPercent(classItem.id) >= 50
                          ? 'bg-blue-500'
                          : 'bg-yellow-500'
                      ]"
                      :style="{ width: `${getClassProgressPercent(classItem.id)}%` }"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 步骤 3: 录入数据 -->
        <div v-else-if="currentStep === Step.INPUT_DATA">
          <!-- 顶部操作栏 -->
          <div class="mb-4 space-y-3">
            <!-- 表单和班级信息 -->
            <div class="flex items-center justify-between">
              <div class="text-sm text-gray-600">
                <p>
                  <span class="font-semibold">表单:</span> {{ selectedForm?.formName }}
                </p>
                <p>
                  <span class="font-semibold">班级:</span>
                  {{ selectedClass?.cohort }} {{ selectedClass?.className }}
                </p>
                <p>
                  <span class="font-semibold">学生人数:</span> {{ students.length }}
                </p>
              </div>
              <div class="flex items-center gap-2">
                <Button
                  variant="secondary"
                  @click="clearAllDrafts"
                >
                  清空所有草稿
                </Button>
                <Button
                  variant="primary"
                  :loading="saving"
                  @click="openSubmitDialog"
                >
                  提交数据
                </Button>
              </div>
            </div>

            <!-- 草稿状态显示 -->
            <div class="flex items-center gap-4 text-sm">
              <div class="flex items-center gap-2">
                <span class="text-gray-600">已填写完整:</span>
                <span
                  :class="[
                    'font-semibold',
                    filledStudentsCount === students.length ? 'text-green-600' : 'text-orange-600'
                  ]"
                >
                  {{ filledStudentsCount }} / {{ students.length }} 名学生
                </span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-gray-600">完成度:</span>
                <span
                  :class="[
                    'font-semibold',
                    completeness === 100 ? 'text-green-600' : 'text-orange-600'
                  ]"
                >
                  {{ completeness }}%
                </span>
              </div>
              <div v-if="lastSaveTime" class="flex items-center gap-2">
                <span class="text-gray-600">最后保存:</span>
                <span class="text-gray-500">{{ draftRelativeTime }}</span>
              </div>
              <div v-if="filledStudentsCount < students.length" class="flex items-center gap-2 text-orange-600">
                <span>⚠️ 需填写完整所有学生数据才能提交</span>
              </div>
            </div>

            <!-- 颜色图例 -->
            <div class="flex items-center gap-4 text-xs text-gray-600 bg-gray-50 rounded-lg p-2">
              <span class="font-semibold">状态图例:</span>
              <div class="flex items-center gap-1">
                <div class="w-4 h-4 bg-green-50 border border-green-200 rounded"></div>
                <span>已完成（所有必填项已填写）</span>
              </div>
              <div class="flex items-center gap-1">
                <div class="w-4 h-4 bg-yellow-50 border border-yellow-200 rounded"></div>
                <span>未完成（部分项目未填写）</span>
              </div>
              <div class="flex items-center gap-1">
                <div class="w-4 h-4 bg-white border border-gray-200 rounded"></div>
                <span>未填写</span>
              </div>
              <div class="flex items-center gap-1">
                <div class="w-4 h-4 bg-blue-100 border border-blue-400 rounded"></div>
                <span>当前搜索定位</span>
              </div>
            </div>
          </div>

          <!-- 快捷键提示 -->
          <div class="mb-2 flex items-center gap-4 text-xs text-gray-500">
            <div class="flex items-center gap-1">
              <kbd class="px-2 py-0.5 bg-gray-100 border border-gray-300 rounded text-gray-700 font-mono">Tab</kbd>
              <span>跳转到下一个输入框</span>
            </div>
            <div class="flex items-center gap-1">
              <kbd class="px-2 py-0.5 bg-gray-100 border border-gray-300 rounded text-gray-700 font-mono">Enter</kbd>
              <span>循环切换搜索结果</span>
            </div>
            <div class="flex items-center gap-1">
              <kbd class="px-2 py-0.5 bg-gray-100 border border-gray-300 rounded text-gray-700 font-mono">Ctrl</kbd>
              <span>+</span>
              <kbd class="px-2 py-0.5 bg-gray-100 border border-gray-300 rounded text-gray-700 font-mono">F</kbd>
              <span>快速聚焦搜索框</span>
            </div>
            <div class="flex items-center gap-1">
              <kbd class="px-2 py-0.5 bg-gray-100 border border-gray-300 rounded text-gray-700 font-mono">Ctrl</kbd>
              <span>+</span>
              <kbd class="px-2 py-0.5 bg-gray-100 border border-gray-300 rounded text-gray-700 font-mono">S</kbd>
              <span>打开提交预览</span>
            </div>
            <div class="flex items-center gap-1 text-blue-600">
              <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
              <span>数据自动保存到本地草稿</span>
            </div>
          </div>

          <!-- 学生搜索框 -->
          <div class="mb-4 flex items-center gap-2">
            <input
              ref="searchInputRef"
              v-model="searchQuery"
              type="text"
              placeholder="输入学号或姓名搜索..."
              class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button @click="searchStudent" variant="primary">搜索</Button>
            <Button v-if="searchQuery" @click="clearSearch" variant="secondary">清空</Button>
            <span v-if="matchedStudents.length > 1 && searchQuery && highlightedStudentId" class="text-sm text-blue-600">
              第 {{ currentMatchIndex + 1 }} / {{ matchedStudents.length }} 个结果
            </span>
            <span v-else-if="matchedStudents.length === 1 && searchQuery" class="text-sm text-gray-600">
              找到 1 个匹配结果
            </span>
            <span v-else-if="searchQuery && matchedStudents.length === 0" class="text-sm text-red-600">
              未找到匹配结果
            </span>
          </div>

          <!-- 数据录入表格 -->
          <div class="relative">
            <!-- 左侧滚动按钮 -->
            <button
              v-if="canScrollLeft"
              @click="scrollLeft"
              class="absolute -left-4 top-1/2 -translate-y-1/2 z-30 bg-blue-600 hover:bg-blue-700 text-white shadow-lg rounded-full p-2 transition-all hover:scale-110"
              title="向左滚动"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <!-- 右侧滚动按钮 -->
            <button
              v-if="canScrollRight"
              @click="scrollRight"
              class="absolute -right-4 top-1/2 -translate-y-1/2 z-30 bg-blue-600 hover:bg-blue-700 text-white shadow-lg rounded-full p-2 transition-all hover:scale-110"
              title="向右滚动"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <!-- 表格容器 -->
            <div ref="tableScrollContainer" class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                    学号
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                    姓名
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    性别
                  </th>
                  <th
                    v-for="item in selectedForm?.items"
                    :key="item.id"
                    class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    {{ item.itemName }}
                    <span class="text-gray-400">({{ item.itemUnit }})</span>
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    总分
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    等级
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr
                  v-for="student in students"
                  :key="student.id"
                  :data-student-id="student.id"
                  :class="[
                    'hover:bg-gray-50 transition-colors',
                    getStudentDataStatus(student.id, student.gender) === 'complete' ? 'bg-green-50' : '',
                    getStudentDataStatus(student.id, student.gender) === 'partial' ? 'bg-yellow-50' : '',
                    highlightedStudentId === student.id ? 'ring-2 ring-blue-400 bg-blue-100' : ''
                  ]"
                >
                  <td
                    :class="[
                      'px-4 py-3 text-sm text-gray-900 whitespace-nowrap sticky left-0',
                      getStudentDataStatus(student.id, student.gender) === 'complete' ? 'bg-green-50' : '',
                      getStudentDataStatus(student.id, student.gender) === 'partial' ? 'bg-yellow-50' : 'bg-white',
                      highlightedStudentId === student.id ? 'bg-blue-100' : ''
                    ]"
                  >
                    {{ student.studentIdSchool }}
                  </td>
                  <td
                    :class="[
                      'px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap sticky left-0',
                      getStudentDataStatus(student.id, student.gender) === 'complete' ? 'bg-green-50' : '',
                      getStudentDataStatus(student.id, student.gender) === 'partial' ? 'bg-yellow-50' : 'bg-white',
                      highlightedStudentId === student.id ? 'bg-blue-100' : ''
                    ]"
                  >
                    <div class="flex items-center gap-2">
                      <span>{{ student.name }}</span>
                      <!-- 状态标识 -->
                      <span
                        v-if="getStudentDataStatus(student.id, student.gender) === 'complete'"
                        class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800"
                        title="所有必填项已填写完整"
                      >
                        ✓ 完成
                      </span>
                      <span
                        v-else-if="getStudentDataStatus(student.id, student.gender) === 'partial'"
                        class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800"
                        title="部分项目未填写"
                      >
                        ⚠ 未完成
                      </span>
                    </div>
                  </td>
                  <td class="px-4 py-3 text-sm text-gray-900">
                    {{ getGenderText(student.gender) }}
                  </td>
                  <!-- 动态测试项目输入框 -->
                  <td
                    v-for="item in selectedForm?.items"
                    :key="item.id"
                    class="px-4 py-3"
                  >
                    <!-- 只显示适用于该学生性别的项目 -->
                    <div v-if="!item.genderLimit || item.genderLimit === student.gender">
                      <!-- 计算型项目显示为自动计算 -->
                      <span v-if="item.isCalculated" class="text-gray-400 text-sm">自动计算</span>
                      <!-- 时间格式项目：使用 TimeInput 组件 -->
                      <div v-else-if="item.itemUnit === '分秒'">
                        <TimeInput
                          :model-value="testDataMap.get(student.id)?.[item.itemCode]"
                          :min="item.validationRules?.min"
                          :max="item.validationRules?.max"
                          @update:model-value="(value) => updateTestData(student.id, item.itemCode, value, item)"
                          @error="(msg) => handleTimeError(student.id, item.itemCode, msg)"
                        />
                        <p
                          v-if="getValidationError(student.id, item.itemCode)"
                          class="text-xs text-red-600 mt-1"
                        >
                          {{ getValidationError(student.id, item.itemCode) }}
                        </p>
                      </div>
                      <!-- 普通数字输入项目 -->
                      <div v-else>
                        <input
                          :value="testDataMap.get(student.id)?.[item.itemCode] || ''"
                          type="text"
                          :placeholder="`输入${item.itemName}`"
                          :class="[
                            'w-24 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:border-blue-500',
                            getValidationError(student.id, item.itemCode)
                              ? 'border-red-500 focus:ring-red-500'
                              : 'border-gray-300 focus:ring-blue-500'
                          ]"
                          @input="updateTestData(student.id, item.itemCode, ($event.target as HTMLInputElement).value, item)"
                          @keydown="filterNumericInput"
                        />
                        <p
                          v-if="getValidationError(student.id, item.itemCode)"
                          class="text-xs text-red-600 mt-1"
                        >
                          {{ getValidationError(student.id, item.itemCode) }}
                        </p>
                      </div>
                    </div>
                    <span v-else class="text-gray-400 text-sm">-</span>
                  </td>
                  <!-- 总分 -->
                  <td class="px-4 py-3 text-sm font-semibold text-gray-900">
                    {{ formatTotalScore(existingRecordsMap.get(student.id)?.totalScore) }}
                  </td>
                  <!-- 等级 -->
                  <td class="px-4 py-3 text-sm">
                    <span :class="getGradeLevelClass(existingRecordsMap.get(student.id)?.gradeLevel)">
                      {{ getGradeLevelText(existingRecordsMap.get(student.id)?.gradeLevel) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
            </div>
          </div>

          <!-- 空状态 -->
          <div v-if="students.length === 0" class="text-center py-12 text-gray-500">
            该班级暂无学生
          </div>
        </div>
      </Card>

      </div>

    <!-- 草稿恢复对话框 -->
    <Modal v-model="showDraftDialog" title="发现未保存的草稿" size="md">
      <div class="space-y-4">
        <p class="text-sm text-gray-600">
          检测到上次录入时保存的草稿数据
          <span v-if="draftTimestamp" class="block mt-1 text-xs text-gray-500">
            保存时间：{{ draft.formatTimestamp(draftTimestamp) }}
          </span>
        </p>

        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p class="text-sm text-yellow-800">
            <strong>提示：</strong>恢复草稿将覆盖当前已填写的数据
          </p>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <Button variant="secondary" @click="discardDraft">
            放弃草稿
          </Button>
          <Button variant="primary" @click="restoreDraft">
            <template #icon>
              <ArrowPathIcon class="h-5 w-5" />
            </template>
            恢复草稿
          </Button>
        </div>
      </template>
    </Modal>

    <!-- 提交预览对话框 -->
    <Modal v-model="showSubmitDialog" title="提交数据预览" size="lg">
      <div class="space-y-4">
        <!-- 统计信息 -->
        <div class="grid grid-cols-2 gap-4">
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p class="text-sm text-blue-600 mb-1">学生总数</p>
            <p class="text-2xl font-bold text-blue-700">{{ students.length }}</p>
          </div>
          <div class="bg-green-50 border border-green-200 rounded-lg p-4">
            <p class="text-sm text-green-600 mb-1">完成度</p>
            <p class="text-2xl font-bold text-green-700">{{ completeness }}%</p>
          </div>
        </div>

        <!-- 警告提示 -->
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p class="text-sm text-yellow-800">
            <strong>注意：</strong>提交后将保存所有学生的体测数据到数据库，并覆盖已存在的记录。
          </p>
        </div>

        <!-- 学生数据列表 -->
        <div>
          <h3 class="text-sm font-semibold text-gray-700 mb-2">
            学生数据预览 ({{ students.length }} 名)
          </h3>
          <div class="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50 sticky top-0">
                <tr>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">学号</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">姓名</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">性别</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">填写项目数</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr
                  v-for="student in students"
                  :key="student.id"
                  class="hover:bg-gray-50"
                >
                  <td class="px-4 py-2 text-sm text-gray-900">{{ student.studentIdSchool }}</td>
                  <td class="px-4 py-2 text-sm font-medium text-gray-900">{{ student.name }}</td>
                  <td class="px-4 py-2 text-sm text-gray-600">{{ getGenderText(student.gender) }}</td>
                  <td class="px-4 py-2 text-sm text-green-600 font-semibold">
                    {{ Object.keys(testDataMap.get(student.id) || {}).length }} 项
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <Button variant="secondary" @click="showSubmitDialog = false">
            取消
          </Button>
          <Button variant="primary" :loading="saving" @click="submitAllData">
            确认提交
          </Button>
        </div>
      </template>
    </Modal>
  </div>
</template>
