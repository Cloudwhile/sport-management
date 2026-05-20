// @ts-nocheck
import { Request, Response } from 'express';
import { col, fn, Op } from 'sequelize';
import PhysicalTestRecord from '../models/PhysicalTestRecord.js';
import PhysicalTestForm from '../models/PhysicalTestForm.js';
import FormTestItem from '../models/FormTestItem.js';
import Student from '../models/Student.js';
import Class from '../models/Class.js';
import StudentClassRelation from '../models/StudentClassRelation.js';
import { calculateGradeLevel } from '../utils/gradeHelper.js';
import { formatHighSchoolClassName } from '../utils/classNameFormatter.js';

const EXCLUDED_ANALYSIS_ITEM_CODES = new Set(['height', 'weight']);

const SCORE_LEVELS = [
  { key: 'excellent', label: '优秀', min: 90 },
  { key: 'good', label: '良好', min: 80 },
  { key: 'pass', label: '及格', min: 60 },
  { key: 'fail', label: '不及格', min: -Infinity },
];

const toNumber = (value: unknown): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const round = (value: number, digits = 2): number => {
  return Number((Number.isFinite(value) ? value : 0).toFixed(digits));
};

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value));
};

const toPercent = (numerator: number, denominator: number, digits = 2): number => {
  if (denominator <= 0) return 0;
  return round(clamp((numerator / denominator) * 100, 0, 100), digits);
};

const toRatio = (numerator: number, denominator: number, digits = 4): number => {
  if (denominator <= 0) return 0;
  return round(clamp(numerator / denominator, 0, 1), digits);
};

const calculatePercentile = (score: number, peerScores: number[]): number => {
  const validScores = peerScores.filter(item => Number.isFinite(item));
  if (!Number.isFinite(score) || validScores.length === 0) return 0;
  const lowerOrEqualCount = validScores.filter(item => item <= score).length;
  return toPercent(lowerOrEqualCount, validScores.length, 1);
};

const getScoreLevel = (score: number): string => {
  return SCORE_LEVELS.find(level => score >= level.min)?.key || 'fail';
};

const formatHighSchoolGradeName = (cohort?: string | number | null): string => {
  const cohortText = String(cohort ?? '').trim();
  const cohortYear = cohortText.match(/\d{4}/)?.[0] || cohortText;
  return cohortYear ? `高中${cohortYear}级` : '未指定入学级';
};

const getCohortFromGradeLevel = (gradeLevel: number, academicYear: string): string => {
  const startYear = Number(String(academicYear || '').match(/\d{4}/)?.[0]);
  if (!Number.isFinite(startYear) || !Number.isFinite(gradeLevel)) return '';
  return String(startYear - gradeLevel + 1);
};
const getUniqueStudentCount = (records: any[]): number => {
  return new Set(records.map(record => record.studentId).filter(Boolean)).size;
};
const getRecordsAverage = (records: any[]): number => {
  if (records.length === 0) return 0;
  const total = records.reduce((sum, record) => sum + toNumber(record.totalScore), 0);
  return round(total / records.length);
};


const getRecordItemScore = (record: any, itemCode: string): number | null => {
  const rawValue = (record.scores || {})[itemCode];
  if (rawValue === undefined || rawValue === null || rawValue === '') return null;
  const score = Number(rawValue);
  return Number.isFinite(score) ? score : null;
};

const buildGradeDistribution = (records: any[]) => {
  const distribution = { excellent: 0, good: 0, pass: 0, fail: 0 };

  records.forEach(record => {
    distribution[getScoreLevel(toNumber(record.totalScore))]++;
  });

  return distribution;
};

const getItemsForForm = async (formId: number | string) => {
  return FormTestItem.findAll({
    where: { formId },
    order: [['sortOrder', 'ASC']],
  });
};

const getAnalysisItemsForForm = async (formId: number | string) => {
  const items = await getItemsForForm(formId);
  return items.filter(item => !EXCLUDED_ANALYSIS_ITEM_CODES.has(item.itemCode));
};
const buildItemSummaries = (items: any[], records: any[]) => {
  return items.map(item => {
    const itemScores = records
      .map(record => getRecordItemScore(record, item.itemCode))
      .filter((score): score is number => score !== null);

    const averageScore = itemScores.length > 0
      ? itemScores.reduce((sum, score) => sum + score, 0) / itemScores.length
      : 0;
    const passCount = itemScores.filter(score => score >= 60).length;

    return {
      itemCode: item.itemCode,
      itemName: item.itemName,
      averageScore: round(averageScore),
      passRate: toPercent(passCount, itemScores.length),
      passCount,
      failCount: itemScores.length - passCount,
      maxValue: itemScores.length > 0 ? round(Math.max(...itemScores)) : 0,
      minValue: itemScores.length > 0 ? round(Math.min(...itemScores)) : 0,
      sampleCount: itemScores.length,
    };
  });
};

const buildGenderSummaries = (records: any[]) => {
  return ['male', 'female'].map(gender => {
    const genderRecords = records.filter(record => record.student?.gender === gender);
    const passCount = genderRecords.filter(record => toNumber(record.totalScore) >= 60).length;
    const excellentCount = genderRecords.filter(record => toNumber(record.totalScore) >= 90).length;

    return {
      gender,
      genderName: gender === 'male' ? '男生' : '女生',
      count: getUniqueStudentCount(genderRecords),
      submittedCount: getUniqueStudentCount(genderRecords),
      averageScore: getRecordsAverage(genderRecords),
      passRate: toPercent(passCount, genderRecords.length),
      excellentRate: toPercent(excellentCount, genderRecords.length),
    };
  }).filter(summary => summary.submittedCount > 0);
};

const buildRadarSeries = (items: any[], records: any[]) => {
  const labels = items.map(item => item.itemName);
  const buildData = (sourceRecords: any[]) => items.map(item => {
    const itemScores = sourceRecords
      .map(record => getRecordItemScore(record, item.itemCode))
      .filter((score): score is number => score !== null);
    return itemScores.length > 0
      ? round(itemScores.reduce((sum, score) => sum + score, 0) / itemScores.length)
      : 0;
  });

  const series = [
    { name: '整体平均', data: buildData(records) },
  ];

  const maleRecords = records.filter(record => record.student?.gender === 'male');
  const femaleRecords = records.filter(record => record.student?.gender === 'female');

  if (maleRecords.length > 0) {
    series.push({ name: '男生平均', data: buildData(maleRecords) });
  }
  if (femaleRecords.length > 0) {
    series.push({ name: '女生平均', data: buildData(femaleRecords) });
  }

  return { labels, series };
};

const buildWeaknesses = (itemSummaries: any[], classSummaries: any[] = []) => {
  return {
    weakItems: [...itemSummaries]
      .filter(item => item.sampleCount > 0)
      .sort((a, b) => a.passRate - b.passRate || a.averageScore - b.averageScore)
      .slice(0, 5),
    weakClasses: [...classSummaries]
      .filter(item => item.submittedCount > 0)
      .sort((a, b) => a.passRate - b.passRate || a.averageScore - b.averageScore)
      .slice(0, 5),
  };
};

const buildRiskSummary = (itemSummaries: any[], classSummaries: any[] = [], averageScore = 0) => {
  const mostFailedItem = [...itemSummaries]
    .filter(item => item.sampleCount > 0)
    .sort((a, b) => b.failCount - a.failCount || a.passRate - b.passRate)[0] || null;

  const belowAverageClasses = [...classSummaries]
    .filter(item => item.submittedCount > 0 && item.averageScore < averageScore)
    .map(item => ({
      classId: item.classId,
      className: item.className,
      averageScore: item.averageScore,
      gap: round(item.averageScore - averageScore),
      weakItems: item.weakItems || [],
    }))
    .sort((a, b) => a.gap - b.gap)
    .slice(0, 5);

  return { mostFailedItem, belowAverageClasses };
};

const getScoreMetrics = (records: any[], totalStudents: number) => {
  const submittedCount = Math.min(getUniqueStudentCount(records), totalStudents);
  const passCount = records.filter(record => toNumber(record.totalScore) >= 60).length;
  const excellentCount = records.filter(record => toNumber(record.totalScore) >= 90).length;

  return {
    totalStudents,
    submittedCount,
    submissionRate: toRatio(submittedCount, totalStudents),
    averageScore: getRecordsAverage(records),
    passRate: toPercent(passCount, records.length),
    excellentRate: toPercent(excellentCount, records.length),
  };
};

const fetchRecords = (where: any) => {
  return PhysicalTestRecord.findAll({
    where,
    include: [
      {
        model: Student,
        as: 'student',
        attributes: ['id', 'name', 'gender'],
      },
      {
        model: Class,
        as: 'class',
        attributes: ['id', 'cohort', 'className'],
      },
    ],
  });
};

const getClassIdsForGrade = async (gradeLevel: number, academicYear: string) => {
  const cohort = getCohortFromGradeLevel(gradeLevel, academicYear);
  if (!cohort) return [];

  const classes = await Class.findAll({ where: { cohort } });
  return classes.map(cls => cls.id);
};

const getClassIdsForCohort = async (cohort: string) => {
  const classes = await Class.findAll({ where: { cohort } });
  return classes.map(cls => cls.id);
};

const getClassIdsForGradeScope = async (options: { gradeLevel?: number; cohort?: string }, academicYear: string) => {
  if (options.cohort) return getClassIdsForCohort(options.cohort);
  if (options.gradeLevel) return getClassIdsForGrade(options.gradeLevel, academicYear);
  return [];
};

const countStudentsForClasses = async (classIds: number[], academicYear: string) => {
  if (classIds.length === 0) return 0;

  return StudentClassRelation.count({
    where: {
      classId: { [Op.in]: classIds },
      academicYear,
      isActive: true,
    },
  });
};

const getStudentCountMapForClasses = async (classIds: number[], academicYear: string) => {
  if (classIds.length === 0) return new Map<number, number>();

  const rows = await StudentClassRelation.findAll({
    where: {
      classId: { [Op.in]: classIds },
      academicYear,
      isActive: true,
    },
    attributes: ['classId', [fn('COUNT', col('id')), 'studentCount']],
    group: ['classId'],
    raw: true,
  });

  return new Map(
    rows.map((row: any) => [Number(row.classId), Number(row.studentCount) || 0]),
  );
};

const buildClassSummaries = async (classes: any[], records: any[], academicYear: string, items: any[] = []) => {
  const summaries = [];
  const studentCountMap = await getStudentCountMapForClasses(
    classes.map(classInfo => Number(classInfo.id)).filter(Boolean),
    academicYear,
  );

  for (const classInfo of classes) {
    const classRecords = records.filter(record => Number(record.classId) === Number(classInfo.id));
    const totalStudents = studentCountMap.get(Number(classInfo.id)) || 0;
    const submittedCount = Math.min(getUniqueStudentCount(classRecords), totalStudents);
    const passCount = classRecords.filter(record => toNumber(record.totalScore) >= 60).length;
    const excellentCount = classRecords.filter(record => toNumber(record.totalScore) >= 90).length;
    const itemSummaries = buildItemSummaries(items, classRecords);

    summaries.push({
      classId: classInfo.id,
      className: formatHighSchoolClassName(classInfo.cohort, classInfo.className),
      cohort: classInfo.cohort,
      totalStudents,
      submittedCount,
      submissionRate: toPercent(submittedCount, totalStudents),
      unsubmittedCount: Math.max(totalStudents - submittedCount, 0),
      averageScore: getRecordsAverage(classRecords),
      passRate: toPercent(passCount, classRecords.length),
      excellentRate: toPercent(excellentCount, classRecords.length),
      gradeDistribution: buildGradeDistribution(classRecords),
      weakItems: itemSummaries
        .filter(item => item.sampleCount > 0)
        .sort((a, b) => a.passRate - b.passRate || a.averageScore - b.averageScore)
        .slice(0, 3),
    });
  }

  return summaries.sort((a, b) => b.averageScore - a.averageScore);
};

const buildTrendSeries = async (scope: 'school' | 'grade' | 'class', options: { gradeLevel?: number; cohort?: string; classId?: number } = {}) => {
  const forms = await PhysicalTestForm.findAll({
    order: [['academicYear', 'ASC'], ['testDate', 'ASC'], ['id', 'ASC']],
  });
  const labels = forms.map(form => form.testDate ? `${form.academicYear} ${form.testDate}` : form.formName);
  const formIds = forms.map(form => form.id);
  const allRecords = formIds.length > 0
    ? await fetchRecords({ formId: { [Op.in]: formIds } })
    : [];
  const recordsByFormId = new Map<number, any[]>();
  allRecords.forEach(record => {
    const key = Number(record.formId);
    if (!recordsByFormId.has(key)) recordsByFormId.set(key, []);
    recordsByFormId.get(key).push(record);
  });
  const gradeClassIdsCache = new Map<string, number[]>();

  const getScopedClassIds = async (form: any) => {
    const cacheKey = `${options.cohort || options.gradeLevel || ''}:${form.academicYear}`;
    if (!gradeClassIdsCache.has(cacheKey)) {
      gradeClassIdsCache.set(
        cacheKey,
        await getClassIdsForGradeScope(options, form.academicYear),
      );
    }
    return gradeClassIdsCache.get(cacheKey) || [];
  };

  if (scope === 'class' && options.classId) {
    const data = forms.map(form => getRecordsAverage(
      (recordsByFormId.get(Number(form.id)) || []).filter(
        record => Number(record.classId) === Number(options.classId),
      ),
    ));
    return { labels, series: [{ name: '当前班级', data }] };
  }

  if (scope === 'grade' && (options.cohort || options.gradeLevel)) {
    const data = [];
    for (const form of forms) {
      const classIds = await getScopedClassIds(form);
      const classIdSet = new Set(classIds.map(Number));
      data.push(getRecordsAverage(
        (recordsByFormId.get(Number(form.id)) || []).filter(
          record => classIdSet.has(Number(record.classId)),
        ),
      ));
    }
    const name = options.cohort
      ? formatHighSchoolGradeName(options.cohort)
      : formatHighSchoolGradeName(getCohortFromGradeLevel(options.gradeLevel || 0, forms[0]?.academicYear));
    return { labels, series: [{ name, data }] };
  }

  const allData = [];
  const cohortData = new Map<string, number[]>();
  const allCohorts = new Set<string>();
  forms.forEach(form => (form.participatingCohorts || []).forEach((cohort: string) => allCohorts.add(cohort)));

  for (const form of forms) {
    const records = recordsByFormId.get(Number(form.id)) || [];
    allData.push(getRecordsAverage(records));

    const formCohorts = new Map<string, any[]>();
    records.forEach(record => {
      if (!record.class?.cohort) return;
      const cohort = String(record.class.cohort);
      allCohorts.add(cohort);
      if (!formCohorts.has(cohort)) formCohorts.set(cohort, []);
      formCohorts.get(cohort).push(record);
    });

    Array.from(allCohorts).forEach(cohort => {
      if (!cohortData.has(cohort)) cohortData.set(cohort, []);
      cohortData.get(cohort).push(getRecordsAverage(formCohorts.get(cohort) || []));
    });
  }

  return {
    labels,
    series: [
      { name: '全校平均', data: allData },
      ...Array.from(cohortData.entries())
        .sort(([a], [b]) => Number(b) - Number(a))
        .map(([cohort, data]) => ({ name: formatHighSchoolGradeName(cohort), data })),
    ],
  };
};
const getScopedRecordsAndTotal = async (form: any, scope: 'school' | 'grade' | 'class', options: { gradeLevel?: number; cohort?: string; classId?: number } = {}) => {
  if (scope === 'class' && options.classId) {
    const records = await fetchRecords({ formId: form.id, classId: options.classId });
    const totalStudents = await StudentClassRelation.count({
      where: { classId: options.classId, academicYear: form.academicYear, isActive: true },
    });
    return { records, totalStudents };
  }

  if (scope === 'grade' && (options.gradeLevel || options.cohort)) {
    const classIds = await getClassIdsForGradeScope(options, form.academicYear);
    const records = classIds.length > 0
      ? await fetchRecords({ formId: form.id, classId: { [Op.in]: classIds } })
      : [];
    const totalStudents = await countStudentsForClasses(classIds, form.academicYear);
    return { records, totalStudents };
  }

  const allClasses = await Class.findAll();
  const participatingClasses = allClasses.filter(cls => {
    return form.participatingCohorts && form.participatingCohorts.includes(cls.cohort);
  });
  const classIds = participatingClasses.map(item => item.id);
  const records = classIds.length > 0
    ? await fetchRecords({ formId: form.id, classId: { [Op.in]: classIds } })
    : [];
  const totalStudents = await countStudentsForClasses(classIds, form.academicYear);
  return { records, totalStudents };
};

const buildRadarSeriesForScope = async (
  form: any,
  items: any[],
  records: any[],
  scope: 'school' | 'grade' | 'class',
  options: { gradeLevel?: number; cohort?: string; classId?: number } = {},
) => {
  const radar = buildRadarSeries(items, records);
  radar.series[0].name = scope === 'class' ? '当前班级' : scope === 'grade' ? (options.cohort ? formatHighSchoolGradeName(options.cohort) : '当前入学级') : '全校平均';

  const buildData = (sourceRecords: any[]) => items.map(item => {
    const itemScores = sourceRecords
      .map(record => getRecordItemScore(record, item.itemCode))
      .filter((score): score is number => score !== null);
    return itemScores.length > 0
      ? round(itemScores.reduce((sum, score) => sum + score, 0) / itemScores.length)
      : 0;
  });

  if (scope === 'school') {
    const cohortRecords = new Map<string, any[]>();
    records.forEach(record => {
      if (!record.class?.cohort) return;
      const cohort = String(record.class.cohort);
      if (!cohortRecords.has(cohort)) cohortRecords.set(cohort, []);
      cohortRecords.get(cohort).push(record);
    });

    Array.from(cohortRecords.entries())
      .sort(([a], [b]) => Number(b) - Number(a))
      .forEach(([cohort, sourceRecords]) => {
        radar.series.push({ name: `${formatHighSchoolGradeName(cohort)}平均`, data: buildData(sourceRecords) });
      });
  } else if (scope === 'class' && options.cohort) {
    const gradeScoped = await getScopedRecordsAndTotal(form, 'grade', { cohort: options.cohort });
    if (gradeScoped.records.length > 0) {
      radar.series.push({ name: `${formatHighSchoolGradeName(options.cohort)}平均`, data: buildData(gradeScoped.records) });
    }
  }

  return radar;
};
const buildRateTrendSeries = async (scope: 'school' | 'grade' | 'class', options: { gradeLevel?: number; cohort?: string; classId?: number } = {}) => {
  const forms = await PhysicalTestForm.findAll({
    order: [['academicYear', 'ASC'], ['testDate', 'ASC'], ['id', 'ASC']],
  });
  const labels = forms.map(form => form.testDate ? `${form.academicYear} ${form.testDate}` : form.formName);
  const averageScore: number[] = [];
  const passRate: number[] = [];
  const excellentRate: number[] = [];
  const submissionRate: number[] = [];

  for (const form of forms) {
    const scoped = await getScopedRecordsAndTotal(form, scope, options);
    const metrics = getScoreMetrics(scoped.records, scoped.totalStudents);
    averageScore.push(metrics.averageScore);
    passRate.push(metrics.passRate);
    excellentRate.push(metrics.excellentRate);
    submissionRate.push(round(metrics.submissionRate * 100));
  }

  return {
    labels,
    series: [
      { name: '平均分', data: averageScore },
      { name: '及格率', data: passRate },
      { name: '优秀率', data: excellentRate },
      { name: '提交率', data: submissionRate },
    ],
  };
};

const buildItemTrendSeries = async (items: any[], scope: 'school' | 'grade' | 'class', options: { gradeLevel?: number; cohort?: string; classId?: number } = {}) => {
  const forms = await PhysicalTestForm.findAll({
    order: [['academicYear', 'ASC'], ['testDate', 'ASC'], ['id', 'ASC']],
  });
  const labels = forms.map(form => form.testDate ? `${form.academicYear} ${form.testDate}` : form.formName);
  const scopedByForm = await Promise.all(
    forms.map(form => getScopedRecordsAndTotal(form, scope, options)),
  );
  const series = [];

  for (const item of items) {
    const data = scopedByForm.map(scoped => {
      const itemScores = scoped.records
        .map(record => getRecordItemScore(record, item.itemCode))
        .filter((score): score is number => score !== null);
      return itemScores.length > 0
        ? round(itemScores.reduce((sum, score) => sum + score, 0) / itemScores.length)
        : 0;
    });
    series.push({ name: item.itemName, itemCode: item.itemCode, data });
  }

  return { labels, series };
};

const buildClassItemHeatmap = (items: any[], records: any[], classSummaries: any[]) => {
  return {
    columns: items.map(item => ({ itemCode: item.itemCode, itemName: item.itemName })),
    rows: classSummaries.map(classInfo => {
      const classRecords = records.filter(record => Number(record.classId) === Number(classInfo.classId));
      return {
        classId: classInfo.classId,
        className: classInfo.className,
        values: items.map(item => {
          const itemScores = classRecords
            .map(record => getRecordItemScore(record, item.itemCode))
            .filter((score): score is number => score !== null);
          return itemScores.length > 0
            ? round(itemScores.reduce((sum, score) => sum + score, 0) / itemScores.length)
            : null;
        }),
      };
    }),
  };
};

const buildGradeSummaries = async (classes: any[], records: any[], academicYear: string) => {
  const cohortMap = new Map<string, { classes: any[]; records: any[] }>();
  const studentCountMap = await getStudentCountMapForClasses(
    classes.map(classInfo => Number(classInfo.id)).filter(Boolean),
    academicYear,
  );

  classes.forEach(classInfo => {
    const cohort = String(classInfo.cohort || '');
    if (!cohort) return;
    if (!cohortMap.has(cohort)) cohortMap.set(cohort, { classes: [], records: [] });
    cohortMap.get(cohort).classes.push(classInfo);
  });

  records.forEach(record => {
    const cohort = String(record.class?.cohort || '');
    if (!cohort) return;
    if (!cohortMap.has(cohort)) cohortMap.set(cohort, { classes: [], records: [] });
    cohortMap.get(cohort).records.push(record);
  });

  const summaries = [];
  for (const [cohort, group] of cohortMap.entries()) {
    const classIds = group.classes.map(item => item.id);
    const totalStudents = classIds.reduce(
      (sum, classId) => sum + (studentCountMap.get(Number(classId)) || 0),
      0,
    );
    const metrics = getScoreMetrics(group.records, totalStudents);
    summaries.push({
      cohort,
      gradeName: formatHighSchoolGradeName(cohort),
      totalClasses: group.classes.length,
      totalStudents,
      submittedCount: metrics.submittedCount,
      submissionRate: round(metrics.submissionRate * 100),
      averageScore: metrics.averageScore,
      passRate: metrics.passRate,
      excellentRate: metrics.excellentRate,
      gradeDistribution: buildGradeDistribution(group.records),
    });
  }

  return summaries.sort((a, b) => Number(b.cohort) - Number(a.cohort));
};
const buildComparison = async (
  form: any,
  scope: 'school' | 'grade' | 'class',
  options: { gradeLevel?: number; cohort?: string; classId?: number } = {},
  currentMetrics: any,
) => {
  const forms = await PhysicalTestForm.findAll({
    order: [['academicYear', 'ASC'], ['testDate', 'ASC'], ['id', 'ASC']],
  });
  const currentIndex = forms.findIndex(item => Number(item.id) === Number(form.id));
  const previousForm = currentIndex > 0 ? forms[currentIndex - 1] : null;
  if (!previousForm) return null;

  const previousScoped = await getScopedRecordsAndTotal(previousForm, scope, options);
  const previousMetrics = getScoreMetrics(previousScoped.records, previousScoped.totalStudents);

  return {
    previousFormId: previousForm.id,
    previousFormName: previousForm.formName,
    previousTestDate: previousForm.testDate,
    averageScoreDelta: round(currentMetrics.averageScore - previousMetrics.averageScore),
    passRateDelta: round(currentMetrics.passRate - previousMetrics.passRate),
    excellentRateDelta: round(currentMetrics.excellentRate - previousMetrics.excellentRate),
    submissionRateDelta: round((currentMetrics.submissionRate - previousMetrics.submissionRate) * 100),
  };
};
const buildSummary = async ({
  form,
  records,
  totalStudents,
  classSummaries = [],
  gradeSummaries = [],
  trendScope,
  trendOptions = {},
}: {
  form: any;
  records: any[];
  totalStudents: number;
  classSummaries?: any[];
  gradeSummaries?: any[];
  trendScope: 'school' | 'grade' | 'class';
  trendOptions?: any;
}) => {
  const items = await getAnalysisItemsForForm(form.id);
  const metrics = getScoreMetrics(records, totalStudents);
  const itemSummaries = buildItemSummaries(items, records);

  return {
    totalStudents,
    submittedCount: metrics.submittedCount,
    submissionRate: metrics.submissionRate,
    averageScore: metrics.averageScore,
    gradeDistribution: buildGradeDistribution(records),
    scoreDistribution: buildGradeDistribution(records),
    classSummaries,
    gradeSummaries,
    itemSummaries,
    genderSummaries: buildGenderSummaries(records),
    radarSeries: await buildRadarSeriesForScope(form, items, records, trendScope, trendOptions),
    trendSeries: await buildTrendSeries(trendScope, trendOptions),
    trendMetricSeries: await buildRateTrendSeries(trendScope, trendOptions),
    itemTrendSeries: await buildItemTrendSeries(items, trendScope, trendOptions),
    classItemHeatmap: buildClassItemHeatmap(items, records, classSummaries),
    comparison: await buildComparison(form, trendScope, trendOptions, metrics),
    riskSummary: buildRiskSummary(itemSummaries, classSummaries, metrics.averageScore),
    weaknesses: buildWeaknesses(itemSummaries, classSummaries),
  };
};

export const getOverallStats = async (req: Request, res: Response) => {
  try {
    const { academicYear } = req.query;
    const totalStudents = await Student.count();
    const totalClasses = await Class.count();
    const totalForms = await PhysicalTestForm.count();
    const totalRecords = await PhysicalTestRecord.count();

    let yearStats = null;
    if (academicYear) {
      const yearForms = await PhysicalTestForm.findAll({
        where: { academicYear: academicYear as string },
        attributes: ['id'],
      });
      yearStats = {
        forms: yearForms.length,
        records: await PhysicalTestRecord.count({
          where: { formId: { [Op.in]: yearForms.map(form => form.id) } },
        }),
      };
    }

    res.json({ success: true, data: { totalStudents, totalClasses, totalForms, totalRecords, yearStats } });
  } catch (error: any) {
    console.error('获取整体统计失败:', error);
    res.status(500).json({ success: false, message: '获取统计数据失败', error: error.message });
  }
};

export const getClassStats = async (req: Request, res: Response) => {
  try {
    const { formId, classId } = req.params;
    const form = await PhysicalTestForm.findByPk(formId);
    if (!form) return res.status(404).json({ success: false, message: '表单不存在' });

    const classInfo = await Class.findByPk(classId);
    if (!classInfo) return res.status(404).json({ success: false, message: '班级不存在' });

    const records = await fetchRecords({ formId, classId });
    const items = await getAnalysisItemsForForm(form.id);
    const totalStudents = await StudentClassRelation.count({
      where: { classId, academicYear: form.academicYear, isActive: true },
    });
    const classSummaries = await buildClassSummaries([classInfo], records, form.academicYear, items);
    const gradeSummaries = await buildGradeSummaries([classInfo], records, form.academicYear);
    const summary = await buildSummary({
      form,
      records,
      totalStudents,
      classSummaries,
      gradeSummaries,
      trendScope: 'class',
      trendOptions: { classId: Number(classId), cohort: classInfo.cohort },
    });

    res.json({ success: true, data: summary });
  } catch (error: any) {
    console.error('获取班级统计失败:', error);
    res.status(500).json({ success: false, message: '获取统计数据失败', error: error.message });
  }
};

export const getGradeStats = async (req: Request, res: Response) => {
  try {
    const { formId } = req.params;
    const gradeLevel = req.params.gradeLevel || req.params.gradeId;
    const form = await PhysicalTestForm.findByPk(formId);
    if (!form) return res.status(404).json({ success: false, message: '表单不存在' });

    const gradeParam = String(gradeLevel || '');
    const targetCohort = /^\d{4}$/.test(gradeParam) ? gradeParam : '';
    const targetGradeLevel = targetCohort ? undefined : parseInt(gradeParam);
    const allClasses = await Class.findAll();
    const filteredClasses = allClasses.filter(cls => {
      if (targetCohort) return String(cls.cohort) === targetCohort;
      return calculateGradeLevel(cls.cohort, form.academicYear) === targetGradeLevel;
    });
    const gradeName = targetCohort
      ? formatHighSchoolGradeName(targetCohort)
      : formatHighSchoolGradeName(getCohortFromGradeLevel(targetGradeLevel || 0, form.academicYear));
    if (filteredClasses.length === 0) {
      return res.status(404).json({ success: false, message: `${form.academicYear}学年没有找到${gradeName}的班级` });
    }

    const classIds = filteredClasses.map(item => item.id);
    const records = await fetchRecords({ formId, classId: { [Op.in]: classIds } });
    const items = await getAnalysisItemsForForm(form.id);
    const totalStudents = await countStudentsForClasses(classIds, form.academicYear);
    const classSummaries = await buildClassSummaries(filteredClasses, records, form.academicYear, items);
    const gradeSummaries = await buildGradeSummaries(filteredClasses, records, form.academicYear);
    const summary = await buildSummary({
      form,
      records,
      totalStudents,
      classSummaries,
      gradeSummaries,
      trendScope: 'grade',
      trendOptions: { gradeLevel: targetGradeLevel, cohort: targetCohort },
    });

    res.json({ success: true, data: summary });
  } catch (error: any) {
    console.error('获取级部统计失败:', error);
    res.status(500).json({ success: false, message: '获取统计数据失败', error: error.message });
  }
};

export const getFormStats = async (req: Request, res: Response) => {
  try {
    const { formId } = req.params;
    const form = await PhysicalTestForm.findByPk(formId);
    if (!form) return res.status(404).json({ success: false, message: '表单不存在' });

    const allClasses = await Class.findAll();
    const participatingClasses = allClasses.filter(cls => {
      return form.participatingCohorts && form.participatingCohorts.includes(cls.cohort);
    });
    const classIds = participatingClasses.map(item => item.id);
    const records = await fetchRecords({ formId, classId: { [Op.in]: classIds } });
    const items = await getAnalysisItemsForForm(form.id);
    const totalStudents = await countStudentsForClasses(classIds, form.academicYear);
    const classSummaries = await buildClassSummaries(participatingClasses, records, form.academicYear, items);
    const gradeSummaries = await buildGradeSummaries(participatingClasses, records, form.academicYear);
    const summary = await buildSummary({
      form,
      records,
      totalStudents,
      classSummaries,
      gradeSummaries,
      trendScope: 'school',
    });

    res.json({ success: true, data: summary });
  } catch (error: any) {
    console.error('获取表单统计失败:', error);
    res.status(500).json({ success: false, message: '获取统计数据失败', error: error.message });
  }
};

export const getTrendData = async (req: Request, res: Response) => {
  try {
    const { classId, gradeLevel } = req.query;
    const gradeParam = String(gradeLevel || '');
    const trend = classId
      ? await buildTrendSeries('class', { classId: Number(classId) })
      : gradeLevel
        ? await buildTrendSeries('grade', /^\d{4}$/.test(gradeParam) ? { cohort: gradeParam } : { gradeLevel: Number(gradeLevel) })
        : await buildTrendSeries('school');

    res.json({ success: true, data: trend });
  } catch (error: any) {
    console.error('获取趋势数据失败:', error);
    res.status(500).json({ success: false, message: '获取趋势数据失败', error: error.message });
  }
};

export const getStudentHistory = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const student = await Student.findByPk(studentId);
    if (!student) {
      res.status(404).json({ success: false, message: '学生不存在' });
      return;
    }

    const records = await PhysicalTestRecord.findAll({
      where: { studentId: parseInt(studentId) },
      include: [
        { model: PhysicalTestForm, as: 'form', attributes: ['id', 'formName', 'academicYear', 'testDate'] },
        { model: Class, as: 'class', attributes: ['id', 'cohort', 'className'] },
      ],
      order: [['created_at', 'ASC']],
    });

    const recordData = (records as any[]).map(record => record.toJSON());
    const formIds = [...new Set(recordData.map(record => record.formId).filter(Boolean))];
    const allPeerRecords = formIds.length > 0
      ? await PhysicalTestRecord.findAll({
          where: { formId: { [Op.in]: formIds } },
          attributes: ['formId', 'classId', 'totalScore'],
          raw: true,
        })
      : [];
    const peerScoresByFormClass = new Map<string, number[]>();

    allPeerRecords.forEach((peer: any) => {
      const key = `${peer.formId}:${peer.classId}`;
      if (!peerScoresByFormClass.has(key)) peerScoresByFormClass.set(key, []);
      peerScoresByFormClass.get(key).push(toNumber(peer.totalScore));
    });

    const gradeClassIdsByRecord = new Map<string, number[]>();
    const uniqueGradeScopes = new Map<string, { gradeLevel: number; academicYear: string }>();

    recordData.forEach(data => {
      const gradeLevel = data.class?.cohort && data.form?.academicYear
        ? calculateGradeLevel(data.class.cohort, data.form.academicYear)
        : null;
      if (!gradeLevel) return;

      const key = `${gradeLevel}:${data.form.academicYear}`;
      uniqueGradeScopes.set(key, { gradeLevel, academicYear: data.form.academicYear });
    });

    for (const [key, scope] of uniqueGradeScopes.entries()) {
      gradeClassIdsByRecord.set(
        key,
        await getClassIdsForGrade(scope.gradeLevel, scope.academicYear),
      );
    }

    const history = [];
    for (const data of recordData) {
      const totalScore = toNumber(data.totalScore);
      const gradeLevel = data.class?.cohort && data.form?.academicYear
        ? calculateGradeLevel(data.class.cohort, data.form.academicYear)
        : null;
      const gradeClassIds = gradeLevel
        ? gradeClassIdsByRecord.get(`${gradeLevel}:${data.form.academicYear}`) || []
        : [];
      const classPeerScores = peerScoresByFormClass.get(`${data.formId}:${data.classId}`) || [];
      const gradePeerScores = gradeClassIds.flatMap(
        classId => peerScoresByFormClass.get(`${data.formId}:${classId}`) || [],
      );

      history.push({
        id: data.id,
        formId: data.formId,
        formName: data.form?.formName,
        academicYear: data.form?.academicYear,
        testDate: data.form?.testDate,
        classId: data.classId,
        cohort: data.class?.cohort,
        className: data.class?.className,
        testData: data.testData,
        scores: data.scores,
        totalScore: data.totalScore,
        gradeLevel: data.gradeLevel,
        percentile: {
          class: calculatePercentile(totalScore, classPeerScores),
          grade: calculatePercentile(totalScore, gradePeerScores),
        },
        submittedAt: data.submittedAt,
      });
    }

    res.json({
      success: true,
      data: {
        student: {
          id: student.get('id'),
          studentIdNational: student.get('studentIdNational'),
          studentIdSchool: student.get('studentIdSchool'),
          name: student.get('name'),
          gender: student.get('gender'),
          birthDate: student.get('birthDate'),
        },
        history,
      },
    });
  } catch (error: any) {
    console.error('获取学生历史数据失败:', error);
    res.status(500).json({ success: false, message: '获取学生历史数据失败', error: error.message });
  }
};

export const getClassHistory = async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const classData = await Class.findByPk(classId);
    if (!classData) {
      res.status(404).json({ success: false, message: '班级不存在' });
      return;
    }

    const records = await PhysicalTestRecord.findAll({
      where: { classId: parseInt(classId) },
      include: [
        { model: PhysicalTestForm, as: 'form', attributes: ['id', 'formName', 'academicYear', 'testDate'] },
      ],
    });

    const formStats = new Map();
    for (const record of records) {
      const data = record.toJSON() as any;
      const formId = data.formId;

      if (!formStats.has(formId)) {
        formStats.set(formId, {
          formId,
          formName: data.form?.formName,
          academicYear: data.form?.academicYear,
          testDate: data.form?.testDate,
          records: [],
        });
      }

      formStats.get(formId).records.push(record);
    }

    const history = Array.from(formStats.values()).map(item => {
      const records = item.records;
      const passCount = records.filter(record => toNumber(record.totalScore) >= 60).length;
      const excellentCount = records.filter(record => toNumber(record.totalScore) >= 90).length;

      return {
        formId: item.formId,
        formName: item.formName,
        academicYear: item.academicYear,
        testDate: item.testDate,
        totalCount: records.length,
        avgScore: getRecordsAverage(records),
        passRate: toPercent(passCount, records.length),
        excellentRate: toPercent(excellentCount, records.length),
      };
    }).sort((a, b) => new Date(a.testDate || 0).getTime() - new Date(b.testDate || 0).getTime());

    res.json({
      success: true,
      data: {
        class: {
          id: classData.get('id'),
          cohort: classData.get('cohort'),
          className: classData.get('className'),
        },
        history,
      },
    });
  } catch (error: any) {
    console.error('获取班级历史趋势失败:', error);
    res.status(500).json({ success: false, message: '获取班级历史趋势失败', error: error.message });
  }
};
