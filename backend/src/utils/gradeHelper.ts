/**
 * 年级计算辅助工具
 * 用于根据班级入学年份和当前学年计算年级等级
 */

/**
 * 根据入学年份（cohort）和学年计算当前年级等级
 * @param cohort 入学年份，如"2024级"
 * @param academicYear 学年，如"2025-2026"
 * @returns 年级等级（1-6），如果已毕业或未入学则返回null
 *
 * @example
 * calculateGradeLevel("2024级", "2024-2025") // 返回 1 (一年级)
 * calculateGradeLevel("2024级", "2025-2026") // 返回 2 (二年级)
 * calculateGradeLevel("2024级", "2026-2027") // 返回 3 (三年级)
 */
export function calculateGradeLevel(cohort: string, academicYear: string): number | null {
  // 提取入学年份数字
  const cohortYear = parseInt(cohort.replace(/级$/, ''));

  // 提取学年的起始年份
  const currentYear = parseInt(academicYear.split('-')[0]);

  // 计算年级等级
  const gradeLevel = currentYear - cohortYear + 1;

  // 验证合理性（假设最多6年制，最少1年）
  if (gradeLevel < 1 || gradeLevel > 6) {
    return null;
  }

  return gradeLevel;
}

/**
 * 根据年级等级获取年级中文名称
 * @param gradeLevel 年级等级（1-6）
 * @returns 年级中文名称，如"一年级"
 */
export function getGradeName(gradeLevel: number): string {
  const gradeNames: Record<number, string> = {
    1: '一年级',
    2: '二年级',
    3: '三年级',
    4: '四年级',
    5: '五年级',
    6: '六年级',
  };

  return gradeNames[gradeLevel] || '未知年级';
}

/**
 * 判断班级在指定学年是否已毕业
 * @param cohort 入学年份，如"2024级"
 * @param academicYear 学年，如"2027-2028"
 * @param schoolYears 学制年数，默认3年
 * @returns 是否已毕业
 */
export function isGraduated(cohort: string, academicYear: string, schoolYears: number = 3): boolean {
  const gradeLevel = calculateGradeLevel(cohort, academicYear);

  if (gradeLevel === null) {
    return true; // 超出范围视为已毕业
  }

  return gradeLevel > schoolYears;
}

/**
 * 获取班级的预计毕业年份
 * @param cohort 入学年份，如"2024级"
 * @param schoolYears 学制年数，默认3年
 * @returns 毕业年份，如"2027"
 */
export function getGraduationYear(cohort: string, schoolYears: number = 3): string {
  const cohortYear = parseInt(cohort.replace(/级$/, ''));
  return (cohortYear + schoolYears - 1).toString();
}

/**
 * 获取当前学年（实际应用中应从系统设置或环境变量读取）
 * @returns 当前学年，如"2024-2025"
 */
export async function getCurrentAcademicYear(): Promise<string> {
  // TODO: 从系统设置表读取当前学年
  // 临时方案：基于当前日期计算
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 0-11 -> 1-12

  // 如果是1-8月，属于上一学年的下学期
  // 如果是9-12月，属于新学年的上学期
  if (currentMonth >= 1 && currentMonth <= 8) {
    return `${currentYear - 1}-${currentYear}`;
  } else {
    return `${currentYear}-${currentYear + 1}`;
  }
}

/**
 * 验证班级入学年份格式是否合法
 * @param cohort 入学年份
 * @returns 是否合法
 */
export function isValidCohort(cohort: string): boolean {
  const pattern = /^\d{4}级$/;
  return pattern.test(cohort);
}

/**
 * 提取班级编号
 * @param className 班级名称，如"一班"、"2班"、"十二班"
 * @returns 班级编号数字
 */
export function extractClassNumber(className: string): number {
  // 中文数字映射
  const chineseNumbers: Record<string, number> = {
    '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
    '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
    '十一': 11, '十二': 12, '十三': 13, '十四': 14, '十五': 15,
    '十六': 16, '十七': 17, '十八': 18, '十九': 19, '二十': 20,
  };

  // 提取中文数字（如：一班、二班）
  const chineseMatch = className.match(/^(一|二|三|四|五|六|七|八|九|十|十一|十二|十三|十四|十五|十六|十七|十八|十九|二十)班?$/);
  if (chineseMatch) {
    return chineseNumbers[chineseMatch[1]] || 1;
  }

  // 提取阿拉伯数字（如：1班、12班）
  const numberMatch = className.match(/^(\d+)班?$/);
  if (numberMatch) {
    return parseInt(numberMatch[1]);
  }

  // 如果无法提取，返回1
  return 1;
}
