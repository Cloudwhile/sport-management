import request from '@/utils/request'
import type {
  GetFormsParams,
  CreateFormData,
  UpdateFormData,
  UpdateTestItemsData,
  ApiResponse,
} from '@/types/api'
import type { PhysicalTestForm, FormTestItem } from '@/types/models'

/**
 * 体测表单管理 API
 */

/**
 * 获取表单列表
 */
export const getForms = (params: GetFormsParams) => {
  return request<ApiResponse<PhysicalTestForm[]>>({
    url: '/forms',
    method: 'get',
    params,
  })
}

/**
 * 获取表单详情（包含测试项目）
 */
export const getForm = (id: number) => {
  return request<ApiResponse<PhysicalTestForm>>({
    url: `/forms/${id}`,
    method: 'get',
  })
}

/**
 * 创建表单（同时创建默认国标测试项目）
 */
export const createForm = (data: CreateFormData) => {
  return request<ApiResponse<PhysicalTestForm>>({
    url: '/forms',
    method: 'post',
    data,
  })
}

/**
 * 更新表单基本信息
 */
export const updateForm = (id: number, data: UpdateFormData) => {
  return request<ApiResponse<PhysicalTestForm>>({
    url: `/forms/${id}`,
    method: 'put',
    data,
  })
}

/**
 * 删除表单
 */
export const deleteForm = (id: number) => {
  return request<ApiResponse>({
    url: `/forms/${id}`,
    method: 'delete',
  })
}

/**
 * 发布表单（draft → published）
 */
export const publishForm = (id: number) => {
  return request<ApiResponse<PhysicalTestForm>>({
    url: `/forms/${id}/publish`,
    method: 'post',
  })
}

/**
 * 关闭表单（published → closed）
 */
export const closeForm = (id: number) => {
  return request<ApiResponse<PhysicalTestForm>>({
    url: `/forms/${id}/close`,
    method: 'post',
  })
}

/**
 * 获取表单的测试项目
 */
export const getFormTestItems = (id: number) => {
  return request<ApiResponse<FormTestItem[]>>({
    url: `/forms/${id}/items`,
    method: 'get',
  })
}

/**
 * 更新测试项目配置
 */
export const updateFormTestItems = (id: number, data: UpdateTestItemsData) => {
  return request<ApiResponse<FormTestItem[]>>({
    url: `/forms/${id}/items`,
    method: 'put',
    data,
  })
}
