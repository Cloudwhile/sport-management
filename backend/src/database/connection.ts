import { Sequelize } from 'sequelize';
import config from '../config/index.js';

const sequelize = new Sequelize(
  config.database.name,
  config.database.user,
  config.database.password,
  {
    host: config.database.host,
    port: config.database.port,
    dialect: config.database.dialect,
    logging: config.database.logging,
    pool: config.database.pool,
    define: {
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

// 测试数据库连接
export const testConnection = async (): Promise<boolean> => {
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
    return false;
  }
};

/**
 * @deprecated 已废弃，请使用迁移系统代替
 * 使用 npm run db:migrate 执行迁移
 */
export const syncDatabase = async (_force: boolean = false): Promise<void> => {
  console.warn('⚠️  警告: syncDatabase 已废弃，请使用迁移系统');
  console.warn('   执行迁移: npm run db:migrate');
  console.warn('   查看状态: npm run db:migrate:status');
};

export default sequelize;
