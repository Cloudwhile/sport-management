import { Optional } from 'sequelize';

// User 模型类型
export interface UserAttributes {
  id: number;
  username: string;
  password: string;
  role: 'admin' | 'teacher' | 'class';
  real_name?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'created_at' | 'updated_at'> {}

// Student 模型类型
export interface StudentAttributes {
  id: number;
  student_id: string;
  name: string;
  gender: 'male' | 'female';
  birth_date: Date;
  id_card?: string;
  phone?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface StudentCreationAttributes extends Optional<StudentAttributes, 'id' | 'created_at' | 'updated_at'> {}

// Class 模型类型
export interface ClassAttributes {
  id: number;
  grade_id: number;
  name: string;
  description?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface ClassCreationAttributes extends Optional<ClassAttributes, 'id' | 'created_at' | 'updated_at'> {}

// Grade 模型类型
export interface GradeAttributes {
  id: number;
  name: string;
  year: number;
  description?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface GradeCreationAttributes extends Optional<GradeAttributes, 'id' | 'created_at' | 'updated_at'> {}

// PhysicalTestForm 模型类型
export interface PhysicalTestFormAttributes {
  id: number;
  name: string;
  description?: string;
  grade_id: number;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface PhysicalTestFormCreationAttributes extends Optional<PhysicalTestFormAttributes, 'id' | 'is_active' | 'created_at' | 'updated_at'> {}

// FormTestItem 模型类型
export interface FormTestItemAttributes {
  id: number;
  form_id: number;
  name: string;
  unit: string;
  scoring_standard?: object;
  created_at?: Date;
  updated_at?: Date;
}

export interface FormTestItemCreationAttributes extends Optional<FormTestItemAttributes, 'id' | 'created_at' | 'updated_at'> {}

// PhysicalTestRecord 模型类型
export interface PhysicalTestRecordAttributes {
  id: number;
  student_id: number;
  form_id: number;
  test_date: Date;
  test_data?: object;
  total_score?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface PhysicalTestRecordCreationAttributes extends Optional<PhysicalTestRecordAttributes, 'id' | 'created_at' | 'updated_at'> {}

// 关系表类型
export interface StudentClassRelationAttributes {
  id: number;
  student_id: number;
  class_id: number;
  join_date?: Date;
  created_at?: Date;
  updated_at?: Date;
}

export interface StudentClassRelationCreationAttributes extends Optional<StudentClassRelationAttributes, 'id' | 'created_at' | 'updated_at'> {}

export interface TeacherClassRelationAttributes {
  id: number;
  teacher_id: number;
  class_id: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface TeacherClassRelationCreationAttributes extends Optional<TeacherClassRelationAttributes, 'id' | 'created_at' | 'updated_at'> {}
