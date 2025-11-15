/**
 * 默认国标体测项目配置
 */

export interface DefaultTestItem {
  itemCode: string;
  itemName: string;
  itemUnit?: string;
  genderLimit?: 'male' | 'female' | null;
  isRequired: boolean;
  sortOrder: number;
  scoringStandard?: Record<string, unknown>;
}

/**
 * 国标体测项目列表
 * 通用项目：身高、体重、BMI、肺活量、50米跑、立定跳远、坐位体前屈
 * 女生专属：仰卧起坐、800米跑
 * 男生专属：引体向上、1000米跑
 */
export const defaultTestItems: DefaultTestItem[] = [
  {
    itemCode: 'height',
    itemName: '身高',
    itemUnit: 'cm',
    genderLimit: null,
    isRequired: true,
    sortOrder: 1,
    scoringStandard: {
      description: '身高测量值',
      type: 'numeric',
    },
  },
  {
    itemCode: 'weight',
    itemName: '体重',
    itemUnit: 'kg',
    genderLimit: null,
    isRequired: true,
    sortOrder: 2,
    scoringStandard: {
      description: '体重测量值',
      type: 'numeric',
    },
  },
  {
    itemCode: 'bmi',
    itemName: 'BMI',
    itemUnit: '',
    genderLimit: null,
    isRequired: true,
    sortOrder: 3,
    scoringStandard: {
      description: 'BMI自动计算: 体重(kg) / 身高²(m)',
      type: 'calculated',
      formula: 'weight / (height/100)²',
      ranges: {
        underweight: { max: 18.5, score: 60 },
        normal: { min: 18.5, max: 23.9, score: 100 },
        overweight: { min: 24, max: 27.9, score: 80 },
        obese: { min: 28, score: 60 },
      },
    },
  },
  {
    itemCode: 'lung_capacity',
    itemName: '肺活量',
    itemUnit: 'ml',
    genderLimit: null,
    isRequired: true,
    sortOrder: 4,
    scoringStandard: {
      description: '肺活量测量值',
      type: 'numeric',
      male: {
        excellent: { min: 4800, score: 100 },
        good: { min: 4300, max: 4799, score: 85 },
        pass: { min: 3100, max: 4299, score: 60 },
        fail: { max: 3099, score: 50 },
      },
      female: {
        excellent: { min: 3400, score: 100 },
        good: { min: 3000, max: 3399, score: 85 },
        pass: { min: 2000, max: 2999, score: 60 },
        fail: { max: 1999, score: 50 },
      },
    },
  },
  {
    itemCode: 'sprint_50m',
    itemName: '50米跑',
    itemUnit: '秒',
    genderLimit: null,
    isRequired: true,
    sortOrder: 5,
    scoringStandard: {
      description: '50米跑成绩(秒)',
      type: 'numeric',
      note: '成绩越小越好',
      male: {
        excellent: { max: 7.0, score: 100 },
        good: { min: 7.1, max: 7.5, score: 85 },
        pass: { min: 7.6, max: 9.1, score: 60 },
        fail: { min: 9.2, score: 50 },
      },
      female: {
        excellent: { max: 7.5, score: 100 },
        good: { min: 7.6, max: 8.3, score: 85 },
        pass: { min: 8.4, max: 10.3, score: 60 },
        fail: { min: 10.4, score: 50 },
      },
    },
  },
  {
    itemCode: 'standing_jump',
    itemName: '立定跳远',
    itemUnit: 'cm',
    genderLimit: null,
    isRequired: true,
    sortOrder: 6,
    scoringStandard: {
      description: '立定跳远距离',
      type: 'numeric',
      male: {
        excellent: { min: 250, score: 100 },
        good: { min: 225, max: 249, score: 85 },
        pass: { min: 185, max: 224, score: 60 },
        fail: { max: 184, score: 50 },
      },
      female: {
        excellent: { min: 202, score: 100 },
        good: { min: 181, max: 201, score: 85 },
        pass: { min: 146, max: 180, score: 60 },
        fail: { max: 145, score: 50 },
      },
    },
  },
  {
    itemCode: 'sit_reach',
    itemName: '坐位体前屈',
    itemUnit: 'cm',
    genderLimit: null,
    isRequired: true,
    sortOrder: 7,
    scoringStandard: {
      description: '坐位体前屈距离',
      type: 'numeric',
      male: {
        excellent: { min: 21.6, score: 100 },
        good: { min: 17.7, max: 21.5, score: 85 },
        pass: { min: 3.7, max: 17.6, score: 60 },
        fail: { max: 3.6, score: 50 },
      },
      female: {
        excellent: { min: 23.5, score: 100 },
        good: { min: 19.5, max: 23.4, score: 85 },
        pass: { min: 6.0, max: 19.4, score: 60 },
        fail: { max: 5.9, score: 50 },
      },
    },
  },
  {
    itemCode: 'situp_1min',
    itemName: '仰卧起坐(1分钟)',
    itemUnit: '次',
    genderLimit: 'female',
    isRequired: true,
    sortOrder: 8,
    scoringStandard: {
      description: '仰卧起坐1分钟次数(仅女生)',
      type: 'numeric',
      female: {
        excellent: { min: 54, score: 100 },
        good: { min: 48, max: 53, score: 85 },
        pass: { min: 26, max: 47, score: 60 },
        fail: { max: 25, score: 50 },
      },
    },
  },
  {
    itemCode: 'pullup',
    itemName: '引体向上',
    itemUnit: '次',
    genderLimit: 'male',
    isRequired: true,
    sortOrder: 9,
    scoringStandard: {
      description: '引体向上次数(仅男生)',
      type: 'numeric',
      male: {
        excellent: { min: 15, score: 100 },
        good: { min: 12, max: 14, score: 85 },
        pass: { min: 4, max: 11, score: 60 },
        fail: { max: 3, score: 50 },
      },
    },
  },
  {
    itemCode: 'run_800m',
    itemName: '800米跑',
    itemUnit: '分秒',
    genderLimit: 'female',
    isRequired: true,
    sortOrder: 10,
    scoringStandard: {
      description: '800米跑成绩(仅女生)',
      type: 'time',
      note: '成绩越小越好',
      female: {
        excellent: { max: '3:24', score: 100 },
        good: { min: '3:25', max: '3:42', score: 85 },
        pass: { min: '3:43', max: '4:34', score: 60 },
        fail: { min: '4:35', score: 50 },
      },
    },
  },
  {
    itemCode: 'run_1000m',
    itemName: '1000米跑',
    itemUnit: '分秒',
    genderLimit: 'male',
    isRequired: true,
    sortOrder: 11,
    scoringStandard: {
      description: '1000米跑成绩(仅男生)',
      type: 'time',
      note: '成绩越小越好',
      male: {
        excellent: { max: '3:27', score: 100 },
        good: { min: '3:28', max: '3:44', score: 85 },
        pass: { min: '3:45', max: '4:38', score: 60 },
        fail: { min: '4:39', score: 50 },
      },
    },
  },
];
