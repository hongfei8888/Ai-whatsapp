# ⚡ 快速部署指南

**5 分钟完成云端部署！**

---

## 🎯 部署架构

```
前端（Vercel）          后端（Railway）
     ↓                       ↓
  Next.js 15            Fastify + Docker
     ↓                       ↓
  全球 CDN               Chrome + WhatsApp
```

---

## 📝 前置条件

- [ ] GitHub 账号
- [ ] Vercel 账号（https://vercel.com）
- [ ] Railway 账号（https://railway.app）
- [ ] 项目已推送到 GitHub

---

## 🚀 三步部署

### 步骤 1: 部署后端（Railway）⏱️ 3分钟

```bash
1. 访问: https://railway.app/new
2. 选择: Deploy from GitHub repo
3. 选择: hongfei8888/Ai-whatsapp
4. 添加: PostgreSQL 数据库
5. 配置环境变量:
   NODE_ENV=production
   HOST=0.0.0.0
   CORS_ORIGIN=https://你的域名.vercel.app
6. 点击: Deploy
7. 记录 URL: https://_____.railway.app
```

### 步骤 2: 部署前端（Vercel）⏱️ 2分钟

```bash
1. 访问: https://vercel.com/new
2. 导入: hongfei8888/Ai-whatsapp
3. 设置 Root Directory: web
4. 添加环境变量:
   NEXT_PUBLIC_API_BASE_URL=https://_____.railway.app
   NEXT_PUBLIC_WS_URL=wss://_____.railway.app
5. 点击: Deploy
6. 完成!
```

### 步骤 3: 测试访问 ⏱️ 1分钟

```bash
1. 访问: https://_____.vercel.app/dashboard
2. 点击: 添加账号
3. 扫码: 登录 WhatsApp
4. ✅ 成功!
```

---

## 🎁 赠送：一键脚本

### 准备 Vercel 配置

双击运行：`prepare-vercel-deployment.bat`

这个脚本会：
- ✅ 检查 Vercel CLI
- ✅ 复制配置文件
- ✅ 测试构建
- ✅ 提供部署指令

---

## 📊 部署成本

```
Vercel (前端):    $0/月  (Hobby 计划)
Railway (后端):   $5/月  (Developer 计划)
─────────────────────────────────────
总计:            $5/月
```

**包含**：
- ✅ 全球 CDN
- ✅ 自动 HTTPS
- ✅ 零停机部署
- ✅ 自动扩展
- ✅ 99.9% SLA

---

## 🔗 快速链接

| 资源 | 链接 |
|------|------|
| 📘 Vercel 详细指南 | [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) |
| 📘 Railway 详细指南 | [RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md) |
| ✅ 部署检查清单 | [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) |
| 🔧 环境变量配置 | [ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md) |
| 🏠 项目文档 | [README.md](README.md) |

---

## 🐛 快速故障排除

### 前端无法访问？
```bash
检查: Vercel 部署是否成功
查看: Vercel 项目 → Deployments
```

### 后端无法连接？
```bash
检查: Railway 服务是否运行
查看: Railway 项目 → Logs
```

### 跨域错误？
```bash
修复: Railway 添加环境变量
     CORS_ORIGIN=https://你的vercel.app
     然后重启服务
```

### AI 不工作？
```bash
添加: Railway 环境变量
     DEEPSEEK_API_KEY=sk-xxx
     AI_ENABLED=true
```

---

## 💡 Pro Tips

### 加速构建
```bash
# Vercel: 启用 Turbo
# Railway: 使用 Docker 缓存
```

### 监控性能
```bash
# Vercel: Analytics 标签
# Railway: Metrics 标签
```

### 自动部署
```bash
# 推送到 GitHub 自动触发部署
git push origin master
```

---

## 🎉 完成后

您将拥有：
- 🌐 生产级 WhatsApp 自动化系统
- ⚡ 全球访问，毫秒级响应
- 🔒 HTTPS 加密，安全可靠
- 📊 实时监控，一目了然
- 🚀 随时更新，零停机切换

---

**现在就开始部署吧！** 🚀

有问题？查看[完整文档](VERCEL_DEPLOYMENT.md)或提交 [Issue](https://github.com/hongfei8888/Ai-whatsapp/issues)

