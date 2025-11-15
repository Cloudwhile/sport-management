import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import config from './config/index.js';
import { testConnection, syncDatabase } from './database/connection.js';

const app = express();

// 中间件
app.use(helmet());
app.use(cors(config.cors));
app.use(morgan(config.app.env === 'development' ? 'dev' : 'combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 限流
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制100次请求
  message: '请求过于频繁，请稍后再试',
});
app.use('/api/', limiter);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API 路由
app.get('/api', (req, res) => {
  res.json({
    message: '学校体测数据管理系统 API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// 导入并使用路由
import authRoutes from './routes/auth.js';
import gradeRoutes from './routes/grades.js';
import classRoutes from './routes/classes.js';
import studentRoutes from './routes/students.js';

app.use('/api/auth', authRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/students', studentRoutes);

// 404 处理
app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(err.status || 500).json({
    error: err.message || '服务器内部错误',
    ...(config.app.env === 'development' && { stack: err.stack }),
  });
});

// 启动服务器
const startServer = async () => {
  try {
    // 测试数据库连接
    await testConnection();

    // 同步数据库（开发环境）
    if (config.app.env === 'development') {
      await syncDatabase(false);
    }

    // 启动服务器
    app.listen(config.app.port, config.app.host, () => {
      console.log(`🚀 服务器启动成功: http://${config.app.host}:${config.app.port}`);
      console.log(`📝 环境: ${config.app.env}`);
    });
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
};

startServer();

export default app;
