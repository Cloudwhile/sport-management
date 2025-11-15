import express, { Router } from 'express';
import * as gradeController from '../controllers/gradeController.js';

const router: Router = express.Router();

/**
 * @route   GET /api/grades
 * @desc    获取所有年级（支持分页）
 * @access  Public
 */
router.get('/', gradeController.getAll);

/**
 * @route   GET /api/grades/:id
 * @desc    获取年级详情
 * @access  Public
 */
router.get('/:id', gradeController.getById);

/**
 * @route   POST /api/grades
 * @desc    创建年级
 * @access  Public
 */
router.post('/', gradeController.create);

/**
 * @route   PUT /api/grades/:id
 * @desc    更新年级
 * @access  Public
 */
router.put('/:id', gradeController.update);

/**
 * @route   DELETE /api/grades/:id
 * @desc    删除年级
 * @access  Public
 */
router.delete('/:id', gradeController.deleteGrade);

export default router;
