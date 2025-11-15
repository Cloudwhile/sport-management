import request from '../utils/request';

/**
 * 年级管理 API
 */

/**
 * 获取年级列表
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.pageSize - 每页数量
 * @param {string} params.sortBy - 排序字段
 * @param {string} params.order - 排序方式
 */
export const getGrades = (params) => {
  return request({
    url: '/grades',
    method: 'get',
    params,
  });
};

/**
 * 获取年级详情
 * @param {number} id - 年级ID
 */
export const getGrade = (id) => {
  return request({
    url: `/grades/${id}`,
    method: 'get',
  });
};

/**
 * 创建年级
 * @param {Object} data - 年级数据
 * @param {string} data.gradeName - 年级名称
 * @param {number} data.gradeLevel - 年级数字
 */
export const createGrade = (data) => {
  return request({
    url: '/grades',
    method: 'post',
    data,
  });
};

/**
 * 更新年级
 * @param {number} id - 年级ID
 * @param {Object} data - 更新数据
 */
export const updateGrade = (id, data) => {
  return request({
    url: `/grades/${id}`,
    method: 'put',
    data,
  });
};

/**
 * 删除年级
 * @param {number} id - 年级ID
 */
export const deleteGrade = (id) => {
  return request({
    url: `/grades/${id}`,
    method: 'delete',
  });
};
