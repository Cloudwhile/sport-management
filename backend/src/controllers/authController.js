import User from '../models/User.js';
import Class from '../models/Class.js';
import Grade from '../models/Grade.js';
import { comparePassword } from '../utils/password.js';
import { generateToken } from '../utils/jwt.js';

// 用户登录
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    // 先尝试从用户表查找（管理员和教师）
    let user = await User.findOne({ where: { username } });

    if (user) {
      // 验证密码
      const isValid = await comparePassword(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: '用户名或密码错误' });
      }

      // 生成 token
      const token = generateToken({
        id: user.id,
        username: user.username,
        userType: user.role,
        role: user.role,
      });

      return res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          realName: user.realName,
          userType: user.role,
        },
      });
    }

    // 尝试从班级表查找
    const classUser = await Class.findOne({
      where: { classAccount: username },
      include: [
        {
          model: Grade,
          attributes: ['id', 'gradeName'],
        },
      ],
    });

    if (!classUser) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    // 验证班级密码
    if (!classUser.classPassword) {
      return res.status(401).json({ error: '该班级账号未设置密码' });
    }

    const isValid = await comparePassword(password, classUser.classPassword);
    if (!isValid) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    // 生成 token
    const token = generateToken({
      id: classUser.id,
      username: classUser.classAccount,
      userType: 'class',
      role: 'class',
      classId: classUser.id,
      gradeId: classUser.gradeId,
    });

    return res.json({
      token,
      user: {
        id: classUser.id,
        username: classUser.classAccount,
        role: 'class',
        userType: 'class',
        className: classUser.className,
        gradeId: classUser.gradeId,
        gradeName: classUser.Grade?.gradeName,
        academicYear: classUser.academicYear,
      },
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ error: '登录过程出错' });
  }
};

// 退出登录
export const logout = async (req, res) => {
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
export const getMe = async (req, res) => {
  try {
    const { userType, id } = req.user;

    if (userType === 'class') {
      // 班级用户
      const classUser = await Class.findByPk(id, {
        include: [
          {
            model: Grade,
            attributes: ['id', 'gradeName'],
          },
        ],
      });

      if (!classUser) {
        return res.status(404).json({ error: '班级不存在' });
      }

      return res.json({
        id: classUser.id,
        username: classUser.classAccount,
        role: 'class',
        userType: 'class',
        className: classUser.className,
        gradeId: classUser.gradeId,
        gradeName: classUser.Grade?.gradeName,
        academicYear: classUser.academicYear,
      });
    } else {
      // 管理员或教师
      const user = await User.findByPk(id, {
        attributes: { exclude: ['password'] },
      });

      if (!user) {
        return res.status(404).json({ error: '用户不存在' });
      }

      return res.json({
        id: user.id,
        username: user.username,
        role: user.role,
        userType: user.role,
        realName: user.realName,
      });
    }
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ error: '获取用户信息出错' });
  }
};
