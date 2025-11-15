# 学校体测数据管理系统 - 项目需求文档

> 项目启动时间: 2025-11-15
> 合作方: 学校
> 开发团队: AptS:1547 & AptS:1548

---

## 一、项目概述

学校体测数据管理系统，采用**表单发布机制**管理学生体质测试数据，支持按班级录入、数据统计分析和历史趋势对比。

**核心特点**：
- 灵活的表单发布机制（一年一次体测，按表单发布）
- 性别差异化测试项目支持
- 学生转班历史记录管理
- 多维度数据分析与可视化

---

## 二、技术栈选型

### 后端技术栈
- **运行环境**: Node.js
- **Web框架**: Express
- **数据库**: PostgreSQL
- **ORM框架**: Sequelize / Prisma
- **身份认证**: JWT (JSON Web Token)
- **文件处理**: xlsx / exceljs
- **代码规范**: ESLint + Prettier

### 前端技术栈
- **框架**: Vue 3
- **构建工具**: Vite
- **UI组件库**: Element Plus
- **图表库**: ECharts
- **状态管理**: Pinia
- **路由管理**: Vue Router
- **HTTP客户端**: Axios

### 部署环境
- **服务器**: 本地服务器（学校内网）
- **操作系统**: Linux (Ubuntu Server / CentOS)
- **Web服务器**: Nginx（反向代理）
- **进程管理**: PM2
- **备份策略**: 数据库定时备份

---

## 三、用户角色与权限

### 1. 管理员 (Admin)
- ✅ 用户管理（创建/编辑教师账号）
- ✅ 年级班级管理
- ✅ 学生信息管理
- ✅ 体测表单创建与发布
- ✅ 配置测试项目和评分标准
- ✅ 全局数据查看和导出
- ✅ 系统配置管理

### 2. 教师 (Teacher)
- ✅ 查看所管理班级信息
- ✅ 查看班级体测数据
- ✅ 导出班级报表

### 3. 班级账号 (Class Account - 体育委员使用)
- ✅ 登录班级账号
- ✅ 填报本班学生体测数据
- ✅ 查看本班已提交数据

---

## 四、核心功能模块

### 1. 基础数据管理

#### 1.1 年级管理
- 年级信息维护（一年级、二年级...）
- 年级级别设置（1, 2, 3...）

#### 1.2 班级管理
- 班级信息维护（年级 + 班级名称）
- 班级账号管理（用于体育委员登录）
- 班级-学年关联
- 教师-班级关联

#### 1.3 学生管理
**学生基本信息**：
- 学籍号（student_id_national）：全国统一学籍编号，永久不变
- 学校学号（student_id_school）：学校内部编号，基本不变，用于日常管理和未来学生登录
- 姓名、性别、出生日期
- 身份证号、联系电话（可选）

**学生-班级关系管理**：
- 支持学生转班记录
- 按学年维护学生所属班级
- 历史班级归属查询

#### 1.4 用户管理
- 管理员账号管理
- 教师账号管理
- 教师-班级权限分配

---

### 2. 体测表单机制 ⭐ 核心创新

#### 2.1 表单创建流程
1. **创建表单基本信息**
   - 表单名称（如：2024年秋季体测）
   - 学年（2024-2025）
   - 测试日期
   - 填报时间范围（开始时间 - 结束时间）
   - 表单说明

2. **配置测试项目**
   - 选择默认国标项目或自定义项目
   - 设置项目是否必填
   - 配置项目排序
   - 设置性别限制（通用/仅男生/仅女生）

3. **设置评分标准**
   - 每个项目可独立配置评分标准
   - 支持男女不同标准
   - 分级设置：优秀(90-100)、良好(80-89)、及格(60-79)、不及格(0-59)

4. **发布表单**
   - 草稿状态 → 发布状态
   - 全校统一发布
   - 可设置截止时间

#### 2.2 国标体测项目配置

**通用项目**（男女都测，评分标准不同）：
| 项目代码 | 项目名称 | 单位 | 性别限制 |
|---------|---------|------|---------|
| height | 身高 | cm | null |
| weight | 体重 | kg | null |
| bmi | BMI | - | null（自动计算） |
| lung_capacity | 肺活量 | ml | null |
| sprint_50m | 50米跑 | 秒 | null |
| standing_jump | 立定跳远 | cm | null |
| sit_reach | 坐位体前屈 | cm | null |

**性别专属项目**：
| 项目代码 | 项目名称 | 单位 | 性别限制 |
|---------|---------|------|---------|
| situp_1min | 1分钟仰卧起坐 | 次 | female |
| run_800m | 800米跑 | 秒 | female |
| pullup | 引体向上 | 次 | male |
| run_1000m | 1000米跑 | 秒 | male |

#### 2.3 评分标准 JSON 格式示例
```json
{
  "male": {
    "excellent": {"min": 90, "max": 100, "condition": ">=10"},
    "good": {"min": 80, "max": 89, "condition": ">=8"},
    "pass": {"min": 60, "max": 79, "condition": ">=5"},
    "fail": {"min": 0, "max": 59, "condition": "<5"}
  },
  "female": {
    "excellent": {"min": 90, "max": 100, "condition": ">=50"},
    "good": {"min": 80, "max": 89, "condition": ">=45"},
    "pass": {"min": 60, "max": 79, "condition": ">=35"},
    "fail": {"min": 0, "max": 59, "condition": "<35"}
  }
}
```

---

### 3. 数据录入

#### 3.1 班级账号批量录入 ⭐ 主要方式
**流程**：
1. 体育委员使用班级账号登录
2. 选择已发布的体测表单
3. 系统显示本班学生列表
4. 逐个学生录入数据
5. 系统根据学生性别自动显示对应测试项目
6. 实时计算分数和等级
7. 支持保存草稿和正式提交

**前端逻辑**：
```javascript
// 根据学生性别过滤显示的测试项目
const availableItems = formItems.filter(item => {
  if (item.gender_limit === null) return true; // 通用项目
  return item.gender_limit === student.gender; // 性别匹配
});
```

#### 3.2 Excel 批量导入（可选功能）
- 下载标准模板（根据表单配置生成）
- Excel 批量导入数据
- 数据格式校验和合理性检查

#### 3.3 数据验证规则
- ✅ 性别与测试项目匹配验证（男生不能填仰卧起坐等）
- ✅ 数据合理性检查（身高范围、体重范围等）
- ✅ 必填项检查
- ✅ 重复提交检查（一个学生一个表单只能提交一次）

---

### 4. 数据统计分析

#### 4.1 基础统计
- **班级统计**：及格率、优秀率、平均分、各项目平均值
- **年级统计**：年级整体数据概览
- **全校统计**：全校数据汇总

#### 4.2 历史趋势分析
- **学生个人**：某学生多次体测数据对比（折线图）
- **班级历史**：某班级历年数据趋势
- **年级历史**：某年级历年数据趋势
- **年级/班级对比**：同一表单不同班级横向对比

#### 4.3 数据可视化
- **柱状图**：班级对比、项目分布、成绩分布
- **折线图**：历史趋势、个人成长曲线
- **雷达图**：学生综合素质评估
- **饼图**：等级分布（优秀/良好/及格/不及格比例）

---

### 5. 报表导出
- **Excel 格式**：学生明细表、班级统计表、年级汇总表
- **PDF 格式**：分析报告、学生个人报告单
- **导出维度**：按表单、按班级、按年级、按学生

---

## 五、数据库设计

### 5.1 核心表结构

#### 1. students（学生表）
```sql
CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  student_id_national VARCHAR(50) UNIQUE NOT NULL COMMENT '学籍号（全国统一）',
  student_id_school VARCHAR(50) UNIQUE NOT NULL COMMENT '学校学号',
  name VARCHAR(100) NOT NULL COMMENT '姓名',
  gender VARCHAR(10) NOT NULL COMMENT '性别：male/female',
  birth_date DATE COMMENT '出生日期',
  id_card_number VARCHAR(18) UNIQUE COMMENT '身份证号',
  phone VARCHAR(20) COMMENT '联系电话',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. grades（年级表）
```sql
CREATE TABLE grades (
  id SERIAL PRIMARY KEY,
  grade_name VARCHAR(50) NOT NULL COMMENT '年级名称：一年级、二年级',
  grade_level INT NOT NULL COMMENT '年级数字：1, 2, 3',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 3. classes（班级表）
```sql
CREATE TABLE classes (
  id SERIAL PRIMARY KEY,
  grade_id INT NOT NULL REFERENCES grades(id),
  class_name VARCHAR(50) NOT NULL COMMENT '班级名称：一班、二班',
  academic_year VARCHAR(20) NOT NULL COMMENT '学年：2024-2025',
  class_account VARCHAR(50) UNIQUE COMMENT '班级账号',
  class_password VARCHAR(255) COMMENT '班级密码哈希',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 4. student_class_relations（学生班级关系表）⭐
```sql
CREATE TABLE student_class_relations (
  id SERIAL PRIMARY KEY,
  student_id INT NOT NULL REFERENCES students(id),
  class_id INT NOT NULL REFERENCES classes(id),
  academic_year VARCHAR(20) NOT NULL COMMENT '学年',
  is_active BOOLEAN DEFAULT true COMMENT '是否当前班级',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, academic_year) -- 一个学生一个学年只能在一个班级
);
```

#### 5. physical_test_forms（体测表单表）⭐
```sql
CREATE TABLE physical_test_forms (
  id SERIAL PRIMARY KEY,
  form_name VARCHAR(200) NOT NULL COMMENT '表单名称',
  academic_year VARCHAR(20) NOT NULL COMMENT '学年',
  test_date DATE COMMENT '测试日期',
  start_time TIMESTAMP COMMENT '开始填报时间',
  end_time TIMESTAMP COMMENT '结束填报时间',
  status VARCHAR(20) DEFAULT 'draft' COMMENT '状态：draft/published/closed',
  description TEXT COMMENT '说明',
  created_by INT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 6. form_test_items（表单测试项目配置表）⭐
```sql
CREATE TABLE form_test_items (
  id SERIAL PRIMARY KEY,
  form_id INT NOT NULL REFERENCES physical_test_forms(id),
  item_code VARCHAR(50) NOT NULL COMMENT '项目代码',
  item_name VARCHAR(100) NOT NULL COMMENT '项目名称',
  item_unit VARCHAR(20) COMMENT '单位',
  gender_limit VARCHAR(10) COMMENT '性别限制：null/male/female',
  is_required BOOLEAN DEFAULT true COMMENT '是否必填',
  sort_order INT DEFAULT 0 COMMENT '排序',
  scoring_standard JSONB COMMENT '评分标准',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 7. physical_test_records（体测数据表）⭐
```sql
CREATE TABLE physical_test_records (
  id SERIAL PRIMARY KEY,
  form_id INT NOT NULL REFERENCES physical_test_forms(id),
  student_id INT NOT NULL REFERENCES students(id),
  class_id INT NOT NULL REFERENCES classes(id) COMMENT '冗余字段，方便查询',
  test_data JSONB NOT NULL COMMENT '测试数据JSON',
  total_score DECIMAL(5,2) COMMENT '总分',
  grade_level VARCHAR(20) COMMENT '等级：优秀/良好/及格/不及格',
  submitted_by VARCHAR(100) COMMENT '提交人',
  submitted_at TIMESTAMP COMMENT '提交时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(form_id, student_id) -- 一个学生一个表单只能提交一次
);
```

**test_data JSON 格式示例**：
```json
{
  "height": {"value": 165, "score": 0},
  "weight": {"value": 55, "score": 0},
  "bmi": {"value": 20.2, "score": 0},
  "lung_capacity": {"value": 3200, "score": 85},
  "sprint_50m": {"value": 8.5, "score": 90},
  "standing_jump": {"value": 2.1, "score": 88},
  "sit_reach": {"value": 15.5, "score": 82},
  "situp_1min": {"value": 48, "score": 88}
}
```

#### 8. users（用户表）
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL COMMENT '密码哈希',
  role VARCHAR(20) NOT NULL COMMENT '角色：admin/teacher',
  real_name VARCHAR(100) COMMENT '真实姓名',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 9. teacher_class_relations（教师班级关系表）
```sql
CREATE TABLE teacher_class_relations (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id),
  class_id INT NOT NULL REFERENCES classes(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 10. settings（系统设置表）
```sql
CREATE TABLE settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB COMMENT '配置值',
  description TEXT COMMENT '说明',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 六、关键业务流程

### 流程1：管理员发布体测表单
```
1. 登录管理员账号
2. 进入"体测表单管理"
3. 点击"创建新表单"
4. 填写表单基本信息
   - 表单名称：2024年秋季体测
   - 学年：2024-2025
   - 测试日期：2024-10-15
   - 填报时间：2024-10-15 ~ 2024-10-30
5. 配置测试项目
   - 选择默认国标项目（可调整）
   - 设置性别限制
   - 配置评分标准
6. 预览表单
7. 发布表单（状态：draft → published）
```

### 流程2：班级体育委员填报数据
```
1. 使用班级账号登录（如：class_2024_1_1）
2. 查看"待填报表单"列表
3. 选择表单：2024年秋季体测
4. 进入填报页面
   - 左侧：本班学生列表（姓名、学号、性别）
   - 右侧：体测数据录入表单
5. 选择学生：张三（男）
6. 系统自动显示该学生应填项目：
   - 通用项目：身高、体重、肺活量、50米跑...
   - 男生项目：引体向上、1000米跑
7. 逐项录入数据
8. 系统实时计算分数和等级
9. 保存数据（可多次修改）
10. 继续录入下一个学生
11. 全班录入完成后提交
```

### 流程3：数据查询与统计
```
1. 管理员/教师登录
2. 进入"数据统计"模块
3. 选择查询维度：

   方式A - 按表单查询：
   - 选择表单：2024年秋季体测
   - 选择范围：全校/某年级/某班级
   - 查看统计数据和图表

   方式B - 按学生查询：
   - 输入学生学号或姓名
   - 查看该学生历次体测记录
   - 生成个人成长曲线

   方式C - 按班级查询：
   - 选择班级
   - 查看班级历次体测对比
   - 生成班级趋势图

4. 导出报表（Excel/PDF）
```

---

## 七、典型查询场景 SQL 示例

### 场景1：查询某次体测某班级的数据
```sql
SELECT
  s.student_id_school,
  s.name,
  s.gender,
  ptr.test_data,
  ptr.total_score,
  ptr.grade_level
FROM physical_test_records ptr
JOIN students s ON ptr.student_id = s.id
WHERE ptr.form_id = ?
  AND ptr.class_id = ?
ORDER BY s.student_id_school;
```

### 场景2：查询某个学生的历史体测趋势
```sql
SELECT
  ptf.form_name,
  ptf.academic_year,
  ptf.test_date,
  ptr.test_data,
  ptr.total_score,
  ptr.grade_level
FROM physical_test_records ptr
JOIN physical_test_forms ptf ON ptr.form_id = ptf.id
WHERE ptr.student_id = ?
ORDER BY ptf.test_date;
```

### 场景3：查询某个学生某学年所在班级
```sql
SELECT
  c.class_name,
  g.grade_name
FROM student_class_relations scr
JOIN classes c ON scr.class_id = c.id
JOIN grades g ON c.grade_id = g.id
WHERE scr.student_id = ?
  AND scr.academic_year = ?;
```

### 场景4：统计某表单某班级的及格率
```sql
SELECT
  COUNT(*) as total_count,
  SUM(CASE WHEN total_score >= 60 THEN 1 ELSE 0 END) as pass_count,
  ROUND(SUM(CASE WHEN total_score >= 60 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as pass_rate
FROM physical_test_records
WHERE form_id = ?
  AND class_id = ?;
```

---

## 八、API 接口设计概要

### 8.1 认证接口
- `POST /api/auth/login` - 用户登录（管理员/教师/班级账号）
- `POST /api/auth/logout` - 退出登录
- `GET /api/auth/me` - 获取当前用户信息

### 8.2 学生管理
- `GET /api/students` - 获取学生列表
- `POST /api/students` - 创建学生
- `GET /api/students/:id` - 获取学生详情
- `PUT /api/students/:id` - 更新学生信息
- `DELETE /api/students/:id` - 删除学生
- `POST /api/students/import` - Excel 批量导入学生

### 8.3 班级管理
- `GET /api/classes` - 获取班级列表
- `POST /api/classes` - 创建班级
- `PUT /api/classes/:id` - 更新班级信息
- `DELETE /api/classes/:id` - 删除班级
- `POST /api/classes/:id/students` - 添加学生到班级
- `DELETE /api/classes/:id/students/:studentId` - 从班级移除学生

### 8.4 体测表单
- `GET /api/forms` - 获取表单列表
- `POST /api/forms` - 创建表单
- `GET /api/forms/:id` - 获取表单详情
- `PUT /api/forms/:id` - 更新表单
- `POST /api/forms/:id/publish` - 发布表单
- `POST /api/forms/:id/close` - 关闭表单
- `GET /api/forms/:id/items` - 获取表单测试项目

### 8.5 数据录入
- `GET /api/forms/:formId/records/class/:classId` - 获取某班级填报情况
- `POST /api/records` - 提交体测数据
- `PUT /api/records/:id` - 更新体测数据
- `GET /api/records/:id` - 获取单条记录详情

### 8.6 数据统计
- `GET /api/statistics/form/:formId` - 某表单全局统计
- `GET /api/statistics/form/:formId/class/:classId` - 某表单某班级统计
- `GET /api/statistics/student/:studentId` - 学生历史数据
- `GET /api/statistics/class/:classId/history` - 班级历史趋势

### 8.7 报表导出
- `GET /api/export/form/:formId/excel` - 导出表单数据 Excel
- `GET /api/export/class/:classId/excel` - 导出班级数据 Excel
- `GET /api/export/student/:studentId/pdf` - 导出学生报告 PDF

---

## 九、前端页面结构

### 管理员端
```
├── 登录页
├── 首页（数据概览）
├── 用户管理
│   ├── 管理员管理
│   └── 教师管理
├── 基础数据
│   ├── 年级管理
│   ├── 班级管理
│   └── 学生管理
├── 体测表单
│   ├── 表单列表
│   ├── 创建表单
│   └── 表单详情
├── 数据统计
│   ├── 表单统计
│   ├── 班级统计
│   ├── 年级统计
│   └── 学生查询
└── 系统设置
```

### 教师端
```
├── 登录页
├── 首页
├── 我的班级
├── 班级数据
└── 数据导出
```

### 班级账号端
```
├── 登录页
├── 待填报表单
├── 数据录入
└── 已提交记录
```

---

## 十、开发计划

### 阶段一：基础框架搭建（1-2周）
- [ ] 项目初始化（前后端目录结构）
- [ ] 数据库设计与建表
- [ ] 后端基础架构（Express + Sequelize）
- [ ] 前端基础架构（Vue 3 + Vite + Element Plus）
- [ ] 用户认证系统（JWT）
- [ ] 基础 CRUD 接口

### 阶段二：核心功能开发（2-3周）
- [ ] 学生管理模块
- [ ] 班级管理模块
- [ ] 年级管理模块
- [ ] 体测表单创建与配置
- [ ] 测试项目管理
- [ ] 数据录入功能（班级账号）
- [ ] Excel 导入导出

### 阶段三：数据分析模块（2周）
- [ ] 统计分析接口
- [ ] 数据可视化图表（ECharts）
- [ ] 历史趋势对比
- [ ] 报表生成与导出

### 阶段四：测试与优化（1周）
- [ ] 功能测试
- [ ] 性能优化
- [ ] 安全加固
- [ ] 部署上线
- [ ] 用户培训

---

## 十一、待确认问题

1. ❓ 是否需要学生个人账号查看自己的数据？
2. ❓ 是否需要生成学生体测证书/报告单？
3. ❓ 数据保留年限要求？
4. ❓ 是否需要与上级教育系统对接？
5. ❓ 是否需要移动端支持（微信小程序等）？

---

## 十二、注意事项

### 数据安全
- 学生身份证号等敏感信息需加密存储
- 实施访问控制和权限校验
- 定期数据备份
- 操作日志记录

### 性能优化
- 数据库索引优化
- 大量数据分页加载
- 图表数据缓存
- 静态资源 CDN

### 用户体验
- 响应式设计（兼容不同屏幕）
- 友好的错误提示
- 操作引导和帮助文档
- 数据自动保存（防止丢失）

---

## 附录

### 参考文档
- 国家学生体质健康标准（2014年修订）
- Vue 3 官方文档：https://vuejs.org/
- Express 官方文档：https://expressjs.com/
- Element Plus 官方文档：https://element-plus.org/
- ECharts 官方文档：https://echarts.apache.org/

---

**文档版本**: v1.0
**最后更新**: 2025-11-15
**维护人员**: AptS:1547 & AptS:1548
