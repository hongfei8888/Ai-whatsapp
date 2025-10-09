# 环境变量配置指南

本文档说明了项目所需的所有环境变量配置。

---

## 📋 目录

- [前端环境变量（Vercel）](#前端环境变量vercel)
- [后端环境变量（Railway）](#后端环境变量railway)
- [本地开发环境变量](#本地开发环境变量)

---

## 🎨 前端环境变量（Vercel）

在 Vercel 项目设置的 **Environment Variables** 中添加：

### 必需变量

```bash
# 后端 API 地址
NEXT_PUBLIC_API_BASE_URL=https://your-api.railway.app

# WebSocket 地址
NEXT_PUBLIC_WS_URL=wss://your-api.railway.app
```

### 可选变量

```bash
# 应用名称
NEXT_PUBLIC_APP_NAME=WhatsApp AI Automation
```

### 说明

- `NEXT_PUBLIC_` 前缀的变量会被打包到前端代码中
- 不要在这些变量中存储敏感信息（如 API 密钥）
- 修改后需要重新部署才能生效

---

## 🚂 后端环境变量（Railway）

在 Railway 项目的 **Variables** 标签中添加：

### 必需变量

```bash
# ===== 基础配置 =====
NODE_ENV=production
PORT=4000
HOST=0.0.0.0

# ===== 数据库配置 =====
# Railway 添加 PostgreSQL 后会自动设置
DATABASE_URL=postgresql://user:password@host:5432/database

# ===== CORS 配置 =====
# 填写您的 Vercel 前端地址
CORS_ORIGIN=https://your-vercel-app.vercel.app
```

### 可选变量（AI 功能）

```bash
# ===== AI 配置 =====
# DeepSeek API Key (从 https://platform.deepseek.com/api_keys 获取)
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx

# 全局启用 AI
AI_ENABLED=true

# AI 模型
AI_MODEL=deepseek-chat
```

### 可选变量（安全加固）

```bash
# ===== 安全配置 =====
# JWT 密钥（生成方法：openssl rand -base64 32）
JWT_SECRET=your-random-jwt-secret-key-here

# API 密钥（保护敏感端点）
API_KEY=your-api-protection-key
```

### 可选变量（日志和性能）

```bash
# ===== 日志配置 =====
LOG_LEVEL=info
LOG_TO_FILE=false

# ===== 性能配置 =====
MAX_BODY_SIZE=10485760      # 10MB
MAX_FILE_SIZE=52428800      # 50MB
REQUEST_TIMEOUT=30000       # 30秒

# ===== 其他配置 =====
TZ=Asia/Shanghai
```

---

## 💻 本地开发环境变量

### 前端（web 目录）

创建 `web/.env.local` 文件：

```bash
# 后端 API 地址（本地开发）
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000

# WebSocket 地址（本地开发）
NEXT_PUBLIC_WS_URL=ws://localhost:4000

# 应用名称
NEXT_PUBLIC_APP_NAME=WhatsApp AI Automation (Dev)
```

### 后端（server 目录）

创建 `server/.env` 文件：

```bash
# 运行环境
NODE_ENV=development

# 服务端口
PORT=4000

# 监听地址
HOST=localhost

# 数据库（本地开发使用 SQLite）
DATABASE_URL=file:./dev.db

# CORS 配置（本地开发）
CORS_ORIGIN=http://localhost:3000

# AI 配置（可选）
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
AI_ENABLED=true

# 日志配置
LOG_LEVEL=debug
LOG_TO_FILE=true
```

---

## 📋 配置检查清单

### Vercel 前端部署

- [ ] `NEXT_PUBLIC_API_BASE_URL` 已设置为 Railway URL
- [ ] `NEXT_PUBLIC_WS_URL` 已设置为 Railway WSS URL
- [ ] 环境变量已保存并重新部署

### Railway 后端部署

- [ ] `NODE_ENV=production` 已设置
- [ ] `HOST=0.0.0.0` 已设置（重要！）
- [ ] `DATABASE_URL` 已设置（添加 PostgreSQL 后自动设置）
- [ ] `CORS_ORIGIN` 已设置为 Vercel 前端地址
- [ ] 如果使用 AI：`DEEPSEEK_API_KEY` 已设置
- [ ] 环境变量已保存并重新部署

### 本地开发

- [ ] `web/.env.local` 文件已创建
- [ ] `server/.env` 文件已创建
- [ ] 数据库文件路径正确
- [ ] 前端和后端端口不冲突

---

## 🔍 常见问题

### Q: 前端无法连接后端？

**检查**：
1. `NEXT_PUBLIC_API_BASE_URL` 是否正确
2. Railway 后端是否正在运行
3. CORS 配置是否包含前端域名

### Q: WebSocket 连接失败？

**检查**：
1. `NEXT_PUBLIC_WS_URL` 使用 `wss://`（不是 `ws://`）
2. Railway 默认支持 WebSocket，无需特殊配置

### Q: AI 不工作？

**检查**：
1. `DEEPSEEK_API_KEY` 是否正确
2. `AI_ENABLED=true` 是否已设置
3. API Key 是否有余额

### Q: 跨域错误？

**检查**：
1. Railway 的 `CORS_ORIGIN` 是否包含前端域名
2. 确保域名格式正确（`https://` 前缀）
3. 重启 Railway 服务使配置生效

### Q: 环境变量不生效？

**解决**：
1. 在 Vercel/Railway 保存后**重新部署**
2. 清除浏览器缓存
3. 检查变量名拼写是否正确

---

## 🔐 安全最佳实践

### ⚠️ 不要做的事情

- ❌ 不要将 `.env` 文件提交到 Git
- ❌ 不要在前端变量中存储 API 密钥
- ❌ 不要在代码中硬编码敏感信息
- ❌ 不要共享 `DATABASE_URL` 或 `JWT_SECRET`

### ✅ 应该做的事情

- ✅ 使用强随机字符串作为密钥
- ✅ 定期更换 JWT_SECRET 和 API_KEY
- ✅ 限制 CORS_ORIGIN 只允许信任的域名
- ✅ 使用环境变量管理工具（如 Vercel/Railway）
- ✅ 为开发和生产环境使用不同的配置

---

## 📚 相关文档

- [Vercel 环境变量文档](https://vercel.com/docs/concepts/projects/environment-variables)
- [Railway 环境变量文档](https://docs.railway.app/develop/variables)
- [Next.js 环境变量指南](https://nextjs.org/docs/basic-features/environment-variables)
- [本项目 Vercel 部署指南](VERCEL_DEPLOYMENT.md)
- [本项目 Railway 部署指南](RAILWAY_DEPLOYMENT.md)

---

## 💡 生成随机密钥

### 使用 OpenSSL（推荐）

```bash
openssl rand -base64 32
```

### 使用 Node.js

```javascript
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 使用在线工具

- https://generate-secret.vercel.app/32
- https://randomkeygen.com/

---

**配置完成后，请参考部署检查清单验证所有设置！**

👉 [部署检查清单](DEPLOYMENT_CHECKLIST.md)

