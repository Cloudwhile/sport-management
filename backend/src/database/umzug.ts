import { Umzug, SequelizeStorage } from 'umzug';
import { Sequelize, QueryInterface, DataTypes } from 'sequelize';
import sequelize from './connection.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 迁移上下文类型
export interface MigrationContext {
  queryInterface: QueryInterface;
  Sequelize: typeof Sequelize;
  DataTypes: typeof DataTypes;
  sequelize: Sequelize;
}

// 创建迁移器实例
export const migrator = new Umzug<MigrationContext>({
  migrations: {
    glob: ['migrations/*.ts', { cwd: __dirname }],
    resolve: (params) => {
      const getModule = () => import(`file://${params.path}`);
      return {
        name: params.name,
        path: params.path,
        up: async (context) => {
          const migration = await getModule();
          return migration.up(context);
        },
        down: async (context) => {
          const migration = await getModule();
          return migration.down(context);
        },
      };
    },
  },
  context: {
    queryInterface: sequelize.getQueryInterface(),
    Sequelize,
    DataTypes,
    sequelize,
  },
  storage: new SequelizeStorage({
    sequelize,
    tableName: 'sequelize_meta', // 迁移记录表名
  }),
  logger: console,
});

// 创建种子数据器实例
export const seeder = new Umzug<MigrationContext>({
  migrations: {
    glob: ['seeders/*.ts', { cwd: __dirname }],
    resolve: (params) => {
      const getModule = () => import(`file://${params.path}`);
      return {
        name: params.name,
        path: params.path,
        up: async (context) => {
          const seed = await getModule();
          return seed.up(context);
        },
        down: async (context) => {
          const seed = await getModule();
          return seed.down(context);
        },
      };
    },
  },
  context: {
    queryInterface: sequelize.getQueryInterface(),
    Sequelize,
    DataTypes,
    sequelize,
  },
  storage: new SequelizeStorage({
    sequelize,
    tableName: 'sequelize_seed_meta', // 种子数据记录表名
  }),
  logger: console,
});

// 导出类型
export type { MigrationFn } from 'umzug';
