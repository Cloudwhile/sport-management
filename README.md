# 学校体测数据管理系统

> 项目启动时间: 2025-11-15
> 技术栈: Node.js + Express + PostgreSQL + Vue 3 + Vite + Tailwind CSS + Element Plus

---

## 项目结构

```
sport-management/
├── backend/                # 后端项目
│   ├── src/
│   │   ├── config/        # 配置文件
│   │   ├── controllers/   # 控制器
│   │   ├── middleware/    # 中间件
│   │   ├── models/        # 数据模型
│   │   ├── routes/        # 路由
│   │   ├── services/      # 业务逻辑
│   │   ├── utils/         # 工具函数
│   │   ├── database/      # 数据库配置
│   │   └── index.js       # 入口文件
│   ├── package.json
│   └── .env.example       # 环境变量示例
│
├── frontend/              # 前端项目
│   ├── src/
│   │   ├── api/          # API 接口
│   │   ├── assets/       # 静态资源
│   │   ├── components/   # 组件
│   │   ├── views/        # 页面
│   │   ├── router/       # 路由
│   │   ├── stores/       # 状态管理
│   │   ├── utils/        # 工具函数
│   │   ├── styles/       # 样式文件
│   │   ├── App.vue       # 根组件
│   │   └── main.js       # 入口文件
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
│
└── PROJECT_REQUIREMENTS.md  # 项目需求文档
```

---

## 快速开始

### 1. 环境要求

- Node.js >= 18.x
- PostgreSQL >= 14.x
- npm 或 yarn

### 2. 数据库配置

```bash
# 创建数据库
createdb sport_management

# 或使用 psql
psql -U postgres
CREATE DATABASE sport_management;
```

### 3. 后端启动

```bash
# 进入后端目录
cd backend

# 安装依赖
npm install

# 复制环境变量配置文件
cp .env.example .env

# 编辑 .env 文件，配置数据库连接信息
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=sport_management
# DB_USER=postgres
# DB_PASSWORD=your_password

# 启动开发服务器
npm run dev
```

后端服务将运行在 `http://localhost:3000`

### 4. 前端启动

```bash
# 进入前端目录
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端服务将运行在 `http://localhost:5173`

---

## 项目进度

### 已完成 ✅

- [x] 项目需求文档编写
- [x] 前后端项目结构初始化
- [x] 后端 Express 框架搭建
- [x] 前端 Vue 3 + Vite + Tailwind CSS 搭建
- [x] 数据库模型设计（Sequelize）
- [x] 基础路由和页面框架

### 进行中 🚧

- [ ] 数据库表结构创建与同步
- [ ] 用户认证系统（JWT）
- [ ] 基础数据管理接口（学生、班级、年级）
- [ ] 体测表单管理功能
- [ ] 数据录入功能
- [ ] 数据统计分析功能

### 待开发 📝

- [ ] 数据可视化图表
- [ ] Excel 导入导出
- [ ] 报表生成
- [ ] 权限管理优化
- [ ] 系统部署

---

## 核心功能模块

### 1. 用户角色

- **管理员**: 完整的系统管理权限
- **教师**: 查看班级数据和导出报表
- **班级账号**: 体育委员录入班级体测数据

### 2. 基础数据管理

- 学生信息管理（学籍号 + 学校学号）
- 年级班级管理
- 学生-班级关联（支持转班记录）

### 3. 体测表单机制

- 表单创建与发布
- 测试项目配置（性别差异化）
- 评分标准设置

### 4. 数据录入

- 班级账号批量录入
- Excel 批量导入
- 数据验证与校验

### 5. 数据统计分析

- 班级/年级/全校统计
- 历史趋势分析
- 数据可视化图表
- 报表导出

---

## 技术栈详情

### 后端技术

| 技术 | 版本 | 说明 |
|------|------|------|
| Node.js | 18+ | 运行环境 |
| Express | 4.x | Web 框架 |
| Sequelize | 6.x | ORM 框架 |
| PostgreSQL | 14+ | 数据库 |
| JWT | 9.x | 身份认证 |
| bcryptjs | 2.x | 密码加密 |
| xlsx | 0.18+ | Excel 处理 |

### 前端技术

| 技术 | 版本 | 说明 |
|------|------|------|
| Vue | 3.4+ | 前端框架 |
| Vite | 5.x | 构建工具 |
| Vue Router | 4.x | 路由管理 |
| Pinia | 2.x | 状态管理 |
| Element Plus | 2.5+ | UI 组件库 |
| Tailwind CSS | 3.4+ | 样式框架 |
| ECharts | 5.x | 图表库 |
| Axios | 1.6+ | HTTP 客户端 |

---

## API 接口文档

### 认证接口

- `POST /api/auth/login` - 用户登录
- `POST /api/auth/logout` - 退出登录
- `GET /api/auth/me` - 获取当前用户信息

### 学生管理

- `GET /api/students` - 获取学生列表
- `POST /api/students` - 创建学生
- `GET /api/students/:id` - 获取学生详情
- `PUT /api/students/:id` - 更新学生信息
- `DELETE /api/students/:id` - 删除学生

详细接口文档请参考 [PROJECT_REQUIREMENTS.md](./PROJECT_REQUIREMENTS.md)

---

## 数据库模型

### 核心表

- `students` - 学生表
- `grades` - 年级表
- `classes` - 班级表
- `student_class_relations` - 学生班级关系表
- `users` - 用户表
- `physical_test_forms` - 体测表单表
- `form_test_items` - 表单测试项目配置表
- `physical_test_records` - 体测数据表
- `teacher_class_relations` - 教师班级关系表

详细表结构请参考 [PROJECT_REQUIREMENTS.md](./PROJECT_REQUIREMENTS.md)

---

## 开发规范

### Git 提交规范

```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式调整
refactor: 重构
test: 测试
chore: 构建/工具链配置
```

### 代码规范

- 使用 ESLint 进行代码检查
- 使用 Prettier 进行代码格式化
- 遵循 Vue 3 Composition API 风格

---

## 常见问题

### 1. 数据库连接失败

检查 `.env` 文件中的数据库配置是否正确，确保 PostgreSQL 服务已启动。

### 2. 前端代理 API 失败

确保后端服务已启动，检查 `vite.config.js` 中的 proxy 配置。

### 3. Tailwind CSS 样式不生效

运行 `npm install` 确保所有依赖已安装，检查 `tailwind.config.js` 配置。

---

## 联系方式

- 开发团队: AptS:1547 & AptS:1548
- 项目启动时间: 2025-11-15

---

## 许可证

MIT License
