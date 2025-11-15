import express from 'express';
import {
  getClassStudentsForForm,
  createOrUpdateRecord,
  batchCreateOrUpdateRecords,
  getStudentRecord,
  deleteRecord
} from '../controllers/recordController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// 所有路由都需要认证
router.use(authenticate);

// 获取班级学生列表（用于录入）
router.get('/forms/:formId/classes/:classId/students', getClassStudentsForForm);

// 创建或更新单个学生的体测记录
router.post('/forms/:formId/students/:studentId/record', createOrUpdateRecord);

// 批量保存体测记录
router.post('/forms/:formId/records/batch', batchCreateOrUpdateRecords);

// 获取学生的体测记录详情
router.get('/forms/:formId/students/:studentId/record', getStudentRecord);

// 删除体测记录
router.delete('/forms/:formId/students/:studentId/record', deleteRecord);

export default router;
