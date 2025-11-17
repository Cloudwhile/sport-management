// @ts-nocheck
import { Request, Response } from 'express';
import Setting from '../models/Setting.js';

/**
 * 获取公开设置（无需认证）
 */
export const getPublicSettings = async (req: Request, res: Response) => {
  try {
    const settings = await Setting.findAll({
      where: { isPublic: true },
      attributes: ['key', 'value', 'description', 'category'],
    });

    // 转换为键值对格式，方便前端使用
    const settingsMap: Record<string, any> = {};
    settings.forEach((setting: any) => {
      settingsMap[setting.key] = {
        value: setting.value,
        description: setting.description,
        category: setting.category,
      };
    });

    res.json({
      success: true,
      data: settingsMap,
    });
  } catch (error: any) {
    console.error('获取公开设置失败:', error);
    res.status(500).json({
      success: false,
      message: '获取设置失败',
      error: error.message,
    });
  }
};

/**
 * 获取所有设置（需要认证）
 */
export const getSettings = async (req: Request, res: Response) => {
  try {
    const { category } = req.query;

    const whereClause: any = {};
    if (category) {
      whereClause.category = category;
    }

    const settings = await Setting.findAll({
      where: whereClause,
      order: [['category', 'ASC'], ['key', 'ASC']],
    });

    // 转换为键值对格式
    const settingsMap: Record<string, any> = {};
    settings.forEach((setting: any) => {
      settingsMap[setting.key] = {
        value: setting.value,
        description: setting.description,
        category: setting.category,
        isPublic: setting.isPublic,
      };
    });

    res.json({
      success: true,
      data: settingsMap,
    });
  } catch (error: any) {
    console.error('获取设置失败:', error);
    res.status(500).json({
      success: false,
      message: '获取设置失败',
      error: error.message,
    });
  }
};

/**
 * 获取单个设置
 */
export const getSetting = async (req: Request, res: Response) => {
  try {
    const { key } = req.params;

    const setting = await Setting.findOne({
      where: { key },
    });

    if (!setting) {
      return res.status(404).json({
        success: false,
        message: '设置不存在',
      });
    }

    res.json({
      success: true,
      data: {
        key: setting.get('key'),
        value: setting.get('value'),
        description: setting.get('description'),
        category: setting.get('category'),
        isPublic: setting.get('isPublic'),
      },
    });
  } catch (error: any) {
    console.error('获取设置失败:', error);
    res.status(500).json({
      success: false,
      message: '获取设置失败',
      error: error.message,
    });
  }
};

/**
 * 更新单个设置（仅管理员）
 */
export const updateSetting = async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (!value) {
      return res.status(400).json({
        success: false,
        message: '设置值不能为空',
      });
    }

    const setting = await Setting.findOne({
      where: { key },
    });

    if (!setting) {
      return res.status(404).json({
        success: false,
        message: '设置不存在',
      });
    }

    await setting.update({ value });

    res.json({
      success: true,
      message: '设置更新成功',
      data: {
        key: setting.get('key'),
        value: setting.get('value'),
      },
    });
  } catch (error: any) {
    console.error('更新设置失败:', error);
    res.status(500).json({
      success: false,
      message: '更新设置失败',
      error: error.message,
    });
  }
};

/**
 * 批量更新设置（仅管理员）
 */
export const batchUpdateSettings = async (req: Request, res: Response) => {
  try {
    const { settings } = req.body;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({
        success: false,
        message: '无效的设置数据',
      });
    }

    const updatePromises = Object.entries(settings).map(async ([key, value]) => {
      const setting = await Setting.findOne({ where: { key } });
      if (setting) {
        await setting.update({ value: value as string });
      }
    });

    await Promise.all(updatePromises);

    res.json({
      success: true,
      message: '设置批量更新成功',
    });
  } catch (error: any) {
    console.error('批量更新设置失败:', error);
    res.status(500).json({
      success: false,
      message: '批量更新设置失败',
      error: error.message,
    });
  }
};
