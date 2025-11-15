import { Request, Response } from 'express';
import User from '../models/User.js';
import Class from '../models/Class.js';
import Grade from '../models/Grade.js';
import { comparePassword } from '../utils/password.js';
import { generateToken } from '../utils/jwt.js';

// 用户登录
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: '用户名和密码不能为空' });
      return;
    }

    // 先尝试从用户表查找（管理员和教师）
    let user = await User.findOne({ where: { username } });

    if (user) {
      // 验证密码
      const isValid = await comparePassword(password, user.get('password') as string);
      if (!isValid) {
        res.status(401).json({ error: '用户名或密码错误' });
        return;
      }

      // 生成 token
      const token = generateToken({
        id: user.get('id') as number,
        username: user.get('username') as string,
        userType: user.get('role') as string,
        role: user.get('role') as string,
      });

      res.json({
        token,
        user: {
          id: user.get('id'),
          username: user.get('username'),
          role: user.get('role'),
          realName: user.get('realName'),
          userType: user.get('role'),
        },
      });
      return;
    }

    // 尝试从班级表查找
    const classUser = await Class.findOne({
      where: { classAccount: username },
      include: [
        {
          model: Grade,
          as: 'grade',
          attributes: ['id', 'gradeName'],
        },
      ],
    });

    if (!classUser) {
      res.status(401).json({ error: '用户名或密码错误' });
      return;
    }

    // 验证班级密码
    if (!classUser.get('classPassword')) {
      res.status(401).json({ error: '该班级账号未设置密码' });
      return;
    }

    const isValid = await comparePassword(password, classUser.get('classPassword') as string);
    if (!isValid) {
      res.status(401).json({ error: '用户名或密码错误' });
      return;
    }

    // 生成 token
    const token = generateToken({
      id: classUser.get('id') as number,
      username: classUser.get('classAccount') as string,
      userType: 'class',
      role: 'class',
      classId: classUser.get('id') as number,
      gradeId: classUser.get('gradeId') as number,
    });

    const classGrade = classUser.get('Grade') as any;
    res.json({
      token,
      user: {
        id: classUser.get('id'),
        username: classUser.get('classAccount'),
        role: 'class',
        userType: 'class',
        className: classUser.get('className'),
        gradeId: classUser.get('gradeId'),
        gradeName: classGrade?.get('gradeName'),
        academicYear: classUser.get('academicYear'),
      },
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ error: '登录过程出错' });
  }
};

// 退出登录
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    // JWT 是无状态的，退出登录主要在前端清除 token
    // 如果需要黑名单机制，可以在这里实现
    res.json({ message: '退出成功' });
  } catch (error) {
    console.error('退出登录错误:', error);
    res.status(500).json({ error: '退出登录出错' });
  }
};

// 获取当前用户信息
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userType, id } = req.user as any;

    if (userType === 'class') {
      // 班级用户
      const classUser = await Class.findByPk(id, {
        include: [
          {
            model: Grade,
            as: 'grade',
            attributes: ['id', 'gradeName'],
          },
        ],
      });

      if (!classUser) {
        res.status(404).json({ error: '班级不存在' });
        return;
      }

      const classUserGrade = classUser.get('Grade') as any;
      res.json({
        id: classUser.get('id'),
        username: classUser.get('classAccount'),
        role: 'class',
        userType: 'class',
        className: classUser.get('className'),
        gradeId: classUser.get('gradeId'),
        gradeName: classUserGrade?.get('gradeName'),
        academicYear: classUser.get('academicYear'),
      });
      return;
    } else {
      // 管理员或教师
      const user = await User.findByPk(id, {
        attributes: { exclude: ['password'] },
      });

      if (!user) {
        res.status(404).json({ error: '用户不存在' });
        return;
      }

      res.json({
        id: user.get('id'),
        username: user.get('username'),
        role: user.get('role'),
        userType: user.get('role'),
        realName: user.get('realName'),
      });
    }
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ error: '获取用户信息出错' });
  }
};
