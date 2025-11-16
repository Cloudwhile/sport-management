import { defineStore } from 'pinia'
import { ref } from 'vue'
import { formsAPI } from '@/api'
import { FormStatus } from '@/types'
import type {
  PhysicalTestForm,
  PhysicalTestFormWithItems,
  PhysicalTestFormQueryParams,
  CreatePhysicalTestFormRequest,
  UpdatePhysicalTestFormRequest,
  FormTestItem,
  UpdateFormTestItemRequest
} from '@/types'

export const useFormsStore = defineStore('forms', () => {
  // State
  const items = ref<PhysicalTestForm[]>([])
  const total = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Actions
  /**
   * 获取表单列表
   * @param params 查询参数
   */
  async function fetchList(params?: PhysicalTestFormQueryParams) {
    try {
      loading.value = true
      error.value = null

      const response = await formsAPI.getForms(params)

      items.value = response.data
      total.value = response.total

      return response
    } catch (err: any) {
      error.value = err.message || '获取表单列表失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 根据ID获取表单详情（包含测试项目）
   * @param id 表单ID
   */
  async function fetchById(id: number) {
    try {
      loading.value = true
      error.value = null

      const form = await formsAPI.getFormById(id)

      return form
    } catch (err: any) {
      error.value = err.message || '获取表单详情失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 创建表单
   * @param data 表单数据
   */
  async function create(data: CreatePhysicalTestFormRequest) {
    try {
      loading.value = true
      error.value = null

      const form = await formsAPI.createForm(data)

      // 将新表单添加到列表
      items.value.unshift(form)
      total.value++

      return form
    } catch (err: any) {
      error.value = err.message || '创建表单失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新表单
   * @param id 表单ID
   * @param data 更新的数据
   */
  async function update(id: number, data: UpdatePhysicalTestFormRequest) {
    try {
      loading.value = true
      error.value = null

      const form = await formsAPI.updateForm(id, data)

      // 更新列表中的表单
      const index = items.value.findIndex(item => item.id === id)
      if (index !== -1) {
        items.value[index] = form
      }

      return form
    } catch (err: any) {
      error.value = err.message || '更新表单失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 删除表单
   * @param id 表单ID
   */
  async function remove(id: number) {
    try {
      loading.value = true
      error.value = null

      await formsAPI.deleteForm(id)

      // 从列表中移除表单
      const index = items.value.findIndex(item => item.id === id)
      if (index !== -1) {
        items.value.splice(index, 1)
        total.value--
      }
    } catch (err: any) {
      error.value = err.message || '删除表单失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 发布表单
   * @param id 表单ID
   */
  async function publishForm(id: number) {
    try {
      loading.value = true
      error.value = null

      await formsAPI.publishForm(id)

      // 更新列表中表单的状态
      const index = items.value.findIndex(item => item.id === id)
      if (index !== -1 && items.value[index]) {
        items.value[index]!.status = FormStatus.PUBLISHED
      }
    } catch (err: any) {
      error.value = err.message || '发布表单失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 关闭表单
   * @param id 表单ID
   */
  async function closeForm(id: number) {
    try {
      loading.value = true
      error.value = null

      await formsAPI.closeForm(id)

      // 更新列表中表单的状态
      const index = items.value.findIndex(item => item.id === id)
      if (index !== -1 && items.value[index]) {
        items.value[index]!.status = FormStatus.CLOSED
      }
    } catch (err: any) {
      error.value = err.message || '关闭表单失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取表单的测试项目
   * @param id 表单ID
   */
  async function getTestItems(id: number) {
    try {
      loading.value = true
      error.value = null

      const items = await formsAPI.getTestItems(id)

      return items
    } catch (err: any) {
      error.value = err.message || '获取测试项目失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新表单的测试项目配置
   * @param id 表单ID
   * @param items 测试项目数据
   */
  async function updateTestItems(id: number, items: UpdateFormTestItemRequest[]) {
    try {
      loading.value = true
      error.value = null

      await formsAPI.updateTestItems(id, items)
    } catch (err: any) {
      error.value = err.message || '更新测试项目失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 清除错误信息
   */
  function clearError() {
    error.value = null
  }

  return {
    // State
    items,
    total,
    loading,
    error,
    // Actions
    fetchList,
    fetchById,
    create,
    update,
    remove,
    publishForm,
    closeForm,
    getTestItems,
    updateTestItems,
    clearError
  }
})
