import request from '../utils/request';

/**
 * 学生管理 API
 */

/**
 * 获取学生列表
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.pageSize - 每页数量
 * @param {string} params.search - 搜索关键词（姓名、学号）
 * @param {number} params.classId - 班级ID（可选）
 * @param {number} params.gradeId - 年级ID（可选）
 * @param {string} params.academicYear - 学年（可选）
 */
export const getStudents = (params) => {
  return request({
    url: '/students',
    method: 'get',
    params,
  });
};

/**
 * 获取学生详情
 * @param {number} id - 学生ID
 */
export const getStudentById = (id) => {
  return request({
    url: `/students/${id}`,
    method: 'get',
  });
};

/**
 * 创建学生
 * @param {Object} data - 学生数据
 * @param {string} data.studentIdNational - 学籍号
 * @param {string} data.studentIdSchool - 学校学号
 * @param {string} data.name - 姓名
 * @param {string} data.gender - 性别（male/female）
 * @param {string} data.birthDate - 出生日期
 * @param {string} data.idCardNumber - 身份证号（可选）
 * @param {string} data.phone - 联系电话（可选）
 * @param {number} data.classId - 班级ID
 * @param {string} data.academicYear - 学年
 */
export const createStudent = (data) => {
  return request({
    url: '/students',
    method: 'post',
    data,
  });
};

/**
 * 更新学生信息
 * @param {number} id - 学生ID
 * @param {Object} data - 更新数据
 */
export const updateStudent = (id, data) => {
  return request({
    url: `/students/${id}`,
    method: 'put',
    data,
  });
};

/**
 * 删除学生
 * @param {number} id - 学生ID
 */
export const deleteStudent = (id) => {
  return request({
    url: `/students/${id}`,
    method: 'delete',
  });
};

/**
 * 转班操作
 * @param {number} id - 学生ID
 * @param {Object} data - 转班数据
 * @param {number} data.classId - 目标班级ID
 * @param {string} data.academicYear - 学年
 */
export const transferStudent = (id, data) => {
  return request({
    url: `/students/${id}/transfer`,
    method: 'post',
    data,
  });
};
