import { DataTypes } from 'sequelize';
import sequelize from '../database/connection.js';

const Grade = sequelize.define('Grade', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  gradeName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'grade_name',
    comment: '年级名称：一年级、二年级',
  },
  gradeLevel: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'grade_level',
    comment: '年级数字：1, 2, 3',
  },
}, {
  tableName: 'grades',
  updatedAt: false,
});

export default Grade;
