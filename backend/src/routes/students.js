import express from 'express';
import * as studentController from '../controllers/studentController.js';

const router = express.Router();

// 获取学生列表
router.get('/', studentController.getAll);

// 获取学生详情
router.get('/:id', studentController.getById);

// 创建学生
router.post('/', studentController.create);

// 更新学生信息
router.put('/:id', studentController.update);

// 删除学生
router.delete('/:id', studentController.deleteStudent);

// 转班操作
router.post('/:id/transfer', studentController.transfer);

export default router;
