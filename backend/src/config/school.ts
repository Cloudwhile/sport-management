/**
 * 学校配置
 * 包含学制、毕业日期等全局配置
 */

export interface SchoolConfig {
  // 学制年限（默认3年）
  schoolYears: number;

  // 毕业月份（1-12，默认8表示8月）
  graduationMonth: number;

  // 毕业日期（1-31，默认1表示1号）
  graduationDay: number;
}

// 默认配置
const defaultConfig: SchoolConfig = {
  schoolYears: 3,      // 三年制
  graduationMonth: 8,  // 8月
  graduationDay: 1,    // 1号
};

// 从环境变量读取配置（可选）
export const schoolConfig: SchoolConfig = {
  schoolYears: parseInt(process.env.SCHOOL_YEARS || String(defaultConfig.schoolYears)),
  graduationMonth: parseInt(process.env.GRADUATION_MONTH || String(defaultConfig.graduationMonth)),
  graduationDay: parseInt(process.env.GRADUATION_DAY || String(defaultConfig.graduationDay)),
};

/**
 * 获取学校配置
 */
export function getSchoolConfig(): SchoolConfig {
  return schoolConfig;
}
