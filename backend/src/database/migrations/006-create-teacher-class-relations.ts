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
  await createTableIfMissing(queryInterface, 'teacher_class_relations', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      comment: '教师ID',
    },
    class_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'classes',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      comment: '班级ID',
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  // 创建索引
  await createIndexIfColumnsExist(
    context,
    'teacher_class_relations',
    'teacher_class_relations_user_id_idx',
    ['user_id'],
  );

  await createIndexIfColumnsExist(
    context,
    'teacher_class_relations',
    'teacher_class_relations_class_id_idx',
    ['class_id'],
  );
}

export const down: MigrationFn<MigrationContext> = async (params) => {
  await dropTableIfExists(params.context.queryInterface, 'teacher_class_relations');
};
