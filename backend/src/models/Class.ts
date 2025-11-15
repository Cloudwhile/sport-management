import { DataTypes, Model } from 'sequelize';
import sequelize from '../database/connection.js';

interface ClassAttributes {
  id: number;
  gradeId: number;
  className: string;
  academicYear: string;
  classAccount?: string;
  classPassword?: string;
  created_at?: Date;
  updated_at?: Date;
}

const Class = sequelize.define<Model<ClassAttributes>>('Class', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  gradeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'grade_id',
    references: {
      model: 'grades',
      key: 'id',
    },
  },
  className: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'class_name',
    comment: '班级名称：一班、二班',
  },
  academicYear: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'academic_year',
    comment: '学年：2024-2025',
  },
  classAccount: {
    type: DataTypes.STRING(50),
    unique: true,
    field: 'class_account',
    comment: '班级账号',
  },
  classPassword: {
    type: DataTypes.STRING(255),
    field: 'class_password',
    comment: '班级密码哈希',
  },
}, {
  tableName: 'classes',
  indexes: [
    { fields: ['grade_id'] },
    { fields: ['academic_year'] },
  ],
});

export default Class;
