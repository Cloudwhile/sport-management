import request from '@/utils/request';
import type { ApiResponse } from '@/types/api';

/**
 * 获取整体统计数据
 */
export const getOverallStats = (params?: { academicYear?: string }): Promise<ApiResponse> => {
  return request.get('/statistics/overall', { params });
};

/**
 * 获取班级统计数据
 */
export const getClassStats = (formId: number, classId: number): Promise<ApiResponse> => {
  return request.get(`/statistics/forms/${formId}/classes/${classId}`);
};

/**
 * 获取年级统计数据
 */
export const getGradeStats = (formId: number, gradeId: number): Promise<ApiResponse> => {
  return request.get(`/statistics/forms/${formId}/grades/${gradeId}`);
};

/**
 * 获取表单统计数据（全校）
 */
export const getFormStats = (formId: number): Promise<ApiResponse> => {
  return request.get(`/statistics/forms/${formId}`);
};

/**
 * 获取历史趋势数据
 */
export const getTrendData = (params?: {
  classId?: number;
  gradeId?: number;
}): Promise<ApiResponse> => {
  return request.get('/statistics/trend', { params });
};
