import express from 'express';
import {
  getClassStudentsForForm,
  createOrUpdateRecord,
  batchCreateOrUpdateRecords,
  getStudentRecord,
  deleteRecord
} from '../controllers/recordController.js';
import { authenticate, requireTeacher } from '../middleware/auth.js';

const router = express.Router();

// 所有路由都需要认证
router.use(authenticate);

/**
 * @route   GET /api/records/forms/:formId/classes/:classId/students
 * @desc    获取班级学生列表（用于录入）
 * @access  Private (认证用户)
 */
router.get('/forms/:formId/classes/:classId/students', getClassStudentsForForm);

/**
 * @route   POST /api/records/forms/:formId/students/:studentId/record
 * @desc    创建或更新单个学生的体测记录
 * @access  Private (认证用户)
 */
router.post('/forms/:formId/students/:studentId/record', createOrUpdateRecord);

/**
 * @route   POST /api/records/forms/:formId/records/batch
 * @desc    批量保存体测记录
 * @access  Private (认证用户)
 */
router.post('/forms/:formId/records/batch', batchCreateOrUpdateRecords);

/**
 * @route   GET /api/records/forms/:formId/students/:studentId/record
 * @desc    获取学生的体测记录详情
 * @access  Private (认证用户)
 */
router.get('/forms/:formId/students/:studentId/record', getStudentRecord);

/**
 * @route   DELETE /api/records/forms/:formId/students/:studentId/record
 * @desc    删除体测记录
 * @access  Admin + Teacher
 */
router.delete('/forms/:formId/students/:studentId/record', requireTeacher, deleteRecord);

export default router;
