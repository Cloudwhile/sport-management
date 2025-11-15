import Student from './Student.js';
import Grade from './Grade.js';
import Class from './Class.js';
import StudentClassRelation from './StudentClassRelation.js';
import User from './User.js';
import PhysicalTestForm from './PhysicalTestForm.js';
import FormTestItem from './FormTestItem.js';
import PhysicalTestRecord from './PhysicalTestRecord.js';
import TeacherClassRelation from './TeacherClassRelation.js';

// 定义关联关系

// Student - StudentClassRelation (一对多)
Student.hasMany(StudentClassRelation, { foreignKey: 'studentId', as: 'classRelations' });
StudentClassRelation.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

// Class - StudentClassRelation (一对多)
Class.hasMany(StudentClassRelation, { foreignKey: 'classId', as: 'studentRelations' });
StudentClassRelation.belongsTo(Class, { foreignKey: 'classId', as: 'class' });

// User - PhysicalTestForm (一对多)
User.hasMany(PhysicalTestForm, { foreignKey: 'createdBy', as: 'forms' });
PhysicalTestForm.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// PhysicalTestForm - FormTestItem (一对多)
PhysicalTestForm.hasMany(FormTestItem, { foreignKey: 'formId', as: 'testItems' });
FormTestItem.belongsTo(PhysicalTestForm, { foreignKey: 'formId', as: 'form' });

// PhysicalTestForm - PhysicalTestRecord (一对多)
PhysicalTestForm.hasMany(PhysicalTestRecord, { foreignKey: 'formId', as: 'records' });
PhysicalTestRecord.belongsTo(PhysicalTestForm, { foreignKey: 'formId', as: 'form' });

// Student - PhysicalTestRecord (一对多)
Student.hasMany(PhysicalTestRecord, { foreignKey: 'studentId', as: 'testRecords' });
PhysicalTestRecord.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

// Class - PhysicalTestRecord (一对多)
Class.hasMany(PhysicalTestRecord, { foreignKey: 'classId', as: 'testRecords' });
PhysicalTestRecord.belongsTo(Class, { foreignKey: 'classId', as: 'class' });

// User - TeacherClassRelation (一对多)
User.hasMany(TeacherClassRelation, { foreignKey: 'userId', as: 'classRelations' });
TeacherClassRelation.belongsTo(User, { foreignKey: 'userId', as: 'teacher' });

// Class - TeacherClassRelation (一对多)
Class.hasMany(TeacherClassRelation, { foreignKey: 'classId', as: 'teacherRelations' });
TeacherClassRelation.belongsTo(Class, { foreignKey: 'classId', as: 'class' });

export {
  Student,
  Grade,
  Class,
  StudentClassRelation,
  User,
  PhysicalTestForm,
  FormTestItem,
  PhysicalTestRecord,
  TeacherClassRelation,
};
