import request from '@/utils/request'
import type {
  GetGradesParams,
  CreateGradeData,
  UpdateGradeData,
} from '@/types/api'
import type { Grade } from '@/types/models'

/**
 * 年级管理 API
 */

/**
 * 获取年级列表
 */
export const getGrades = (params: GetGradesParams) => {
  return request<Grade[]>({
    url: '/grades',
    method: 'get',
    params,
  })
}

/**
 * 获取年级详情
 */
export const getGrade = (id: number) => {
  return request<Grade>({
    url: `/grades/${id}`,
    method: 'get',
  })
}

/**
 * 创建年级
 */
export const createGrade = (data: CreateGradeData) => {
  return request<Grade>({
    url: '/grades',
    method: 'post',
    data,
  })
}

/**
 * 更新年级
 */
export const updateGrade = (id: number, data: UpdateGradeData) => {
  return request<Grade>({
    url: `/grades/${id}`,
    method: 'put',
    data,
  })
}

/**
 * 删除年级
 */
export const deleteGrade = (id: number) => {
  return request({
    url: `/grades/${id}`,
    method: 'delete',
  })
}
