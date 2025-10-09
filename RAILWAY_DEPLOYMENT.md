# Railway 后端部署指南

## 🚂 为什么选择 Railway？

Railway 是部署 WhatsApp 后端的最佳选择：

✅ **支持 Docker**：完美运行我们的容器化应用
✅ **支持长连接**：WhatsApp 需要保持持久连接
✅ **简单易用**：一键部署，自动构建
✅ **价格合理**：$5/月起，按使用量计费
✅ **自动扩展**：根据流量自动调整资源

---

## 🚀 快速部署（5分钟）

### 步骤 1：注册 Railway

1. 访问：https://railway.app/
2. 点击 **"Start a New Project"**
3. 使用 GitHub 账号登录

### 步骤 2：创建项目

1. 点击 **"New Project"**
2. 选择 **"Deploy from GitHub repo"**
3. 授权 Railway 访问您的 GitHub
4. 选择仓库：`hongfei8888/Ai-whatsapp`

### 步骤 3：配置项目

Railway 会自动：
- ✅ 检测到 `Dockerfile`
- ✅ 检测到 `docker-compose.yml`
- ✅ 开始构建容器

**重要**：选择构建方式为 **"Dockerfile"**（不是 docker-compose）

### 步骤 4：配置环境变量

在 Railway 项目的 **Variables** 标签中添加：

```bash
# 基础配置
NODE_ENV=production
PORT=4000
HOST=0.0.0.0

# 数据库（Railway 可以自动创建 PostgreSQL）
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# CORS 配置（稍后填写 Vercel 地址）
CORS_ORIGIN=https://your-vercel-app.vercel.app

# AI 配置（可选）
DEEPSEEK_API_KEY=your_deepseek_api_key
AI_ENABLED=true
```

### 步骤 5：添加数据库

1. 在项目中点击 **"New"**
2. 选择 **"Database"** → **"PostgreSQL"**
3. Railway 会自动创建数据库并设置 `DATABASE_URL`

### 步骤 6：部署

1. 点击 **"Deploy"**
2. 等待构建完成（约 5-10 分钟）
3. 构建成功后，Railway 会分配一个公共 URL

完成后，您会看到：
```
✅ Deployed
URL: https://ai-whatsapp-production.up.railway.app
```

---

## 🔧 详细配置

### 1. 服务配置

在项目 **Settings** 中：

#### a. 自定义域名（可选）

```
Domains → Add Domain
输入：api.yourdomain.com
```

然后配置 DNS：
```
类型: CNAME
名称: api
值: your-project.railway.app
```

#### b. 健康检查

```
Healthcheck Path: /status
Healthcheck Timeout: 30s
```

#### c. 资源配置

```
Memory: 2 GB（推荐）
CPU: 2 vCPUs（推荐）
```

### 2. 环境变量详解

```bash
# ===== 必需变量 =====

# 运行环境
NODE_ENV=production

# 服务端口（Railway 自动映射）
PORT=4000

# 监听地址（必须是 0.0.0.0）
HOST=0.0.0.0

# 数据库连接
DATABASE_URL=postgresql://...

# ===== CORS 配置 =====

# 允许的前端域名（多个用逗号分隔）
CORS_ORIGIN=https://your-app.vercel.app,https://www.your-app.com

# ===== AI 配置（可选）=====

# DeepSeek API Key
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx

# 全局启用 AI
AI_ENABLED=true

# AI 模型
AI_MODEL=deepseek-chat

# ===== WhatsApp 配置 =====

# 会话超时（秒）
SESSION_TIMEOUT=300

# 最大重连次数
MAX_RECONNECT_ATTEMPTS=3

# ===== 安全配置 =====

# JWT 密钥（自动生成）
JWT_SECRET=your-random-secret-key-here

# API 密钥（可选，用于保护 API）
API_KEY=your-api-key

# ===== 日志配置 =====

# 日志级别
LOG_LEVEL=info

# 启用日志文件
LOG_TO_FILE=false
```

### 3. 数据库配置

#### 选项 1：使用 Railway PostgreSQL（推荐）

1. 在项目中添加 PostgreSQL
2. Railway 自动设置 `DATABASE_URL`
3. 无需手动配置

#### 选项 2：使用外部数据库

```bash
# Supabase
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres

# Neon
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb

# AWS RDS
DATABASE_URL=postgresql://user:pass@xxx.rds.amazonaws.com:5432/dbname
```

### 4. 初始化数据库

部署完成后，执行数据库迁移：

```bash
# 方式 1：通过 Railway CLI
railway run npx prisma migrate deploy

# 方式 2：在 Railway 控制台执行
cd server && npx prisma migrate deploy
```

---

## 📊 监控和日志

### 查看日志

1. 进入 Railway 项目
2. 点击服务名称
3. 查看 **Logs** 标签

日志会显示：
```
[INFO] Server listening on http://0.0.0.0:4000
[INFO] WhatsApp client initialized
[INFO] Database connected
```

### 查看指标

在 **Metrics** 标签查看：
- CPU 使用率
- 内存使用
- 网络流量
- 请求响应时间

### 设置告警

在 **Settings** → **Notifications** 中配置：
- 部署成功/失败通知
- 资源使用告警
- 错误日志告警

---

## 🔄 更新部署

### 自动部署（推荐）

Railway 会自动监听 GitHub 仓库的更改：

1. 推送代码到 GitHub
   ```bash
   git add .
   git commit -m "Update backend"
   git push origin master
   ```

2. Railway 自动触发部署
3. 零停机更新

### 手动部署

1. 在 Railway 项目中点击 **"Deploy"**
2. 选择 **"Redeploy"**

---

## 🐛 故障排除

### 问题 1：部署失败

**症状**：构建过程中出错

**解决**：
1. 查看构建日志
2. 检查 `Dockerfile` 是否正确
3. 确认依赖版本兼容

### 问题 2：应用无法启动

**症状**：部署成功但服务无响应

**解决**：
1. 检查日志中的错误信息
2. 确认 `PORT` 和 `HOST` 配置正确
3. 检查数据库连接是否正常

### 问题 3：WebSocket 连接失败

**症状**：前端无法建立 WebSocket

**解决**：
1. 确认使用 `wss://`（不是 `ws://`）
2. Railway 默认支持 WebSocket
3. 检查 CORS 配置

### 问题 4：内存不足

**症状**：应用频繁重启

**解决**：
1. 在 Railway 增加内存限制
2. 优化代码减少内存使用
3. 考虑升级套餐

### 问题 5：数据库连接错误

**症状**：无法连接数据库

**解决**：
1. 检查 `DATABASE_URL` 是否正确
2. 确认数据库服务正在运行
3. 检查网络连接和防火墙

---

## 💡 性能优化

### 1. 启用 HTTP/2

Railway 默认启用，无需配置。

### 2. 配置缓存

```typescript
// 在路由中添加缓存头
fastify.get('/status', {
  handler: async (request, reply) => {
    reply.header('Cache-Control', 'public, max-age=60');
    return getStatus();
  }
});
```

### 3. 数据库连接池

```typescript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // 配置连接池
  poolSize = 10
}
```

### 4. 启用压缩

```typescript
// 已在 server/src/server.ts 中配置
import compress from '@fastify/compress';
fastify.register(compress);
```

---

## 💰 成本估算

### Developer 计划（$5/月）

- 500 小时运行时间/月
- 8 GB RAM
- 100 GB 磁盘
- 100 GB 出站流量

**适合**：个人项目、小规模使用

### Team 计划（$20/月）

- 更多运行时间
- 更高资源限制
- 团队协作功能
- 优先支持

**适合**：小型团队、中等流量

### 按需付费

超出套餐的部分：
- 运行时间：$0.000231/分钟
- RAM：$0.000231/GB/分钟
- 出站流量：$0.10/GB

---

## 📚 相关资源

- [Railway 文档](https://docs.railway.app)
- [Railway Discord](https://discord.gg/railway)
- [Railway 状态页](https://status.railway.app)
- [定价详情](https://railway.app/pricing)

---

## 🎉 完成！

您的 WhatsApp 后端现在运行在 Railway 上！

**下一步**：部署前端到 Vercel
👉 查看：[VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md)

---

## 🆘 需要帮助？

- [Railway 文档](https://docs.railway.app)
- [项目 Issues](https://github.com/hongfei8888/Ai-whatsapp/issues)
- [Railway 社区](https://discord.gg/railway)

