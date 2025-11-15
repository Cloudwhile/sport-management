import request from '@/utils/request';
import type { ApiResponse } from '@/types/api';

/**
 * 获取班级学生列表（用于录入）
 */
export const getClassStudentsForForm = (
  formId: number,
  classId: number,
  params?: { academicYear?: string }
): Promise<ApiResponse> => {
  return request.get(`/records/forms/${formId}/classes/${classId}/students`, { params });
};

/**
 * 创建或更新单个学生的体测记录
 */
export const createOrUpdateRecord = (
  formId: number,
  studentId: number,
  data: {
    testData: Record<string, number>;
  }
): Promise<ApiResponse> => {
  return request.post(`/records/forms/${formId}/students/${studentId}/record`, data);
};

/**
 * 批量保存体测记录
 */
export const batchCreateOrUpdateRecords = (
  formId: number,
  data: {
    records: Array<{
      studentId: number;
      testData: Record<string, number>;
    }>;
  }
): Promise<ApiResponse> => {
  return request.post(`/records/forms/${formId}/records/batch`, data);
};

/**
 * 获取学生的体测记录详情
 */
export const getStudentRecord = (
  formId: number,
  studentId: number
): Promise<ApiResponse> => {
  return request.get(`/records/forms/${formId}/students/${studentId}/record`);
};

/**
 * 删除体测记录
 */
export const deleteRecord = (
  formId: number,
  studentId: number
): Promise<ApiResponse> => {
  return request.delete(`/records/forms/${formId}/students/${studentId}/record`);
};
