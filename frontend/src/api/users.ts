import http from '@/utils/http'
import type {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  UserQueryParams,
  PaginatedResponse,
  Class
} from '@/types'

/**
 * 用户管理 API
 */
const usersAPI = {
  /**
   * 获取用户列表
   * @param params 查询参数（分页、排序、筛选）
   * @returns 用户列表（分页）
   */
  getUsers(params?: UserQueryParams): Promise<PaginatedResponse<User>> {
    return http.get('/users', { params })
  },

  /**
   * 获取用户详情
   * @param id 用户ID
   * @returns 用户详细信息
   */
  getUserById(id: number): Promise<User> {
    return http.get(`/users/${id}`)
  },

  /**
   * 创建用户
   * @param data 用户信息
   * @returns 创建的用户
   */
  createUser(data: CreateUserRequest): Promise<User> {
    return http.post('/users', data)
  },

  /**
   * 更新用户信息
   * @param id 用户ID
   * @param data 更新的用户信息
   * @returns 更新后的用户
   */
  updateUser(id: number, data: UpdateUserRequest): Promise<User> {
    return http.put(`/users/${id}`, data)
  },

  /**
   * 删除用户
   * @param id 用户ID
   */
  deleteUser(id: number): Promise<void> {
    return http.delete(`/users/${id}`)
  },

  /**
   * 修改用户密码
   * @param id 用户ID
   * @param password 新密码
   */
  updatePassword(id: number, password: string): Promise<void> {
    return http.put(`/users/${id}/password`, { password })
  },

  /**
   * 获取教师管理的班级列表
   * @param id 教师用户ID
   * @returns 班级列表
   */
  getTeacherClasses(id: number): Promise<Class[]> {
    return http.get(`/users/${id}/classes`)
  },

  /**
   * 为教师分配班级权限
   * @param id 教师用户ID
   * @param classId 班级ID
   */
  assignClassToTeacher(id: number, classId: number): Promise<void> {
    return http.post(`/users/${id}/classes`, { classId })
  },

  /**
   * 移除教师的班级权限
   * @param id 教师用户ID
   * @param classId 班级ID
   */
  removeClassFromTeacher(id: number, classId: number): Promise<void> {
    return http.delete(`/users/${id}/classes/${classId}`)
  }
}

export default usersAPI
