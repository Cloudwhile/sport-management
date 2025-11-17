import { DataTypes, Model } from 'sequelize';
import sequelize from '../database/connection.js';

interface SettingAttributes {
  id: number;
  key: string;
  value: string;
  description?: string;
  category: string;
  isPublic: boolean;
  created_at?: Date;
  updated_at?: Date;
}

interface SettingInstance extends Model<SettingAttributes>, SettingAttributes {}

const Setting = sequelize.define<SettingInstance>('Setting', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  key: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    comment: '设置键名',
  },
  value: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '设置值',
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '设置描述',
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'system',
    comment: '设置分类：system, appearance, feature等',
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_public',
    comment: '是否公开（无需登录即可访问）',
  },
}, {
  tableName: 'settings',
  indexes: [
    { unique: true, fields: ['key'] },
    { fields: ['category'] },
    { fields: ['is_public'] },
  ],
});

export default Setting;
