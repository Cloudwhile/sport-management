const HIGH_SCHOOL_PREFIX = '高中'
const GRADE_SUFFIX = '级'
const CLASS_SUFFIX = '班'

const extractClassNumber = (className?: string | null): number | null => {
  if (!className) return null

  const numberMatch = className.match(/(\d+)\s*班?$/u) || className.match(/(\d+)/u)
  if (numberMatch) return Number(numberMatch[1])

  return null
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

  const fallbackClassName = className?.trim()
  if (!fallbackClassName) {
    return `${schoolLevelLabel}${cohortYear}${GRADE_SUFFIX}`
  }

  const parsedClassNumber = extractClassNumber(fallbackClassName)
  const classNameText = parsedClassNumber
    ? `${String(parsedClassNumber).padStart(2, '0')}${CLASS_SUFFIX}`
    : fallbackClassName

  return `${schoolLevelLabel}${cohortYear}${GRADE_SUFFIX}${classNameText}`
}

export const formatSchoolGradeName = (
  cohort?: string | number | null,
  schoolLevelLabel = HIGH_SCHOOL_PREFIX,
): string => {
  const cohortText = String(cohort ?? '').trim()
  const cohortYear = cohortText.match(/\d{4}/)?.[0] || cohortText
  return cohortYear ? `${schoolLevelLabel}${cohortYear}${GRADE_SUFFIX}` : '未指定入学级'
}
