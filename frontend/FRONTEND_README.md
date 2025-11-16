# 学校体测数据管理系统 - 前端文档

## 项目概述

这是一个基于 **Vue 3 + TypeScript + Tailwind CSS 3** 的现代化前端应用，用于管理学校体测数据。

## 技术栈

### 核心框架
- **Vue 3.4+** - 渐进式 JavaScript 框架（Composition API + `<script setup>`）
- **TypeScript 5.0+** - 类型安全的 JavaScript 超集
- **Vite 5.0+** - 下一代前端构建工具

### 状态管理和路由
- **Vue Router 4** - 官方路由管理器
- **Pinia** - 新一代状态管理库

### UI 和样式
- **Tailwind CSS 3** - 实用优先的 CSS 框架
- **Heroicons Vue** - 精美的 SVG 图标库
- **Chart.js + vue-chartjs** - 图表可视化

### 其他工具
- **Axios** - HTTP 客户端
- **Day.js** - 轻量级日期处理
- **VueUse** - Vue 组合式工具集

## 项目结构

```
frontend/
├── src/
│   ├── api/              # API 接口层（8个模块）
│   │   ├── auth.ts       # 认证接口
│   │   ├── users.ts      # 用户管理接口
│   │   ├── classes.ts    # 班级管理接口
│   │   ├── students.ts   # 学生管理接口
│   │   ├── forms.ts      # 表单管理接口
│   │   ├── records.ts    # 体测记录接口
│   │   ├── statistics.ts # 统计分析接口
│   │   └── index.ts      # 统一导出
│   ├── assets/           # 静态资源
│   ├── components/       # 组件库
│   │   ├── common/       # 通用 UI 组件（10个）
│   │   └── layouts/      # 布局组件（3个）
│   ├── composables/      # 组合式函数
│   │   └── useToast.ts   # Toast 消息提示
│   ├── router/           # 路由配置
│   │   ├── index.ts      # 主路由文件
│   │   └── guards.ts     # 路由守卫
│   ├── stores/           # Pinia 状态管理（6个）
│   │   ├── auth.ts       # 认证状态
│   │   ├── users.ts      # 用户状态
│   │   ├── classes.ts    # 班级状态
│   │   ├── students.ts   # 学生状态
│   │   ├── forms.ts      # 表单状态
│   │   └── index.ts      # 统一导出
│   ├── types/            # TypeScript 类型定义
│   │   ├── common.ts     # 通用类型
│   │   ├── models.ts     # 数据模型
│   │   ├── api.ts        # API 类型
│   │   └── index.ts      # 统一导出
│   ├── utils/            # 工具函数
│   │   └── http.ts       # Axios 封装
│   ├── views/            # 页面组件（8个页面）
│   │   ├── auth/         # 认证页面
│   │   │   └── Login.vue
│   │   ├── dashboard/    # 控制台
│   │   │   └── Dashboard.vue
│   │   ├── users/        # 用户管理
│   │   │   └── Users.vue
│   │   ├── students/     # 学生管理
│   │   │   └── StudentManagement.vue
│   │   ├── classes/      # 班级管理
│   │   │   └── ClassManagement.vue
│   │   ├── forms/        # 表单管理
│   │   │   └── Forms.vue
│   │   ├── records/      # 数据录入
│   │   │   └── Records.vue
│   │   └── statistics/   # 统计分析
│   │       └── Statistics.vue
│   ├── App.vue           # 根组件
│   ├── main.ts           # 应用入口
│   └── style.css         # 全局样式（Tailwind）
├── public/               # 公共资源
├── index.html            # HTML 模板
├── vite.config.ts        # Vite 配置
├── tailwind.config.js    # Tailwind 配置
├── tsconfig.json         # TypeScript 配置
└── package.json          # 项目依赖
```

## 核心功能模块

### 1. 认证模块
- **登录页面** (`/login`)
  - 支持三种角色：管理员、教师、班级账号
  - JWT Token 认证
  - 自动跳转和权限控制

### 2. 管理员模块（Admin）
- **用户管理** (`/users`) - 仅管理员
  - CRUD 操作
  - 角色管理
  - 密码重置
- **控制台** (`/dashboard`)
  - 整体数据概览
  - 快捷操作入口
- **班级管理** (`/classes`)
  - Cohort 设计（基于入学年份）
  - 动态年级计算
  - 班级账号管理
- **学生管理** (`/students`)
  - 学生 CRUD
  - 学生转班
  - 批量导入（预留）
- **表单管理** (`/forms`)
  - 创建体测表单
  - 配置测试项目
  - 状态流转（草稿→发布→关闭）
- **统计分析** (`/statistics`)
  - 多维度统计（全校/年级/班级）
  - 图表可视化
  - 历史趋势分析

### 3. 教师模块（Teacher）
- 班级管理（查看）
- 学生管理（查看/编辑）
- 表单管理
- **数据录入** (`/records`)
  - 选择表单和班级
  - 批量录入体测数据
  - 自动评分
- 统计分析

### 4. 班级账号模块（Class）
- 控制台
- 数据录入（仅本班）

## 通用 UI 组件库

位置：`src/components/common/`

| 组件 | 描述 | 主要 Props |
|------|------|-----------|
| **Button** | 按钮组件 | variant, size, loading, disabled |
| **Input** | 输入框 | modelValue, type, placeholder, error |
| **Select** | 下拉选择 | modelValue, options, placeholder |
| **Modal** | 弹窗 | modelValue, title, size |
| **Table** | 表格 | columns, data, loading |
| **Pagination** | 分页 | currentPage, totalPages, pageSize |
| **Card** | 卡片 | title, subtitle |
| **Badge** | 徽章 | variant, size |
| **Toast** | 消息提示 | type, message, duration |
| **Loading** | 加载指示器 | size, text |

## 布局组件

位置：`src/components/layouts/`

- **MainLayout** - 主布局（顶部导航栏 + 侧边栏 + 内容区）
- **Navbar** - 顶部导航栏（Logo、用户信息、退出按钮）
- **Sidebar** - 侧边栏（根据角色动态显示菜单）

## 路由配置

| 路径 | 组件 | 权限 | 说明 |
|------|------|------|------|
| `/` | - | - | 重定向到 `/dashboard` |
| `/login` | Login | 公开 | 登录页 |
| `/dashboard` | Dashboard | 所有角色 | 控制台 |
| `/users` | Users | Admin | 用户管理 |
| `/classes` | ClassManagement | Admin, Teacher | 班级管理 |
| `/students` | StudentManagement | Admin, Teacher | 学生管理 |
| `/forms` | Forms | Admin, Teacher | 表单管理 |
| `/records` | Records | 所有角色 | 数据录入 |
| `/statistics` | Statistics | Admin, Teacher | 统计分析 |

## 状态管理

### Auth Store (`useAuthStore`)
- **State**: token, user, loading, error
- **Getters**: isAuthenticated, userRole, isAdmin, isTeacher
- **Actions**: login, logout, fetchCurrentUser, initAuth

### 其他 Stores
- **useUsersStore** - 用户列表管理
- **useClassesStore** - 班级列表管理
- **useStudentsStore** - 学生列表管理
- **useFormsStore** - 表单列表管理

## API 接口

所有 API 调用统一通过 `/src/api/` 目录下的模块：

```typescript
import { authAPI, usersAPI, classesAPI } from '@/api'

// 登录
await authAPI.login({ username: 'admin', password: '123456' })

// 获取用户列表
const users = await usersAPI.getUsers({ page: 1, pageSize: 10 })
```

### HTTP 拦截器
- **请求拦截器**: 自动添加 JWT Token
- **响应拦截器**: 统一错误处理，401 自动跳转登录

## 开发指南

### 启动开发服务器

```bash
cd frontend
npm install
npm run dev
```

访问 http://localhost:5173

### 构建生产版本

```bash
npm run build
```

输出目录：`dist/`

### 类型检查

```bash
npm run type-check
```

## 环境配置

### Vite 配置 (`vite.config.ts`)

```typescript
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
```

### 路径别名

- `@/` → `src/` 目录

示例：
```typescript
import { Button } from '@/components/common'
import { useAuthStore } from '@/stores'
import type { User } from '@/types'
```

## 核心业务逻辑

### 1. Cohort 设计（班级年级动态计算）
班级基于入学年份（cohort），年级由后端动态计算。前端无需手动维护年级字段。

```typescript
// 后端返回
{
  cohort: "2024级",
  currentGradeLevel: 1,  // 当前年级等级
  currentGradeName: "一年级"  // 当前年级名称
}
```

### 2. 表单状态流转
```
draft (草稿) → published (已发布) → closed (已关闭)
```
- **草稿**: 可编辑配置
- **已发布**: 不可编辑，开放数据录入
- **已关闭**: 数据冻结，仅供查询

### 3. 自动评分
提交体测数据后，后端自动计算：
- 各项分数 (`scores`)
- 总分 (`totalScore`)
- 等级 (`gradeLevel`): 优秀/良好/及格/不及格

## 依赖清单

```json
{
  "dependencies": {
    "vue": "^3.5.13",
    "vue-router": "^4.5.0",
    "pinia": "^2.3.0",
    "axios": "^1.9.0",
    "@heroicons/vue": "^2.2.0",
    "chart.js": "^4.5.1",
    "vue-chartjs": "^5.3.3",
    "dayjs": "^1.12.0",
    "@vueuse/core": "^12.0.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^6.0.0",
    "typescript": "~5.9.3",
    "vite": "^7.2.2",
    "tailwindcss": "^3.4.16",
    "postcss": "^8.5.1",
    "autoprefixer": "^10.4.20"
  }
}
```

## 代码规范

### Vue 组件
- 使用 `<script setup lang="ts">` 语法
- 遵循 Composition API
- Props 使用 `defineProps<T>()`
- Emits 使用 `defineEmits<T>()`

### TypeScript
- 所有变量、函数都有明确的类型
- 使用 `interface` 定义数据模型
- 避免使用 `any` 类型

### 样式
- 优先使用 Tailwind CSS 工具类
- 避免编写自定义 CSS
- 遵循响应式设计原则

## 性能优化

- 路由懒加载
- 组件按需导入
- 图片懒加载（预留）
- 虚拟滚动（大数据列表，预留）

## 安全措施

- JWT Token 认证
- 路由守卫权限控制
- XSS 防护（Tailwind 自动转义）
- CSRF 防护（后端实现）

## 浏览器兼容性

- Chrome >= 90
- Firefox >= 88
- Safari >= 14
- Edge >= 90

## 常见问题

### 1. Token 过期怎么办？
自动跳转到登录页，重新登录即可。

### 2. 如何添加新页面？
1. 在 `src/views/` 创建组件
2. 在 `src/router/index.ts` 添加路由
3. 在 `src/components/layouts/Sidebar.vue` 添加菜单项

### 3. 如何自定义主题色？
修改 `tailwind.config.js` 的 `theme.extend.colors`。

## 后续优化方向

- [ ] Excel 批量导入学生数据
- [ ] Excel 导出统计报表
- [ ] 日期选择器组件
- [ ] 图片上传组件
- [ ] 虚拟滚动优化大列表性能
- [ ] PWA 支持
- [ ] 国际化（i18n）
- [ ] 暗黑模式

## 联系方式

如有问题，请联系项目维护者。

---

**版本**: 1.0.0
**最后更新**: 2025-11-16
**作者**: AptS:1548
