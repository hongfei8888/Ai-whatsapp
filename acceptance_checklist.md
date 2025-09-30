# Acceptance Checklist

## Backend Stack
- [x] Node.js 20 + TypeScript
- [x] Fastify REST API
- [x] Prisma + SQLite persistence
- [x] Pino structured logging
- [x] whatsapp-web.js integration
- [x] DeepSeek API client for LLM replies

## Frontend Stack
- [x] Next.js 15 + TypeScript
- [x] TailwindCSS + shadcn/ui components
- [x] react-hook-form + zod validation

## Environment Variables (.env.example)
- [x] NODE_ENV
- [x] DATABASE_URL
- [x] SESSION_PATH
- [x] PORT
- [x] DEEPSEEK_API_KEY
- [x] DEEPSEEK_API_URL
- [x] DEEPSEEK_MODEL
- [x] AUTH_TOKEN
- [x] COOLDOWN_HOURS
- [x] PER_CONTACT_REPLY_COOLDOWN
- [x] BANNED_KEYWORDS
- [x] LLM_MAX_TOKENS
- [x] LLM_TEMPERATURE
- [x] LLM_MIN_CHARS
- [x] LLM_STYLE_PRESET

## Prisma Data Model
- [x] Contact: id, phoneE164, name, cooldownUntil, createdAt, updatedAt
- [x] Thread: id, contactId, aiEnabled, lastHumanAt, lastBotAt, createdAt, updatedAt
- [x] Message: id, threadId, direction, text, status (SENT/FAILED/QUEUED), createdAt
- [x] AiConfig: id='global', systemPrompt, maxTokens, temperature, minChars, stylePreset, timestamps

## Backend API Surface
- [x] GET /status → { online, sessionReady, qr, cooldowns }
- [x] GET /auth/qr → QR payload
- [x] POST /contacts → create contact with zod validation
- [x] GET /contacts → list with cooldown remaining seconds
- [x] POST /contacts/:id/outreach → manual outreach with guards
- [x] GET /threads → latest conversations summary
- [x] GET /threads/:id/messages?limit=50 → thread messages
- [x] POST /threads/:id/takeover → disable automation
- [x] POST /threads/:id/release → resume automation
- [x] GET /ai/config → fetch global AI configuration
- [x] PUT /ai/config → update global AI configuration
- [x] POST /ai/test → generate preview reply without persistence

## Automation Pipeline
- [x] Handle only inbound (fromMe = false) messages
- [x] Auto-create thread + greeting when first inbound arrives
- [x] Honor PER_CONTACT_REPLY_COOLDOWN between AI replies
- [x] Rule match → DeepSeek → fallback ordering
- [x] Persist every message to the database
- [x] DeepSeek calls use cached AiConfig (30s TTL)
- [x] Fallback retry supplements short replies using minChars heuristic

## Frontend Screens
- [x] /dashboard: status card, QR polling, recent metrics
- [x] /contacts: search, creation form, outreach modal, cooldown state
- [x] /threads/[id]: conversation view, AI pause/resume, metadata
- [x] /settings: AI 回复配置卡片（系统提示词、Max Tokens、Temperature、最小字数、风格、试一试对话）

## Error Handling
- [x] zod validation for all request payloads
- [x] Unified error envelope { ok: false, code, message, details? }

## End-to-End Criteria (manual verification recommended)
- [ ] Scan QR and persist session
- [ ] Add contact with duplicate guard (manual test)
- [ ] Manual outreach respects cooldown & forbidden words
- [ ] Contact replies trigger AI automation (requires WhatsApp runtime)
- [ ] Message ingestion persists to database during live run
