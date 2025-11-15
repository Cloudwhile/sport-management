import { DataTypes, Model } from 'sequelize';
import sequelize from '../database/connection.js';

interface FormTestItemAttributes {
  id: number;
  formId: number;
  itemCode: string;
  itemName: string;
  itemUnit?: string;
  genderLimit?: 'male' | 'female';
  isRequired: boolean;
  sortOrder: number;
  scoringStandard?: Record<string, unknown>;
  created_at?: Date;
}

const FormTestItem = sequelize.define<Model<FormTestItemAttributes>>('FormTestItem', {
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
  itemCode: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'item_code',
    comment: '项目代码',
  },
  itemName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'item_name',
    comment: '项目名称',
  },
  itemUnit: {
    type: DataTypes.STRING(20),
    field: 'item_unit',
    comment: '单位',
  },
  genderLimit: {
    type: DataTypes.ENUM('male', 'female'),
    field: 'gender_limit',
    comment: '性别限制：null/male/female',
  },
  isRequired: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_required',
    comment: '是否必填',
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'sort_order',
    comment: '排序',
  },
  scoringStandard: {
    type: DataTypes.JSONB,
    field: 'scoring_standard',
    comment: '评分标准',
  },
}, {
  tableName: 'form_test_items',
  updatedAt: false,
  indexes: [
    { fields: ['form_id'] },
    { fields: ['item_code'] },
  ],
});

export default FormTestItem;
