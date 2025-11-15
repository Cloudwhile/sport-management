import { Op } from 'sequelize';
import {
  Student,
  Class,
  Grade,
  StudentClassRelation,
} from '../models/index.js';

// 获取学生列表
export const getAll = async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      search = '',
      classId,
      gradeId,
      academicYear,
    } = req.query;

    const limit = parseInt(pageSize);
    const offset = (parseInt(page) - 1) * limit;

    // 构建查询条件
    const whereConditions = {};
    const relationWhereConditions = { isActive: true };

    // 搜索条件（姓名或学号）
    if (search) {
      whereConditions[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { studentIdNational: { [Op.iLike]: `%${search}%` } },
        { studentIdSchool: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // 班级筛选
    if (classId) {
      relationWhereConditions.classId = parseInt(classId);
    }

    // 学年筛选
    if (academicYear) {
      relationWhereConditions.academicYear = academicYear;
    }

    // 构建 include 条件
    const includeConditions = [
      {
        model: StudentClassRelation,
        as: 'classRelations',
        where: relationWhereConditions,
        required: true,
        include: [
          {
            model: Class,
            as: 'class',
            include: [
              {
                model: Grade,
                as: 'grade',
                ...(gradeId && { where: { id: parseInt(gradeId) } }),
              },
            ],
          },
        ],
      },
    ];

    // 查询数据
    const { count, rows } = await Student.findAndCountAll({
      where: whereConditions,
      include: includeConditions,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      distinct: true,
    });

    // 处理返回数据
    const students = rows.map((student) => {
      const studentData = student.toJSON();
      const currentRelation = studentData.classRelations.find((r) => r.isActive);

      return {
        id: studentData.id,
        studentIdNational: studentData.studentIdNational,
        studentIdSchool: studentData.studentIdSchool,
        name: studentData.name,
        gender: studentData.gender,
        birthDate: studentData.birthDate,
        idCardNumber: studentData.idCardNumber,
        phone: studentData.phone,
        createdAt: studentData.createdAt,
        updatedAt: studentData.updatedAt,
        currentClass: currentRelation
          ? {
              id: currentRelation.class.id,
              className: currentRelation.class.className,
              academicYear: currentRelation.class.academicYear,
              grade: {
                id: currentRelation.class.grade.id,
                gradeName: currentRelation.class.grade.gradeName,
                gradeLevel: currentRelation.class.grade.gradeLevel,
              },
            }
          : null,
        currentAcademicYear: currentRelation ? currentRelation.academicYear : null,
      };
    });

    res.json({
      data: students,
      pagination: {
        total: count,
        page: parseInt(page),
        pageSize: limit,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error('获取学生列表失败:', error);
    res.status(500).json({ error: '获取学生列表失败', message: error.message });
  }
};

// 获取学生详情
export const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findByPk(id, {
      include: [
        {
          model: StudentClassRelation,
          as: 'classRelations',
          include: [
            {
              model: Class,
              as: 'class',
              include: [
                {
                  model: Grade,
                  as: 'grade',
                },
              ],
            },
          ],
          order: [['academicYear', 'DESC']],
        },
      ],
    });

    if (!student) {
      return res.status(404).json({ error: '学生不存在' });
    }

    const studentData = student.toJSON();
    const currentRelation = studentData.classRelations.find((r) => r.isActive);

    res.json({
      ...studentData,
      currentClass: currentRelation
        ? {
            id: currentRelation.class.id,
            className: currentRelation.class.className,
            academicYear: currentRelation.class.academicYear,
            grade: currentRelation.class.grade,
          }
        : null,
      currentAcademicYear: currentRelation ? currentRelation.academicYear : null,
    });
  } catch (error) {
    console.error('获取学生详情失败:', error);
    res.status(500).json({ error: '获取学生详情失败', message: error.message });
  }
};

// 创建学生
export const create = async (req, res) => {
  try {
    const {
      studentIdNational,
      studentIdSchool,
      name,
      gender,
      birthDate,
      idCardNumber,
      phone,
      classId,
      academicYear,
    } = req.body;

    // 验证必填字段
    if (!studentIdNational || !studentIdSchool || !name || !gender) {
      return res.status(400).json({ error: '缺少必填字段' });
    }

    if (!classId || !academicYear) {
      return res.status(400).json({ error: '必须指定班级和学年' });
    }

    // 检查学籍号是否已存在
    const existingNational = await Student.findOne({
      where: { studentIdNational },
    });
    if (existingNational) {
      return res.status(400).json({ error: '学籍号已存在' });
    }

    // 检查学校学号是否已存在
    const existingSchool = await Student.findOne({
      where: { studentIdSchool },
    });
    if (existingSchool) {
      return res.status(400).json({ error: '学校学号已存在' });
    }

    // 检查班级是否存在
    const classExists = await Class.findByPk(classId);
    if (!classExists) {
      return res.status(400).json({ error: '班级不存在' });
    }

    // 创建学生
    const student = await Student.create({
      studentIdNational,
      studentIdSchool,
      name,
      gender,
      birthDate,
      idCardNumber,
      phone,
    });

    // 创建学生-班级关联
    await StudentClassRelation.create({
      studentId: student.id,
      classId: parseInt(classId),
      academicYear,
      isActive: true,
    });

    // 获取完整的学生信息（包含班级）
    const studentWithClass = await Student.findByPk(student.id, {
      include: [
        {
          model: StudentClassRelation,
          as: 'classRelations',
          where: { isActive: true },
          include: [
            {
              model: Class,
              as: 'class',
              include: [
                {
                  model: Grade,
                  as: 'grade',
                },
              ],
            },
          ],
        },
      ],
    });

    res.status(201).json({
      message: '学生创建成功',
      data: studentWithClass,
    });
  } catch (error) {
    console.error('创建学生失败:', error);
    res.status(500).json({ error: '创建学生失败', message: error.message });
  }
};

// 更新学生
export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      studentIdNational,
      studentIdSchool,
      name,
      gender,
      birthDate,
      idCardNumber,
      phone,
    } = req.body;

    const student = await Student.findByPk(id);
    if (!student) {
      return res.status(404).json({ error: '学生不存在' });
    }

    // 如果更新学籍号，检查是否与其他学生重复
    if (studentIdNational && studentIdNational !== student.studentIdNational) {
      const existing = await Student.findOne({
        where: {
          studentIdNational,
          id: { [Op.ne]: id },
        },
      });
      if (existing) {
        return res.status(400).json({ error: '学籍号已存在' });
      }
    }

    // 如果更新学校学号，检查是否与其他学生重复
    if (studentIdSchool && studentIdSchool !== student.studentIdSchool) {
      const existing = await Student.findOne({
        where: {
          studentIdSchool,
          id: { [Op.ne]: id },
        },
      });
      if (existing) {
        return res.status(400).json({ error: '学校学号已存在' });
      }
    }

    // 更新学生信息
    await student.update({
      studentIdNational: studentIdNational || student.studentIdNational,
      studentIdSchool: studentIdSchool || student.studentIdSchool,
      name: name || student.name,
      gender: gender || student.gender,
      birthDate: birthDate !== undefined ? birthDate : student.birthDate,
      idCardNumber: idCardNumber !== undefined ? idCardNumber : student.idCardNumber,
      phone: phone !== undefined ? phone : student.phone,
    });

    // 获取更新后的完整信息
    const updatedStudent = await Student.findByPk(id, {
      include: [
        {
          model: StudentClassRelation,
          as: 'classRelations',
          where: { isActive: true },
          include: [
            {
              model: Class,
              as: 'class',
              include: [
                {
                  model: Grade,
                  as: 'grade',
                },
              ],
            },
          ],
        },
      ],
    });

    res.json({
      message: '学生信息更新成功',
      data: updatedStudent,
    });
  } catch (error) {
    console.error('更新学生失败:', error);
    res.status(500).json({ error: '更新学生失败', message: error.message });
  }
};

// 删除学生
export const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findByPk(id);
    if (!student) {
      return res.status(404).json({ error: '学生不存在' });
    }

    // 删除学生的所有班级关联
    await StudentClassRelation.destroy({
      where: { studentId: id },
    });

    // 删除学生
    await student.destroy();

    res.json({ message: '学生删除成功' });
  } catch (error) {
    console.error('删除学生失败:', error);
    res.status(500).json({ error: '删除学生失败', message: error.message });
  }
};

// 转班操作
export const transfer = async (req, res) => {
  try {
    const { id } = req.params;
    const { classId, academicYear } = req.body;

    if (!classId || !academicYear) {
      return res.status(400).json({ error: '缺少班级或学年信息' });
    }

    // 检查学生是否存在
    const student = await Student.findByPk(id);
    if (!student) {
      return res.status(404).json({ error: '学生不存在' });
    }

    // 检查新班级是否存在
    const newClass = await Class.findByPk(classId);
    if (!newClass) {
      return res.status(400).json({ error: '目标班级不存在' });
    }

    // 查找当前激活的班级关联
    const currentRelation = await StudentClassRelation.findOne({
      where: {
        studentId: id,
        isActive: true,
      },
    });

    // 如果存在当前班级，将其设置为非激活
    if (currentRelation) {
      await currentRelation.update({ isActive: false });
    }

    // 检查是否已存在相同学年的关联
    const existingRelation = await StudentClassRelation.findOne({
      where: {
        studentId: id,
        academicYear,
      },
    });

    if (existingRelation) {
      // 更新现有关联
      await existingRelation.update({
        classId: parseInt(classId),
        isActive: true,
      });
    } else {
      // 创建新的班级关联
      await StudentClassRelation.create({
        studentId: id,
        classId: parseInt(classId),
        academicYear,
        isActive: true,
      });
    }

    // 获取更新后的学生信息
    const updatedStudent = await Student.findByPk(id, {
      include: [
        {
          model: StudentClassRelation,
          as: 'classRelations',
          where: { isActive: true },
          include: [
            {
              model: Class,
              as: 'class',
              include: [
                {
                  model: Grade,
                  as: 'grade',
                },
              ],
            },
          ],
        },
      ],
    });

    res.json({
      message: '转班成功',
      data: updatedStudent,
    });
  } catch (error) {
    console.error('转班失败:', error);
    res.status(500).json({ error: '转班失败', message: error.message });
  }
};
