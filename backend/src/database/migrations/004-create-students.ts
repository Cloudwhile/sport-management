import { MigrationContext } from '../umzug.js';
import { MigrationFn } from 'umzug';
import {
  createIndexIfColumnsExist,
  createTableIfMissing,
  dropTableIfExists,
} from '../migration-helpers.js';

export const up: MigrationFn<MigrationContext> = async (params) => {
  const { context } = params;
  const { queryInterface, DataTypes } = context;
  await createTableIfMissing(queryInterface, 'students', {
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
  await createIndexIfColumnsExist(
    context,
    'students',
    'students_student_id_national_idx',
    ['student_id_national'],
  );

  await createIndexIfColumnsExist(
    context,
    'students',
    'students_student_id_school_idx',
    ['student_id_school'],
  );

  await createIndexIfColumnsExist(
    context,
    'students',
    'students_name_idx',
    ['name'],
  );
}

export const down: MigrationFn<MigrationContext> = async (params) => {
  await dropTableIfExists(params.context.queryInterface, 'students');
};
