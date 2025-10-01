# WhatsApp AI 自动回复系统

🚀 **基于 `whatsapp-web.js` 的智能客服自动化系统**，支持多账号管理、AI自动回复、批量操作等功能。

[![部署状态](https://img.shields.io/badge/部署状态-就绪-success)](https://github.com/hongfei8888/Ai-whatsapp)
[![技术栈](https://img.shields.io/badge/技术栈-Next.js%2015%20%7C%20Fastify%20%7C%20Prisma-blue)](#)
[![许可证](https://img.shields.io/badge/许可证-MIT-green)](LICENSE)

## ✨ 核心特性

- 🤖 **AI智能回复** - 集成DeepSeek模型，自动识别并回复客户消息
- 📱 **多账号管理** - 支持多个WhatsApp账号同时在线管理
- 📊 **实时监控** - Dashboard实时展示系统状态和统计数据
- 📤 **批量操作** - 批量发送消息、导入联系人，提升工作效率
- 🎨 **现代化UI** - 响应式设计，支持深色模式，用户体验优秀
- 🔐 **安全可靠** - 完整的错误处理、会话管理和数据保护
- 🚀 **一键部署** - 前端Vercel部署，后端支持Railway/Fly.io

## 🏗️ 项目架构

```
├── web/                    # 前端 (Next.js 15)
│   ├── app/               # App Router 页面
│   │   ├── dashboard/     # 仪表盘
│   │   ├── contacts/      # 联系人管理
│   │   ├── threads/       # 对话管理
│   │   ├── batch/         # 批量操作
│   │   ├── templates/     # 消息模板
│   │   └── settings/      # 系统设置
│   ├── components/        # 可复用组件
│   │   ├── layout/        # 布局组件
│   │   ├── ui/           # UI组件
│   │   └── forms/        # 表单组件
│   ├── lib/              # 工具库和类型定义
│   └── public/           # 静态资源
├── server/                # 后端服务
│   ├── app/              # Fastify 应用
│   ├── src/              # 业务逻辑
│   │   ├── services/     # 服务层
│   │   ├── routes/       # API路由
│   │   └── utils/        # 工具函数
│   ├── prisma/           # 数据库模型
│   └── uploads/          # 文件上传目录
└── docs/                 # 项目文档
    ├── 项目开发过程总结与经验教训.md
    ├── FIXES_SUMMARY.md
    └── 默认启用AI配置说明.md
```

## 🎯 功能模块

### 前端功能
- **📊 仪表盘** - 系统状态监控、统计图表、快速操作
- **👥 联系人管理** - 联系人列表、分组管理、搜索筛选
- **💬 对话管理** - 消息列表、实时更新、AI接管控制
- **📤 批量操作** - 批量发送消息、导入联系人、任务管理
- **📝 消息模板** - 模板管理、变量替换、分类组织
- **⚙️ 系统设置** - AI配置、账号管理、系统参数

### 后端功能
- **🔐 WhatsApp集成** - 多账号登录、会话管理、消息收发
- **🤖 AI服务** - DeepSeek集成、智能回复、上下文理解
- **📊 数据管理** - Prisma ORM、SQLite数据库、数据同步
- **📁 文件处理** - 图片上传、文件存储、媒体消息
- **⏰ 任务调度** - 批量操作、定时任务、队列管理
- **🔒 安全认证** - API认证、权限控制、数据保护

## 🚀 快速开始

### 环境要求

- **Node.js** >= 20.0.0
- **npm** >= 8.0.0 或 **yarn** >= 1.22.0
- **SQLite** (开发环境，生产环境建议使用 PostgreSQL)
- **Git** (用于版本控制)

### 📦 安装依赖

```bash
# 克隆项目
git clone https://github.com/hongfei8888/Ai-whatsapp.git
cd Ai-whatsapp

# 安装前端依赖
cd web
npm install

# 安装后端依赖
cd ../server
npm install
```

### 🖥️ 本地开发

#### 启动后端服务

```bash
cd server

# 复制环境变量模板
cp env.example .env

# 编辑环境变量 (配置数据库、AI API等)
nano .env

# 生成Prisma客户端
npm run prisma:generate

# 启动开发服务器
npm run dev
```

#### 启动前端服务

```bash
cd web

# 复制环境变量模板
cp env.example .env.local

# 编辑环境变量 (配置后端API地址)
nano .env.local

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000 查看应用界面

### 🌐 生产部署

#### 前端部署到 Vercel

1. **连接仓库**
   - 登录 [Vercel](https://vercel.com)
   - 连接 GitHub 仓库

2. **配置环境变量**
   ```env
   NEXT_PUBLIC_API_BASE_URL=https://your-backend-api.com
   NEXT_PUBLIC_APP_NAME=WhatsApp Automation
   ```

3. **自动部署**
   - Vercel 会自动检测 Next.js 项目
   - 每次推送到 main 分支自动部署

#### 后端部署选项

**选项 A: Railway 部署 (推荐)**
```bash
# 1. 连接 GitHub 仓库到 Railway
# 2. 配置环境变量
# 3. 自动部署
```

**选项 B: Fly.io 部署**
```bash
# 1. 安装 Fly CLI
curl -L https://fly.io/install.sh | sh

# 2. 登录并部署
fly auth login
fly deploy
```

**选项 C: 自建服务器**
```bash
# 1. 服务器要求: Ubuntu 20.04+, 2GB+ RAM
# 2. 使用 PM2 管理进程
npm install -g pm2
pm2 start app/dist/main.js --name whatsapp-automation
pm2 startup
pm2 save
```

## 🔧 开发指南

### 开发工具链

```bash
# 前端开发
cd web
npm run dev          # 开发服务器
npm run build        # 构建生产版本
npm run start        # 启动生产服务器
npm run lint         # 代码检查
npm run typecheck    # 类型检查
npm run depcheck     # 依赖检查

# 后端开发
cd server
npm run dev          # 开发服务器
npm run build        # 构建项目
npm run start        # 启动生产服务器
npm run prisma:generate  # 生成 Prisma 客户端
npm run prisma:push      # 推送数据库变更
```

### 代码质量检查

```bash
# 前端代码检查
cd web
npm run lint         # ESLint 检查
npm run typecheck    # TypeScript 类型检查
npm run depcheck     # 检查未使用的依赖
npm run deadexports  # 检查未使用的导出

# 构建测试
npm run build        # 确保构建成功
```

### 数据库管理

```bash
cd server

# 数据库管理界面
npx prisma studio

# 创建迁移
npx prisma migrate dev --name init

# 部署迁移
npx prisma migrate deploy

# 重置数据库
npx prisma migrate reset
```

## 📋 环境变量说明

### 前端环境变量

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `NEXT_PUBLIC_API_BASE_URL` | 后端API地址 | `https://api.example.com` |
| `NEXT_PUBLIC_APP_NAME` | 应用名称 | `WhatsApp Automation` |

### 后端环境变量

| 变量名 | 说明 | 示例值 | 必填 |
|--------|------|--------|------|
| `DATABASE_URL` | 数据库连接字符串 | `file:./dev.db` | ✅ |
| `PORT` | 服务器端口 | `4000` | ✅ |
| `NODE_ENV` | 运行环境 | `production` | ✅ |
| `SESSION_PATH` | WhatsApp会话存储路径 | `./.session` | ✅ |
| `AUTH_TOKEN` | API认证令牌 | `your-secure-token` | ✅ |
| `DEEPSEEK_API_KEY` | DeepSeek API密钥 | `sk-xxxx` | ✅ |
| `DEEPSEEK_MODEL` | DeepSeek模型名称 | `deepseek-chat` | ✅ |
| `COOLDOWN_HOURS` | 联系人冷却时间(小时) | `24` | ❌ |
| `PER_CONTACT_REPLY_COOLDOWN` | 单次回复冷却时间(分钟) | `10` | ❌ |

## 🐛 故障排除

### 常见问题

1. **前端无法连接后端**
   - 检查 `NEXT_PUBLIC_API_BASE_URL` 配置
   - 确认后端服务正在运行
   - 检查网络连接和防火墙设置

2. **WhatsApp 登录失败**
   - 确认 `SESSION_PATH` 目录存在且可写
   - 检查 Puppeteer 依赖是否正确安装
   - 查看后端日志获取详细错误信息

3. **AI 回复不工作**
   - 验证 `DEEPSEEK_API_KEY` 是否正确
   - 检查 API 配额是否充足
   - 确认网络可以访问 DeepSeek API

4. **数据库连接失败**
   - 检查 `DATABASE_URL` 配置
   - 确认数据库文件权限
   - 运行 `npx prisma generate` 重新生成客户端

5. **构建失败**
   - 运行 `npm run typecheck` 检查类型错误
   - 运行 `npm run lint` 检查代码规范
   - 清除 `.next` 缓存：`rm -rf .next`

### 日志查看

```bash
# 前端日志
cd web
npm run dev

# 后端日志
cd server
npm run dev

# 生产环境日志 (PM2)
pm2 logs whatsapp-automation
```

## 📚 API 文档

### 认证

所有API请求需要在Header中包含认证令牌：
```
Authorization: Bearer your-auth-token
```

### 主要端点

- `GET /status` - 获取系统状态
- `POST /auth/login/start` - 启动登录流程
- `GET /auth/qr` - 获取二维码
- `GET /contacts` - 获取联系人列表
- `POST /contacts` - 创建联系人
- `DELETE /contacts/:id` - 删除联系人
- `GET /threads` - 获取对话列表
- `POST /threads/:id/messages` - 发送消息
- `POST /batch/send` - 批量发送消息
- `GET /ai/config` - 获取AI配置
- `PUT /ai/config` - 更新AI配置
- `POST /templates` - 创建消息模板
- `GET /templates` - 获取模板列表

详细API文档请参考 [API文档](./docs/api.md)


## 🤝 贡献指南

### 开发流程

1. **Fork 项目**
   ```bash
   # 克隆你的 Fork
   git clone https://github.com/your-username/Ai-whatsapp.git
   cd Ai-whatsapp
   ```

2. **创建功能分支**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **提交更改**
   ```bash
   git add .
   git commit -m "Add amazing feature"
   git push origin feature/amazing-feature
   ```

4. **创建 Pull Request**
   - 描述你的更改
   - 确保代码通过所有检查
   - 请求代码审查

### 代码规范

- **TypeScript**: 严格模式，零类型错误
- **ESLint**: 遵循 Next.js 代码规范
- **Commit**: 使用语义化提交信息
- **测试**: 新功能需要包含测试用例

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🆘 支持与帮助

### 获取帮助

如果您遇到问题或有建议，请：

1. **查看文档**
   - 📖 [项目开发过程总结](./项目开发过程总结与经验教训.md)
   - 🔧 [修复清单](./FIXES_SUMMARY.md)
   - ⚙️ [AI配置说明](./默认启用AI配置说明.md)

2. **搜索问题**
   - 🔍 [GitHub Issues](https://github.com/hongfei8888/Ai-whatsapp/issues)
   - 📚 [故障排除](#故障排除) 部分

3. **创建 Issue**
   - 🐛 报告 Bug
   - 💡 提出功能建议
   - ❓ 寻求帮助

### 社区

- 🌟 **Star** 这个项目
- 🔄 **Fork** 并贡献代码
- 💬 **讨论** 在 Issues 中
- 📢 **分享** 给其他人

## 📈 项目历程

### v1.0.0 (2025-10-01) - 🎉 正式发布
- ✅ **完整的 WhatsApp AI 自动化系统**
- ✅ **现代化前端界面** (Next.js 15 + TypeScript)
- ✅ **智能 AI 回复** (DeepSeek 模型集成)
- ✅ **多账号管理** (支持多个 WhatsApp 账号)
- ✅ **批量操作功能** (批量发送、导入联系人)
- ✅ **实时监控面板** (Dashboard 数据展示)
- ✅ **完整的部署方案** (Vercel + Railway/Fly.io)
- ✅ **生产就绪** (错误处理、日志、监控)

### 开发历程
- 🎨 **UI 界面优化** - 从基础界面到现代化设计
- 🏗️ **架构重构** - 前后端分离，组件化设计
- 🤖 **AI 集成** - DeepSeek 模型自动回复
- 📱 **功能完善** - 批量操作、模板管理、文件上传
- 🚀 **部署准备** - 完整的云平台部署方案

## 🌟 项目亮点

- **🎯 用户导向**: 从用户反馈"UI界面好丑"开始，持续优化用户体验
- **🔄 快速迭代**: 小步快跑，及时响应用户需求
- **🛡️ 质量保障**: TypeScript 严格模式，完整的错误处理
- **📚 文档完善**: 详细的技术文档和开发经验总结
- **🚀 部署就绪**: 一键部署到现代云平台

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给个 Star！**

Made with ❤️ by [开发团队](https://github.com/hongfei8888)

</div>