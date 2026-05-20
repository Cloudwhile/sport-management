const HIGH_SCHOOL_PREFIX = '高中';
const GRADE_SUFFIX = '级';
const CLASS_SUFFIX = '班';

const chineseDigits: Record<string, number> = {
  零: 0,
  〇: 0,
  一: 1,
  二: 2,
  两: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
};

const chineseUnits: Record<string, number> = {
  十: 10,
  百: 100,
  千: 1000,
};

const parseChineseNumeral = (value: string): number | null => {
  if (!value) return null;

  let total = 0;
  let current = 0;

  for (const char of value) {
    if (char in chineseDigits) {
      current = chineseDigits[char];
      continue;
    }

    const unit = chineseUnits[char];
    if (!unit) return null;

    total += (current || 1) * unit;
    current = 0;
  }

  return total + current;
};

export const extractClassNumberFromClassName = (className: string): number => {
  const numberMatch = className.match(/(\d+)\s*班?$/u) || className.match(/(\d+)/u);
  if (numberMatch) return Number(numberMatch[1]);

  const normalizedClassName = className.replace(/\s/g, '');
  const chineseMatch = normalizedClassName.match(/([零〇一二两三四五六七八九十百千]+)班?$/u);
  if (chineseMatch?.[1]) {
    const parsed = parseChineseNumeral(chineseMatch[1]);
    if (parsed && parsed > 0) return parsed;
    throw new Error(`无法解析班号: ${className}`);
  }

  throw new Error(`无法解析班号: ${className}`);
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
