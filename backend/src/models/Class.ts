import { DataTypes, Model } from 'sequelize';
import sequelize from '../database/connection.js';

interface ClassAttributes {
  id: number;
  cohort: string;
  className: string;
  classAccount?: string;
  classPassword?: string;
  graduated?: boolean;
  graduationYear?: string;
  created_at?: Date;
  updated_at?: Date;
}

const Class = sequelize.define<Model<ClassAttributes>>('Class', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  cohort: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: '入学年份：2024级',
  },
  className: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'class_name',
    comment: '班级名称：一班、二班',
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
  graduated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否已毕业',
  },
  graduationYear: {
    type: DataTypes.STRING(10),
    field: 'graduation_year',
    comment: '毕业年份',
  },
}, {
  tableName: 'classes',
  indexes: [
    { fields: ['cohort'] },
    { fields: ['graduated'] },
    { unique: true, fields: ['cohort', 'class_name'] },
  ],
});

export default Class;
