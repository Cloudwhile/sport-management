# API 接口参考手册

本文档列出所有可用的前端 API 接口。

---

## 📁 文件结构

```
src/api/
├── auth.ts          # 认证接口
├── users.ts         # 用户管理接口
├── classes.ts       # 班级管理接口
├── students.ts      # 学生管理接口
├── forms.ts         # 表单管理接口
├── records.ts       # 体测记录接口
├── statistics.ts    # 统计分析接口
└── index.ts         # 统一导出
```

---

## 🔐 认证接口 (authAPI)

| 方法 | 描述 | 参数 | 返回值 |
|------|------|------|--------|
| `login(data)` | 用户登录 | `LoginRequest` | `LoginResponse` |
| `logout()` | 用户登出 | - | `void` |
| `getCurrentUser()` | 获取当前用户信息 | - | `User` |

---

## 👥 用户管理接口 (usersAPI)

| 方法 | 描述 | 参数 | 返回值 |
|------|------|------|--------|
| `getUsers(params?)` | 获取用户列表 | `UserQueryParams` | `PaginatedResponse<User>` |
| `getUserById(id)` | 获取用户详情 | `number` | `User` |
| `createUser(data)` | 创建用户 | `CreateUserRequest` | `User` |
| `updateUser(id, data)` | 更新用户信息 | `number, UpdateUserRequest` | `User` |
| `deleteUser(id)` | 删除用户 | `number` | `void` |
| `updatePassword(id, password)` | 修改用户密码 | `number, string` | `void` |
| `getTeacherClasses(id)` | 获取教师管理的班级 | `number` | `Class[]` |
| `assignClassToTeacher(id, classId)` | 为教师分配班级 | `number, number` | `void` |
| `removeClassFromTeacher(id, classId)` | 移除教师的班级权限 | `number, number` | `void` |

---

## 🏫 班级管理接口 (classesAPI)

| 方法 | 描述 | 参数 | 返回值 |
|------|------|------|--------|
| `getClasses(params?)` | 获取班级列表 | `ClassQueryParams` | `PaginatedResponse<Class>` |
| `getClassById(id)` | 获取班级详情 | `number` | `Class` |
| `createClass(data)` | 创建班级 | `CreateClassRequest` | `Class` |
| `updateClass(id, data)` | 更新班级信息 | `number, UpdateClassRequest` | `Class` |
| `deleteClass(id)` | 删除班级 | `number` | `void` |
| `resetPassword(id)` | 重置班级密码 | `number` | `{ password: string }` |
| `addStudent(id, studentId, academicYear)` | 添加学生到班级 | `number, number, string` | `void` |
| `removeStudent(id, studentId)` | 从班级移除学生 | `number, number` | `void` |

---

## 👨‍🎓 学生管理接口 (studentsAPI)

| 方法 | 描述 | 参数 | 返回值 |
|------|------|------|--------|
| `getStudents(params?)` | 获取学生列表 | `StudentQueryParams` | `PaginatedResponse<Student>` |
| `getStudentById(id)` | 获取学生详情 | `number` | `Student` |
| `createStudent(data)` | 创建学生 | `CreateStudentRequest` | `Student` |
| `updateStudent(id, data)` | 更新学生信息 | `number, UpdateStudentRequest` | `Student` |
| `deleteStudent(id)` | 删除学生 | `number` | `void` |
| `transferStudent(id, fromClassId, toClassId, academicYear)` | 学生转班 | `number, number, number, string` | `void` |

---

## 📋 表单管理接口 (formsAPI)

| 方法 | 描述 | 参数 | 返回值 |
|------|------|------|--------|
| `getForms(params?)` | 获取表单列表 | `PhysicalTestFormQueryParams` | `PaginatedResponse<PhysicalTestForm>` |
| `getFormById(id)` | 获取表单详情（含测试项目） | `number` | `PhysicalTestFormWithItems` |
| `createForm(data)` | 创建表单 | `CreatePhysicalTestFormRequest` | `PhysicalTestForm` |
| `updateForm(id, data)` | 更新表单信息 | `number, UpdatePhysicalTestFormRequest` | `PhysicalTestForm` |
| `deleteForm(id)` | 删除表单 | `number` | `void` |
| `publishForm(id)` | 发布表单 | `number` | `void` |
| `closeForm(id)` | 关闭表单 | `number` | `void` |
| `getTestItems(id)` | 获取表单的测试项目 | `number` | `FormTestItem[]` |
| `updateTestItems(id, items)` | 更新表单的测试项目 | `number, UpdateFormTestItemRequest[]` | `void` |

---

## 📝 体测记录接口 (recordsAPI)

| 方法 | 描述 | 参数 | 返回值 |
|------|------|------|--------|
| `getClassStudentsForForm(formId, classId)` | 获取班级学生列表 | `number, number` | `Student[]` |
| `getStudentRecord(formId, studentId)` | 获取学生体测记录 | `number, number` | `PhysicalTestRecordWithDetails \| null` |
| `createOrUpdateRecord(formId, studentId, data)` | 创建/更新体测记录 | `number, number, data` | `PhysicalTestRecord` |
| `batchSaveRecords(formId, records)` | 批量保存体测记录 | `number, Array` | `void` |
| `deleteRecord(formId, studentId)` | 删除体测记录 | `number, number` | `void` |

---

## 📊 统计分析接口 (statisticsAPI)

| 方法 | 描述 | 参数 | 返回值 |
|------|------|------|--------|
| `getOverallStats(params?)` | 获取整体统计数据 | `StatisticsQueryParams` | `StatisticsSummaryResponse` |
| `getClassStats(formId, classId)` | 获取班级统计数据 | `number, number` | `StatisticsSummaryResponse` |
| `getGradeStats(formId, gradeId)` | 获取年级统计数据 | `number, string` | `StatisticsSummaryResponse` |
| `getFormStats(formId)` | 获取表单统计数据（全校） | `number` | `StatisticsSummaryResponse` |
| `getTrendData(params?)` | 获取历史趋势数据 | `StatisticsQueryParams` | `any` |
| `getStudentHistory(studentId)` | 获取学生历史体测数据 | `number` | `any` |
| `getClassHistory(classId)` | 获取班级历史体测趋势 | `number` | `any` |

---

## 📦 类型定义

所有类型定义位于 `/home/esap/sport-management/frontend/src/types/` 目录：

- `common.ts` - 通用类型（枚举、分页、响应等）
- `models.ts` - 数据模型接口
- `api.ts` - API 请求/响应类型
- `index.ts` - 统一导出

### 主要类型

#### 请求类型
- `LoginRequest`
- `CreateUserRequest` / `UpdateUserRequest`
- `CreateClassRequest` / `UpdateClassRequest`
- `CreateStudentRequest` / `UpdateStudentRequest`
- `CreatePhysicalTestFormRequest` / `UpdatePhysicalTestFormRequest`
- `CreatePhysicalTestRecordRequest` / `UpdatePhysicalTestRecordRequest`

#### 查询参数类型
- `UserQueryParams`
- `ClassQueryParams`
- `StudentQueryParams`
- `PhysicalTestFormQueryParams`
- `StatisticsQueryParams`

#### 响应类型
- `LoginResponse`
- `PaginatedResponse<T>`
- `StatisticsSummaryResponse`

#### 数据模型类型
- `User`
- `Class`
- `Student`
- `PhysicalTestForm`
- `PhysicalTestRecord`
- `FormTestItem`

#### 枚举类型
- `UserRole` - 用户角色（admin, teacher）
- `FormStatus` - 表单状态（draft, published, closed）
- `Gender` - 性别（male, female）
- `GradeLevel` - 成绩等级（excellent, good, pass, fail）

---

## 🛠️ HTTP 工具

HTTP 客户端配置位于 `/home/esap/sport-management/frontend/src/utils/http.ts`

### 特性
- 基于 Axios
- 自动添加 Bearer Token
- 请求/响应拦截器
- 统一错误处理
- 开发环境日志

### 拦截器行为

**请求拦截器:**
- 自动从 localStorage 读取 token
- 自动添加 Authorization 头
- 开发环境打印请求日志

**响应拦截器:**
- 自动解包响应数据（返回 `response.data`）
- 401 错误自动跳转登录页并清除 token
- 统一错误日志输出

---

## 💡 使用提示

1. **导入方式**
   ```typescript
   // 推荐: 按需导入
   import { authAPI, usersAPI } from '@/api'
   
   // 也可以: 单独导入
   import authAPI from '@/api/auth'
   ```

2. **类型安全**
   - 所有接口都有完整的 TypeScript 类型定义
   - IDE 会提供智能提示和类型检查
   - 编译时会捕获类型错误

3. **错误处理**
   - 使用 try-catch 捕获异常
   - HTTP 拦截器已处理常见错误
   - 401 会自动跳转登录页

4. **分页查询**
   ```typescript
   const response = await usersAPI.getUsers({
     page: 1,
     pageSize: 10,
     role: 'teacher'
   })
   // response.data - 数据数组
   // response.total - 总记录数
   // response.totalPages - 总页数
   ```

5. **认证**
   - 登录成功后,token 会自动保存到 localStorage
   - 所有后续请求会自动携带 token
   - 登出时记得清除 token

---

## 📖 相关文档

- [API 使用示例](./API_USAGE_EXAMPLES.md) - 详细的代码示例
- [后端 API 文档](../backend/src/swagger/) - 后端 Swagger 文档
- [类型定义](./src/types/) - TypeScript 类型定义源码

---

**创建时间**: 2025-11-16  
**维护者**: AptS:1548
