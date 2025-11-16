import express, { Router } from 'express';
import * as studentController from '../controllers/studentController.js';
import { authenticate, requireTeacher } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router: Router = express.Router();

// 所有学生管理接口都需要认证
router.use(authenticate);

/**
 * @route   GET /api/students
 * @desc    获取学生列表
 * @access  Private (认证用户)
 */
router.get('/', studentController.getAll);

/**
 * @route   GET /api/students/:id
 * @desc    获取学生详情
 * @access  Private (认证用户)
 */
router.get('/:id', studentController.getById);

/**
 * @route   POST /api/students
 * @desc    创建学生
 * @access  Admin + Teacher
 */
router.post('/', requireTeacher, studentController.create);

/**
 * @route   PUT /api/students/:id
 * @desc    更新学生信息
 * @access  Admin + Teacher
 */
router.put('/:id', requireTeacher, studentController.update);

/**
 * @route   DELETE /api/students/:id
 * @desc    删除学生
 * @access  Admin + Teacher
 */
router.delete('/:id', requireTeacher, studentController.deleteStudent);

/**
 * @route   POST /api/students/:id/transfer
 * @desc    学生转班操作
 * @access  Admin + Teacher
 */
router.post('/:id/transfer', requireTeacher, studentController.transfer);

/**
 * @route   POST /api/students/batch-import
 * @desc    批量导入学生（Excel文件）
 * @access  Admin + Teacher
 */
router.post('/batch-import', requireTeacher, upload.single('file'), studentController.batchImport);

export default router;
