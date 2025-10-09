import Fastify, { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z, ZodError } from 'zod';
import { appConfig, isAuthEnabled } from './config';
import { logger } from './logger';
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
import { whatsappService } from './whatsapp-service';
import { sendError, sendOk } from './http/response';
import { prisma } from './prisma';
import { generatePreviewReply } from './ai/pipeline';
import { templateRoutes, categoryRoutes } from './routes/templates';
import { batchRoutes } from './routes/batch';
import { knowledgeRoutes, knowledgeCategoryRoutes } from './routes/knowledge';
import * as fs from 'fs/promises';
import * as path from 'path';
import { recordMessage } from './services/message-service';
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
  },
) => ({
  id: contact.id,
  phoneE164: contact.phoneE164,
  name: contact.name,
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
    text: message.text,
    status: message.status,
    externalId: message.externalId,
    createdAt: message.createdAt.toISOString(),
  })),
});

export async function buildServer(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: true,
  });

  // Register CORS plugin
  await app.register(require('@fastify/cors'), {
    origin: ['http://localhost:3000', 'http://localhost:3001'], // Allow frontend origins
    credentials: true,
  });

  // Register multipart plugin for file uploads
  await app.register(require('@fastify/multipart'), {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
  });

  // Register WebSocket plugin
  await app.register(require('@fastify/websocket'));

  // 只在启用认证时注册认证钩子
  if (isAuthEnabled) {
    app.addHook('onRequest', authHook);
  }
  app.setErrorHandler(errorHandler);

  app.get('/status', async (_request, reply) => {
    const status = whatsappService.getStatus();
    const onlineStates = new Set(['READY', 'AUTHENTICATING']);
    const online = onlineStates.has(status.status);
    const sessionReady = status.status === 'READY';

    const [contactCount, latestMessage] = await Promise.all([
      prisma.contact.count(),
      prisma.message.aggregate({
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
  app.post('/auth/login/start', async (_request, reply) => {
    try {
      logger.info('Received login start request');
      await whatsappService.startLogin();
      logger.info('Login process started successfully');
      return sendOk(reply, 200, { message: 'Login process started' });
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
  app.get('/auth/qr', async (_request, reply) => {
    try {
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

  app.post('/contacts', async (request, reply) => {
    const body = createContactSchema.parse(request.body);
    const contact = await createContact(body);
    const view = serializeContact(contact);
    return sendOk(reply, 201, view);
  });

  app.get('/contacts', async (_request, reply) => {
    const contacts = await listContacts();
    return sendOk(reply, 200, {
      contacts: contacts.map(serializeContact),
    });
  });

  // 获取WhatsApp联系人 (必须在 /contacts/:id 之前)
  app.get('/contacts/whatsapp', async (_request, reply) => {
    try {
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
  app.post('/contacts/sync-whatsapp', async (_request, reply) => {
    try {
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

  app.delete('/contacts/:id', async (request, reply) => {
    try {
      const params = contactIdSchema.parse(request.params);
      await deleteContact(params.id);
      return sendOk(reply, 200, { message: 'Contact deleted successfully' });
    } catch (error) {
      const params = contactIdSchema.parse(request.params);
      logger.error({ error, contactId: params.id }, 'Failed to delete contact');
      return sendError(reply, 500, { code: 'DELETE_CONTACT_FAILED', message: 'Failed to delete contact' });
    }
  });

  app.post('/contacts/:id/outreach', async (request, reply) => {
    const params = contactIdSchema.parse(request.params);
    const body = outreachBodySchema.parse(request.body);

    const result = await sendOutreach({
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
    const params = contactIdSchema.parse(request.params);
    
    try {
      const data = await (request as any).file();
      if (!data) {
        return sendError(reply, 400, { code: 'NO_FILE', message: 'No file uploaded' });
      }

      const contact = await getContactById(params.id);
      const thread = await getOrCreateThread(contact.id);
      
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

  app.get('/threads', async (_request, reply) => {
    const threads = await listThreads();
    const now = new Date();
    return sendOk(reply, 200, {
      threads: threads.map((thread) => serializeThreadListItem(thread, now)),
    });
  });

  app.get<{ Params: { id: string }; Querystring: { limit?: number } }>('/threads/:id/messages', async (request, reply) => {
    const params = contactIdSchema.parse(request.params);
    const query = messagesQuerySchema.parse(request.query);
    const thread = await getThreadWithMessages(params.id, query.limit ?? 50);
    return sendOk(reply, 200, serializeThreadWithMessages(thread));
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
  app.get('/auth/logout', async (_request, reply) => {
    try {
      logger.info('Received logout request (GET)');
      
      // 获取退出前的状态
      const statusBefore = whatsappService.getStatus();
      logger.info({ statusBefore }, 'Status before logout');
      
      // 执行简化的退出（不等待异步操作）
      whatsappService.logout();
      
      // 获取退出后的状态
      const statusAfter = whatsappService.getStatus();
      logger.info({ statusAfter }, 'Status after logout');
      
      logger.info('WhatsApp logout completed successfully');
      return sendOk(reply, 200, { 
        message: 'Logged out successfully',
        statusBefore,
        statusAfter
      });
    } catch (error) {
      logger.error({ 
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      }, 'Failed to logout');
      
      // 即使出错，也尝试返回当前状态
      const currentStatus = whatsappService.getStatus();
      return sendError(reply, 500, { 
        code: 'LOGOUT_FAILED', 
        message: `Failed to logout: ${error instanceof Error ? error.message : String(error)}`,
        details: { currentStatus }
      });
    }
  });

  // 保留POST方法作为备用
  app.post('/auth/logout', async (_request, reply) => {
    try {
      logger.info('Received logout request (POST)');
      
      // 获取退出前的状态
      const statusBefore = whatsappService.getStatus();
      logger.info({ statusBefore }, 'Status before logout');
      
      // 执行简化的退出（不等待异步操作）
      whatsappService.logout();
      
      // 获取退出后的状态
      const statusAfter = whatsappService.getStatus();
      logger.info({ statusAfter }, 'Status after logout');
      
      logger.info('WhatsApp logout completed successfully');
      return sendOk(reply, 200, { 
        message: 'Logged out successfully',
        statusBefore,
        statusAfter
      });
    } catch (error) {
      logger.error({ 
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      }, 'Failed to logout');
      
      // 即使出错，也尝试返回当前状态
      const currentStatus = whatsappService.getStatus();
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

  app.get('/contacts/:id', async (request, reply) => {
    const params = contactIdSchema.parse(request.params);
    const contact = await getContactById(params.id);
    const view = serializeContact(contact);
    return sendOk(reply, 200, view);
  });

  // 更新系统设置 (注释掉，可能在其他地方已定义)
  // app.put('/settings', async (request, reply) => {
  //   try {
  //     const body = settingsSchema.parse(request.body);
  //     // TODO: 保存到数据库或配置文件
  //     logger.info({ settings: body }, 'Settings updated');
  //     return sendOk(reply, 200, { message: 'Settings updated successfully', settings: body });
  //   } catch (error) {
  //     logger.error({ error }, 'Failed to update settings');
  //     return sendError(reply, 500, { code: 'SETTINGS_UPDATE_ERROR', message: 'Failed to update settings' });
  //   }
  // });

  // 获取系统设置
  app.get('/settings', async (_request, reply) => {
    try {
      const settings = {
        globalAiEnabled: true, // 可以从数据库或配置中获取
        welcomeTemplate: appConfig.welcomeTemplate || '您好！我是AI助手，很高兴为您服务。',
        apiUrl: process.env.API_BASE_URL || 'http://localhost:4000',
        theme: 'light',
        language: 'zh-CN'
      };
      return sendOk(reply, 200, settings);
    } catch (error) {
      logger.error({ error }, 'Failed to get settings');
      return sendError(reply, 500, { code: 'SETTINGS_GET_FAILED', message: 'Failed to get settings' });
    }
  });


  // 注册模板管理路由
  await app.register(templateRoutes);
  await app.register(categoryRoutes);
  
  // 注册批量操作路由
  await app.register(batchRoutes);
  
  // 注册知识库路由
  await app.register(knowledgeRoutes);
  await app.register(knowledgeCategoryRoutes);

  // WebSocket 路由
  app.register(async function (fastify) {
    (fastify as any).get('/ws', { websocket: true }, (connection: any, req: any) => {
      logger.info('WebSocket client connected');

      const ws = connection.socket;

      // 发送连接成功消息
      ws.send(JSON.stringify({
        type: 'connected',
        data: { message: 'WebSocket connection established' },
        timestamp: Date.now()
      }));

      // 监听 WhatsApp 状态变化
      const statusHandler = (status: any) => {
        if (ws.readyState === 1) { // OPEN
          ws.send(JSON.stringify({
            type: 'whatsapp_status',
            data: status,
            timestamp: Date.now()
          }));
        }
      };

      const qrHandler = (qr: string) => {
        if (ws.readyState === 1) {
          ws.send(JSON.stringify({
            type: 'qr_update',
            data: { qr },
            timestamp: Date.now()
          }));
        }
      };

      // 注册事件监听
      whatsappService.on('status', statusHandler);
      whatsappService.on('qr', qrHandler);

      // 处理客户端消息
      ws.on('message', (message: Buffer) => {
        try {
          const data = JSON.parse(message.toString());
          logger.debug({ type: data.type }, 'Received WebSocket message');

          // 处理 ping
          if (data.type === 'ping') {
            ws.send(JSON.stringify({
              type: 'pong',
              data: {},
              timestamp: Date.now()
            }));
          }
        } catch (error) {
          logger.error({ err: error }, 'Failed to parse WebSocket message');
        }
      });

      // 处理连接关闭
      ws.on('close', () => {
        logger.info('WebSocket client disconnected');
        whatsappService.off('status', statusHandler);
        whatsappService.off('qr', qrHandler);
      });

      // 处理错误
      ws.on('error', (error: any) => {
        logger.error({ err: error }, 'WebSocket error');
      });
    });
  });

  if (!isAuthEnabled) {
    logger.warn('AUTH_TOKEN is not configured. Authentication is disabled.');
  }

  return app;
}