# 🐛 AI回复问题调试指南

## 当前状态检查

您已按正确流程操作但AI仍未回复。让我们逐步排查每个环节：

## 🔍 步骤1: 数据库详细检查

访问 Prisma Studio: `http://localhost:5555`

### 检查 Messages 表
查看最近的消息记录，确认：
- [ ] 有入站消息 (direction: "IN", 时间戳最新)
- [ ] 对应的线程ID (threadId)
- [ ] 消息内容 (text)

### 检查 Thread 表  
找到对应的线程记录，确认：
- [ ] aiEnabled = true
- [ ] takenOver = false 
- [ ] lastHumanAt 有最新时间戳
- [ ] contactId 对应正确的联系人

### 检查 Contact 表
确认联系人信息：
- [ ] 联系人存在
- [ ] 手机号正确
- [ ] cooldownUntil 为空或已过期

## 🔍 步骤2: 后端日志分析

### 启用详细日志
在后端控制台应该看到以下日志顺序：

```
1. {"msg":"incoming request", "method":"POST", "url":"/webhooks/message"}
2. {"msg":"Processing inbound message"}  
3. {"msg":"Contact found/created"}
4. {"msg":"Thread found/created"}
5. {"msg":"AI reply check - shouldSendAutoReply: true"}
6. {"msg":"Generating AI reply"}
7. {"msg":"AI reply generated successfully"}
8. {"msg":"Sending WhatsApp message"}
9. {"msg":"Message sent successfully"}
```

### 如果某个步骤缺失，问题就在那里

## 🔍 步骤3: 手动测试AI功能

让我们创建一个测试脚本来验证AI回复功能：

### 方法1: 直接测试DeepSeek API
```bash
# 测试DeepSeek API连接
curl -X POST https://api.deepseek.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-7c4774e671b84e39b16594c6a5e940cb" \
  -d '{
    "model": "deepseek-chat",
    "messages": [
      {"role": "system", "content": "你是一名中文客服助理"},
      {"role": "user", "content": "你好"}
    ]
  }'
```

### 方法2: 测试系统API
```bash
# 测试后端状态
curl -H "Authorization: Bearer change-me" http://localhost:4000/status

# 测试线程列表
curl -H "Authorization: Bearer change-me" http://localhost:4000/threads

# 测试联系人列表  
curl -H "Authorization: Bearer change-me" http://localhost:4000/contacts
```

## 🔧 常见问题排查

### 问题A: AI开关未正确设置
**检查**: Thread 表中 aiEnabled 字段
**解决**: 如果为 false，通过前端 "Release" 按钮启用

### 问题B: WhatsApp消息未正确接收
**检查**: Messages 表是否有入站消息
**解决**: 确保 WhatsApp Web 连接正常

### 问题C: DeepSeek API问题  
**检查**: 后端日志是否有API错误
**解决**: 验证API key有效性和配额

### 问题D: 消息处理逻辑错误
**检查**: 后端日志完整流程
**解决**: 重启后端服务

## 🚀 立即诊断步骤

### 1. 重现问题并观察日志
- 发送一条测试消息
- 立即查看后端控制台
- 记录出现的日志和缺失的日志

### 2. 检查数据库状态
- 访问 Prisma Studio
- 查看最新的消息记录
- 确认线程状态

### 3. 测试组件功能
- 测试 DeepSeek API 直接调用
- 测试后端 API 响应
- 测试 WhatsApp 连接状态

## 📊 诊断报告模板

请提供以下信息：

### 数据库状态
- [ ] Messages 表最新记录: ___
- [ ] Thread 表 aiEnabled: ___  
- [ ] Thread 表 takenOver: ___
- [ ] Contact 表状态: ___

### 后端日志
```
粘贴最近的后端控制台日志，特别是收到消息后的日志
```

### 前端状态
- [ ] Dashboard WhatsApp 状态: ___
- [ ] Threads 页面 AI 状态: ___
- [ ] 是否有对话记录: ___

### 测试结果
- [ ] DeepSeek API 直接测试: ___
- [ ] 后端 API 测试: ___
- [ ] 具体的操作步骤: ___

## 🎯 快速修复尝试

### 尝试1: 重启服务
```bash
# 停止后端 (Ctrl+C)
# 重新启动
npm run dev
```

### 尝试2: 清理并重新设置
```bash
# 清理数据库
rm dev.db
npx prisma db push

# 重新扫码登录
# 重新添加联系人测试
```

### 尝试3: 检查环境变量
```bash
# 确认配置正确
type .env | findstr DEEPSEEK
type .env | findstr COOLDOWN
```

根据以上诊断结果，我们可以精确定位问题并快速解决！
