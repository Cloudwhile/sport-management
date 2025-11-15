import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: '未提供认证令牌' });
      return;
    }

    const token = authHeader.split(' ')[1] as string;
    const decoded = verifyToken(token);

    if (!decoded) {
      res.status(401).json({ error: '令牌无效或已过期' });
      return;
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error('认证错误:', error);
    res.status(500).json({ error: '认证过程出错' });
  }
};

export const requireRole = (...allowedRoles: Array<'admin' | 'teacher' | 'class'>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: '未认证' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: '权限不足' });
      return;
    }

    next();
  };
};

export const requireAdmin = requireRole('admin');
export const requireTeacher = requireRole('admin', 'teacher');
export const requireClass = requireRole('admin', 'teacher', 'class');
