import request from '../utils/request';

/**
 * 认证 API
 */

/**
 * 用户登录
 * @param {Object} credentials - 登录凭证
 * @param {string} credentials.username - 用户名
 * @param {string} credentials.password - 密码
 */
export const login = (credentials) => {
  return request({
    url: '/auth/login',
    method: 'post',
    data: credentials,
  });
};

/**
 * 退出登录
 */
export const logout = () => {
  return request({
    url: '/auth/logout',
    method: 'post',
  });
};

/**
 * 获取当前用户信息
 */
export const getMe = () => {
  return request({
    url: '/auth/me',
    method: 'get',
  });
};
