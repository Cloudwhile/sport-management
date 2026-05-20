const HIGH_SCHOOL_PREFIX = '高中';
const GRADE_SUFFIX = '级';
const CLASS_SUFFIX = '班';

export const extractClassNumberFromClassName = (className: string): number => {
  const numberMatch = className.match(/(\d+)\s*班?$/u) || className.match(/(\d+)/u);
  if (numberMatch) return Number(numberMatch[1]);

  throw new Error(`班号必须使用阿拉伯数字: ${className}`);
};

export const normalizeClassName = (className: string): string => {
  const classNumber = extractClassNumberFromClassName(className);
  return `${String(classNumber).padStart(2, '0')}${CLASS_SUFFIX}`;
};

export const formatHighSchoolClassName = (
  cohort: string | number | null | undefined,
  className: string | null | undefined,
  schoolLevelLabel = HIGH_SCHOOL_PREFIX,
): string => {
  const cohortText = String(cohort ?? '').trim();
  const cohortYear = cohortText.match(/\d{4}/)?.[0] || cohortText;

  if (!cohortYear) {
    return className?.trim() || '-';
  }

  if (!className?.trim()) {
    return `${schoolLevelLabel}${cohortYear}${GRADE_SUFFIX}`;
  }

  const normalizedClassName = normalizeClassName(className ?? '');

  return `${schoolLevelLabel}${cohortYear}${GRADE_SUFFIX}${normalizedClassName}`;
};

export const formatSchoolGradeName = (
  cohort: string | number | null | undefined,
  schoolLevelLabel = HIGH_SCHOOL_PREFIX,
): string => {
  const cohortText = String(cohort ?? '').trim();
  const cohortYear = cohortText.match(/\d{4}/)?.[0] || cohortText;
  return cohortYear ? `${schoolLevelLabel}${cohortYear}${GRADE_SUFFIX}` : '未指定入学级';
};
