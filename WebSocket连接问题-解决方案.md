# WebSocket 连接问题 - 解决方案

## ⚠️ 问题描述

前端显示 WebSocket 连接错误：
```
❌ [单例] WebSocket 错误: {}
```

这是一个**非致命错误**，不会影响系统的基本功能。

---

## 🔍 问题原因

WebSocket 连接失败通常由以下原因导致：

### 1. **后端服务器未运行** ⭐ (最常见)
前端尝试连接到 `ws://localhost:4000/ws`，但后端服务器没有启动。

### 2. **端口配置不正确**
环境变量 `NEXT_PUBLIC_API_BASE_URL` 配置的端口与后端实际运行端口不一致。

### 3. **WebSocket 插件未启动**
后端的 `@fastify/websocket` 插件没有正确初始化。

### 4. **防火墙或代理问题**
防火墙阻止了 WebSocket 连接，或代理不支持 WebSocket。

---

## ✅ 解决方案

### 方案 1: 启动后端服务器 (推荐)

#### Windows:
```bash
cd server
npm install
npm run dev
```

或使用项目的启动脚本：
```bash
# 在项目根目录
.\start-dev.bat
```

#### Linux/Mac:
```bash
cd server
npm install
npm run dev
```

### 方案 2: 检查环境变量

确保前端的 `.env.local` 文件配置正确：

**web/.env.local**:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

### 方案 3: 验证后端 WebSocket 配置

检查后端是否正确注册了 WebSocket：

**server/app/src/server.ts**:
```typescript
// 应该包含这行
await app.register(require('@fastify/websocket'));

// 以及 WebSocket 服务初始化
webSocketService.initialize(app, accountManager);
```

### 方案 4: 测试 WebSocket 连接

在浏览器控制台中测试：
```javascript
// 测试 WebSocket 连接
const ws = new WebSocket('ws://localhost:4000/ws');
ws.onopen = () => console.log('✅ 连接成功');
ws.onerror = (e) => console.error('❌ 连接失败:', e);
```

---

## 🎯 改进措施

### 1. 改进的错误处理

已更新 `web/lib/websocketManager.ts`，改进：

- ✅ 将 error 改为 warning（非致命错误）
- ✅ 增加详细的调试信息
- ✅ 增加重连间隔到 5 秒（减少日志噪音）
- ✅ 提供更清晰的错误提示

### 2. 静默重连

WebSocket 会自动在后台重连，不会干扰用户：
- 每 5 秒尝试重连一次
- 连接成功后自动恢复实时功能
- 即使连接失败，系统其他功能仍可正常使用

### 3. 降级体验

即使 WebSocket 连接失败，系统仍然可以：
- ✅ 正常使用所有页面
- ✅ 查看账号和数据
- ✅ 发送消息
- ✅ 管理联系人
- ⚠️ 但失去实时更新功能（需要手动刷新）

---

## 📋 功能对比

| 功能 | 有 WebSocket | 无 WebSocket |
|-----|-------------|-------------|
| 账号管理 | ✅ | ✅ |
| 查看联系人 | ✅ | ✅ |
| 发送消息 | ✅ | ✅ |
| 查看消息 | ✅ | ✅ |
| 实时接收新消息 | ✅ | ❌ (需刷新) |
| 实时状态更新 | ✅ | ❌ (需刷新) |
| 二维码实时更新 | ✅ | ❌ (需刷新) |

---

## 🔧 调试步骤

### 1. 检查后端是否运行
```bash
# 检查端口是否被占用
netstat -ano | findstr :4000  # Windows
lsof -i :4000                 # Linux/Mac
```

### 2. 检查后端日志
启动后端时应该看到：
```
✓ WebSocket 服务已初始化
✓ Server listening on http://localhost:4000
```

### 3. 检查浏览器控制台
正常情况下应该看到：
```
🔌 [单例] 尝试连接 WebSocket: ws://localhost:4000/ws
✅ [单例] WebSocket 已成功连接
```

异常情况会看到：
```
⚠️ [WebSocket] 连接失败 - 后端服务器可能未运行
```

---

## 🚀 快速启动指南

### 完整启动流程：

1. **启动后端**:
   ```bash
   cd server
   npm install
   npm run dev
   ```
   等待看到: `Server listening on http://localhost:4000`

2. **启动前端**:
   ```bash
   cd web
   npm install
   npm run dev
   ```
   等待看到: `Ready on http://localhost:3000`

3. **访问应用**: 
   打开浏览器访问 `http://localhost:3000`

4. **检查 WebSocket**:
   在浏览器控制台应该看到：
   ```
   ✅ [单例] WebSocket 已成功连接
   ```

---

## ⚙️ 环境变量配置

### 前端 (web/.env.local)
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

### 后端 (server/.env)
```env
PORT=4000
DATABASE_URL="file:./prisma/dev.db"
# ... 其他配置
```

---

## 💡 常见问题

### Q1: WebSocket 一直重连，但都失败？
**A**: 检查后端是否运行在正确的端口（4000）。

### Q2: 后端运行了，但 WebSocket 还是连接失败？
**A**: 检查防火墙是否阻止了 WebSocket 连接。

### Q3: 开发环境下 WebSocket 正常，生产环境失败？
**A**: 生产环境需要配置 `NEXT_PUBLIC_API_BASE_URL` 为实际的服务器地址。

### Q4: WebSocket 连接失败影响使用吗？
**A**: 不影响基本功能，只是失去实时更新。可以通过手动刷新页面获取最新数据。

---

## 📊 监控 WebSocket 状态

可以在代码中添加状态监控：

```typescript
import { wsManager } from '@/lib/websocketManager';

// 获取连接状态
const state = wsManager.getConnectionState();

// WebSocket 状态码
// 0 = CONNECTING
// 1 = OPEN
// 2 = CLOSING
// 3 = CLOSED
```

---

## ✨ 总结

- WebSocket 连接失败是**非致命错误**
- 系统会自动在后台重连
- 主要功能不受影响
- 只需确保后端服务器运行即可

**如果看到 WebSocket 警告，请先启动后端服务器！** 🚀

