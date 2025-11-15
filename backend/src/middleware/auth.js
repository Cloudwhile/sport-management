import { verifyToken } from '../utils/jwt.js';
import User from '../models/User.js';
import Class from '../models/Class.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未提供认证令牌' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ error: '令牌无效或已过期' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error('认证错误:', error);
    res.status(500).json({ error: '认证过程出错' });
  }
};

export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: '未认证' });
    }

    if (!allowedRoles.includes(req.user.userType)) {
      return res.status(403).json({ error: '权限不足' });
    }

    next();
  };
};

export const requireAdmin = requireRole('admin');
export const requireTeacher = requireRole('admin', 'teacher');
export const requireClass = requireRole('admin', 'teacher', 'class');
