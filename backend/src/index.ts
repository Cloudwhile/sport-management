import express, { Request, Response, NextFunction, Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import config from './config/index.js';
import { testConnection } from './database/connection.js';
import { migrator } from './database/umzug.js';

const app: Application = express();

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
  message: '请求过于频繁,请稍后再试',
});
app.use('/api/', limiter);

// 健康检查
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API 路由
app.get('/api', (req: Request, res: Response) => {
  res.json({
    message: '学校体测数据管理系统 API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// 导入并使用路由
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import gradeRoutes from './routes/grades.js';
import classRoutes from './routes/classes.js';
import studentRoutes from './routes/students.js';
import formRoutes from './routes/forms.js';
import recordRoutes from './routes/records.js';
import statisticsRoutes from './routes/statistics.js';

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/forms', formRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/statistics', statisticsRoutes);

// 404 处理
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: '接口不存在' });
});

// 错误处理
app.use((err: Error & { status?: number }, req: Request, res: Response, next: NextFunction) => {
  console.error('服务器错误:', err);
  res.status(err.status || 500).json({
    error: err.message || '服务器内部错误',
    ...(config.app.env === 'development' && { stack: err.stack }),
  });
});

// 启动服务器
const startServer = async (): Promise<void> => {
  try {
    // 测试数据库连接
    await testConnection();

    // 检查迁移状态
    const pending = await migrator.pending();
    if (pending.length > 0) {
      console.warn(`⚠️  数据库有 ${pending.length} 个待执行的迁移`);
      console.warn('   请先执行: npm run db:migrate');

      if (config.app.env === 'development') {
        console.log('   开发环境：自动执行迁移中...');
        await migrator.up();
        console.log('✅ 数据库迁移已完成');
      } else {
        console.error('❌ 生产环境不允许自动迁移，请手动执行迁移后再启动');
        process.exit(1);
      }
    } else {
      console.log('✅ 数据库迁移状态正常');
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
