import request from '../utils/request';

/**
 * 班级管理 API
 */

/**
 * 获取班级列表
 * @param {Object} params - 查询参数
 * @param {number} params.gradeId - 年级ID（可选）
 * @param {string} params.academicYear - 学年（可选）
 * @param {number} params.page - 页码
 * @param {number} params.limit - 每页数量
 */
export const getClasses = (params) => {
  return request({
    url: '/classes',
    method: 'get',
    params,
  });
};

/**
 * 获取班级详情
 * @param {number} id - 班级ID
 */
export const getClassById = (id) => {
  return request({
    url: `/classes/${id}`,
    method: 'get',
  });
};

/**
 * 创建班级
 * @param {Object} data - 班级数据
 * @param {number} data.gradeId - 年级ID
 * @param {string} data.className - 班级名称
 * @param {string} data.academicYear - 学年
 */
export const createClass = (data) => {
  return request({
    url: '/classes',
    method: 'post',
    data,
  });
};

/**
 * 更新班级
 * @param {number} id - 班级ID
 * @param {Object} data - 更新数据
 */
export const updateClass = (id, data) => {
  return request({
    url: `/classes/${id}`,
    method: 'put',
    data,
  });
};

/**
 * 删除班级
 * @param {number} id - 班级ID
 */
export const deleteClass = (id) => {
  return request({
    url: `/classes/${id}`,
    method: 'delete',
  });
};

/**
 * 重置班级密码
 * @param {number} id - 班级ID
 */
export const resetClassPassword = (id) => {
  return request({
    url: `/classes/${id}/reset-password`,
    method: 'post',
  });
};
