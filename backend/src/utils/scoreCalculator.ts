/**
 * 体测成绩计算工具
 * 根据评分标准计算学生成绩
 */

interface ScoringStandard {
  ranges: Array<{
    min?: number;
    max?: number;
    score: number;
  }>;
}

/**
 * 根据评分标准计算分数
 * @param value 测试值
 * @param scoringStandard 评分标准（JSONB格式）
 * @returns 分数，如果无法计算返回null
 */
export const calculateScore = (
  value: number | null | undefined,
  scoringStandard: ScoringStandard | null | undefined
): number | null => {
  if (value == null || !scoringStandard || !scoringStandard.ranges) {
    return null;
  }

  // 遍历评分标准找到匹配的分数区间
  for (const range of scoringStandard.ranges) {
    const { min, max, score } = range;

    // 检查值是否在当前区间内
    const minMatch = min === undefined || value >= min;
    const maxMatch = max === undefined || value <= max;

    if (minMatch && maxMatch) {
      return score;
    }
  }

  // 如果没有匹配的区间，返回null
  return null;
};

/**
 * 批量计算多个测试项目的分数
 * @param testData 测试数据 { itemCode: value }
 * @param testItems 测试项目配置数组
 * @returns 计算后的分数数据 { itemCode: score }
 */
export const calculateBatchScores = (
  testData: Record<string, number>,
  testItems: Array<{
    itemCode: string;
    scoringStandard?: any;
  }>
): Record<string, number | null> => {
  const scores: Record<string, number | null> = {};

  for (const item of testItems) {
    const value = testData[item.itemCode];
    scores[item.itemCode] = calculateScore(value, item.scoringStandard);
  }

  return scores;
};

/**
 * 计算总分
 * @param scores 各项分数
 * @returns 总分
 */
export const calculateTotalScore = (
  scores: Record<string, number | null>
): number => {
  let total = 0;
  let count = 0;

  for (const score of Object.values(scores)) {
    if (score != null) {
      total += score;
      count++;
    }
  }

  // 返回平均分，如果没有有效分数返回0
  return count > 0 ? Math.round(total / count) : 0;
};
