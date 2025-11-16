# 多阶段构建：前端构建阶段
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# 复制前端依赖文件
COPY frontend/package*.json ./

# 安装前端依赖
RUN npm ci --only=production

# 复制前端源代码
COPY frontend/ ./

# 构建前端
RUN npm run build

# 多阶段构建：后端构建阶段
FROM node:20-alpine AS backend-builder

WORKDIR /app/backend

# 复制后端依赖文件
COPY backend/package*.json ./

# 安装后端依赖（包括开发依赖，用于构建）
RUN npm ci

# 复制后端源代码
COPY backend/ ./

# 复制前端构建产物到后端
COPY --from=frontend-builder /app/frontend/dist ./dist/frontend

# 构建后端
RUN npm run build:backend

# 生产环境阶段
FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 安装生产依赖和构建工具（需要 tsx 用于执行迁移脚本）
COPY backend/package*.json ./
RUN npm ci --only=production && \
    npm install tsx --save-dev

# 从构建阶段复制编译后的文件
COPY --from=backend-builder /app/backend/dist ./dist

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 更改所有权
RUN chown -R nodejs:nodejs /app

# 切换到非 root 用户
USER nodejs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 启动应用
CMD ["node", "dist/index.js"]
