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
export const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
    return false;
  }
};

// 同步数据库模型
export const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ force, alter: !force });
    console.log(`✅ 数据库同步完成 (force: ${force})`);
  } catch (error) {
    console.error('❌ 数据库同步失败:', error);
    throw error;
  }
};

export default sequelize;
