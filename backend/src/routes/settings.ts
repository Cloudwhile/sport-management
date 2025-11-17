import express from 'express';
import {
  getPublicSettings,
  getSettings,
  getSetting,
  updateSetting,
  batchUpdateSettings,
} from '../controllers/settingsController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// 公开路由：获取公开设置（无需认证）
router.get('/public', getPublicSettings);

// 需要认证的路由
router.get('/', authenticate, getSettings);
router.get('/:key', authenticate, getSetting);

// 仅管理员可访问的路由
router.put('/:key', authenticate, requireAdmin, updateSetting);
router.put('/', authenticate, requireAdmin, batchUpdateSettings);

export default router;
