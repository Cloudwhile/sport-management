import http from '@/utils/http'
import type { StatisticsQueryParams, StatisticsSummaryResponse, OverallStatsResponse } from '@/types'

/**
 * 统计分析 API
 */
const statisticsAPI = {
  /**
   * 获取整体统计数据
   * @param params 查询参数
   * @returns 整体统计数据
   */
  getOverallStats(params?: StatisticsQueryParams): Promise<OverallStatsResponse> {
    return http.get('/statistics/overall', { params })
  },

  /**
   * 获取班级统计数据
   * @param formId 表单ID
   * @param classId 班级ID
   * @returns 班级统计数据
   */
  getClassStats(formId: number, classId: number): Promise<StatisticsSummaryResponse> {
    return http.get(`/statistics/forms/${formId}/classes/${classId}`)
  },

  /**
   * 获取年级统计数据
   * @param formId 表单ID
   * @param gradeId 年级ID
   * @returns 年级统计数据
   */
  getGradeStats(formId: number, gradeId: string): Promise<StatisticsSummaryResponse> {
    return http.get(`/statistics/forms/${formId}/grades/${gradeId}`)
  },

  /**
   * 获取表单统计数据（全校）
   * @param formId 表单ID
   * @returns 全校统计数据
   */
  getFormStats(formId: number): Promise<StatisticsSummaryResponse> {
    return http.get(`/statistics/forms/${formId}`)
  },

  /**
   * 获取历史趋势数据
   * @param params 查询参数
   * @returns 趋势数据
   */
  getTrendData(params?: StatisticsQueryParams): Promise<any> {
    return http.get('/statistics/trend', { params })
  },

  /**
   * 获取学生历史体测数据
   * @param studentId 学生ID
   * @returns 学生历史数据
   */
  getStudentHistory(studentId: number): Promise<any> {
    return http.get(`/statistics/students/${studentId}`)
  },

  /**
   * 获取班级历史体测趋势
   * @param classId 班级ID
   * @returns 班级历史趋势
   */
  getClassHistory(classId: number): Promise<any> {
    return http.get(`/statistics/classes/${classId}/history`)
  }
}

export default statisticsAPI
