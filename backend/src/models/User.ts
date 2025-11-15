import { DataTypes, Model } from 'sequelize';
import sequelize from '../database/connection.js';

interface UserAttributes {
  id: number;
  username: string;
  password: string;
  role: 'admin' | 'teacher';
  realName?: string;
  created_at?: Date;
  updated_at?: Date;
}

const User = sequelize.define<Model<UserAttributes>>('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: '用户名',
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '密码哈希',
  },
  role: {
    type: DataTypes.ENUM('admin', 'teacher'),
    allowNull: false,
    comment: '角色',
  },
  realName: {
    type: DataTypes.STRING(100),
    field: 'real_name',
    comment: '真实姓名',
  },
}, {
  tableName: 'users',
  indexes: [
    { fields: ['username'] },
    { fields: ['role'] },
  ],
});

export default User;
