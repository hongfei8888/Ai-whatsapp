# server.ts 修复进度报告

## ✅ 已修复（7个错误）

1. **行358**: `/status` - 添加 accountId，从 accountManager 获取 whatsappService ✅
2. **行391**: `/auth/login/start` - 添加 accountId 支持 ✅
3. **行416**: `/auth/qr` - 添加 accountId 支持 ✅  
4. **行447**: `/contacts POST` - 添加 accountId 参数 ✅
5. **行475**: `/contacts GET` - 添加 accountId 过滤 ✅
6. **行483**: `/contacts/whatsapp` - 从 accountManager 获取 whatsappService ✅
7. **行497**: `/contacts/sync-whatsapp` - 从 accountManager 获取 whatsappService ✅

## ⏸️ 待修复（约23个错误）

### 联系人相关

8. **行512**: `deleteContact(params.id)` - 需要添加 accountId
9. **行534**: `getContactById(params.id)` - 需要添加 accountId
10. **行535**: `getOrCreateThread(contact.id)` - 需要添加 accountId
11. **行548**: `whatsappService.sendMediaMessage(...)` - 需要从 accountManager 获取
12. **行555**: `recordMessage({...})` - 需要添加 accountId
13. **行507**: `whatsappService.sendTextMessage(...)` - 需要从 accountManager 获取
14. **行834**: `getContactById(params.id)` - 需要添加 accountId

### 会话相关

15. **行578**: `listThreads()` - 需要添加 accountId
16. **行605**: `getOrCreateThread(contact.id)` - 需要添加 accountId
17. **行670**: `getOrCreateThread(params.id)` - 需要添加 accountId（参数错误，应该是contactId）
18. **行692**: `getOrCreateThread(params.id)` - 需要添加 accountId

### 消息发送相关

19. **行598**: `getContactByPhone(body.phoneE164)` - 需要添加 accountId
20. **行601**: `createContact({ phoneE164: body.phoneE164 })` - 需要添加 accountId
21. **行609**: `whatsappService.sendTextMessage(...)` - 需要从 accountManager 获取
22. **行613**: `recordMessageIfMissing({...})` - 需要添加 accountId
23. **行625**: `where: { externalId: response.id }` - 需要使用复合唯一约束

### 登出相关

24. **行721**: `whatsappService.getStatus()` - 需要从 accountManager 获取
25. **行725**: `whatsappService.logout()` - 需要从 accountManager 获取
26. **行728**: `whatsappService.getStatus()` - 需要从 accountManager 获取
27. **行747**: `whatsappService.getStatus()` - 需要从 accountManager 获取
28. **行762**: `whatsappService.getStatus()` - 需要从 accountManager 获取
29. **行766**: `whatsappService.logout()` - 需要从 accountManager 获取
30. **行769**: `whatsappService.getStatus()` - 需要从 accountManager 获取
31. **行788**: `whatsappService.getStatus()` - 需要从 accountManager 获取

## 🔧 修复模式

### 模式1：删除联系人
```typescript
// ❌ 错误
await deleteContact(params.id);

// ✅ 正确
const accountId = request.accountId!;
await deleteContact(accountId, params.id);
```

### 模式2：获取联系人
```typescript
// ❌ 错误  
const contact = await getContactById(params.id);

// ✅ 正确
const accountId = request.accountId!;
const contact = await getContactById(accountId, params.id);
```

### 模式3：获取 WhatsAppService
```typescript
// ❌ 错误
const status = whatsappService.getStatus();

// ✅ 正确
const accountId = request.accountId!;
const whatsappService = accountManager.getAccountService(accountId);
if (!whatsappService) {
  return sendError(reply, 404, { code: 'ACCOUNT_NOT_FOUND', message: 'Account not found' });
}
const status = whatsappService.getStatus();
```

### 模式4：修复复合唯一约束
```typescript
// ❌ 错误
await prisma.message.findUnique({
  where: { externalId: response.id }
});

// ✅ 正确
await prisma.message.findFirst({
  where: { 
    accountId,
    externalId: response.id 
  }
});
```

## 📊 统计

- **总错误**: 30个
- **已修复**: 7个（23%）
- **待修复**: 23个（77%）
- **预计剩余时间**: 45-60分钟

## 🎯 下一步

继续批量修复剩余的23个错误，按以下顺序：
1. 联系人操作相关（7个）- 15分钟
2. 会话操作相关（4个）- 10分钟  
3. 消息发送相关（6个）- 15分钟
4. 登出和状态相关（8个）- 15分钟

