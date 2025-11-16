# 通用 UI 组件库

基于 Vue 3、TypeScript、Tailwind CSS 3 和 Heroicons 构建的通用 UI 组件库。

## 组件列表

### 1. Button - 按钮组件
基础按钮组件，支持多种样式变体和加载状态。

**Props:**
- `variant`: 'primary' | 'secondary' | 'danger' | 'ghost' (默认: 'primary')
- `size`: 'sm' | 'md' | 'lg' (默认: 'md')
- `loading`: boolean (默认: false)
- `disabled`: boolean (默认: false)

**Slots:**
- `icon`: 图标插槽
- `default`: 默认内容插槽

**使用示例:**
```vue
<Button variant="primary" size="md" :loading="loading">
  提交
</Button>
```

---

### 2. Input - 输入框组件
表单输入框组件，支持多种输入类型和错误提示。

**Props:**
- `modelValue`: string | number
- `type`: 'text' | 'number' | 'email' | 'password' | 'tel' | 'url' (默认: 'text')
- `placeholder`: string
- `disabled`: boolean (默认: false)
- `error`: string (错误消息)
- `label`: string (标签)

**使用示例:**
```vue
<Input
  v-model="username"
  label="用户名"
  placeholder="请输入用户名"
  :error="usernameError"
/>
```

---

### 3. Select - 下拉选择组件
下拉选择框组件。

**Props:**
- `modelValue`: string | number
- `options`: SelectOption[] (必需)
- `placeholder`: string (默认: '请选择')
- `disabled`: boolean (默认: false)
- `label`: string

**类型定义:**
```typescript
interface SelectOption {
  label: string
  value: string | number
}
```

**使用示例:**
```vue
<Select
  v-model="selectedValue"
  label="选择选项"
  :options="options"
  placeholder="请选择"
/>
```

---

### 4. Modal - 弹窗组件
模态对话框组件，支持自定义标题、内容和底部操作区。

**Props:**
- `modelValue`: boolean (必需，控制显示/隐藏)
- `title`: string
- `size`: 'sm' | 'md' | 'lg' | 'xl' (默认: 'md')

**Slots:**
- `header`: 自定义头部
- `default`: 内容区域
- `footer`: 底部操作区

**特性:**
- 点击遮罩层关闭
- ESC 键关闭
- 打开时禁止页面滚动

**使用示例:**
```vue
<Modal v-model="showModal" title="确认删除" size="md">
  <p>确定要删除这条记录吗？</p>
  <template #footer>
    <Button variant="secondary" @click="showModal = false">取消</Button>
    <Button variant="danger" @click="handleDelete">删除</Button>
  </template>
</Modal>
```

---

### 5. Table - 表格组件
数据表格组件，支持自定义列渲染和加载状态。

**Props:**
- `columns`: TableColumn[] (必需)
- `data`: any[] (必需)
- `loading`: boolean (默认: false)

**类型定义:**
```typescript
interface TableColumn {
  key: string
  label: string
  width?: string
}
```

**Slots:**
- `cell-{columnKey}`: 自定义列内容，接收 `{ row, value }` 参数

**使用示例:**
```vue
<Table :columns="columns" :data="data" :loading="loading">
  <template #cell-status="{ value }">
    <Badge :variant="value === 'active' ? 'success' : 'danger'">
      {{ value }}
    </Badge>
  </template>
</Table>
```

---

### 6. Pagination - 分页组件
分页导航组件，支持页码跳转和每页数量调整。

**Props:**
- `currentPage`: number (必需)
- `totalPages`: number (必需)
- `totalItems`: number (必需)
- `pageSize`: number (必需)

**Events:**
- `page-change`: 页码变化，参数: (page: number)
- `size-change`: 每页数量变化，参数: (size: number)

**使用示例:**
```vue
<Pagination
  :current-page="currentPage"
  :total-pages="totalPages"
  :total-items="totalItems"
  :page-size="pageSize"
  @page-change="handlePageChange"
  @size-change="handleSizeChange"
/>
```

---

### 7. Card - 卡片组件
内容卡片容器组件。

**Props:**
- `title`: string
- `subtitle`: string

**Slots:**
- `header`: 自定义头部
- `default`: 内容区域
- `footer`: 底部区域

**使用示例:**
```vue
<Card title="用户信息" subtitle="查看和编辑用户信息">
  <p>用户详情内容...</p>
  <template #footer>
    <Button>编辑</Button>
  </template>
</Card>
```

---

### 8. Badge - 徽章组件
状态标签组件。

**Props:**
- `variant`: 'success' | 'warning' | 'danger' | 'info' (默认: 'info')
- `size`: 'sm' | 'md' | 'lg' (默认: 'md')

**使用示例:**
```vue
<Badge variant="success">已激活</Badge>
<Badge variant="danger" size="sm">已禁用</Badge>
```

---

### 9. Toast - 消息提示
轻量级消息提示组件，配合 `useToast` composable 使用。

**useToast API:**
```typescript
const toast = useToast()

toast.success(message: string, duration?: number)
toast.error(message: string, duration?: number)
toast.warning(message: string, duration?: number)
toast.info(message: string, duration?: number)
```

**使用示例:**
```vue
<script setup lang="ts">
import { useToast } from '@/composables/useToast'

const toast = useToast()

const handleSubmit = () => {
  // 提交逻辑...
  toast.success('提交成功！')
}
</script>
```

**特性:**
- 自动消失（默认 3 秒）
- 支持手动关闭
- 多种消息类型
- 位于页面右上角

---

### 10. Loading - 加载指示器
加载动画组件。

**Props:**
- `size`: 'sm' | 'md' | 'lg' (默认: 'md')
- `text`: string (加载提示文本)

**使用示例:**
```vue
<Loading size="md" text="加载中..." />
```

---

## 统一导入

所有组件都可以从 `@/components/common` 统一导入：

```typescript
import {
  Button,
  Input,
  Select,
  Modal,
  Table,
  Pagination,
  Card,
  Badge,
  Toast,
  Loading
} from '@/components/common'

// 导入类型
import type { SelectOption, TableColumn, ToastProps } from '@/components/common'
```

---

## 完整示例

查看 `ComponentsExample.vue` 文件以获取所有组件的使用示例。

---

## 设计规范

- **样式系统**: Tailwind CSS 3
- **图标库**: @heroicons/vue
- **TypeScript**: 完整类型支持
- **响应式**: 支持移动端和桌面端
- **无障碍性**: 遵循 WCAG 2.1 标准
- **动画**: Tailwind 过渡动画

---

## 浏览器支持

- Chrome >= 90
- Firefox >= 88
- Safari >= 14
- Edge >= 90
