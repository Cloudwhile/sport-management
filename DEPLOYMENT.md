# 学校体测数据管理系统 - Docker 部署指南

## 快速开始

### 1. 环境准备

确保已安装：
- Docker (>= 20.10)
- Docker Compose (>= 2.0)

### 2. 配置环境变量

复制环境变量示例文件并根据需要修改：

```bash
cp .env.example .env
```

编辑 `.env` 文件，设置数据库密码和 JWT 密钥：

```env
DB_PASSWORD=your-secure-password
JWT_SECRET=your-jwt-secret-key
```

### 3. 启动服务

```bash
# 构建并启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 查看服务状态
docker-compose ps
```

### 4. 访问应用

- **前端应用**: http://localhost:3000
- **API 文档**: http://localhost:3000/api-docs
- **健康检查**: http://localhost:3000/health

默认管理员账号：
- 用户名: `admin`
- 密码: `admin123`

### 5. 数据库初始化

首次启动后，应用会自动执行数据库迁移和种子数据初始化。

如果需要手动操作：

```bash
# 进入应用容器
docker-compose exec app sh

# 执行迁移
npm run db:migrate

# 执行种子数据
npm run db:seed
```

## 常用命令

### 服务管理

```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose stop

# 重启服务
docker-compose restart

# 停止并删除容器
docker-compose down

# 停止并删除容器和数据卷（谨慎使用）
docker-compose down -v
```

### 日志查看

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看应用日志
docker-compose logs -f app

# 查看数据库日志
docker-compose logs -f postgres
```

### 数据库操作

```bash
# 连接到数据库
docker-compose exec postgres psql -U postgres -d sport_management

# 备份数据库
docker-compose exec postgres pg_dump -U postgres sport_management > backup.sql

# 恢复数据库
docker-compose exec -T postgres psql -U postgres sport_management < backup.sql
```

## 生产环境部署建议

### 1. 安全配置

- 修改 `.env` 中的所有默认密码和密钥
- 使用强密码（至少 16 位，包含大小写字母、数字和特殊字符）
- 定期更换 JWT 密钥

### 2. 反向代理（推荐使用 Nginx）

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3. 数据备份

建议设置定时任务进行数据库备份：

```bash
# 添加到 crontab
0 2 * * * cd /path/to/sport-management && docker-compose exec -T postgres pg_dump -U postgres sport_management | gzip > backups/backup-$(date +\%Y\%m\%d).sql.gz
```

### 4. 资源限制

在 `docker-compose.yml` 中添加资源限制：

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

## 故障排查

### 应用无法启动

```bash
# 查看详细日志
docker-compose logs app

# 检查容器状态
docker-compose ps

# 重启应用容器
docker-compose restart app
```

### 数据库连接失败

```bash
# 检查数据库是否运行
docker-compose ps postgres

# 查看数据库日志
docker-compose logs postgres

# 测试数据库连接
docker-compose exec postgres psql -U postgres -c "SELECT 1"
```

### 端口冲突

如果 3000 或 5432 端口已被占用，修改 `.env` 文件：

```env
APP_PORT=8080
DB_PORT=5433
```

然后重启服务：

```bash
docker-compose down
docker-compose up -d
```

## 更新应用

```bash
# 拉取最新代码
git pull

# 重新构建并启动
docker-compose up -d --build

# 如有数据库迁移，进入容器执行
docker-compose exec app npm run db:migrate
```

## 性能优化

### 数据库优化

编辑 `docker-compose.yml`，为 PostgreSQL 添加配置：

```yaml
postgres:
  command:
    - "postgres"
    - "-c"
    - "shared_buffers=256MB"
    - "-c"
    - "max_connections=200"
```

### 应用优化

- 启用 gzip 压缩（已在后端配置）
- 使用 CDN 加速静态资源
- 配置 Redis 缓存（如需要）

## 监控

建议集成以下监控工具：

- **Prometheus + Grafana**: 系统和应用监控
- **Loki**: 日志聚合
- **cAdvisor**: 容器监控

## 支持

如遇到问题，请查看：
- [项目文档](README.md)
- [Issue 跟踪](https://github.com/your-repo/issues)
