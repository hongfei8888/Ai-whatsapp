
# 📑 WhatsApp AI 自动回复工具（MVP 单号版，DeepSeek版）

## 一、项目目标

基于 `whatsapp-web.js`，实现 **1 个运营号** 的最小 MVP：

* 扫码登录（会话持久化）
* 手动录入联系人 & 发起首发消息（必须人工触发）
* 当联系人回话后 → 进入 **AI 自动回复**（规则匹配 → DeepSeek 模型 → 兜底话术）
* 提供最小后台（管理台）操作界面

---

## 二、前端需求

### 技术栈

* **Next.js 15 + TypeScript**
* **TailwindCSS + shadcn/ui**（UI 组件库）
* **react-hook-form + zod**（表单验证）

### 页面与功能

1. **Dashboard**

   * 显示运营号状态：

     * 在线/离线/待扫码
     * 待扫码时显示二维码（轮询 `/auth/qr`）
   * 最近活动摘要（最新消息时间 / 联系人数量）

2. **Contacts**

   * 添加联系人（手机号 E.164 + 姓名）
   * 列表：姓名 / 手机号 / 冷却剩余 / 操作按钮
   * **首发按钮** → 弹窗输入消息文本 → 调用 `POST /contacts/:id/outreach`

     * 冷却中则禁用并显示剩余时间
     * 发送成功 toast 提示

3. **Threads/[id]**

   * 会话消息流（入站/出站分左右显示）
   * 显示联系人信息与 AI 状态
   * 按钮：接管 / 释放（调用 `/threads/:id/takeover` / `release`）
   * 可视化冷却计时（仅展示）

4. **Settings**

   * 只读展示：

     * 冷却时长（COOLDOWN_HOURS）
     * 单联系人自动回复冷却（PER_CONTACT_REPLY_COOLDOWN）

---

## 三、后端需求

### 技术栈

* Node.js 20 + TypeScript
* Fastify（REST API）
* Prisma + SQLite（存储）
* Pino（结构化日志）
* whatsapp-web.js（消息收发）
* **DeepSeek API**（LLM 回复）

### 环境变量（.env.example）

```
NODE_ENV=development
DATABASE_URL=file:./dev.db
SESSION_PATH=./.session
PORT=4000

DEEPSEEK_API_KEY=sk-xxxx
DEEPSEEK_MODEL=deepseek-chat

AUTH_TOKEN=changeme
COOLDOWN_HOURS=24
PER_CONTACT_REPLY_COOLDOWN=10
```

### 数据模型（Prisma）

```prisma
model Contact {
  id            String   @id @default(cuid())
  phoneE164     String   @unique
  name          String?
  cooldownUntil DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Thread {
  id         String   @id @default(cuid())
  contactId  String
  aiEnabled  Boolean  @default(false)
  lastHumanAt DateTime?
  lastBotAt   DateTime?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}

model Message {
  id        String   @id @default(cuid())
  threadId  String
  direction String   // IN / OUT
  text      String?
  status    String   // SENT / FAILED / QUEUED
  createdAt DateTime @default(now())
}
```

### API 设计

* **系统**

  * `GET /status` → `{ online, sessionReady, qr? }`
  * `GET /auth/qr` → `{ qr: base64 | null }`
* **联系人**

  * `POST /contacts` → 新建联系人
  * `GET /contacts` → 列表，含冷却剩余秒数
* **首发消息**

  * `POST /contacts/:id/outreach`

    * body: `{ content: string }`
    * 守卫：冷却期、违禁词过滤（`保证|永久|群发|官方`）
* **线程/消息**

  * `GET /threads` → 最近对话列表
  * `GET /threads/:id/messages?limit=50` → 消息流
  * `POST /threads/:id/takeover` → 停止 AI
  * `POST /threads/:id/release` → 开启 AI

### 自动回复管道

1. 仅处理 **fromMe=false** 的入站消息
2. 找到对应 Thread：

   * 若不存在 → 新建 + `aiEnabled=true` + 发送一次欢迎语
3. 自动回复（需满足 **单联系人节流 ≥ PER_CONTACT_REPLY_COOLDOWN 秒**）
4. 回复顺序：

   * 规则匹配（简单关键词，如“退款” → 固定模板）
   * DeepSeek 调用

     * prompt：

       ```
       你是一个WhatsApp客服助手，请用简短、礼貌、专业的方式回复用户问题。
       要求：
       - 中文回答
       - 限制在120字以内
       - 不要承诺100%保证、永久有效等
       - 若无法回答，提示"我记录下来了，会尽快回复你"
       ```
   * 无结果 → 兜底话术

### 错误返回格式

```json
{ "ok": false, "code": "COOLDOWN|CONTENT|VALIDATION|SEND_FAIL", "message": "..." }
```

---

## 四、验收标准

* [ ] 能扫码登录并保持会话
* [ ] 能添加联系人，重复手机号报错
* [ ] 首发消息只能人工触发，冷却生效
* [ ] 对方回话后能进入 AI 自动回复（DeepSeek 模型）
* [ ] 所有消息写入数据库
* [ ] Dashboard 显示在线状态或二维码
* [ ] Contacts 可新增、搜索、发首发、显示冷却
* [ ] Threads 显示完整消息流，可切换 AI 开关

---

## 五、Cursor 提示词（开发用）

```
你是资深全栈工程师。请在当前 whatsapp-web.js 单号项目上，按以下需求实现 MVP：

后端：
- 使用 Fastify + Prisma(SQLite) + Pino
- 数据模型：Contact / Thread / Message
- 接口：GET /status, GET /auth/qr, POST /contacts, GET /contacts, POST /contacts/:id/outreach, GET /threads, GET /threads/:id/messages, POST /threads/:id/takeover, POST /threads/:id/release
- 守卫逻辑：首发必须人工触发，冷却COOLDOWN_HOURS，违禁词过滤
- 自动回复：对方回话后，若 aiEnabled=true，则触发
   1) 规则匹配
   2) DeepSeek 模型 (调用 /v1/chat/completions，model=DEEPSEEK_MODEL，携带 DEEPSEEK_API_KEY)
   3) 兜底话术
- 所有消息写入数据库
- 统一错误返回格式

前端（Next.js + Tailwind + shadcn/ui）：
- /dashboard: 显示运营号在线状态，若未登录展示二维码
- /contacts: 列表+新增联系人；操作按钮首发消息（弹窗输入）
- /threads/[id]: 展示消息流，按钮接管/释放
- /settings: 只读显示冷却配置

请在保持现有逻辑的前提下，增量实现以上功能，输出修改文件清单和说明。


