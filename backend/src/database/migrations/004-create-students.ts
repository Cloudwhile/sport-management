import { MigrationContext } from '../umzug.js';
import { MigrationFn } from 'umzug';

export const up: MigrationFn<MigrationContext> = async (params) => {
  const { context } = params;
  const { queryInterface, DataTypes } = context;
  await queryInterface.createTable('students', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    student_id_national: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: '全国学籍号',
    },
    student_id_school: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
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
    birth_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: '出生日期',
    },
    id_card_number: {
      type: DataTypes.STRING(18),
      allowNull: true,
      unique: true,
      comment: '身份证号',
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: '联系电话',
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  // 创建索引
  await queryInterface.addIndex('students', ['student_id_national'], {
    name: 'students_student_id_national_idx',
  });

  await queryInterface.addIndex('students', ['student_id_school'], {
    name: 'students_student_id_school_idx',
  });

  await queryInterface.addIndex('students', ['name'], {
    name: 'students_name_idx',
  });
}

export const down: MigrationFn<MigrationContext> = async (params) => {
  await params.context.queryInterface.dropTable('students');
};
