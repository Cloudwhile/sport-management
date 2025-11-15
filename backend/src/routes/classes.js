import express from 'express';
import classController from '../controllers/classController.js';

const router = express.Router();

/**
 * @route   GET /api/classes
 * @desc    获取所有班级（支持筛选和分页）
 * @access  Private
 */
router.get('/', classController.getAll);

/**
 * @route   GET /api/classes/:id
 * @desc    获取班级详情
 * @access  Private
 */
router.get('/:id', classController.getById);

/**
 * @route   POST /api/classes
 * @desc    创建班级
 * @access  Private
 */
router.post('/', classController.create);

/**
 * @route   PUT /api/classes/:id
 * @desc    更新班级
 * @access  Private
 */
router.put('/:id', classController.update);

/**
 * @route   DELETE /api/classes/:id
 * @desc    删除班级
 * @access  Private
 */
router.delete('/:id', classController.delete);

/**
 * @route   POST /api/classes/:id/reset-password
 * @desc    重置班级密码
 * @access  Private
 */
router.post('/:id/reset-password', classController.resetPassword);

export default router;
