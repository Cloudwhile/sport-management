import express from 'express';
import {
  getOverallStats,
  getClassStats,
  getGradeStats,
  getFormStats,
  getTrendData,
  getStudentHistory,
  getClassHistory
} from '../controllers/statisticsController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// 所有路由都需要认证
router.use(authenticate);

/**
 * @route   GET /api/statistics/overall
 * @desc    获取整体统计数据
 * @access  Private
 */
router.get('/overall', getOverallStats);

/**
 * @route   GET /api/statistics/forms/:formId/classes/:classId
 * @desc    获取班级统计数据
 * @access  Private
 */
router.get('/forms/:formId/classes/:classId', getClassStats);

/**
 * @route   GET /api/statistics/forms/:formId/grades/:gradeId
 * @desc    获取年级统计数据
 * @access  Private
 */
router.get('/forms/:formId/grades/:gradeId', getGradeStats);

/**
 * @route   GET /api/statistics/forms/:formId
 * @desc    获取表单统计数据（全校）
 * @access  Private
 */
router.get('/forms/:formId', getFormStats);

/**
 * @route   GET /api/statistics/trend
 * @desc    获取历史趋势数据
 * @access  Private
 */
router.get('/trend', getTrendData);

/**
 * @route   GET /api/statistics/students/:studentId
 * @desc    获取学生历史体测数据
 * @access  Private
 */
router.get('/students/:studentId', getStudentHistory);

/**
 * @route   GET /api/statistics/classes/:classId/history
 * @desc    获取班级历史体测趋势
 * @access  Private
 */
router.get('/classes/:classId/history', getClassHistory);

export default router;
