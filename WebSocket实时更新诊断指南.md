# WebSocket 实时更新诊断指南

## 🔍 快速诊断步骤

### 第 1 步：检查 WebSocket 连接状态

1. 打开浏览器开发者工具（F12）
2. 切换到 **Console（控制台）** 标签
3. 刷新页面，查找以下日志：

**期望看到的日志：**
```
🔌 尝试连接 WebSocket: ws://localhost:4000/ws
✅ WebSocket 已连接成功！
收到 WebSocket 消息: { type: 'connected', data: {...}, timestamp: ... }
```

**如果看到错误：**
- `WebSocket connection failed` → 后端服务器未运行或端口错误
- `ERR_CONNECTION_REFUSED` → 端口 4000 未监听

### 第 2 步：访问 WebSocket 测试页面

打开测试页面验证连接：
```
http://localhost:3000/test-ws
```

这个页面会显示：
- ✅ WebSocket 连接状态（实时）
- 📨 所有收到的 WebSocket 消息
- 🧪 可以手动发送测试消息

### 第 3 步：检查后端服务器

1. **确认后端服务器正在运行：**
   ```powershell
   # 检查端口 4000 是否被占用
   netstat -ano | findstr ":4000"
   ```

2. **如果没有运行，启动后端：**
   ```powershell
   cd server
   npm run dev
   ```

3. **检查后端日志：**
   后端启动后应该看到：
   ```
   Fastify server started on port 4000
   WebSocket service initialized
   ```

### 第 4 步：检查前端环境配置

1. **确认 `web/.env.local` 文件存在：**
   ```
   NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
   ```

2. **如果文件不存在，创建它：**
   ```powershell
   cd web
   echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:4000" > .env.local
   ```

3. **重启前端服务器：**
   ```powershell
   # 先停止前端（Ctrl+C）
   # 然后重新启动
   npm run dev
   ```

## 🐛 常见问题及解决方案

### 问题 1：WebSocket 无法连接

**症状：** 控制台显示 `WebSocket connection failed`

**解决方案：**
1. 确认后端服务器在端口 4000 上运行
2. 检查防火墙是否阻止了连接
3. 尝试直接访问 `http://localhost:4000/status` 确认后端可访问

### 问题 2：连接成功但收不到消息

**症状：** WebSocket 连接成功，但没有收到 `new_message` 事件

**可能原因：**
1. WhatsApp 客户端未初始化
2. WhatsApp 服务未监听消息事件

**解决方案：**
1. 在仪表盘页面扫码登录 WhatsApp
2. 确认 WhatsApp 状态为 "READY"
3. 发送测试消息验证

### 问题 3：消息延迟或不实时

**症状：** 消息需要刷新页面才能看到

**解决方案：**
1. 检查 WebSocket 连接是否保持活跃
2. 查看浏览器控制台是否有错误
3. 确认 `useWebSocket` Hook 在组件中正确使用

## 📊 WebSocket 消息类型

系统支持以下 WebSocket 消息类型：

| 消息类型 | 描述 | 数据格式 |
|---------|------|---------|
| `connected` | 连接成功确认 | `{ message: string }` |
| `new_message` | 新消息到达 | `{ from, to, body, fromMe, ... }` |
| `whatsapp_status` | WhatsApp 状态变化 | `{ status, state, ... }` |
| `qr_update` | 二维码更新 | `{ qr: string }` |
| `message_status` | 消息状态更新 | `{ messageId, status }` |

## 🔧 调试技巧

### 1. 在浏览器中查看 WebSocket 连接

1. 打开开发者工具（F12）
2. 切换到 **Network（网络）** 标签
3. 筛选 **WS（WebSocket）** 类型
4. 查看 `ws` 连接的详细信息

### 2. 测试 WebSocket 是否正常工作

在控制台中运行：
```javascript
const ws = new WebSocket('ws://localhost:4000/ws');
ws.onopen = () => console.log('✅ 连接成功');
ws.onmessage = (e) => console.log('📨 收到消息:', JSON.parse(e.data));
ws.onerror = (e) => console.error('❌ 连接错误:', e);
```

### 3. 查看实时消息日志

组件中已添加详细日志，打开控制台查看：
- `🔌 尝试连接 WebSocket:` - 连接尝试
- `✅ WebSocket 已连接成功！` - 连接成功
- `收到 WebSocket 消息:` - 接收到的消息
- `收到新消息，刷新会话列表:` - 新消息处理

## ✅ 验证 WebSocket 正常工作

完成以下步骤确认 WebSocket 正常：

1. [ ] 后端服务器运行在端口 4000
2. [ ] 前端可以访问 `http://localhost:3000`
3. [ ] 浏览器控制台显示 `✅ WebSocket 已连接成功！`
4. [ ] 测试页面 `/test-ws` 显示连接成功
5. [ ] WhatsApp 已扫码登录（状态 = READY）
6. [ ] 发送测试消息后，前端立即收到并显示

## 📝 联系支持

如果以上步骤都无法解决问题，请提供以下信息：

1. 浏览器控制台的完整日志（截图）
2. 后端服务器的启动日志
3. `/test-ws` 页面的状态截图
4. WhatsApp 连接状态

---

**提示：** 大多数实时更新问题都是由于 WebSocket 连接未建立或后端服务未运行导致的。请首先确认这两点！

