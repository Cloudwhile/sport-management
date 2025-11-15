import express, { Router } from 'express';
import * as formController from '../controllers/formController.js';

const router: Router = express.Router();

/**
 * @route   GET /api/forms
 * @desc    获取所有表单（支持分页和状态筛选）
 * @access  Public
 */
router.get('/', formController.getAll);

/**
 * @route   GET /api/forms/:id
 * @desc    获取表单详情（包含测试项目）
 * @access  Public
 */
router.get('/:id', formController.getById);

/**
 * @route   POST /api/forms
 * @desc    创建表单（同时创建默认国标测试项目）
 * @access  Public
 */
router.post('/', formController.create);

/**
 * @route   PUT /api/forms/:id
 * @desc    更新表单基本信息
 * @access  Public
 */
router.put('/:id', formController.update);

/**
 * @route   DELETE /api/forms/:id
 * @desc    删除表单
 * @access  Public
 */
router.delete('/:id', formController.deleteForm);

/**
 * @route   POST /api/forms/:id/publish
 * @desc    发布表单（draft → published）
 * @access  Public
 */
router.post('/:id/publish', formController.publish);

/**
 * @route   POST /api/forms/:id/close
 * @desc    关闭表单（published → closed）
 * @access  Public
 */
router.post('/:id/close', formController.close);

/**
 * @route   GET /api/forms/:id/items
 * @desc    获取表单的测试项目
 * @access  Public
 */
router.get('/:id/items', formController.getTestItems);

/**
 * @route   PUT /api/forms/:id/items
 * @desc    更新测试项目配置
 * @access  Public
 */
router.put('/:id/items', formController.updateTestItems);

export default router;
