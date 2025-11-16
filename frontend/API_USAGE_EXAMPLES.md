# API 接口使用示例

本文档展示如何在前端使用封装好的 API 接口。

## 导入方式

```typescript
// 方式 1: 按需导入
import { authAPI, usersAPI, classesAPI } from '@/api'

// 方式 2: 单独导入
import authAPI from '@/api/auth'
import usersAPI from '@/api/users'
```

## 认证模块 (authAPI)

### 登录
```typescript
import { authAPI } from '@/api'

const login = async () => {
  try {
    const response = await authAPI.login({
      username: 'admin',
      password: '123456'
    })
    // response: { token: string, user: User }
    localStorage.setItem('token', response.token)
    console.log('登录成功', response.user)
  } catch (error) {
    console.error('登录失败', error)
  }
}
```

### 登出
```typescript
const logout = async () => {
  try {
    await authAPI.logout()
    localStorage.removeItem('token')
    console.log('登出成功')
  } catch (error) {
    console.error('登出失败', error)
  }
}
```

### 获取当前用户信息
```typescript
const getCurrentUser = async () => {
  try {
    const user = await authAPI.getCurrentUser()
    console.log('当前用户', user)
  } catch (error) {
    console.error('获取用户信息失败', error)
  }
}
```

## 用户管理模块 (usersAPI)

### 获取用户列表
```typescript
import { usersAPI } from '@/api'

const fetchUsers = async () => {
  try {
    const response = await usersAPI.getUsers({
      page: 1,
      pageSize: 10,
      role: 'teacher',
      realName: '张三'
    })
    console.log('用户列表', response.data)
    console.log('总数', response.total)
  } catch (error) {
    console.error('获取用户列表失败', error)
  }
}
```

### 创建用户
```typescript
const createUser = async () => {
  try {
    const newUser = await usersAPI.createUser({
      username: 'teacher01',
      password: '123456',
      role: 'teacher',
      realName: '李老师'
    })
    console.log('创建成功', newUser)
  } catch (error) {
    console.error('创建用户失败', error)
  }
}
```

### 修改密码
```typescript
const changePassword = async (userId: number) => {
  try {
    await usersAPI.updatePassword(userId, 'newPassword123')
    console.log('密码修改成功')
  } catch (error) {
    console.error('密码修改失败', error)
  }
}
```

### 为教师分配班级
```typescript
const assignClass = async (teacherId: number, classId: number) => {
  try {
    await usersAPI.assignClassToTeacher(teacherId, classId)
    console.log('班级分配成功')
  } catch (error) {
    console.error('班级分配失败', error)
  }
}
```

## 班级管理模块 (classesAPI)

### 获取班级列表
```typescript
import { classesAPI } from '@/api'

const fetchClasses = async () => {
  try {
    const response = await classesAPI.getClasses({
      page: 1,
      pageSize: 20,
      graduated: false,
      currentGradeLevel: 7
    })
    console.log('班级列表', response.data)
  } catch (error) {
    console.error('获取班级列表失败', error)
  }
}
```

### 创建班级
```typescript
const createClass = async () => {
  try {
    const newClass = await classesAPI.createClass({
      cohort: '2024级',
      className: '1班',
      classAccount: 'class_2024_1',
      graduated: false,
      currentGradeLevel: 7,
      currentGradeName: '初一'
    })
    console.log('班级创建成功', newClass)
  } catch (error) {
    console.error('班级创建失败', error)
  }
}
```

### 重置班级密码
```typescript
const resetClassPassword = async (classId: number) => {
  try {
    const result = await classesAPI.resetPassword(classId)
    console.log('新密码:', result.password)
  } catch (error) {
    console.error('密码重置失败', error)
  }
}
```

## 学生管理模块 (studentsAPI)

### 获取学生列表
```typescript
import { studentsAPI } from '@/api'

const fetchStudents = async () => {
  try {
    const response = await studentsAPI.getStudents({
      page: 1,
      pageSize: 50,
      classId: 1,
      gender: 'male'
    })
    console.log('学生列表', response.data)
  } catch (error) {
    console.error('获取学生列表失败', error)
  }
}
```

### 创建学生
```typescript
const createStudent = async () => {
  try {
    const newStudent = await studentsAPI.createStudent({
      studentIdNational: 'G123456789012345678',
      studentIdSchool: '2024001',
      name: '张三',
      gender: 'male',
      birthDate: '2010-05-15',
      phone: '13800138000'
    })
    console.log('学生创建成功', newStudent)
  } catch (error) {
    console.error('学生创建失败', error)
  }
}
```

### 学生转班
```typescript
const transferStudent = async (studentId: number) => {
  try {
    await studentsAPI.transferStudent(
      studentId,
      1,  // 原班级ID
      2,  // 目标班级ID
      '2024-2025'  // 学年
    )
    console.log('转班成功')
  } catch (error) {
    console.error('转班失败', error)
  }
}
```

## 表单管理模块 (formsAPI)

### 获取表单列表
```typescript
import { formsAPI } from '@/api'

const fetchForms = async () => {
  try {
    const response = await formsAPI.getForms({
      page: 1,
      pageSize: 10,
      academicYear: '2024-2025',
      status: 'published'
    })
    console.log('表单列表', response.data)
  } catch (error) {
    console.error('获取表单列表失败', error)
  }
}
```

### 创建表单
```typescript
const createForm = async () => {
  try {
    const newForm = await formsAPI.createForm({
      formName: '2024年秋季学期体测',
      academicYear: '2024-2025',
      testDate: '2024-11-20',
      status: 'draft',
      description: '本次体测包含身高、体重、肺活量等项目'
    })
    console.log('表单创建成功', newForm)
  } catch (error) {
    console.error('表单创建失败', error)
  }
}
```

### 发布表单
```typescript
const publishForm = async (formId: number) => {
  try {
    await formsAPI.publishForm(formId)
    console.log('表单发布成功')
  } catch (error) {
    console.error('表单发布失败', error)
  }
}
```

### 获取表单测试项目
```typescript
const getFormItems = async (formId: number) => {
  try {
    const items = await formsAPI.getTestItems(formId)
    console.log('测试项目', items)
  } catch (error) {
    console.error('获取测试项目失败', error)
  }
}
```

## 体测记录模块 (recordsAPI)

### 获取班级学生列表
```typescript
import { recordsAPI } from '@/api'

const getStudentsForTest = async (formId: number, classId: number) => {
  try {
    const students = await recordsAPI.getClassStudentsForForm(formId, classId)
    console.log('待测学生', students)
  } catch (error) {
    console.error('获取学生列表失败', error)
  }
}
```

### 保存学生体测记录
```typescript
const saveTestRecord = async (formId: number, studentId: number) => {
  try {
    const record = await recordsAPI.createOrUpdateRecord(formId, studentId, {
      classId: 1,
      testData: {
        height: 165,
        weight: 55,
        vitalCapacity: 3200,
        fiftyMeterRun: 8.5
      }
    })
    console.log('记录保存成功', record)
  } catch (error) {
    console.error('记录保存失败', error)
  }
}
```

### 批量保存体测记录
```typescript
const batchSaveRecords = async (formId: number) => {
  try {
    await recordsAPI.batchSaveRecords(formId, [
      {
        studentId: 1,
        classId: 1,
        testData: { height: 165, weight: 55 }
      },
      {
        studentId: 2,
        classId: 1,
        testData: { height: 170, weight: 60 }
      }
    ])
    console.log('批量保存成功')
  } catch (error) {
    console.error('批量保存失败', error)
  }
}
```

## 统计分析模块 (statisticsAPI)

### 获取整体统计
```typescript
import { statisticsAPI } from '@/api'

const getOverallStats = async () => {
  try {
    const stats = await statisticsAPI.getOverallStats({
      academicYear: '2024-2025'
    })
    console.log('整体统计', stats)
  } catch (error) {
    console.error('获取统计数据失败', error)
  }
}
```

### 获取班级统计
```typescript
const getClassStats = async (formId: number, classId: number) => {
  try {
    const stats = await statisticsAPI.getClassStats(formId, classId)
    console.log('班级统计', stats)
  } catch (error) {
    console.error('获取班级统计失败', error)
  }
}
```

### 获取学生历史数据
```typescript
const getStudentHistory = async (studentId: number) => {
  try {
    const history = await statisticsAPI.getStudentHistory(studentId)
    console.log('学生历史数据', history)
  } catch (error) {
    console.error('获取学生历史数据失败', error)
  }
}
```

## 在 Vue 组件中使用

### Composition API 示例
```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { authAPI, usersAPI } from '@/api'
import type { User } from '@/types'

const currentUser = ref<User | null>(null)
const users = ref<User[]>([])
const loading = ref(false)

// 获取当前用户
const loadCurrentUser = async () => {
  try {
    loading.value = true
    currentUser.value = await authAPI.getCurrentUser()
  } catch (error) {
    console.error('获取用户信息失败', error)
  } finally {
    loading.value = false
  }
}

// 获取用户列表
const loadUsers = async () => {
  try {
    loading.value = true
    const response = await usersAPI.getUsers({ page: 1, pageSize: 10 })
    users.value = response.data
  } catch (error) {
    console.error('获取用户列表失败', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadCurrentUser()
  loadUsers()
})
</script>

<template>
  <div v-if="loading">加载中...</div>
  <div v-else>
    <div v-if="currentUser">
      当前用户: {{ currentUser.realName }}
    </div>
    <ul>
      <li v-for="user in users" :key="user.id">
        {{ user.realName }} - {{ user.role }}
      </li>
    </ul>
  </div>
</template>
```

## 错误处理

HTTP 客户端已经在拦截器中处理了常见错误（401、403、500等），你只需要在调用时捕获异常即可：

```typescript
try {
  const result = await authAPI.login({ username, password })
  // 处理成功逻辑
} catch (error) {
  // 错误已被拦截器处理并打印到控制台
  // 这里可以添加额外的错误处理逻辑，如显示错误提示
  console.error('操作失败', error)
}
```

## 类型安全

所有 API 接口都有完整的 TypeScript 类型定义，IDE 会提供智能提示：

```typescript
import { authAPI } from '@/api'
import type { LoginRequest } from '@/types'

// IDE 会自动提示 LoginRequest 的结构
const loginData: LoginRequest = {
  username: 'admin',  // ✓ 正确
  password: '123456'  // ✓ 正确
  // email: 'test@test.com'  // ✗ 错误: LoginRequest 没有 email 字段
}

const response = await authAPI.login(loginData)
// IDE 会提示 response 的类型为 LoginResponse
// response.token  ✓
// response.user   ✓
```
