import { DataTypes } from 'sequelize';
import sequelize from '../database/connection.js';

const PhysicalTestRecord = sequelize.define('PhysicalTestRecord', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  formId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'form_id',
    references: {
      model: 'physical_test_forms',
      key: 'id',
    },
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'student_id',
    references: {
      model: 'students',
      key: 'id',
    },
  },
  classId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'class_id',
    references: {
      model: 'classes',
      key: 'id',
    },
    comment: '冗余字段，方便查询',
  },
  testData: {
    type: DataTypes.JSONB,
    allowNull: false,
    field: 'test_data',
    comment: '测试数据JSON',
  },
  totalScore: {
    type: DataTypes.DECIMAL(5, 2),
    field: 'total_score',
    comment: '总分',
  },
  gradeLevel: {
    type: DataTypes.STRING(20),
    field: 'grade_level',
    comment: '等级：优秀/良好/及格/不及格',
  },
  submittedBy: {
    type: DataTypes.STRING(100),
    field: 'submitted_by',
    comment: '提交人',
  },
  submittedAt: {
    type: DataTypes.DATE,
    field: 'submitted_at',
    comment: '提交时间',
  },
}, {
  tableName: 'physical_test_records',
  indexes: [
    { unique: true, fields: ['form_id', 'student_id'] },
    { fields: ['student_id'] },
    { fields: ['class_id'] },
  ],
});

export default PhysicalTestRecord;
