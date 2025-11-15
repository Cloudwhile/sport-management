import { DataTypes, Model } from 'sequelize';
import sequelize from '../database/connection.js';

interface TeacherClassRelationAttributes {
  id: number;
  userId: number;
  classId: number;
  created_at?: Date;
}

const TeacherClassRelation = sequelize.define<Model<TeacherClassRelationAttributes>>('TeacherClassRelation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
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
}, {
  tableName: 'teacher_class_relations',
  updatedAt: false,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['class_id'] },
  ],
});

export default TeacherClassRelation;
