import express from 'express';
import {
  getOverallStats,
  getClassStats,
  getGradeStats,
  getFormStats,
  getTrendData
} from '../controllers/statisticsController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// 所有路由都需要认证
router.use(authenticate);

// 获取整体统计数据
router.get('/overall', getOverallStats);

// 获取班级统计数据
router.get('/forms/:formId/classes/:classId', getClassStats);

// 获取年级统计数据
router.get('/forms/:formId/grades/:gradeId', getGradeStats);

// 获取表单统计数据（全校）
router.get('/forms/:formId', getFormStats);

// 获取历史趋势数据
router.get('/trend', getTrendData);

export default router;
