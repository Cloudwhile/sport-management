import express, { Router } from 'express';
import * as gradeController from '../controllers/gradeController.js';
import { authenticate, requireTeacher } from '../middleware/auth.js';

const router: Router = express.Router();

// 所有年级管理接口都需要认证
router.use(authenticate);

/**
 * @route   GET /api/grades
 * @desc    获取所有年级（支持分页）
 * @access  Private (认证用户)
 */
router.get('/', gradeController.getAll);

/**
 * @route   GET /api/grades/:id
 * @desc    获取年级详情
 * @access  Private (认证用户)
 */
router.get('/:id', gradeController.getById);

/**
 * @route   POST /api/grades
 * @desc    创建年级
 * @access  Admin + Teacher
 */
router.post('/', requireTeacher, gradeController.create);

/**
 * @route   PUT /api/grades/:id
 * @desc    更新年级
 * @access  Admin + Teacher
 */
router.put('/:id', requireTeacher, gradeController.update);

/**
 * @route   DELETE /api/grades/:id
 * @desc    删除年级
 * @access  Admin + Teacher
 */
router.delete('/:id', requireTeacher, gradeController.deleteGrade);

export default router;
