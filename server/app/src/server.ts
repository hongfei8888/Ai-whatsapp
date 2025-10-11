import Fastify, { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z, ZodError } from 'zod';
import { appConfig, isAuthEnabled } from './config';
import { logger } from './logger';
import type { WPPConnectService } from './wppconnect-service';
import { AccountManager } from './services/account-manager';

// 扩展 Fastify 类型以包含 accountManager 和 prisma
declare module 'fastify' {
  interface FastifyInstance {
    accountManager: AccountManager;
    prisma: typeof prisma;
  }
  interface FastifyRequest {
    accountId?: string;
  }
}
import { webSocketService } from './websocket-service';
import {
  AuthenticationError,
  ContactAlreadyExistsError,
  ContactNotFoundError,
  ForbiddenKeywordError,
  MessageSendError,
  ThreadNotFoundError,
  ValidationError,
} from './errors';
import {
  ContactView,
  createContact,
  deleteContact,
  getContactById,
  getContactByPhone,
  listContacts,
} from './services/contact-service';
import { sendOutreach } from './services/outreach-service';
import {
  clearAiConfigCache,
  ensureAiConfig,
  getAiConfig,
  serializeAiConfig,
  updateAiConfig,
} from './services/ai-config-service';
import {
  deleteThread,
  getThreadSummary,
  getThreadWithMessages,
  listThreads,
  setAiEnabled,
} from './services/thread-service';
import {
  createTemplate,
  listTemplates,
  updateTemplate,
  getTemplateById,
  serializeTemplate,
} from './services/template-service';
import {
  createCampaign,
  listCampaigns,
  getCampaignById,
  getCampaignRecipients,
  startCampaign,
  pauseCampaign,
  cancelCampaign,
  previewCampaignMessages,
  serializeCampaign,
  serializeRecipient,
} from './services/campaign-service';
import { CampaignRecipientStatus, CampaignStatus } from '@prisma/client';
import { sendError, sendOk } from './http/response';
import { accountContextMiddleware } from './middleware/account-context';
import { accountRoutes } from './routes/accounts';
import { contactRoutes } from './routes/contacts';
import { prisma } from './prisma';
import { generatePreviewReply } from './ai/pipeline';
import { templateRoutes, categoryRoutes } from './routes/templates';
import { batchRoutes } from './routes/batch';
import { knowledgeRoutes, knowledgeCategoryRoutes } from './routes/knowledge';
import { translationRoutes } from './routes/translation';
import { statsRoutes } from './routes/stats';
import { dataManagementRoutes } from './routes/data-management';
import mediaRoutes from './routes/media';
import { messageRoutes } from './routes/messages';
import { threadRoutes } from './routes/threads';
import { groupRoutes } from './routes/groups';
import { 
  getSystemSettings, 
  updateSystemSettings 
} from './services/system-settings-service';
import * as fs from 'fs/promises';
import * as path from 'path';
import { recordMessage, recordMessageIfMissing } from './services/message-service';
import { getOrCreateThread } from './services/thread-service';
import { MessageDirection, MessageStatus } from '@prisma/client';

interface AuthenticatedRequest extends FastifyRequest {
  user?: { token: string };
}

const createContactSchema = z.object({
  phoneE164: z.string().min(5),
  name: z.string().min(1).max(80).optional(),
  consent: z.boolean().optional(),
}).strict();

const contactIdSchema = z.object({
  id: z.string().min(1),
});

const outreachBodySchema = z.object({
  content: z.string().min(1).max(1000),
}).strict();

const aiConfigSchema = z.object({
  systemPrompt: z.string().min(40).max(4000),
  maxTokens: z.number().int().min(128).max(2048),
  temperature: z.number().min(0).max(1),
  minChars: z.number().int().min(20).max(600),
  stylePreset: z.enum(['concise-cn', 'sales-cn', 'support-cn']),
}).strict();

const aiTestSchema = z.object({
  user: z.string().min(1).max(1000),
  context: z.string().min(1).max(2000).optional(),
}).strict();

const messagesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(1000).optional(),
});

const createTemplateSchema = z.object({
  name: z.string().min(1).max(120),
  content: z.string().min(1).max(2000),
  variables: z.array(z.string().min(1).max(50)).optional(),
}).strict();

const updateTemplateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  content: z.string().min(1).max(2000).optional(),
  variables: z.array(z.string().min(1).max(50)).optional(),
}).refine((value) => value.name || value.content || (value.variables && value.variables.length > 0), {
  message: 'At least one field must be provided for update',
});

const createCampaignSchema = z.object({
  name: z.string().min(1).max(120),
  templateId: z.string().min(1).optional(),
  content: z.string().min(1).max(2000).optional(),
  contactIds: z.array(z.string().min(1)).optional(),
  scheduleAt: z.string().datetime().optional(),
  ratePerMinute: z.number().int().min(1).max(60).optional(),
  jitterMs: z.number().int().min(0).max(2000).optional(),
}).refine((value) => Boolean(value.templateId) || Boolean(value.content), {
  message: 'templateId or content is required',
});

const campaignListQuerySchema = z.object({
  status: z.nativeEnum(CampaignStatus).optional(),
});

const campaignRecipientsQuerySchema = z.object({
  status: z.nativeEnum(CampaignRecipientStatus).optional(),
  take: z.coerce.number().int().min(1).max(200).optional(),
  cursor: z.string().optional(),
});

const previewQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).optional(),
});

const settingsSchema = z.object({
  globalAiEnabled: z.boolean().optional(),
  welcomeTemplate: z.string().min(1).max(500).optional(),
}).strict();

const authHook = async (request: AuthenticatedRequest): Promise<void> => {
  if (!isAuthEnabled) {
    return;
  }

  const authHeader = request.headers.authorization;
  if (!authHeader) {
    throw new AuthenticationError();
  }

  const [scheme, token] = authHeader.split(' ');
  if (!token || scheme.toLowerCase() !== 'bearer' || token !== appConfig.authToken) {
    throw new AuthenticationError();
  }

  request.user = { token };
};

const errorHandler = async (error: any, request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  if (error instanceof AuthenticationError) {
    await sendError(reply, 401, { code: 'UNAUTHORIZED', message: error.message });
    return;
  }

  if (error instanceof ContactAlreadyExistsError) {
    await sendError(reply, 409, { code: 'CONTACT_EXISTS', message: error.message });
    return;
  }

  if (error instanceof ContactNotFoundError) {
    await sendError(reply, 404, { code: 'CONTACT_NOT_FOUND', message: error.message });
    return;
  }

  if (error instanceof ThreadNotFoundError) {
    await sendError(reply, 404, { code: 'THREAD_NOT_FOUND', message: error.message });
    return;
  }


  if (error instanceof ForbiddenKeywordError) {
    await sendError(reply, 422, { code: 'CONTENT', message: error.message });
    return;
  }

  if (error instanceof MessageSendError) {
    await sendError(reply, 502, { code: 'SEND_FAIL', message: error.message });
    return;
  }

  if (error instanceof ZodError) {
    await sendError(reply, 400, {
      code: 'VALIDATION_ERROR',
      message: 'Invalid request payload',
      details: error.flatten(),
    });
    return;
  }

  logger.error({ err: error, url: request.url }, 'Unhandled error');
  await sendError(reply, 500, { code: 'INTERNAL_ERROR', message: 'Internal Server Error' });
};

const serializeContact = (contact: ContactView) => ({
  id: contact.id,
  phoneE164: contact.phoneE164,
  name: contact.name,
  consent: contact.consent,
  optedOutAt: contact.optedOutAt ? contact.optedOutAt.toISOString() : null,
  source: contact.source,
  tags: contact.tags,
  notes: contact.notes,
  createdAt: contact.createdAt.toISOString(),
  updatedAt: contact.updatedAt.toISOString(),
});

const serializeContactSummary = (
  contact: {
    id: string;
    phoneE164: string;
    name: string | null;
    avatarUrl?: string | null;
  },
) => ({
  id: contact.id,
  phoneE164: contact.phoneE164,
  name: contact.name,
  avatarUrl: contact.avatarUrl,
});

const serializeThreadListItem = (
  thread: Awaited<ReturnType<typeof listThreads>>[number],
  now = new Date(),
) => ({
  id: thread.id,
  contactId: thread.contactId,
  aiEnabled: thread.aiEnabled,
  lastHumanAt: thread.lastHumanAt ? thread.lastHumanAt.toISOString() : null,
  lastBotAt: thread.lastBotAt ? thread.lastBotAt.toISOString() : null,
  createdAt: thread.createdAt.toISOString(),
  updatedAt: thread.updatedAt.toISOString(),
  messagesCount: thread.messagesCount,
  latestMessageAt: thread.latestMessageAt ? thread.latestMessageAt.toISOString() : null,
  contact: serializeContactSummary(thread.contact),
  lastMessage: thread.lastMessage ? {
    id: thread.lastMessage.id,
    body: thread.lastMessage.text,
    fromMe: thread.lastMessage.direction === 'OUT',
    createdAt: thread.lastMessage.createdAt.toISOString(),
  } : null,
});

const serializeThreadWithMessages = (
  thread: Awaited<ReturnType<typeof getThreadWithMessages>>,
  now = new Date(),
) => ({
  id: thread.id,
  contactId: thread.contactId,
  aiEnabled: thread.aiEnabled,
  lastHumanAt: thread.lastHumanAt ? thread.lastHumanAt.toISOString() : null,
  lastBotAt: thread.lastBotAt ? thread.lastBotAt.toISOString() : null,
  createdAt: thread.createdAt.toISOString(),
  updatedAt: thread.updatedAt.toISOString(),
  contact: serializeContactSummary(thread.contact),
  messages: thread.messages.map((message) => ({
    id: message.id,
    threadId: message.threadId,
    direction: message.direction,
    body: message.text, // 映射 text 为 body
    fromMe: message.direction === 'OUT', // 映射 direction 为 fromMe
    text: message.text, // 保留 text 字段以兼容
    status: message.status,
    externalId: message.externalId,
    createdAt: message.createdAt.toISOString(),
  })),
});

export async function buildServer(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: true,
    bodyLimit: 10 * 1024 * 1024 * 1024, // ✅ 10GB 限制（流式处理不受此限制）
    requestTimeout: 30 * 60 * 1000, // ✅ 30分钟超时（支持大文件上传）
  });

  // 初始化 AccountManager
  const accountManager = new AccountManager(prisma, './.sessions');
  app.decorate('accountManager', accountManager);
  app.decorate('prisma', prisma);

  // 加载现有账号
  try {
    await accountManager.loadExistingAccounts();
    logger.info('Accounts loaded successfully');
  } catch (error) {
    logger.error({ error }, 'Failed to load accounts');
  }

  // Register CORS plugin
  await app.register(require('@fastify/cors'), {
    origin: ['http://localhost:3000', 'http://localhost:3001'], // Allow frontend origins
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // 允许所有常用 HTTP 方法
  });

  // Register multipart plugin for file uploads (streaming support)
  await app.register(require('@fastify/multipart'), {
    limits: {
      fileSize: Infinity, // ✅ 无限制文件大小（使用流式处理）
      files: 1, // 每次只上传一个文件
    },
  });

  // Register WebSocket plugin
  await app.register(require('@fastify/websocket'));

  // 只在启用认证时注册认证钩子
  if (isAuthEnabled) {
    app.addHook('onRequest', authHook);
  }
  app.setErrorHandler(errorHandler);

  app.get('/status', async (request, reply) => {
    const accountId = request.accountId!;
    const whatsappService = accountManager.getAccountService(accountId);
    
    if (!whatsappService) {
      return sendError(reply, 404, { code: 'ACCOUNT_NOT_FOUND', message: 'Account not found or not started' });
    }
    
    const status = whatsappService.getStatus();
    const onlineStates = new Set(['READY', 'AUTHENTICATING']);
    const online = onlineStates.has(status.status);
    const sessionReady = status.status === 'READY';

    const [contactCount, latestMessage] = await Promise.all([
      prisma.contact.count({ where: { accountId } }),
      prisma.message.aggregate({
        where: { accountId },
        _max: { createdAt: true },
      }),
    ]);

    return sendOk(reply, 200, {
      online,
      sessionReady,
      qr: status.qr,
      status: status.status,
      state: status.state, // 新增状态机状态
      phoneE164: status.phoneE164, // 新增手机号
      lastOnline: status.lastOnline?.toISOString() ?? null, // 新增最后在线时间
      contactCount,
      latestMessageAt: latestMessage._max.createdAt
        ? latestMessage._max.createdAt.toISOString()
        : null,
    });
  });

  // 新增：启动登录流程
  app.post('/auth/login/start', async (request, reply) => {
    try {
      const accountId = request.accountId!;
      logger.info({ accountId }, 'Received login start request');
      
      const whatsappService = accountManager.getAccountService(accountId);
      if (!whatsappService) {
        return sendError(reply, 404, { code: 'ACCOUNT_NOT_FOUND', message: 'Account not found or not started' });
      }
      
      // 调用真正的WhatsApp服务启动登录
      await whatsappService.startLogin();
      logger.info({ accountId }, 'Login process started successfully');
      return sendOk(reply, 200, { 
        message: 'Login process started successfully'
      });
      
    } catch (error) {
      logger.error({ 
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      }, 'Failed to start login process');
      return sendError(reply, 500, { 
        code: 'LOGIN_START_FAILED', 
        message: `Failed to start login process: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  });

  // 增强的二维码端点
  app.get('/auth/qr', async (request, reply) => {
    try {
      const accountId = request.accountId!;
      const whatsappService = accountManager.getAccountService(accountId);
      
      if (!whatsappService) {
        return sendError(reply, 404, { code: 'ACCOUNT_NOT_FOUND', message: 'Account not found or not started' });
      }
      
      // 获取真正的WhatsApp状态和二维码
      const status = whatsappService.getStatus();
      return sendOk(reply, 200, {
        qr: status.qr,
        status: status.status,
        state: status.state,
      });
    } catch (error) {
      logger.error({ error }, 'Failed to get QR code');
      return sendError(reply, 500, { code: 'QR_FETCH_FAILED', message: 'Failed to get QR code' });
    }
  });

  app.get('/ai/config', async (_request, reply) => {
    const config = await getAiConfig();
    return sendOk(reply, 200, serializeAiConfig(config));
  });

  app.put('/ai/config', async (request, reply) => {
    const body = aiConfigSchema.parse(request.body);
    const updated = await updateAiConfig(body);
    return sendOk(reply, 200, serializeAiConfig(updated));
  });

  app.post('/ai/test', async (request, reply) => {
    const payload = aiTestSchema.parse(request.body);
    const preview = await generatePreviewReply({ user: payload.user, context: payload.context });
    return sendOk(reply, 200, { reply: preview });
  });

  // ❌ 已移除旧的基础CRUD路由，现在使用独立的 contacts.ts 路由文件
  // - POST /contacts -> contacts.ts
  // - GET /contacts -> contacts.ts
  // - DELETE /contacts/:id -> contacts.ts
  
  // 📞 特殊联系人功能路由（保留在这里）
  
  // 获取WhatsApp联系人 (必须在 /contacts/:id 之前)
  app.get('/contacts/whatsapp', async (request, reply) => {
    try {
      const accountId = request.accountId!;
      const whatsappService = accountManager.getAccountService(accountId);
      
      if (!whatsappService) {
        return sendError(reply, 404, { code: 'ACCOUNT_NOT_FOUND', message: 'Account not found or not started' });
      }
      
      const whatsappContacts = await whatsappService.getWhatsAppContacts();
      return sendOk(reply, 200, {
        contacts: whatsappContacts,
        count: whatsappContacts.length,
      });
    } catch (error) {
      logger.error({ error }, 'Failed to get WhatsApp contacts');
      return sendError(reply, 500, { code: 'WHATSAPP_CONTACTS_FAILED', message: 'Failed to get WhatsApp contacts' });
    }
  });

  // 同步WhatsApp联系人到数据库 (必须在 /contacts/:id 之前)
  app.post('/contacts/sync-whatsapp', async (request, reply) => {
    try {
      const accountId = request.accountId!;
      const whatsappService = accountManager.getAccountService(accountId);
      
      if (!whatsappService) {
        return sendError(reply, 404, { code: 'ACCOUNT_NOT_FOUND', message: 'Account not found or not started' });
      }
      
      const result = await whatsappService.syncContactsToDatabase();
      return sendOk(reply, 200, {
        message: 'WhatsApp contacts synced successfully',
        result,
      });
    } catch (error) {
      logger.error({ error }, 'Failed to sync WhatsApp contacts');
      return sendError(reply, 500, { code: 'WHATSAPP_SYNC_FAILED', message: 'Failed to sync WhatsApp contacts' });
    }
  });

  // POST /contacts/:id/outreach - 发送外联消息
  app.post('/contacts/:id/outreach', async (request, reply) => {
    const accountId = request.accountId!;
    const params = contactIdSchema.parse(request.params);
    const body = outreachBodySchema.parse(request.body);
    
    const whatsappService = accountManager.getAccountService(accountId);
    if (!whatsappService) {
      return sendError(reply, 404, { code: 'ACCOUNT_NOT_FOUND', message: 'Account not found or not started' });
    }

    const result = await sendOutreach(accountId, {
      contactId: params.id,
      content: body.content,
    }, async ({ phoneE164, content }) => {
      const response = await whatsappService.sendTextMessage(phoneE164, content);
      return { externalId: response.id ?? null };
    });

    return sendOk(reply, 202, {
      threadId: result.threadId,
      message: {
        id: result.message.id,
        threadId: result.message.threadId,
        direction: result.message.direction,
        text: result.message.text,
        status: result.message.status,
        createdAt: result.message.createdAt.toISOString(),
      },
    });
  });

  // 文件上传API
  app.post('/contacts/:id/upload', async (request, reply) => {
    const accountId = request.accountId!;
    const params = contactIdSchema.parse(request.params);
    
    try {
      const whatsappService = accountManager.getAccountService(accountId);
      if (!whatsappService) {
        return sendError(reply, 404, { code: 'ACCOUNT_NOT_FOUND', message: 'Account not found or not started' });
      }
      
      const data = await (request as any).file();
      if (!data) {
        return sendError(reply, 400, { code: 'NO_FILE', message: 'No file uploaded' });
      }

      const contact = await getContactById(accountId, params.id);
      const thread = await getOrCreateThread(accountId, contact.id);
      
      // 保存文件到临时目录
      const uploadDir = './uploads';
      await fs.mkdir(uploadDir, { recursive: true });
      
      const fileName = `${Date.now()}_${data.filename}`;
      const filePath = path.join(uploadDir, fileName);
      
      // 写入文件
      await fs.writeFile(filePath, await data.toBuffer());
      
      // 发送媒体消息
      const sendResult = await whatsappService.sendMediaMessage(
        contact.phoneE164, 
        filePath, 
        data.filename
      );
      
      // 记录消息到数据库
      const message = await recordMessage({
        accountId,
        threadId: thread.id,
        direction: MessageDirection.OUT,
        text: `[文件] ${data.filename}`,
        externalId: sendResult.id ?? null,
        status: MessageStatus.SENT,
      });
      
      // 清理临时文件
      await fs.unlink(filePath).catch(() => {}); // 忽略删除错误
      
      return sendOk(reply, 202, { threadId: thread.id, message });
      
    } catch (error) {
      logger.error({ error, contactId: params.id }, 'Failed to upload file');
      return sendError(reply, 500, { 
        code: 'UPLOAD_FAILED', 
        message: 'File upload failed' 
      });
    }
  });

  app.get('/threads', async (request, reply) => {
    const accountId = request.accountId!;
    const threads = await listThreads(accountId);
    const now = new Date();
    return sendOk(reply, 200, {
      threads: threads.map((thread) => serializeThreadListItem(thread, now)),
    });
  });

  // 注意：/threads/:id/messages 路由已移至 routes/threads.ts

  // 发送消息
  app.post('/messages/send', async (request, reply) => {
    try {
      const accountId = request.accountId!;
      const body = z.object({
        phoneE164: z.string(),
        content: z.string(),
      }).parse(request.body);

      logger.info({ accountId, phoneE164: body.phoneE164, contentLength: body.content.length }, 'Sending message via API');

      const whatsappService = accountManager.getAccountService(accountId);
      if (!whatsappService) {
        return sendError(reply, 404, { code: 'ACCOUNT_NOT_FOUND', message: 'Account not found or not started' });
      }

      // 查找或创建联系人
      let contact = await getContactByPhone(accountId, body.phoneE164);
      if (!contact) {
        logger.info({ accountId, phoneE164: body.phoneE164 }, 'Contact not found, creating new contact');
        contact = await createContact(accountId, { phoneE164: body.phoneE164 });
      }

      // 获取或创建对话线程
      const thread = await getOrCreateThread(accountId, contact.id);
      logger.info({ accountId, threadId: thread.id, contactId: contact.id }, 'Thread obtained');

      // 发送 WhatsApp 消息
      const response = await whatsappService.sendTextMessage(body.phoneE164, body.content);
      logger.info({ accountId, responseId: response.id }, 'WhatsApp message sent');

      // 记录消息到数据库（如果已存在则跳过）
      let message = await recordMessageIfMissing({
        accountId,
        threadId: thread.id,
        externalId: response.id ?? null,
        direction: 'OUT' as MessageDirection,
        text: body.content,
        status: response.id ? 'SENT' as MessageStatus : 'FAILED' as MessageStatus,
      });

      // 如果消息已通过 WebSocket 保存，从数据库查找
      if (!message && response.id) {
        logger.info({ accountId, externalId: response.id }, 'Message already exists, fetching from database');
        message = await prisma.message.findFirst({
          where: { 
            accountId,
            externalId: response.id 
          },
        });
      }

      if (!message) {
        throw new Error('Failed to create or find message in database');
      }

      logger.info({ messageId: message.id }, 'Message recorded to database');

      // 🔥 触发 WebSocket 事件，通知前端新消息
      const chatId = body.phoneE164.replace('+', '') + '@c.us';
      webSocketService.broadcast({
        type: 'new_message',
        data: {
          id: message.externalId || message.id,
          from: chatId,
          to: chatId,
          body: body.content,
          fromMe: true,
          type: 'chat',
          timestamp: Math.floor(message.createdAt.getTime() / 1000),
          threadId: thread.id,
          messageId: message.id,
          hasMedia: false,
          // 🎨 媒体字段 - 从数据库消息对象中获取
          mediaUrl: message.mediaUrl || null,
          mediaType: message.mediaType || null,
          mediaMimeType: message.mediaMimeType || null,
          mediaSize: message.mediaSize || null,
          mediaFileName: message.mediaFileName || null,
          originalFileName: message.originalFileName || null,
          thumbnailUrl: message.thumbnailUrl || null,
          duration: message.duration || null,
        },
        timestamp: Date.now(),
      });
      logger.info({ messageId: message.id, hasMedia: !!message.mediaUrl }, 'WebSocket event broadcast');

      return sendOk(reply, 200, {
        message: {
          id: message.id,
          threadId: message.threadId,
          direction: message.direction,
          body: message.text,
          fromMe: true,
          text: message.text,
          status: message.status,
          externalId: message.externalId,
          createdAt: message.createdAt.toISOString(),
        },
      });
    } catch (error) {
      logger.error({ 
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      }, 'Failed to send message via API');
      
      return sendError(reply, 500, { 
        code: 'SEND_MESSAGE_FAILED', 
        message: error instanceof Error ? error.message : 'Failed to send message' 
      });
    }
  });

  // 获取或创建联系人的对话线程
  app.post('/contacts/:id/thread', async (request, reply) => {
    const accountId = request.accountId!;
    const params = contactIdSchema.parse(request.params);
    
    try {
      // 获取或创建线程
      const thread = await getOrCreateThread(accountId, params.id);
      const threadSummary = await getThreadSummary(thread.id);
      
      return sendOk(reply, 200, { 
        thread: serializeThreadListItem(threadSummary) 
      });
    } catch (error) {
      logger.error({ 
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      }, 'Failed to get or create thread');
      
      return sendError(reply, 500, { 
        code: 'THREAD_CREATE_FAILED', 
        message: error instanceof Error ? error.message : 'Failed to get or create thread' 
      });
    }
  });

  app.post('/threads/:id/takeover', async (request, reply) => {
    const params = contactIdSchema.parse(request.params);
    await setAiEnabled(params.id, false);
    const thread = await getThreadSummary(params.id);
    return sendOk(reply, 200, { thread: serializeThreadListItem(thread) });
  });

  // 设置线程AI状态
  app.put('/threads/:id/ai', async (request, reply) => {
    const params = contactIdSchema.parse(request.params);
    const body = z.object({ aiEnabled: z.boolean() }).parse(request.body);
    await setAiEnabled(params.id, body.aiEnabled);
    const threadSummary = await getThreadSummary(params.id);
    return sendOk(reply, 200, { thread: serializeThreadListItem(threadSummary) });
  });

  app.post('/threads/:id/release', async (request, reply) => {
    const params = contactIdSchema.parse(request.params);
    await setAiEnabled(params.id, true);
    const thread = await getThreadSummary(params.id);
    return sendOk(reply, 200, { thread: serializeThreadListItem(thread) });
  });

  // 退出登录 - 使用GET请求避免Content-Type问题
  app.get('/auth/logout', async (request, reply) => {
    try {
      const accountId = request.accountId!;
      logger.info({ accountId }, 'Received logout request (GET)');
      
      const whatsappService = accountManager.getAccountService(accountId);
      if (!whatsappService) {
        return sendError(reply, 404, { code: 'ACCOUNT_NOT_FOUND', message: 'Account not found or not started' });
      }
      
      // 获取退出前的状态
      const statusBefore = whatsappService.getStatus();
      logger.info({ accountId, statusBefore }, 'Status before logout');
      
      // 执行简化的退出（不等待异步操作）
      whatsappService.logout();
      
      // 获取退出后的状态
      const statusAfter = whatsappService.getStatus();
      logger.info({ accountId, statusAfter }, 'Status after logout');
      
      logger.info({ accountId }, 'WhatsApp logout completed successfully');
      return sendOk(reply, 200, { 
        message: 'Logged out successfully',
        statusBefore,
        statusAfter
      });
    } catch (error) {
      const accountId = request.accountId!;
      logger.error({ 
        accountId,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      }, 'Failed to logout');
      
      // 即使出错，也尝试返回当前状态
      const whatsappService = accountManager.getAccountService(accountId);
      const currentStatus = whatsappService?.getStatus();
      return sendError(reply, 500, { 
        code: 'LOGOUT_FAILED', 
        message: `Failed to logout: ${error instanceof Error ? error.message : String(error)}`,
        details: { currentStatus }
      });
    }
  });

  // 保留POST方法作为备用
  app.post('/auth/logout', async (request, reply) => {
    try {
      const accountId = request.accountId!;
      logger.info({ accountId }, 'Received logout request (POST)');
      
      const whatsappService = accountManager.getAccountService(accountId);
      if (!whatsappService) {
        return sendError(reply, 404, { code: 'ACCOUNT_NOT_FOUND', message: 'Account not found or not started' });
      }
      
      // 获取退出前的状态
      const statusBefore = whatsappService.getStatus();
      logger.info({ accountId, statusBefore }, 'Status before logout');
      
      // 执行简化的退出（不等待异步操作）
      whatsappService.logout();
      
      // 获取退出后的状态
      const statusAfter = whatsappService.getStatus();
      logger.info({ accountId, statusAfter }, 'Status after logout');
      
      logger.info({ accountId }, 'WhatsApp logout completed successfully');
      return sendOk(reply, 200, { 
        message: 'Logged out successfully',
        statusBefore,
        statusAfter
      });
    } catch (error) {
      const accountId = request.accountId!;
      logger.error({ 
        accountId,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      }, 'Failed to logout');
      
      // 即使出错，也尝试返回当前状态
      const whatsappService = accountManager.getAccountService(accountId);
      const currentStatus = whatsappService?.getStatus();
      return sendError(reply, 500, { 
        code: 'LOGOUT_FAILED', 
        message: `Failed to logout: ${error instanceof Error ? error.message : String(error)}`,
        details: { currentStatus }
      });
    }
  });

  // 删除对话线程
  app.delete('/threads/:id', async (request, reply) => {
    const params = contactIdSchema.parse(request.params);
    try {
      await deleteThread(params.id);
      logger.info({ threadId: params.id }, 'Thread deleted successfully');
      return sendOk(reply, 200, { message: 'Thread deleted successfully' });
    } catch (error) {
      logger.error({ error, threadId: params.id }, 'Failed to delete thread');
      return sendError(reply, 500, { code: 'DELETE_FAILED', message: 'Failed to delete thread' });
    }
  });

  // ❌ 已移除：GET /contacts/:id -> 现在在 contacts.ts 路由中
  
  // 获取系统设置
  app.get('/settings', async (_request, reply) => {
    try {
      const settings = await getSystemSettings();
      return sendOk(reply, 200, settings);
    } catch (error) {
      logger.error({ error }, 'Failed to get settings');
      return sendError(reply, 500, { code: 'SETTINGS_ERROR', message: 'Failed to get settings' });
    }
  });

  // 更新系统设置
  app.put('/settings', async (request, reply) => {
    try {
      const updates = request.body as any;
      const settings = await updateSystemSettings(updates);
      return sendOk(reply, 200, settings);
    } catch (error) {
      logger.error({ error }, 'Failed to update settings');
      return sendError(reply, 500, { 
        code: 'SETTINGS_ERROR', 
        message: error instanceof Error ? error.message : 'Failed to update settings' 
      });
    }
  });


  // 注册账号管理路由（不需要账号上下文）
  await app.register(accountRoutes, { prefix: '/accounts' });

  // 注册账号上下文中间件（所有其他路由都需要）
  app.addHook('onRequest', accountContextMiddleware);

  // 注册联系人管理路由
  await app.register(contactRoutes, { prefix: '/contacts' });

  // 注册模板管理路由
  await app.register(templateRoutes);
  await app.register(categoryRoutes);
  
  // 注册批量操作路由
  await app.register(batchRoutes);
  
  // 注册知识库路由
  await app.register(knowledgeRoutes);
  await app.register(knowledgeCategoryRoutes);
  
  // 注册翻译路由
  await app.register(translationRoutes);
  
  // 注册统计路由
  await app.register(statsRoutes);
  
  // 注册数据管理路由
  await app.register(dataManagementRoutes);
  
  // 注册媒体文件路由
  await app.register(mediaRoutes);
  
  // 注册消息操作路由
  await app.register(messageRoutes);
  
  // 注册会话管理路由
  await app.register(threadRoutes);

  // 注册群组管理路由（社群营销）
  await app.register(groupRoutes, { prefix: '/groups' });

  if (!isAuthEnabled) {
    logger.warn('AUTH_TOKEN is not configured. Authentication is disabled.');
  }

  // Initialize WebSocket service with AccountManager
  webSocketService.initialize(app, accountManager);

  return app;
}