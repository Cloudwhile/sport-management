import { Umzug, SequelizeStorage, type MigrationFn } from 'umzug';
import { Sequelize, QueryInterface, DataTypes } from 'sequelize';
import sequelize from './connection.js';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath, pathToFileURL } from 'url';

const getRuntimeDirname = () => {
  if (typeof __dirname === 'string') return __dirname;
  return path.dirname(fileURLToPath(import.meta.url));
};
const __runtimeDirname = getRuntimeDirname();
const isPackagedExecutable = Boolean((process as NodeJS.Process & { pkg?: unknown }).pkg);
const isBundledPkgEntry = path.basename(__runtimeDirname) === 'dist-pkg';
const databaseDir = isPackagedExecutable || isBundledPkgEntry
  ? path.join(__runtimeDirname, 'database')
  : __runtimeDirname;
const migrationExtension = isPackagedExecutable || isBundledPkgEntry
  ? '.js'
  : path.extname(databaseDir.includes('\\dist\\') || databaseDir.includes('/dist/') ? 'index.js' : 'index.ts');
const shouldRequireMigrationFiles = isPackagedExecutable || isBundledPkgEntry;
const requireMigrationFile = createRequire(
  typeof __filename === 'string' ? __filename : import.meta.url,
);

// 迁移上下文类型
export interface MigrationContext {
  queryInterface: QueryInterface;
  Sequelize: typeof Sequelize;
  DataTypes: typeof DataTypes;
  sequelize: Sequelize;
}

type MigrationModule = {
  up: MigrationFn<MigrationContext>;
  down?: MigrationFn<MigrationContext>;
};

const loadMigrationModule = async (filePath: string): Promise<MigrationModule> => {
  if (shouldRequireMigrationFiles) {
    return requireMigrationFile(filePath) as MigrationModule;
  }

  return import(pathToFileURL(filePath).href) as Promise<MigrationModule>;
};

// 创建迁移器实例
export const migrator = new Umzug<MigrationContext>({
  migrations: {
    glob: [`migrations/*${migrationExtension}`, { cwd: databaseDir }],
    resolve: (params) => {
      const getModule = () => loadMigrationModule(params.path!);
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
    glob: [`seeders/*${migrationExtension}`, { cwd: databaseDir }],
    resolve: (params) => {
      const getModule = () => loadMigrationModule(params.path!);
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
