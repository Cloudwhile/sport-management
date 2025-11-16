import { DataTypes, Model } from 'sequelize';
import sequelize from '../database/connection.js';

export interface PhysicalTestFormAttributes {
  id: number;
  formName: string;
  academicYear: string;
  participatingCohorts: string[];
  testDate?: string;
  startTime?: Date;
  endTime?: Date;
  status: 'draft' | 'published' | 'closed';
  description?: string;
  createdBy?: number;
  created_at?: Date;
  updated_at?: Date;
}

const PhysicalTestForm = sequelize.define<Model<PhysicalTestFormAttributes>>('PhysicalTestForm', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  formName: {
    type: DataTypes.STRING(200),
    allowNull: false,
    field: 'form_name',
    comment: '表单名称',
  },
  academicYear: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'academic_year',
    comment: '学年',
  },
  participatingCohorts: {
    type: DataTypes.JSONB,
    allowNull: false,
    field: 'participating_cohorts',
    comment: '参与的年级(入学年份数组), 如 ["2022", "2023"]',
  },
  testDate: {
    type: DataTypes.DATEONLY,
    field: 'test_date',
    comment: '测试日期',
  },
  startTime: {
    type: DataTypes.DATE,
    field: 'start_time',
    comment: '开始填报时间',
  },
  endTime: {
    type: DataTypes.DATE,
    field: 'end_time',
    comment: '结束填报时间',
  },
  status: {
    type: DataTypes.ENUM('draft', 'published', 'closed'),
    defaultValue: 'draft',
    comment: '状态',
  },
  description: {
    type: DataTypes.TEXT,
    comment: '说明',
  },
  createdBy: {
    type: DataTypes.INTEGER,
    field: 'created_by',
    references: {
      model: 'users',
      key: 'id',
    },
  },
}, {
  tableName: 'physical_test_forms',
  indexes: [
    { fields: ['academic_year'] },
    { fields: ['status'] },
  ],
});

export default PhysicalTestForm;
