import { Request, Response } from 'express';
import { Op } from 'sequelize';
import {
  User,
  TeacherClassRelation,
  Class,
} from '../models/index.js';
import { hashPassword } from '../utils/password.js';

/**
 * 获取用户列表
 */
export const getAll = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      pageSize = 10,
      role,
      search = '',
    } = req.query;

    const limit = parseInt(pageSize as string);
    const offset = (parseInt(page as string) - 1) * limit;

    // 构建查询条件
    const whereConditions: any = {};

    // 角色筛选
    if (role && (role === 'admin' || role === 'teacher')) {
      whereConditions.role = role;
    }

    // 搜索条件（用户名或真实姓名）
    if (search) {
      whereConditions[Op.or] = [
        { username: { [Op.iLike]: `%${search}%` } },
        { realName: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // 查询数据
    const { count, rows } = await User.findAndCountAll({
      where: whereConditions,
      attributes: { exclude: ['password'] }, // 不返回密码字段
      limit,
      offset,
      order: [['id', 'DESC']],
    });

    res.json({
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page as string),
        pageSize: limit,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({ error: '获取用户列表失败', message: (error as Error).message });
  }
};

/**
 * 获取用户详情
 */
export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      res.status(404).json({ error: '用户不存在' });
      return;
    }

    // 如果是教师，获取管理的班级
    let managedClasses = null;
    if (user.get('role') === 'teacher') {
      const relations = await TeacherClassRelation.findAll({
        where: { userId: id },
        include: [
          {
            model: Class,
            as: 'class',
          },
        ],
      });

      managedClasses = relations.map((rel: any) => {
        const relData = rel.toJSON();
        return {
          id: relData.class.id,
          cohort: relData.class.cohort,
          className: relData.class.className,
          classAccount: relData.class.classAccount,
          graduated: relData.class.graduated,
        };
      });
    }

    res.json({
      ...user.toJSON(),
      managedClasses,
    });
  } catch (error) {
    console.error('获取用户详情失败:', error);
    res.status(500).json({ error: '获取用户详情失败', message: (error as Error).message });
  }
};

/**
 * 创建用户
 */
export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      username,
      password,
      role,
      realName,
    } = req.body;

    // 验证必填字段
    if (!username || !password || !role) {
      res.status(400).json({ error: '用户名、密码和角色不能为空' });
      return;
    }

    // 验证角色
    if (role !== 'admin' && role !== 'teacher') {
      res.status(400).json({ error: '角色必须是 admin 或 teacher' });
      return;
    }

    // 检查用户名是否已存在
    const existingUser = await User.findOne({
      where: { username },
    });
    if (existingUser) {
      res.status(400).json({ error: '用户名已存在' });
      return;
    }

    // 密码哈希
    const hashedPassword = await hashPassword(password);

    // 创建用户
    const user = await User.create({
      username,
      password: hashedPassword,
      role,
      realName: realName || null,
    });

    // 返回用户信息（不包含密码）
    const userData = user.toJSON() as any;
    delete userData.password;

    res.status(201).json({
      message: '用户创建成功',
      data: userData,
    });
  } catch (error) {
    console.error('创建用户失败:', error);
    res.status(500).json({ error: '创建用户失败', message: (error as Error).message });
  }
};

/**
 * 更新用户信息
 */
export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      username,
      role,
      realName,
    } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      res.status(404).json({ error: '用户不存在' });
      return;
    }

    // 如果更新用户名，检查是否与其他用户重复
    if (username && username !== user.get('username')) {
      const existing = await User.findOne({
        where: {
          username,
          id: { [Op.ne]: id },
        },
      });
      if (existing) {
        res.status(400).json({ error: '用户名已存在' });
        return;
      }
    }

    // 验证角色
    if (role && role !== 'admin' && role !== 'teacher') {
      res.status(400).json({ error: '角色必须是 admin 或 teacher' });
      return;
    }

    // 更新用户信息
    await user.update({
      username: username || user.get('username'),
      role: role || user.get('role'),
      realName: realName !== undefined ? realName : user.get('realName'),
    });

    // 获取更新后的用户信息
    const updatedUser = await User.findByPk(id, {
      attributes: { exclude: ['password'] },
    });

    res.json({
      message: '用户信息更新成功',
      data: updatedUser,
    });
  } catch (error) {
    console.error('更新用户失败:', error);
    res.status(500).json({ error: '更新用户失败', message: (error as Error).message });
  }
};

/**
 * 删除用户
 */
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      res.status(404).json({ error: '用户不存在' });
      return;
    }

    // 如果是教师，删除其所有班级关联
    if (user.get('role') === 'teacher') {
      await TeacherClassRelation.destroy({
        where: { userId: id },
      });
    }

    // 删除用户
    await user.destroy();

    res.json({ message: '用户删除成功' });
  } catch (error) {
    console.error('删除用户失败:', error);
    res.status(500).json({ error: '删除用户失败', message: (error as Error).message });
  }
};

/**
 * 修改用户密码
 */
export const updatePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
      res.status(400).json({ error: '密码不能为空' });
      return;
    }

    const user = await User.findByPk(id);
    if (!user) {
      res.status(404).json({ error: '用户不存在' });
      return;
    }

    // 密码哈希
    const hashedPassword = await hashPassword(password);

    // 更新密码
    await user.update({ password: hashedPassword });

    res.json({ message: '密码修改成功' });
  } catch (error) {
    console.error('修改密码失败:', error);
    res.status(500).json({ error: '修改密码失败', message: (error as Error).message });
  }
};

/**
 * 获取教师管理的班级列表
 */
export const getTeacherClasses = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // 检查用户是否存在且为教师
    const user = await User.findByPk(id);
    if (!user) {
      res.status(404).json({ error: '用户不存在' });
      return;
    }

    if (user.get('role') !== 'teacher') {
      res.status(400).json({ error: '该用户不是教师' });
      return;
    }

    // 获取教师管理的班级
    const relations = await TeacherClassRelation.findAll({
      where: { userId: id },
      include: [
        {
          model: Class,
          as: 'class',
        },
      ],
    });

    const classes = relations.map((rel: any) => {
      const relData = rel.toJSON();
      return {
        id: relData.class.id,
        cohort: relData.class.cohort,
        className: relData.class.className,
        classAccount: relData.class.classAccount,
        graduated: relData.class.graduated,
        assignedAt: relData.created_at,
      };
    });

    res.json({
      data: classes,
    });
  } catch (error) {
    console.error('获取教师班级失败:', error);
    res.status(500).json({ error: '获取教师班级失败', message: (error as Error).message });
  }
};

/**
 * 为教师分配班级权限
 */
export const assignClassToTeacher = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { classId } = req.body;

    if (!classId) {
      res.status(400).json({ error: '班级ID不能为空' });
      return;
    }

    // 检查用户是否存在且为教师
    const user = await User.findByPk(id);
    if (!user) {
      res.status(404).json({ error: '用户不存在' });
      return;
    }

    if (user.get('role') !== 'teacher') {
      res.status(400).json({ error: '该用户不是教师' });
      return;
    }

    // 检查班级是否存在
    const classExists = await Class.findByPk(classId);
    if (!classExists) {
      res.status(404).json({ error: '班级不存在' });
      return;
    }

    // 检查是否已经分配过
    const existingRelation = await TeacherClassRelation.findOne({
      where: {
        userId: id,
        classId: parseInt(classId),
      },
    });

    if (existingRelation) {
      res.status(400).json({ error: '该教师已经管理该班级' });
      return;
    }

    // 创建关联
    await TeacherClassRelation.create({
      userId: parseInt(id),
      classId: parseInt(classId),
    });

    res.status(201).json({
      message: '班级分配成功',
    });
  } catch (error) {
    console.error('分配班级失败:', error);
    res.status(500).json({ error: '分配班级失败', message: (error as Error).message });
  }
};

/**
 * 移除教师的班级权限
 */
export const removeClassFromTeacher = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, classId } = req.params;

    // 检查用户是否存在且为教师
    const user = await User.findByPk(id);
    if (!user) {
      res.status(404).json({ error: '用户不存在' });
      return;
    }

    if (user.get('role') !== 'teacher') {
      res.status(400).json({ error: '该用户不是教师' });
      return;
    }

    // 查找关联
    const relation = await TeacherClassRelation.findOne({
      where: {
        userId: id,
        classId: parseInt(classId),
      },
    });

    if (!relation) {
      res.status(404).json({ error: '该教师未管理该班级' });
      return;
    }

    // 删除关联
    await relation.destroy();

    res.json({
      message: '班级权限移除成功',
    });
  } catch (error) {
    console.error('移除班级权限失败:', error);
    res.status(500).json({ error: '移除班级权限失败', message: (error as Error).message });
  }
};
