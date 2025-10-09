# 🚀 部署检查清单

使用这个清单确保完美部署您的 WhatsApp AI 自动化系统。

---

## 📋 部署前准备

### ✅ 账号注册

- [ ] GitHub 账号（已有：hongfei8888）
- [ ] Railway 账号（https://railway.app/）
- [ ] Vercel 账号（https://vercel.com/）
- [ ] DeepSeek API Key（如果使用 AI）

### ✅ 代码准备

- [ ] 代码已推送到 GitHub
- [ ] `.gitignore` 已配置（排除大文件）
- [ ] `Dockerfile` 已准备
- [ ] `docker-compose.yml` 已准备
- [ ] 环境变量示例文件（`.env.example`）已创建

---

## 🚂 第一步：部署后端到 Railway

### 1. 创建项目

- [ ] 访问 https://railway.app/new
- [ ] 选择 "Deploy from GitHub repo"
- [ ] 选择 `hongfei8888/Ai-whatsapp` 仓库
- [ ] Railway 检测到 Dockerfile

### 2. 添加数据库

- [ ] 点击 "New" → "Database" → "PostgreSQL"
- [ ] 等待数据库创建完成
- [ ] 确认 `DATABASE_URL` 自动设置

### 3. 配置环境变量

复制以下变量到 Railway Variables：

```bash
# 基础配置
- [ ] NODE_ENV=production
- [ ] PORT=4000
- [ ] HOST=0.0.0.0

# AI 配置（可选）
- [ ] DEEPSEEK_API_KEY=sk-xxx
- [ ] AI_ENABLED=true

# 日志配置
- [ ] LOG_LEVEL=info
```

### 4. 部署

- [ ] 点击 "Deploy"
- [ ] 等待构建完成（5-10分钟）
- [ ] 记录分配的 URL：`https://_____.railway.app`
- [ ] 测试访问：`https://_____.railway.app/status`

### 5. 初始化数据库

在 Railway 控制台执行：

```bash
- [ ] cd server && npx prisma migrate deploy
```

---

## 🎨 第二步：部署前端到 Vercel

### 1. 准备配置

在本地执行：

```bash
- [ ] cd web
- [ ] cp next.config.vercel.js next.config.js
- [ ] git add next.config.js vercel.json
- [ ] git commit -m "Add Vercel config"
- [ ] git push origin master
```

### 2. 创建 Vercel 项目

- [ ] 访问 https://vercel.com/new
- [ ] 导入 `hongfei8888/Ai-whatsapp`
- [ ] 设置 Root Directory: `web`
- [ ] 框架选择：Next.js

### 3. 配置环境变量

在 Vercel 项目设置中添加：

```bash
- [ ] NEXT_PUBLIC_API_BASE_URL=https://_____.railway.app
- [ ] NEXT_PUBLIC_WS_URL=wss://_____.railway.app
- [ ] NEXT_PUBLIC_APP_NAME=WhatsApp AI Automation
```

### 4. 部署

- [ ] 点击 "Deploy"
- [ ] 等待构建完成（3-5分钟）
- [ ] 记录 Vercel URL：`https://_____.vercel.app`

---

## 🔧 第三步：配置 CORS

### 更新 Railway 环境变量

在 Railway 添加/更新：

```bash
- [ ] CORS_ORIGIN=https://_____.vercel.app
```

然后：

- [ ] 重启 Railway 服务（Settings → Restart）

---

## ✅ 第四步：验证部署

### 测试前端

- [ ] 访问 `https://_____.vercel.app/dashboard`
- [ ] Dashboard 正常显示
- [ ] 左侧菜单可见
- [ ] 统计卡片显示

### 测试后端连接

打开浏览器开发者工具（F12）：

- [ ] Network 标签中 API 请求成功（状态码 200）
- [ ] Console 没有 CORS 错误
- [ ] WebSocket 连接成功

### 测试 WhatsApp 功能

- [ ] 点击 "添加账号"
- [ ] 二维码正常显示
- [ ] 可以用手机扫码
- [ ] 登录成功后显示账号信息

---

## 🌐 第五步：域名配置（可选）

### Vercel 自定义域名

- [ ] 进入 Vercel 项目 → Domains
- [ ] 添加域名：`app.yourdomain.com`
- [ ] 配置 DNS（CNAME 到 `cname.vercel-dns.com`）
- [ ] 等待 SSL 证书生效

### Railway 自定义域名

- [ ] 进入 Railway 项目 → Settings → Domains
- [ ] 添加域名：`api.yourdomain.com`
- [ ] 配置 DNS（CNAME 到 Railway 提供的地址）
- [ ] 等待 SSL 证书生效

### 更新 CORS 配置

- [ ] 在 Railway 更新 `CORS_ORIGIN` 包含新域名
- [ ] 在 Vercel 更新 `NEXT_PUBLIC_API_BASE_URL` 使用新域名

---

## 📊 第六步：监控设置

### Railway 监控

- [ ] 查看 Metrics 标签（CPU、内存、网络）
- [ ] 设置告警通知（Settings → Notifications）
- [ ] 配置健康检查（Healthcheck Path: /status）

### Vercel 监控

- [ ] 查看 Analytics（如果可用）
- [ ] 设置部署通知
- [ ] 配置 Webhook（可选）

---

## 🔐 第七步：安全加固

### Railway 安全

- [ ] 限制 CORS_ORIGIN 只允许您的域名
- [ ] 设置 API_KEY 保护敏感端点
- [ ] 定期更新依赖包

### Vercel 安全

- [ ] 检查环境变量不包含敏感信息
- [ ] 启用 Vercel WAF（Pro 计划）
- [ ] 配置 CSP 头部

---

## 📝 部署信息记录

完成部署后，记录以下信息：

```
部署日期：___________

后端（Railway）：
- URL: https://_____.railway.app
- 数据库: PostgreSQL
- 区域: US East

前端（Vercel）：
- URL: https://_____.vercel.app
- 区域: Global CDN

自定义域名（如果有）：
- 前端: https://app.yourdomain.com
- 后端: https://api.yourdomain.com

环境变量：
- DEEPSEEK_API_KEY: 已设置
- DATABASE_URL: 已设置
- CORS_ORIGIN: 已设置

数据库：
- 迁移状态: 已完成
- 备份策略: 自动（Railway）
```

---

## 🎉 部署完成！

恭喜！您的应用现在已经：

- ✅ 运行在云端
- ✅ 全球访问
- ✅ 自动 HTTPS
- ✅ 零停机部署
- ✅ 自动扩展

---

## 📚 后续步骤

- [ ] 阅读 [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) 了解更多前端配置
- [ ] 阅读 [RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md) 了解更多后端配置
- [ ] 设置监控和告警
- [ ] 配置备份策略
- [ ] 优化性能

---

## 🆘 遇到问题？

参考故障排除文档：
- [VERCEL_DEPLOYMENT.md - 故障排除](VERCEL_DEPLOYMENT.md#故障排除)
- [RAILWAY_DEPLOYMENT.md - 故障排除](RAILWAY_DEPLOYMENT.md#故障排除)
- [GitHub Issues](https://github.com/hongfei8888/Ai-whatsapp/issues)

---

**祝您部署顺利！** 🚀

