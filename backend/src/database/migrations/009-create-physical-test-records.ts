import { MigrationContext } from '../umzug.js';
import { MigrationFn } from 'umzug';

export const up: MigrationFn<MigrationContext> = async (params) => {
  const { context } = params;
  const { queryInterface, DataTypes } = context;
  await queryInterface.createTable('physical_test_records', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    form_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'physical_test_forms',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      comment: '表单ID',
    },
    student_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'students',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      comment: '学生ID',
    },
    class_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'classes',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
      comment: '班级ID（冗余字段）',
    },
    test_data: {
      type: DataTypes.JSONB,
      allowNull: false,
      comment: '测试数据',
    },
    total_score: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: '总分',
    },
    grade_level: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: '等级',
    },
    submitted_by: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '提交人',
    },
    submitted_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '提交时间',
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

  // 创建唯一索引：同一表单，一个学生只能有一条记录
  await queryInterface.addIndex('physical_test_records', ['form_id', 'student_id'], {
    name: 'physical_test_records_form_student_unique',
    unique: true,
  });

  await queryInterface.addIndex('physical_test_records', ['student_id'], {
    name: 'physical_test_records_student_id_idx',
  });

  await queryInterface.addIndex('physical_test_records', ['class_id'], {
    name: 'physical_test_records_class_id_idx',
  });
}

export const down: MigrationFn<MigrationContext> = async (params) => {
  await params.context.queryInterface.dropTable('physical_test_records');
};
