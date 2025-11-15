import { DataTypes, Model } from 'sequelize';
import sequelize from '../database/connection.js';

export interface StudentClassRelationAttributes {
  id: number;
  studentId: number;
  classId: number;
  academicYear: string;
  isActive: boolean;
  created_at?: Date;
}

const StudentClassRelation = sequelize.define<Model<StudentClassRelationAttributes>>('StudentClassRelation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
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
  },
  academicYear: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'academic_year',
    comment: '学年',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
    comment: '是否当前班级',
  },
}, {
  tableName: 'student_class_relations',
  updatedAt: false,
  indexes: [
    { unique: true, fields: ['student_id', 'academic_year'] },
    { fields: ['class_id'] },
  ],
});

export default StudentClassRelation;
