# 🔍 AI自动回复故障排查指南

## 问题：收到消息没有立即收到AI回复

### 📋 立即检查清单

#### 1. WhatsApp连接状态
**访问管理台**: `http://localhost:3000` 或 `3001`
- [ ] Dashboard显示状态是否为 "Online"
- [ ] 如果显示其他状态，需要重新扫码或重启服务

#### 2. 操作流程验证
**重要**: 必须按正确流程操作才会触发AI回复

**❌ 错误流程**:
```
直接用WhatsApp发消息给联系人 → AI不会回复
```

**✅ 正确流程**:
```
1. 系统中添加联系人
2. 通过"Outreach"发送首发消息  
3. 对方回复后 → AI自动回复
```

#### 3. 线程状态检查
- [ ] 进入 Threads 页面
- [ ] 找到对应的对话线程
- [ ] 检查AI状态是否为 "Active"
- [ ] 如果是 "Paused"，点击 "Release" 按钮

### 🧪 详细排查步骤

#### 步骤1: 检查后端日志
在后端控制台查找以下关键信息：

**✅ 正常流程应该看到**:
```
{"msg":"incoming request","method":"GET","url":"/status"}
{"msg":"WhatsApp QR code updated"}
{"msg":"incoming message"} 
{"msg":"AI reply generated"}
{"msg":"outgoing message sent"}
```

**❌ 如果缺少某个步骤，说明问题出现在那里**

#### 步骤2: 检查数据库记录
我已启动 Prisma Studio: `http://localhost:5555`

**检查项目**:
1. **Messages表**: 
   - 是否有入站消息 (direction: IN)
   - 是否有对应的出站消息 (direction: OUT)
   
2. **Thread表**:
   - aiEnabled 是否为 true
   - takenOver 是否为 false
   - lastInboundAt 是否有最新时间

3. **Contact表**:
   - 联系人是否存在
   - cooldownUntil 是否已过期

#### 步骤3: API测试
```bash
# 测试状态
curl -H "Authorization: Bearer change-me" http://localhost:4000/status

# 测试线程列表  
curl -H "Authorization: Bearer change-me" http://localhost:4000/threads

# 测试联系人列表
curl -H "Authorization: Bearer change-me" http://localhost:4000/contacts
```

### 🔧 常见问题解决

#### 问题A: WhatsApp未连接
**症状**: Dashboard显示 "Awaiting QR" 或其他非 "Online" 状态
**解决**: 
1. 重新扫码登录
2. 确保手机WhatsApp正常
3. 检查网络连接

#### 问题B: 没有按正确流程操作
**症状**: 直接用WhatsApp发消息，AI不回复
**解决**: 
1. 必须先在系统中添加联系人
2. 通过 "Outreach" 发送首发消息
3. 对方回复后AI才会激活

#### 问题C: AI开关未启用
**症状**: 有对话记录但AI不回复
**解决**:
1. 进入 Threads 页面
2. 找到对应对话
3. 如果AI状态是 "Paused"，点击 "Release"

#### 问题D: DeepSeek API问题
**症状**: 有入站消息但没有AI回复
**解决**:
1. 检查 DEEPSEEK_API_KEY 是否有效
2. 确认API配额是否充足
3. 测试网络是否能访问DeepSeek API

#### 问题E: 违禁词过滤
**症状**: 某些消息有回复，某些没有
**解决**:
1. 检查用户消息是否包含违禁词
2. 查看 BANNED_KEYWORDS 配置

### 🎯 快速测试方案

#### 完整测试流程 (5分钟)

**1. 准备阶段**
- 确保后端运行在 4000 端口
- 访问前端 Dashboard 确认 WhatsApp "Online"

**2. 添加测试联系人**
```
进入 Contacts → Add Contact
手机号: +86138xxxxxxxx (您的另一个号码)
姓名: 测试联系人
```

**3. 发送首发消息**
```
点击联系人的 "Outreach" 按钮
消息内容: "这是测试消息，请回复'你好'测试自动回复"
点击发送
```

**4. 触发自动回复**
```
用另一个手机收到消息后
回复: "你好"
应该立即收到AI回复
```

**5. 验证结果**
```
进入 Threads 页面
查看对话记录
应该看到完整的消息流
```

### 🆘 如果问题仍然存在

请提供以下信息：

**1. WhatsApp状态**
- Dashboard 显示什么状态？

**2. 操作步骤**
- 是通过 "Outreach" 发送的首发消息吗？
- 还是直接用 WhatsApp 发的消息？

**3. 数据库记录**
- Prisma Studio 中是否有消息记录？
- Thread 的 aiEnabled 是否为 true？

**4. 后端日志**
- 控制台有什么错误信息？
- 有看到 "incoming message" 日志吗？

**5. 具体测试场景**
- 发送了什么消息？
- 对方是如何回复的？
- 期望什么样的回复？

根据这些信息，我可以精确定位问题所在！
