import express, { Request, Response, NextFunction, Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
// import rateLimit from 'express-rate-limit';
import config from './config/index.js';
import { testConnection } from './database/connection.js';
import { migrator } from './database/umzug.js';

const app: Application = express();

// 中间件
// 配置 helmet，允许加载静态资源
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));
app.use(cors(config.cors));
app.use(morgan(config.app.env === 'development' ? 'dev' : 'combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 限流
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15分钟
//   max: 100, // 限制100次请求
//   message: '请求过于频繁,请稍后再试',
// });
// app.use('/api/', limiter);

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

// Swagger文档
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const swaggerDocument = YAML.load(join(__dirname, 'swagger', 'openapi.yaml'));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/forms', formRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/statistics', statisticsRoutes);

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: '学校体测系统 API 文档',
}));

// 静态文件服务（前端构建文件）
import path from 'path';
// 生产环境：从 dist/frontend 读取
// 开发环境：从 ../../frontend/dist 读取
const frontendPath = config.app.env === 'production'
  ? path.join(__dirname, 'frontend')
  : path.join(__dirname, '../../frontend/dist');

app.use(express.static(frontendPath));

// SPA 路由处理：所有非 API 请求都返回 index.html
// 这样前端的 Vue Router 就可以处理路由了
app.get('*', (req: Request, res: Response): void => {
  // 如果是 API 请求但没有匹配到路由，返回 404
  if (req.path.startsWith('/api')) {
    res.status(404).json({ error: '接口不存在' });
    return;
  }
  // 其他所有请求返回前端 index.html
  res.sendFile(path.join(frontendPath, 'index.html'));
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

      // 检查是否启用自动迁移（通过环境变量 AUTO_MIGRATE）
      const autoMigrate = process.env.AUTO_MIGRATE === 'true';

      if (config.app.env === 'development' || autoMigrate) {
        console.log('   自动执行迁移中...');
        await migrator.up();
        console.log('✅ 数据库迁移已完成');

        // 如果启用了自动种子数据（通过环境变量 AUTO_SEED）
        if (process.env.AUTO_SEED === 'true') {
          console.log('   执行种子数据...');
          try {
            // 动态导入种子执行器
            const { seeder } = await import('./database/umzug.js');
            await seeder.up();
            console.log('✅ 种子数据已完成');
          } catch (error: any) {
            console.warn('⚠️  种子数据执行失败（可能已存在）:', error.message);
          }
        }
      } else {
        console.error('❌ 生产环境不允许自动迁移，请手动执行迁移后再启动');
        console.error('   或者设置环境变量 AUTO_MIGRATE=true 启用自动迁移');
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
