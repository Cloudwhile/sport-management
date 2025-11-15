import dotenv from 'dotenv';
import { Dialect } from 'sequelize';

dotenv.config();

interface AppConfig {
  env: string;
  port: number;
  host: string;
}

interface DatabaseConfig {
  host: string;
  port: number;
  name: string;
  user: string;
  password: string;
  dialect: Dialect;
  logging: boolean | ((sql: string) => void);
  pool: {
    max: number;
    min: number;
    acquire: number;
    idle: number;
  };
}

interface JwtConfig {
  secret: string;
  expiresIn: string;
}

interface CorsConfig {
  origin: string;
  credentials: boolean;
}

interface Config {
  app: AppConfig;
  database: DatabaseConfig;
  jwt: JwtConfig;
  cors: CorsConfig;
}

const config: Config = {
  app: {
    env: process.env['NODE_ENV'] || 'development',
    port: parseInt(process.env['PORT'] || '3000', 10),
    host: process.env['HOST'] || 'localhost',
  },
  database: {
    host: process.env['DB_HOST'] || 'localhost',
    port: parseInt(process.env['DB_PORT'] || '5432', 10),
    name: process.env['DB_NAME'] || 'sport_management',
    user: process.env['DB_USER'] || 'postgres',
    password: process.env['DB_PASSWORD'] || '',
    dialect: 'postgres' as Dialect,
    logging: process.env['NODE_ENV'] === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
  jwt: {
    secret: process.env['JWT_SECRET'] || 'your_jwt_secret_key',
    expiresIn: process.env['JWT_EXPIRES_IN'] || '7d',
  },
  cors: {
    origin: process.env['CORS_ORIGIN'] || 'http://localhost:5173',
    credentials: true,
  },
};

export default config;
