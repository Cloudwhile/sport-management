import Grade from '../models/Grade.js';

/**
 * 获取所有年级（支持分页）
 */
export const getAll = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, sortBy = 'gradeLevel', order = 'ASC' } = req.query;

    const limit = parseInt(pageSize);
    const offset = (parseInt(page) - 1) * limit;

    const { count, rows } = await Grade.findAndCountAll({
      limit,
      offset,
      order: [[sortBy, order]],
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        pageSize: limit,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error('获取年级列表失败:', error);
    res.status(500).json({
      success: false,
      error: '获取年级列表失败',
      message: error.message,
    });
  }
};

/**
 * 获取年级详情
 */
export const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const grade = await Grade.findByPk(id);

    if (!grade) {
      return res.status(404).json({
        success: false,
        error: '年级不存在',
      });
    }

    res.json({
      success: true,
      data: grade,
    });
  } catch (error) {
    console.error('获取年级详情失败:', error);
    res.status(500).json({
      success: false,
      error: '获取年级详情失败',
      message: error.message,
    });
  }
};

/**
 * 创建年级
 */
export const create = async (req, res) => {
  try {
    const { gradeName, gradeLevel } = req.body;

    // 验证必填字段
    if (!gradeName || !gradeLevel) {
      return res.status(400).json({
        success: false,
        error: '年级名称和年级数字为必填项',
      });
    }

    // 检查年级数字是否已存在
    const existingGrade = await Grade.findOne({ where: { gradeLevel } });
    if (existingGrade) {
      return res.status(400).json({
        success: false,
        error: '该年级数字已存在',
      });
    }

    const grade = await Grade.create({
      gradeName,
      gradeLevel,
    });

    res.status(201).json({
      success: true,
      data: grade,
      message: '年级创建成功',
    });
  } catch (error) {
    console.error('创建年级失败:', error);
    res.status(500).json({
      success: false,
      error: '创建年级失败',
      message: error.message,
    });
  }
};

/**
 * 更新年级
 */
export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { gradeName, gradeLevel } = req.body;

    const grade = await Grade.findByPk(id);

    if (!grade) {
      return res.status(404).json({
        success: false,
        error: '年级不存在',
      });
    }

    // 如果更新年级数字，检查是否与其他年级冲突
    if (gradeLevel && gradeLevel !== grade.gradeLevel) {
      const existingGrade = await Grade.findOne({ where: { gradeLevel } });
      if (existingGrade) {
        return res.status(400).json({
          success: false,
          error: '该年级数字已存在',
        });
      }
    }

    await grade.update({
      gradeName: gradeName || grade.gradeName,
      gradeLevel: gradeLevel !== undefined ? gradeLevel : grade.gradeLevel,
    });

    res.json({
      success: true,
      data: grade,
      message: '年级更新成功',
    });
  } catch (error) {
    console.error('更新年级失败:', error);
    res.status(500).json({
      success: false,
      error: '更新年级失败',
      message: error.message,
    });
  }
};

/**
 * 删除年级
 */
export const deleteGrade = async (req, res) => {
  try {
    const { id } = req.params;

    const grade = await Grade.findByPk(id);

    if (!grade) {
      return res.status(404).json({
        success: false,
        error: '年级不存在',
      });
    }

    // TODO: 检查是否有关联的班级，如果有则不允许删除
    // const classCount = await Class.count({ where: { gradeId: id } });
    // if (classCount > 0) {
    //   return res.status(400).json({
    //     success: false,
    //     error: '该年级下还有班级，无法删除',
    //   });
    // }

    await grade.destroy();

    res.json({
      success: true,
      message: '年级删除成功',
    });
  } catch (error) {
    console.error('删除年级失败:', error);
    res.status(500).json({
      success: false,
      error: '删除年级失败',
      message: error.message,
    });
  }
};
