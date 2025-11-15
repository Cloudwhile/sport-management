import { DataTypes } from 'sequelize';
import sequelize from '../database/connection.js';

const Student = sequelize.define('Student', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  studentIdNational: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    field: 'student_id_national',
    comment: '学籍号（全国统一）',
  },
  studentIdSchool: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    field: 'student_id_school',
    comment: '学校学号',
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '姓名',
  },
  gender: {
    type: DataTypes.ENUM('male', 'female'),
    allowNull: false,
    comment: '性别',
  },
  birthDate: {
    type: DataTypes.DATEONLY,
    field: 'birth_date',
    comment: '出生日期',
  },
  idCardNumber: {
    type: DataTypes.STRING(18),
    unique: true,
    field: 'id_card_number',
    comment: '身份证号',
  },
  phone: {
    type: DataTypes.STRING(20),
    comment: '联系电话',
  },
}, {
  tableName: 'students',
  indexes: [
    { fields: ['student_id_national'] },
    { fields: ['student_id_school'] },
    { fields: ['name'] },
  ],
});

export default Student;
