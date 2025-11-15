import express, { Router } from 'express';
import * as userController from '../controllers/userController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router: Router = express.Router();

// 所有用户管理路由都需要认证和管理员权限
router.use(authenticate);
router.use(requireAdmin);

/**
 * @route   GET /api/users
 * @desc    获取用户列表（支持分页、角色筛选、搜索）
 * @access  Admin
 */
router.get('/', userController.getAll);

/**
 * @route   GET /api/users/:id
 * @desc    获取用户详情
 * @access  Admin
 */
router.get('/:id', userController.getById);

/**
 * @route   POST /api/users
 * @desc    创建用户（管理员/教师）
 * @access  Admin
 */
router.post('/', userController.create);

/**
 * @route   PUT /api/users/:id
 * @desc    更新用户信息
 * @access  Admin
 */
router.put('/:id', userController.update);

/**
 * @route   DELETE /api/users/:id
 * @desc    删除用户
 * @access  Admin
 */
router.delete('/:id', userController.deleteUser);

/**
 * @route   PUT /api/users/:id/password
 * @desc    修改用户密码
 * @access  Admin
 */
router.put('/:id/password', userController.updatePassword);

/**
 * @route   GET /api/users/:id/classes
 * @desc    获取教师管理的班级列表
 * @access  Admin
 */
router.get('/:id/classes', userController.getTeacherClasses);

/**
 * @route   POST /api/users/:id/classes
 * @desc    为教师分配班级权限
 * @access  Admin
 */
router.post('/:id/classes', userController.assignClassToTeacher);

/**
 * @route   DELETE /api/users/:id/classes/:classId
 * @desc    移除教师的班级权限
 * @access  Admin
 */
router.delete('/:id/classes/:classId', userController.removeClassFromTeacher);

export default router;
