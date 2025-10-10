# WebSocket 实时更新增强实施指南

## 概述

为聊天系统添加更多实时事件，支持消息编辑、删除、星标、会话管理等操作的实时同步。

---

## 一、后端 WhatsApp Service 增强

### 文件：`server/app/src/whatsapp-service.ts`

#### 1. 添加新的事件类型

在文件顶部添加事件类型定义：

```typescript
// 新增：WebSocket 事件类型
export interface WebSocketEvent {
  type: string;
  data: any;
  timestamp: number;
}

export interface MessageEditedEvent {
  messageId: string;
  threadId: string;
  text: string;
  editedAt: string;
}

export interface MessageDeletedEvent {
  messageId: string;
  threadId: string;
  deletedAt: string;
  deletedBy: string;
}

export interface MessageStarredEvent {
  messageId: string;
  threadId: string;
  isStarred: boolean;
  starredAt: string | null;
}

export interface ThreadPinnedEvent {
  threadId: string;
  isPinned: boolean;
  pinnedAt: string | null;
}

export interface ThreadArchivedEvent {
  threadId: string;
  isArchived: boolean;
  archivedAt: string | null;
}

export interface TypingEvent {
  threadId: string;
  contactId: string;
  isTyping: boolean;
}
```

#### 2. 添加事件触发方法

在 WhatsAppService 类中添加以下方法：

```typescript
/**
 * 触发消息编辑事件
 */
emitMessageEdited(messageId: string, threadId: string, text: string) {
  this.emit('message_edited', {
    messageId,
    threadId,
    text,
    editedAt: new Date().toISOString(),
  });
  
  logger.info({ messageId, threadId }, 'Message edited event emitted');
}

/**
 * 触发消息删除事件
 */
emitMessageDeleted(messageId: string, threadId: string, deletedBy: string) {
  this.emit('message_deleted', {
    messageId,
    threadId,
    deletedAt: new Date().toISOString(),
    deletedBy,
  });
  
  logger.info({ messageId, threadId }, 'Message deleted event emitted');
}

/**
 * 触发消息星标事件
 */
emitMessageStarred(messageId: string, threadId: string, isStarred: boolean) {
  this.emit('message_starred', {
    messageId,
    threadId,
    isStarred,
    starredAt: isStarred ? new Date().toISOString() : null,
  });
  
  logger.info({ messageId, threadId, isStarred }, 'Message starred event emitted');
}

/**
 * 触发会话置顶事件
 */
emitThreadPinned(threadId: string, isPinned: boolean) {
  this.emit('thread_pinned', {
    threadId,
    isPinned,
    pinnedAt: isPinned ? new Date().toISOString() : null,
  });
  
  logger.info({ threadId, isPinned }, 'Thread pinned event emitted');
}

/**
 * 触发会话归档事件
 */
emitThreadArchived(threadId: string, isArchived: boolean) {
  this.emit('thread_archived', {
    threadId,
    isArchived,
    archivedAt: isArchived ? new Date().toISOString() : null,
  });
  
  logger.info({ threadId, isArchived }, 'Thread archived event emitted');
}

/**
 * 触发正在输入事件
 */
emitTyping(threadId: string, contactId: string, isTyping: boolean) {
  this.emit('typing', {
    threadId,
    contactId,
    isTyping,
  });
}
```

---

## 二、后端路由集成

### 1. 消息路由 (`server/app/src/routes/messages.ts`)

在消息操作的路由处理中添加事件触发：

```typescript
// 编辑消息
server.put('/messages/:id/edit', async (request, reply) => {
  try {
    const { id } = request.params as { id: string };
    const { text } = request.body as { text: string };
    
    const message = await messageService.editMessage(id, text);
    
    // 触发 WebSocket 事件
    const whatsappService = request.server.whatsappService;
    if (whatsappService) {
      whatsappService.emitMessageEdited(id, message.threadId, text);
    }
    
    return reply.send({ ok: true, message });
  } catch (error) {
    // ...
  }
});

// 删除消息
server.delete('/messages/:id', async (request, reply) => {
  try {
    const { id } = request.params as { id: string };
    
    const message = await messageService.deleteMessage(id);
    
    // 触发 WebSocket 事件
    const whatsappService = request.server.whatsappService;
    if (whatsappService) {
      whatsappService.emitMessageDeleted(id, message.threadId, 'user');
    }
    
    return reply.send({ ok: true, message });
  } catch (error) {
    // ...
  }
});

// 标记星标
server.post('/messages/:id/star', async (request, reply) => {
  try {
    const { id } = request.params as { id: string };
    const { starred } = request.body as { starred: boolean };
    
    const message = await messageService.starMessage(id, starred);
    
    // 触发 WebSocket 事件
    const whatsappService = request.server.whatsappService;
    if (whatsappService) {
      whatsappService.emitMessageStarred(id, message.threadId, starred);
    }
    
    return reply.send({ ok: true, message });
  } catch (error) {
    // ...
  }
});
```

### 2. 会话路由 (`server/app/src/routes/threads.ts`)

```typescript
// 置顶会话
server.post('/threads/:id/pin', async (request, reply) => {
  try {
    const { id } = request.params as { id: string };
    const { pinned } = request.body as { pinned: boolean };
    
    const thread = await threadService.pinThread(id, pinned);
    
    // 触发 WebSocket 事件
    const whatsappService = request.server.whatsappService;
    if (whatsappService) {
      whatsappService.emitThreadPinned(id, pinned);
    }
    
    return reply.send({ ok: true, thread });
  } catch (error) {
    // ...
  }
});

// 归档会话
server.post('/threads/:id/archive', async (request, reply) => {
  try {
    const { id } = request.params as { id: string };
    const { archived } = request.body as { archived: boolean };
    
    const thread = await threadService.archiveThread(id, archived);
    
    // 触发 WebSocket 事件
    const whatsappService = request.server.whatsappService;
    if (whatsappService) {
      whatsappService.emitThreadArchived(id, archived);
    }
    
    return reply.send({ ok: true, thread });
  } catch (error) {
    // ...
  }
});
```

---

## 三、前端 WebSocket 客户端增强

### 文件：`web/lib/useWebSocket.ts`

#### 添加新事件类型的 TypeScript 定义

```typescript
interface WebSocketMessage {
  type: 'connected' | 'status_changed' | 'new_message' | 'message_status' 
    | 'message_edited' | 'message_deleted' | 'message_starred' | 'message_read'
    | 'thread_pinned' | 'thread_archived' | 'typing';
  data: any;
  timestamp: number;
}
```

#### 更新事件处理逻辑

现有的 `useWebSocket` hook 已经可以接收所有事件，只需要在使用端处理新的事件类型即可。

---

## 四、前端聊天页面事件处理

### 文件：`web/app/chat/[id]/page.tsx`

在 `useEffect` 中添加新事件的处理：

```typescript
useEffect(() => {
  if (!lastMessage) return;
  
  const { type, data } = lastMessage;
  
  switch (type) {
    case 'new_message':
      handleNewMessage(data);
      break;
      
    case 'message_edited':
      handleMessageEdited(data);
      break;
      
    case 'message_deleted':
      handleMessageDeleted(data);
      break;
      
    case 'message_starred':
      handleMessageStarred(data);
      break;
      
    case 'message_read':
      handleMessageRead(data);
      break;
      
    case 'thread_pinned':
      handleThreadPinned(data);
      break;
      
    case 'thread_archived':
      handleThreadArchived(data);
      break;
      
    case 'typing':
      handleTyping(data);
      break;
      
    case 'message_status':
      handleMessageStatus(data);
      break;
  }
}, [lastMessage]);
```

#### 添加事件处理函数

```typescript
const handleMessageEdited = (data: any) => {
  setState((prev) => ({
    ...prev,
    messages: prev.messages.map((msg) =>
      msg.id === data.messageId
        ? { 
            ...msg, 
            text: data.text, 
            isEdited: true, 
            editedAt: data.editedAt 
          }
        : msg
    ),
  }));
  
  console.log('✏️ 消息已编辑:', data.messageId);
};

const handleMessageDeleted = (data: any) => {
  setState((prev) => ({
    ...prev,
    messages: prev.messages.map((msg) =>
      msg.id === data.messageId
        ? { 
            ...msg, 
            isDeleted: true, 
            deletedAt: data.deletedAt,
            deletedBy: data.deletedBy 
          }
        : msg
    ),
  }));
  
  console.log('🗑️ 消息已删除:', data.messageId);
};

const handleMessageStarred = (data: any) => {
  setState((prev) => ({
    ...prev,
    messages: prev.messages.map((msg) =>
      msg.id === data.messageId
        ? { 
            ...msg, 
            isStarred: data.isStarred, 
            starredAt: data.starredAt 
          }
        : msg
    ),
  }));
  
  console.log('⭐ 消息星标更新:', data.messageId, data.isStarred);
};

const handleMessageRead = (data: any) => {
  setState((prev) => ({
    ...prev,
    messages: prev.messages.map((msg) =>
      msg.id === data.messageId
        ? { ...msg, readAt: data.readAt }
        : msg
    ),
  }));
  
  console.log('✓✓ 消息已读:', data.messageId);
};

const handleThreadPinned = (data: any) => {
  if (data.threadId !== threadId) return;
  
  setState((prev) => ({
    ...prev,
    currentThread: prev.currentThread
      ? {
          ...prev.currentThread,
          isPinned: data.isPinned,
          pinnedAt: data.pinnedAt,
        }
      : null,
  }));
  
  console.log('📌 会话置顶状态更新:', data.isPinned);
};

const handleThreadArchived = (data: any) => {
  if (data.threadId !== threadId) return;
  
  setState((prev) => ({
    ...prev,
    currentThread: prev.currentThread
      ? {
          ...prev.currentThread,
          isArchived: data.isArchived,
          archivedAt: data.archivedAt,
        }
      : null,
  }));
  
  console.log('📦 会话归档状态更新:', data.isArchived);
};

const handleTyping = (data: any) => {
  if (data.threadId !== threadId) return;
  
  // 显示"正在输入..."提示
  // 可以添加一个定时器，3秒后自动清除
  console.log('✍️ 对方正在输入...');
};
```

---

## 五、实施步骤

### 步骤 1：更新后端 WhatsApp Service
1. 在 `whatsapp-service.ts` 中添加新的事件类型定义
2. 添加事件触发方法（`emitMessageEdited` 等）

### 步骤 2：更新消息路由
1. 在 `routes/messages.ts` 的相应端点中添加事件触发
2. 确保所有消息操作都会触发对应的 WebSocket 事件

### 步骤 3：更新会话路由
1. 在 `routes/threads.ts` 的相应端点中添加事件触发
2. 确保会话管理操作都会触发对应的 WebSocket 事件

### 步骤 4：更新前端事件处理
1. 在 `useWebSocket.ts` 中添加新事件类型定义（如果需要）
2. 在聊天页面中添加新事件的处理函数
3. 更新 UI 以响应实时事件

### 步骤 5：测试
1. 测试消息编辑的实时同步
2. 测试消息删除的实时同步
3. 测试消息星标的实时同步
4. 测试会话置顶/归档的实时同步
5. 测试多设备场景

---

## 六、测试清单

- [ ] 消息编辑后，其他设备立即看到更新
- [ ] 消息删除后，其他设备立即看到"此消息已删除"
- [ ] 消息标记星标后，其他设备立即看到星标图标
- [ ] 会话置顶后，其他设备立即更新会话列表顺序
- [ ] 会话归档后，其他设备立即更新会话列表
- [ ] 正在输入提示正常显示（可选功能）
- [ ] WebSocket 断开重连后，所有事件正常工作

---

## 七、注意事项

### 性能考虑
- 频繁的 WebSocket 事件可能影响性能，考虑添加事件节流
- 大量消息更新时，使用批量更新而不是逐个更新

### 错误处理
- WebSocket 断开时，确保事件不会丢失
- 考虑添加事件队列，在重连后重新发送

### 安全性
- 确保 WebSocket 事件只发送给相关的用户
- 验证事件数据的合法性

### 兼容性
- 确保旧版本客户端不会因为新事件类型而崩溃
- 添加版本检查和优雅降级

---

## 八、快速实施代码片段

### 快速添加到 whatsapp-service.ts

在 WhatsAppService 类中添加：

```typescript
// 在类的方法区域添加
emitMessageEdited(messageId: string, threadId: string, text: string) {
  this.emit('message_edited', { messageId, threadId, text, editedAt: new Date().toISOString() });
}

emitMessageDeleted(messageId: string, threadId: string, deletedBy: string) {
  this.emit('message_deleted', { messageId, threadId, deletedAt: new Date().toISOString(), deletedBy });
}

emitMessageStarred(messageId: string, threadId: string, isStarred: boolean) {
  this.emit('message_starred', { messageId, threadId, isStarred, starredAt: isStarred ? new Date().toISOString() : null });
}

emitThreadPinned(threadId: string, isPinned: boolean) {
  this.emit('thread_pinned', { threadId, isPinned, pinnedAt: isPinned ? new Date().toISOString() : null });
}

emitThreadArchived(threadId: string, isArchived: boolean) {
  this.emit('thread_archived', { threadId, isArchived, archivedAt: isArchived ? new Date().toISOString() : null });
}
```

### 快速添加到路由

在每个相关的路由处理函数末尾添加：

```typescript
// 获取 whatsappService 实例
const whatsappService = request.server.whatsappService;
if (whatsappService) {
  whatsappService.emitXXX(...); // 调用对应的事件方法
}
```

---

**实施完成后，系统将具备完整的实时更新能力！**

