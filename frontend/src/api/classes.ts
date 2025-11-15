import request from '@/utils/request'
import type {
  GetClassesParams,
  CreateClassData,
  UpdateClassData,
} from '@/types/api'
import type { Class } from '@/types/models'

/**
 * 班级管理 API
 */

/**
 * 获取班级列表
 */
export const getClasses = (params: GetClassesParams) => {
  return request<Class[]>({
    url: '/classes',
    method: 'get',
    params,
  })
}

/**
 * 获取班级详情
 */
export const getClassById = (id: number) => {
  return request<Class>({
    url: `/classes/${id}`,
    method: 'get',
  })
}

/**
 * 创建班级
 */
export const createClass = (data: CreateClassData) => {
  return request<Class>({
    url: '/classes',
    method: 'post',
    data,
  })
}

/**
 * 更新班级
 */
export const updateClass = (id: number, data: UpdateClassData) => {
  return request<Class>({
    url: `/classes/${id}`,
    method: 'put',
    data,
  })
}

/**
 * 删除班级
 */
export const deleteClass = (id: number) => {
  return request({
    url: `/classes/${id}`,
    method: 'delete',
  })
}

/**
 * 重置班级密码
 */
export const resetClassPassword = (id: number) => {
  return request({
    url: `/classes/${id}/reset-password`,
    method: 'post',
  })
}
