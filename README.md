# WhatsApp AI 自动化系统

> 🚀 **企业级** WhatsApp 智能客服自动化平台，支持70+核心功能，包括AI自动回复、即时通讯、批量操作、多语言翻译、数据分析等。

[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Docker](https://img.shields.io/badge/docker-ready-blue)](Dockerfile)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](package.json)
[![Status](https://img.shields.io/badge/status-production--ready-success)](README.md)
[![Version](https://img.shields.io/badge/version-3.0-blue)](README.md)

---

## ✨ 核心特性

### 即时通讯系统
- 💬 **企业级聊天** - 完整的即时通讯功能（引用、编辑、删除、转发、星标、搜索）
- 📎 **媒体文件** - 支持图片、视频、音频、文档（拖拽上传、自动缩略图）
- 📌 **会话管理** - 置顶、归档、标签、未读计数、草稿自动保存
- 🔍 **智能搜索** - 实时搜索消息、高亮显示、快速跳转

### AI 智能系统
- 🤖 **AI自动回复** - DeepSeek模型智能回复（可配置System Prompt、Temperature）
- 🌐 **多语言翻译** - 百度翻译API集成、自动翻译、双语显示、智能缓存
- 📚 **知识库** - 企业知识管理、AI基于知识库回复
- 🎨 **风格预设** - 4种AI风格（简洁/专业/友好/随意）

### 批量操作
- 📤 **批量发送** - 支持模板、变量替换、速率控制、实时进度
- 📥 **批量导入** - CSV文件上传、数据预览、自动去重
- 🏷️ **标签管理** - 批量添加/移除/替换标签
- 📊 **操作历史** - 完整记录、筛选、统计分析

### 数据分析
- 📊 **Dashboard** - 8个核心指标、3个交互式图表、实时活动流
- 📈 **趋势分析** - 本周消息趋势、成功率分析、批量操作统计
- ⚙️ **系统设置** - 6个标签页（基础设置、AI配置、翻译、统计、数据管理、账号）
- 📤 **数据导出** - JSON/CSV格式、自定义导出内容

### 技术特性
- 🐳 **Docker容器化** - 一键部署、完全隔离的运行环境
- ⚡ **性能优化** - 首屏<1s、网络流量↓90%、API调用↓96%
- 🔄 **实时同步** - WebSocket实时更新、多设备同步
- 📱 **响应式设计** - 完美支持桌面端和移动端

---

## 🚀 快速开始

### 方式 1: 本地 Docker 部署（推荐开发）

#### 1. 安装 Docker Desktop

**Windows**: [下载Docker Desktop](https://www.docker.com/products/docker-desktop)

#### 2. 启动应用

```bash
# 方式1: 使用脚本（推荐）
双击运行: docker-start.bat

# 方式2: 命令行
docker-compose build
docker-compose up -d
```

#### 3. 访问应用

```
前端界面: http://localhost:3000/dashboard/
后端API:   http://localhost:4000/status
```

#### 4. 添加账号

1. 访问设置页面: http://localhost:3000/settings/
2. 点击"添加账号"
3. 扫描二维码登录
4. ✅ 完成！

---

### 方式 2: 云端部署（推荐生产）

#### ☁️ **Vercel + Railway 部署**

**前端（Vercel）**:
1. Fork 本仓库到您的 GitHub
2. 访问 https://vercel.com/new
3. 导入仓库，Root Directory 设置为 `web`
4. 添加环境变量（见下方）
5. 点击 Deploy

**后端（Railway）**:
1. 访问 https://railway.app/new
2. 选择 "Deploy from GitHub repo"
3. 选择本仓库
4. 添加 PostgreSQL 数据库
5. 配置环境变量（见下方）
6. 自动部署

**详细步骤**:
- 📘 [Vercel 部署指南](VERCEL_DEPLOYMENT.md)
- 📘 [Railway 部署指南](RAILWAY_DEPLOYMENT.md)
- ✅ [部署检查清单](DEPLOYMENT_CHECKLIST.md)

**优势**:
- ✅ 全球 CDN 加速
- ✅ 自动 HTTPS
- ✅ 零停机部署
- ✅ 自动扩展
- ✅ $5/月起

---

## 📚 技术架构

```
Docker Container (Ubuntu 20.04)
├── Nginx (端口3000)          # 前端静态文件 + 反向代理
├── Backend (端口4000)        # Fastify API服务
│   ├── WhatsApp Web.js      # WhatsApp集成
│   ├── Prisma + SQLite      # 数据库
│   └── DeepSeek AI          # 智能回复
└── Chrome Stable            # WhatsApp Web渲染
```

**技术栈**:
- 前端: Next.js 15 + TypeScript + React 18
- 后端: Fastify + TypeScript + Prisma ORM
- 数据库: SQLite (生产环境可用PostgreSQL)
- AI: DeepSeek Chat API
- 容器: Docker + Nginx + Supervisor

---

## 🛠️ 常用命令

```bash
# 查看状态
docker-compose ps
docker-compose logs -f

# 停止/重启
docker-compose down
docker-compose restart

# 重新构建
docker-compose build
docker-compose up -d

# 进入容器
docker exec -it whatsapp-ai-automation bash
```

---

## 📖 完整文档

**所有详细信息请查看**:
- 📘 **[项目完整文档](【项目总结】WhatsApp-AI自动化系统完整开发文档.md)** - 包含开发历程、技术架构、使用指南、问题解决等所有内容

---

## 🎯 主要功能

### 📊 Dashboard
- 实时系统状态监控
- 统计数据可视化
- 快速操作入口

### 👥 联系人管理
- 联系人CRUD操作
- 标签分类管理
- 批量导入联系人

### 💬 对话管理
- 多线程消息处理
- AI自动回复开关
- 消息历史记录

### 📝 消息模板
- 快速回复模板
- 变量替换功能
- 模板分类管理

### 📚 知识库
- 企业知识管理
- AI基于知识回复
- 分类组织

### 📤 批量操作
- 批量发送消息
- 进度跟踪
- 定时发送

---

## ⚙️ 配置选项

### 环境变量

编辑 `docker-compose.yml`:
```yaml
environment:
  - NODE_ENV=production
  - PORT=4000
  - LOG_LEVEL=info
  - AUTH_TOKEN=your_secret_token  # 启用认证（可选）
  - DEEPSEEK_API_KEY=sk-xxx       # AI密钥（可选）
```

### 资源限制

```yaml
mem_limit: 2g      # 内存限制
cpus: 2.0          # CPU限制
shm_size: 2gb      # 共享内存（Chrome需要）
```

---

## 🔧 故障排查

### 容器无法启动
```bash
docker-compose down
docker-compose up -d
docker-compose logs -f
```

### 二维码不显示
```bash
docker-compose restart
# 等待30秒后刷新页面
```

### 数据备份
```bash
# 备份会话数据
docker run --rm -v whatsapp_session_data:/data -v %cd%:/backup ubuntu tar czf /backup/session-backup.tar.gz /data
```

### 完全重置
```bash
docker-compose down -v  # 警告：删除所有数据！
docker-compose up -d
```

---

## 📁 项目结构

```
whatsapp-ai-automation/
├── Dockerfile              # Docker镜像配置
├── docker-compose.yml      # 容器编排
├── nginx.conf              # Nginx配置
│
├── server/                 # 后端服务
│   ├── app/src/           # TypeScript源码
│   └── prisma/            # 数据库模型
│
├── web/                    # 前端应用
│   ├── app/               # Next.js页面
│   ├── components/        # React组件
│   └── out/               # 构建产物
│
└── src/                    # 核心库
    └── structures/        # 数据结构
```

---

## 🌟 为什么选择Docker方案？

### 问题背景
Windows系统上Chrome的CacheStorage API存在系统级bug，导致：
- ❌ WhatsApp Web页面无法加载
- ❌ 二维码无法显示
- ❌ Service Worker失效

### 解决方案
使用Docker提供完全隔离的Linux环境：
- ✅ 干净的Ubuntu 20.04系统
- ✅ 正常工作的Chrome Stable
- ✅ 不受主机系统影响
- ✅ 一致的运行环境
- ✅ 一键启动，易于部署

**结果**: 问题彻底解决！二维码正常显示，所有功能完美运行！

---

## 📊 项目数据

```
开发周期: 12天 (2025.9.29 - 2025.10.10)
代码行数: ~42,000行高质量代码
核心功能: 70+ 个功能模块
组件数量: 60+ React组件
API端点: 50+ 个后端API
优化效果: 
  - 磁盘占用: ↓77% (3.5GB → 800MB)
  - 首屏加载: ↓75% (2.5s → <1s)
  - 二次访问: ↓94% (2.3s → <0.05s)
  - 网络流量: ↓90%
  - API调用: ↓96%
性能指标: 
  - 首屏加载: <1s
  - 二次访问: <0.05s
  - API响应: <100ms
  - 内存占用: <100MB
  - CPU使用: <20%
  - 滚动帧率: 60fps
```

---

## 📜 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

---

## 🙏 致谢

感谢以下开源项目：
- [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js)
- [Next.js](https://nextjs.org/)
- [Fastify](https://www.fastify.io/)
- [Prisma](https://www.prisma.io/)
- [Docker](https://www.docker.com/)

---

## 📞 获取帮助

如遇问题：
1. 查看日志: `docker-compose logs -f`
2. 检查状态: `docker-compose ps`
3. 阅读[完整文档](【项目总结】WhatsApp-AI自动化系统完整开发文档.md)
4. 重启服务: `docker-compose restart`

---

**版本**: 全功能完整版 v3.0  
**更新**: 2025-10-10  
**状态**: ✅ 生产就绪 - 70+ 核心功能已完成  
**仓库**: https://github.com/hongfei8888/Ai-whatsapp

---

**🚀 开始使用吧！祝您使用愉快！**
