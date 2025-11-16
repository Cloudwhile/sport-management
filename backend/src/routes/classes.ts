import express, { Router } from 'express';
import classController from '../controllers/classController.js';
import { authenticate, requireTeacher } from '../middleware/auth.js';

const router: Router = express.Router();

// 所有班级管理接口都需要认证
router.use(authenticate);

/**
 * @route   GET /api/classes
 * @desc    获取所有班级（支持筛选和分页）
 * @access  Private (认证用户)
 */
router.get('/', classController.getAll);

/**
 * @route   GET /api/classes/:id
 * @desc    获取班级详情
 * @access  Private (认证用户)
 */
router.get('/:id', classController.getById);

/**
 * @route   GET /api/classes/:id/statistics
 * @desc    获取班级统计详情（包含学生列表和体测统计）
 * @access  Private (认证用户)
 */
router.get('/:id/statistics', classController.getStatistics);

/**
 * @route   POST /api/classes
 * @desc    创建班级
 * @access  Admin + Teacher
 */
router.post('/', requireTeacher, classController.create);

/**
 * @route   PUT /api/classes/:id
 * @desc    更新班级
 * @access  Admin + Teacher
 */
router.put('/:id', requireTeacher, classController.update);

/**
 * @route   DELETE /api/classes/:id
 * @desc    删除班级
 * @access  Admin + Teacher
 */
router.delete('/:id', requireTeacher, classController.delete);

/**
 * @route   PUT /api/classes/:id/password
 * @desc    重置班级密码
 * @access  Admin + Teacher
 */
router.put('/:id/password', requireTeacher, classController.resetPassword);

/**
 * @route   POST /api/classes/:id/students
 * @desc    添加学生到班级
 * @access  Admin + Teacher
 */
router.post('/:id/students', requireTeacher, classController.addStudent);

/**
 * @route   DELETE /api/classes/:id/students/:studentId
 * @desc    从班级移除学生
 * @access  Admin + Teacher
 */
router.delete('/:id/students/:studentId', requireTeacher, classController.removeStudent);

export default router;
