# 全局确认对话框使用指南

## 概述

全局确认对话框是一个可在整个应用中使用的通用组件，用于替代浏览器原生的 `confirm()` 对话框，提供更美观、更灵活的用户确认体验。

## 组件位置

- **组件**: `/src/components/common/ConfirmDialog.vue`
- **Hook**: `/src/composables/useConfirm.ts`
- **集成位置**: `/src/App.vue`

## 使用方法

### 1. 在组件中导入 hook

```typescript
import { useConfirm } from '@/composables/useConfirm'

// 在 setup 函数中
const confirm = useConfirm()
```

### 2. 调用确认对话框

```typescript
// 基本用法
const confirmed = await confirm({
  title: '确认操作',
  message: '确定要执行此操作吗？'
})

if (confirmed) {
  // 用户点击了确认按钮
  console.log('用户确认了操作')
} else {
  // 用户点击了取消按钮或关闭了对话框
  console.log('用户取消了操作')
}
```

### 3. 自定义选项

```typescript
const confirmed = await confirm({
  title: '删除确认',
  message: '确定要删除这条记录吗？此操作不可恢复！',
  confirmText: '删除',      // 自定义确认按钮文字
  cancelText: '取消',       // 自定义取消按钮文字
  variant: 'danger'         // 'danger' | 'primary'，按钮样式
})
```

## 完整示例

### 示例 1: 删除操作

```typescript
<script setup lang="ts">
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'

const confirm = useConfirm()
const toast = useToast()

const deleteItem = async (itemId: number) => {
  const confirmed = await confirm({
    title: '删除确认',
    message: '确定要删除这条记录吗？此操作不可恢复！',
    confirmText: '删除',
    variant: 'danger'
  })

  if (!confirmed) return

  try {
    await api.deleteItem(itemId)
    toast.success('删除成功')
  } catch (error: any) {
    toast.error(error.message || '删除失败')
  }
}
</script>
```

### 示例 2: 清空数据

```typescript
const clearData = async () => {
  const confirmed = await confirm({
    title: '清空数据',
    message: '确定要清空所有数据吗？此操作不可恢复！',
    confirmText: '清空',
    cancelText: '取消',
    variant: 'danger'
  })

  if (!confirmed) return

  // 执行清空操作
  data.value = []
  toast.success('数据已清空')
}
```

### 示例 3: 保存修改

```typescript
const saveChanges = async () => {
  const confirmed = await confirm({
    title: '保存修改',
    message: '确定要保存当前的修改吗？',
    confirmText: '保存',
    variant: 'primary'  // 使用蓝色主题按钮
  })

  if (!confirmed) return

  try {
    await api.saveData(formData.value)
    toast.success('保存成功')
  } catch (error: any) {
    toast.error(error.message || '保存失败')
  }
}
```

## API 参考

### ConfirmOptions 接口

```typescript
interface ConfirmOptions {
  title: string           // 对话框标题（必填）
  message: string         // 确认消息（必填）
  confirmText?: string    // 确认按钮文字，默认：'确定'
  cancelText?: string     // 取消按钮文字，默认：'取消'
  variant?: 'danger' | 'primary'  // 按钮样式，默认：'danger'
}
```

### 返回值

- **Promise<boolean>**:
  - `true`: 用户点击了确认按钮
  - `false`: 用户点击了取消按钮或关闭了对话框

## 特性

- ✅ 全局单例，无需在每个页面重复定义
- ✅ Promise 风格的 API，支持 async/await
- ✅ 支持自定义标题、消息和按钮文字
- ✅ 支持两种按钮样式（danger 和 primary）
- ✅ 美观的模态框 UI，带动画效果
- ✅ 支持 ESC 键关闭
- ✅ 支持点击背景关闭
- ✅ 完全类型安全（TypeScript）

## 注意事项

1. **必须在组件的 setup 函数中使用**，不能在顶层作用域调用
2. **返回的是 Promise**，需要使用 `await` 或 `.then()` 处理
3. **函数必须是 async 函数**，因为需要等待用户响应
4. 对话框会自动阻塞用户操作，直到用户做出选择

## 迁移指南

### 从浏览器原生 confirm 迁移

**之前**:
```typescript
const deleteItem = (item) => {
  if (!confirm('确定要删除吗？')) return
  // 执行删除
}
```

**之后**:
```typescript
import { useConfirm } from '@/composables/useConfirm'

const confirm = useConfirm()

const deleteItem = async (item) => {
  const confirmed = await confirm({
    title: '删除确认',
    message: '确定要删除吗？'
  })

  if (!confirmed) return
  // 执行删除
}
```

### 主要差异

1. 函数必须改为 `async`
2. 使用 `await confirm(options)` 替代 `confirm(message)`
3. 需要传递对象参数而不是字符串
4. 可以自定义更多选项

## 相关文件

- `/src/components/common/ConfirmDialog.vue` - 对话框组件
- `/src/composables/useConfirm.ts` - 使用 hook
- `/src/App.vue` - 全局集成
- `/src/views/records/Records.vue` - 使用示例
