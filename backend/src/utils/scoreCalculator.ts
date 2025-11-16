/**
 * 体测成绩计算工具
 * 根据国家标准评分规则计算学生体测成绩
 */

type Gender = 'male' | 'female';
type GradeLevel = 'excellent' | 'good' | 'pass' | 'fail';

interface ScoreRange {
  min?: number | string;
  max?: number | string;
  score: number;
}

interface ScoringStandard {
  type?: string;
  male?: Record<string, ScoreRange>;
  female?: Record<string, ScoreRange>;
  ranges?: ScoreRange[];
  [key: string]: any;
}

/**
 * 时间字符串转换为秒数
 * 支持格式：'3:24' 或 '3:24.5'
 * @param timeStr 时间字符串
 * @returns 秒数
 */
export const timeToSeconds = (timeStr: string): number => {
  const parts = timeStr.split(':');
  if (parts.length !== 2) {
    throw new Error(`无效的时间格式: ${timeStr}`);
  }

  const minutes = parseInt(parts[0], 10);
  const seconds = parseFloat(parts[1]);

  return minutes * 60 + seconds;
};

/**
 * 计算BMI值
 * @param height 身高（厘米）
 * @param weight 体重（公斤）
 * @returns BMI值，保留2位小数
 */
export const calculateBMI = (height: number, weight: number): number => {
  if (height <= 0 || weight <= 0) {
    throw new Error('身高和体重必须大于0');
  }

  const heightInMeters = height / 100;
  const bmi = weight / (heightInMeters * heightInMeters);
  return Math.round(bmi * 100) / 100;
};

/**
 * 根据评分标准计算单项分数
 * @param value 测试值（数字或时间字符串）
 * @param scoringStandard 评分标准（支持male/female分组）
 * @param gender 学生性别
 * @returns 分数，如果无法计算返回null
 */
export const calculateScore = (
  value: number | string | null | undefined,
  scoringStandard: ScoringStandard | null | undefined,
  gender: Gender
): number | null => {
  if (value == null || !scoringStandard) {
    return null;
  }

  // 获取对应性别的评分标准
  const genderStandard = scoringStandard[gender];
  if (!genderStandard) {
    // 如果没有性别特定标准，尝试使用通用的ranges
    if (!scoringStandard.ranges || !Array.isArray(scoringStandard.ranges)) {
      return null;
    }
    return matchRanges(value, scoringStandard.ranges, scoringStandard.type);
  }

  // 检查genderStandard是否是对象
  if (typeof genderStandard !== 'object') {
    return null;
  }

  // 将性别标准的对象转换为数组
  const ranges = Object.values(genderStandard);

  // 确保ranges是数组
  if (!Array.isArray(ranges) || ranges.length === 0) {
    return null;
  }

  return matchRanges(value, ranges, scoringStandard.type);
};

/**
 * 在评分区间中查找匹配的分数
 * @param value 测试值
 * @param ranges 评分区间数组
 * @param type 数据类型（time/numeric等）
 * @returns 匹配的分数或null
 */
const matchRanges = (
  value: number | string,
  ranges: ScoreRange[],
  type?: string
): number | null => {
  // 转换值的类型
  let numericValue: number;

  if (type === 'time' && typeof value === 'string') {
    // 时间类型：转换为秒数进行比较
    try {
      numericValue = timeToSeconds(value);
    } catch {
      return null;
    }
  } else if (typeof value === 'number') {
    numericValue = value;
  } else {
    // 尝试解析为数字
    numericValue = parseFloat(value as string);
    if (isNaN(numericValue)) {
      return null;
    }
  }

  // 遍历评分区间
  for (const range of ranges) {
    let { min, max, score } = range;

    // 转换min和max为数字（如果是时间字符串）
    let numericMin: number | undefined;
    let numericMax: number | undefined;

    if (min !== undefined) {
      if (type === 'time' && typeof min === 'string') {
        try {
          numericMin = timeToSeconds(min);
        } catch {
          continue;
        }
      } else {
        numericMin = typeof min === 'number' ? min : parseFloat(min as string);
      }
    }

    if (max !== undefined) {
      if (type === 'time' && typeof max === 'string') {
        try {
          numericMax = timeToSeconds(max);
        } catch {
          continue;
        }
      } else {
        numericMax = typeof max === 'number' ? max : parseFloat(max as string);
      }
    }

    // 检查值是否在区间内
    const minMatch = numericMin === undefined || numericValue >= numericMin;
    const maxMatch = numericMax === undefined || numericValue <= numericMax;

    if (minMatch && maxMatch) {
      return score;
    }
  }

  return null;
};

/**
 * 批量计算多个测试项目的分数
 * @param testData 测试数据 { itemCode: value }
 * @param testItems 测试项目配置数组
 * @param gender 学生性别
 * @returns 计算后的分数数据 { itemCode: score }
 */
export const calculateBatchScores = (
  testData: Record<string, number | string>,
  testItems: Array<{
    itemCode: string;
    itemName?: string;
    scoringStandard?: any;
  }>,
  gender: Gender
): Record<string, number | null> => {
  const scores: Record<string, number | null> = {};

  for (const item of testItems) {
    const value = testData[item.itemCode];

    try {
      scores[item.itemCode] = calculateScore(value, item.scoringStandard, gender);
    } catch (error) {
      console.error(`计算 ${item.itemName || item.itemCode} 分数失败:`, error);
      console.error('评分标准:', JSON.stringify(item.scoringStandard, null, 2));
      console.error('测试值:', value);
      scores[item.itemCode] = null;
    }
  }

  return scores;
};

/**
 * 计算加权总分
 * @param scores 各项分数 { itemCode: score }
 * @param testItems 测试项目配置数组（包含权重信息）
 * @returns 加权总分（保留2位小数）
 */
export const calculateTotalScore = (
  scores: Record<string, number | null>,
  testItems: Array<{
    itemCode: string;
    weight?: number; // 权重（百分比）
  }>
): number => {
  let weightedSum = 0;
  let totalWeight = 0;

  for (const item of testItems) {
    const score = scores[item.itemCode];
    const weight = item.weight || 0;

    // 只计算有效分数和有权重的项目
    if (score != null && weight > 0) {
      weightedSum += score * weight;
      totalWeight += weight;
    }
  }

  // 如果没有有效分数，返回0
  if (totalWeight === 0) {
    return 0;
  }

  // 加权平均分：(各项分数 × 权重) / 总权重
  const totalScore = weightedSum / totalWeight;

  // 保留2位小数
  return Math.round(totalScore * 100) / 100;
};

/**
 * 根据总分计算等级
 * 国家标准四级制：
 * - excellent（优秀）：≥90分
 * - good（良好）：80-89分
 * - pass（及格）：60-79分
 * - fail（不及格）：<60分
 *
 * @param totalScore 总分
 * @returns 等级
 */
export const calculateGradeLevel = (totalScore: number): GradeLevel => {
  if (totalScore >= 90) {
    return 'excellent';
  } else if (totalScore >= 80) {
    return 'good';
  } else if (totalScore >= 60) {
    return 'pass';
  } else {
    return 'fail';
  }
};
