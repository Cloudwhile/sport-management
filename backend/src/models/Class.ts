import { DataTypes, Model } from 'sequelize';
import sequelize from '../database/connection.js';
import { isGraduated, getGraduationYear } from '../utils/gradeHelper.js';

interface ClassAttributes {
  id: number;
  cohort: string;
  className: string;
  classAccount?: string;
  classPassword?: string;
  created_at?: Date;
  updated_at?: Date;
}

// 扩展接口，包含虚拟字段
interface ClassInstance extends Model<ClassAttributes>, ClassAttributes {
  graduated: boolean;
  graduationYear: string;
}

const Class = sequelize.define<ClassInstance>('Class', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  cohort: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: '入学年份：2024',
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
  // 虚拟字段：根据 cohort 自动计算是否已毕业
  graduated: {
    type: DataTypes.VIRTUAL,
    get(this: ClassInstance) {
      const cohort = this.getDataValue('cohort');
      return cohort ? isGraduated(cohort) : false;
    },
  },
  // 虚拟字段：根据 cohort 自动计算毕业年份
  graduationYear: {
    type: DataTypes.VIRTUAL,
    get(this: ClassInstance) {
      const cohort = this.getDataValue('cohort');
      return cohort ? getGraduationYear(cohort) : '';
    },
  },
}, {
  tableName: 'classes',
  indexes: [
    { fields: ['cohort'] },
    { unique: true, fields: ['cohort', 'class_name'] },
  ],
});

export default Class;
