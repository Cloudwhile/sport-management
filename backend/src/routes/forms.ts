import express, { Router } from 'express';
import * as formController from '../controllers/formController.js';
import { authenticate, requireTeacher } from '../middleware/auth.js';

const router: Router = express.Router();

// 所有表单接口都需要认证
router.use(authenticate);

/**
 * @route   GET /api/forms
 * @desc    获取所有表单（支持分页和状态筛选）
 * @access  Private (认证用户，班级账号需要查看表单列表)
 */
router.get('/', formController.getAll);

/**
 * @route   GET /api/forms/:id
 * @desc    获取表单详情（包含测试项目）
 * @access  Private (认证用户)
 */
router.get('/:id', formController.getById);

/**
 * @route   GET /api/forms/:id/items
 * @desc    获取表单的测试项目
 * @access  Private (认证用户，班级账号需要查看测试项目)
 */
router.get('/:id/items', formController.getTestItems);

/**
 * @route   POST /api/forms
 * @desc    创建表单（同时创建默认国标测试项目）
 * @access  Admin + Teacher
 */
router.post('/', requireTeacher, formController.create);

/**
 * @route   PUT /api/forms/:id
 * @desc    更新表单基本信息
 * @access  Admin + Teacher
 */
router.put('/:id', requireTeacher, formController.update);

/**
 * @route   DELETE /api/forms/:id
 * @desc    删除表单
 * @access  Admin + Teacher
 */
router.delete('/:id', requireTeacher, formController.deleteForm);

/**
 * @route   POST /api/forms/:id/publish
 * @desc    发布表单（draft → published）
 * @access  Admin + Teacher
 */
router.post('/:id/publish', requireTeacher, formController.publish);

/**
 * @route   POST /api/forms/:id/close
 * @desc    关闭表单（published → closed）
 * @access  Admin + Teacher
 */
router.post('/:id/close', requireTeacher, formController.close);

/**
 * @route   PUT /api/forms/:id/items
 * @desc    更新测试项目配置
 * @access  Admin + Teacher
 */
router.put('/:id/items', requireTeacher, formController.updateTestItems);

export default router;
