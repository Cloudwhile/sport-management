import express from 'express';
import { login, logout, getMe } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// 登录
router.post('/login', login);

// 退出登录
router.post('/logout', authenticate, logout);

// 获取当前用户信息
router.get('/me', authenticate, getMe);

export default router;
