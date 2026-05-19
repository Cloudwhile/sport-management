import express from 'express';
import multer from 'multer';
import {
  getPublicSettings,
  getSettings,
  getSetting,
  updateSetting,
  batchUpdateSettings,
  uploadSettingImage,
} from '../controllers/settingsController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

const imageUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/gif',
      'image/x-icon',
      'image/vnd.microsoft.icon',
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('只支持 PNG、JPG、WebP、GIF 或 ICO 格式的图片'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

// 公开路由：获取公开设置（无需认证）
router.get('/public', getPublicSettings);

// 需要认证的路由
router.get('/', authenticate, getSettings);
router.get('/:key', authenticate, getSetting);

// 仅管理员可访问的路由
router.post('/:key/image', authenticate, requireAdmin, imageUpload.single('file'), uploadSettingImage);
router.put('/:key', authenticate, requireAdmin, updateSetting);
router.put('/', authenticate, requireAdmin, batchUpdateSettings);

export default router;
