/**
 * 年级(cohort)相关工具函数
 */

/**
 * 获取年级显示名称
 * @param cohort 入学年份, 如 "2022"
 * @returns 显示名称, 如 "2022级"
 */
export function getCohortDisplay(cohort: string): string {
  return `${cohort}级`;
}

/**
 * 获取多个年级的显示名称
 * @param cohorts 入学年份数组, 如 ["2022", "2023", "2024"]
 * @returns 显示名称, 如 "2022级、2023级、2024级"
 */
export function getCohortsDisplay(cohorts: string[]): string {
  return cohorts.map(c => `${c}级`).join('、');
}

/**
 * 验证班级是否可以参与指定表单
 * @param classCohort 班级的入学年份
 * @param formCohorts 表单允许的入学年份数组
 * @returns 是否可以参与
 */
export function canClassParticipate(classCohort: string, formCohorts: string[]): boolean {
  return formCohorts.includes(classCohort);
}

/**
 * 验证 participatingCohorts 参数的合法性
 * @param cohorts 年级数组
 * @returns 错误信息,如果合法则返回 null
 */
export function validateCohorts(cohorts: unknown): string | null {
  if (!cohorts) {
    return '必须选择参与的年级';
  }

  if (!Array.isArray(cohorts)) {
    return '年级参数格式不正确';
  }

  if (cohorts.length === 0) {
    return '必须至少选择一个年级';
  }

  for (const cohort of cohorts) {
    if (typeof cohort !== 'string') {
      return '年级参数格式不正确';
    }
    // 验证格式: 4位数字
    if (!/^\d{4}$/.test(cohort)) {
      return `年级格式不正确: ${cohort}, 应为4位数字,如 "2022"`;
    }
  }

  return null;
}
