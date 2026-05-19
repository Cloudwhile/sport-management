const HIGH_SCHOOL_PREFIX = '高中'
const GRADE_SUFFIX = '级'
const CLASS_SUFFIX = '班'

const chineseClassNumbers: Record<string, number> = {
  一: 1,
  二: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
  十: 10,
  十一: 11,
  十二: 12,
  十三: 13,
  十四: 14,
  十五: 15,
  十六: 16,
  十七: 17,
  十八: 18,
  十九: 19,
  二十: 20,
}

const extractClassNumber = (className?: string | null): number => {
  if (!className) return 1

  const numberMatch = className.match(/(\d+)\s*班?$/u) || className.match(/(\d+)/u)
  if (numberMatch) return Number(numberMatch[1])

  const normalizedClassName = className.replace(/\s/g, '')
  const chineseMatch = normalizedClassName.match(/([一二三四五六七八九十]{1,2})班?$/u)
  if (chineseMatch?.[1]) return chineseClassNumbers[chineseMatch[1]] || 1

  return 1
}

export const formatHighSchoolClassName = (
  cohort?: string | number | null,
  className?: string | null,
  schoolLevelLabel = HIGH_SCHOOL_PREFIX,
): string => {
  const cohortText = String(cohort ?? '').trim()
  const cohortYear = cohortText.match(/\d{4}/)?.[0] || cohortText

  if (!cohortYear) {
    return className?.trim() || '-'
  }

  const classNumber = String(extractClassNumber(className)).padStart(2, '0')

  return `${schoolLevelLabel}${cohortYear}${GRADE_SUFFIX}${classNumber}${CLASS_SUFFIX}`
}

export const formatSchoolGradeName = (
  cohort?: string | number | null,
  schoolLevelLabel = HIGH_SCHOOL_PREFIX,
): string => {
  const cohortText = String(cohort ?? '').trim()
  const cohortYear = cohortText.match(/\d{4}/)?.[0] || cohortText
  return cohortYear ? `${schoolLevelLabel}${cohortYear}${GRADE_SUFFIX}` : '未指定入学级'
}
