import http from '@/utils/http'
import type {
  PhysicalTestForm,
  PhysicalTestFormWithItems,
  CreatePhysicalTestFormRequest,
  UpdatePhysicalTestFormRequest,
  PhysicalTestFormQueryParams,
  PaginatedResponse,
  FormTestItem,
  UpdateFormTestItemRequest
} from '@/types'

/**
 * 表单管理 API
 */
const formsAPI = {
  /**
   * 获取表单列表
   * @param params 查询参数（分页、排序、筛选）
   * @returns 表单列表（分页）
   */
  getForms(params?: PhysicalTestFormQueryParams): Promise<PaginatedResponse<PhysicalTestForm>> {
    return http.get('/forms', { params })
  },

  /**
   * 获取表单详情（包含测试项目）
   * @param id 表单ID
   * @returns 表单详细信息
   */
  getFormById(id: number): Promise<PhysicalTestFormWithItems> {
    return http.get(`/forms/${id}`)
  },

  /**
   * 创建表单
   * @param data 表单信息
   * @returns 创建的表单
   */
  createForm(data: CreatePhysicalTestFormRequest): Promise<PhysicalTestForm> {
    return http.post('/forms', data)
  },

  /**
   * 更新表单信息
   * @param id 表单ID
   * @param data 更新的表单信息
   * @returns 更新后的表单
   */
  updateForm(id: number, data: UpdatePhysicalTestFormRequest): Promise<PhysicalTestForm> {
    return http.put(`/forms/${id}`, data)
  },

  /**
   * 删除表单
   * @param id 表单ID
   */
  deleteForm(id: number): Promise<void> {
    return http.delete(`/forms/${id}`)
  },

  /**
   * 发布表单
   * @param id 表单ID
   */
  publishForm(id: number): Promise<void> {
    return http.post(`/forms/${id}/publish`)
  },

  /**
   * 关闭表单
   * @param id 表单ID
   */
  closeForm(id: number): Promise<void> {
    return http.post(`/forms/${id}/close`)
  },

  /**
   * 获取表单的测试项目
   * @param id 表单ID
   * @returns 测试项目列表
   */
  getTestItems(id: number): Promise<FormTestItem[]> {
    return http.get(`/forms/${id}/items`)
  },

  /**
   * 更新表单的测试项目配置
   * @param id 表单ID
   * @param items 测试项目数据
   */
  updateTestItems(id: number, items: UpdateFormTestItemRequest[]): Promise<void> {
    return http.put(`/forms/${id}/items`, { items })
  }
}

export default formsAPI
