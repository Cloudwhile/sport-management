// @ts-nocheck
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import Setting from '../models/Setting.js';

const APPEARANCE_SETTINGS: Record<string, { description: string; category: string; isPublic: boolean }> = {
  site_logo_url: {
    description: '站点 Logo 图片，用于顶部导航和浏览器标签页图标',
    category: 'appearance',
    isPublic: true,
  },
  home_image_url: {
    description: '首页图片，用于登录页背景展示',
    category: 'appearance',
    isPublic: true,
  },
};

const SYSTEM_SETTINGS: Record<string, { value: string; description: string; category: string; isPublic: boolean }> = {
  school_level: {
    value: 'senior',
    description: '学校等级，用于小学、初中、高中等不同环境下的名称展示',
    category: 'system',
    isPublic: true,
  },
};

const SCHOOL_LEVEL_VALUES = new Set(['primary', 'junior', 'senior']);

const IMAGE_MIME_EXTENSIONS: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/x-icon': '.ico',
  'image/vnd.microsoft.icon': '.ico',
};

const getKnownSettingDefaults = (key: string) => {
  if (APPEARANCE_SETTINGS[key]) return { key, value: '', ...APPEARANCE_SETTINGS[key] };
  if (SYSTEM_SETTINGS[key]) return { key, ...SYSTEM_SETTINGS[key] };
  return null;
};

export const uploadSettingImage = async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const defaults = getKnownSettingDefaults(key);

    if (!defaults) {
      return res.status(400).json({
        success: false,
        message: '不支持的图片设置项',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请选择要上传的图片',
      });
    }

    const extension = IMAGE_MIME_EXTENSIONS[req.file.mimetype];
    if (!extension) {
      return res.status(400).json({
        success: false,
        message: '只支持 PNG、JPG、WebP、GIF 或 ICO 格式的图片',
      });
    }

    const uploadDir = path.resolve(process.cwd(), 'uploads', 'settings');
    await fs.mkdir(uploadDir, { recursive: true });

    const fileName = `${key}-${randomUUID()}${extension}`;
    const filePath = path.join(uploadDir, fileName);
    await fs.writeFile(filePath, req.file.buffer);

    const publicUrl = `/uploads/settings/${fileName}`;
    const [setting] = await Setting.findOrCreate({
      where: { key },
      defaults: {
        ...defaults,
        value: publicUrl,
      },
    });

    await setting.update({ value: publicUrl });

    res.json({
      success: true,
      message: '图片上传成功',
      data: {
        key,
        value: publicUrl,
      },
    });
  } catch (error: any) {
    console.error('上传设置图片失败:', error);
    res.status(500).json({
      success: false,
      message: '上传图片失败',
      error: error.message,
    });
  }
};

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

    if (value === undefined || value === null) {
      return res.status(400).json({
        success: false,
        message: '设置值不能为空',
      });
    }

    if (key === 'school_level' && !SCHOOL_LEVEL_VALUES.has(String(value))) {
      return res.status(400).json({
        success: false,
        message: '学校等级只能是 primary、junior 或 senior',
      });
    }

    let setting = await Setting.findOne({
      where: { key },
    });

    if (!setting) {
      const defaults = getKnownSettingDefaults(key);
      if (defaults) {
        setting = await Setting.create(defaults);
      }
    }

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
