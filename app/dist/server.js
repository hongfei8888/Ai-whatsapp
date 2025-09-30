"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildServer = buildServer;
const fastify_1 = __importDefault(require("fastify"));
const zod_1 = require("zod");
const config_1 = require("./config");
const logger_1 = require("./logger");
const errors_1 = require("./errors");
const contact_service_1 = require("./services/contact-service");
const outreach_service_1 = require("./services/outreach-service");
const ai_config_service_1 = require("./services/ai-config-service");
const thread_service_1 = require("./services/thread-service");
const whatsapp_service_1 = require("./whatsapp-service");
const response_1 = require("./http/response");
const prisma_1 = require("./prisma");
const pipeline_1 = require("./ai/pipeline");
const createContactSchema = zod_1.z.object({
    phoneE164: zod_1.z.string().min(5),
    name: zod_1.z.string().min(1).max(80).optional(),
}).strict();
const contactIdSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
});
const outreachBodySchema = zod_1.z.object({
    content: zod_1.z.string().min(1).max(1000),
}).strict();
const aiConfigSchema = zod_1.z.object({
    systemPrompt: zod_1.z.string().min(40).max(4000),
    maxTokens: zod_1.z.number().int().min(128).max(2048),
    temperature: zod_1.z.number().min(0).max(1),
    minChars: zod_1.z.number().int().min(20).max(600),
    stylePreset: zod_1.z.enum(['concise-cn', 'sales-cn', 'support-cn']),
}).strict();
const aiTestSchema = zod_1.z.object({
    user: zod_1.z.string().min(1).max(1000),
    context: zod_1.z.string().min(1).max(2000).optional(),
}).strict();
const messagesQuerySchema = zod_1.z.object({
    limit: zod_1.z.coerce.number().int().min(1).max(200).optional(),
});
const settingsSchema = zod_1.z.object({
    cooldownHours: zod_1.z.number().int().min(1).max(168).optional(),
    perContactReplyCooldownMinutes: zod_1.z.number().int().min(0).max(1440).optional(),
    globalAiEnabled: zod_1.z.boolean().optional(),
    welcomeTemplate: zod_1.z.string().min(1).max(500).optional(),
}).strict();
const authHook = async (request) => {
    if (!config_1.isAuthEnabled) {
        return;
    }
    const authHeader = request.headers.authorization;
    if (!authHeader) {
        throw new errors_1.AuthenticationError();
    }
    const [scheme, token] = authHeader.split(' ');
    if (!token || scheme.toLowerCase() !== 'bearer' || token !== config_1.appConfig.authToken) {
        throw new errors_1.AuthenticationError();
    }
    request.user = { token };
};
const errorHandler = async (error, request, reply) => {
    if (error instanceof errors_1.AuthenticationError) {
        await (0, response_1.sendError)(reply, 401, { code: 'UNAUTHORIZED', message: error.message });
        return;
    }
    if (error instanceof errors_1.ContactAlreadyExistsError) {
        await (0, response_1.sendError)(reply, 409, { code: 'CONTACT_EXISTS', message: error.message });
        return;
    }
    if (error instanceof errors_1.ContactNotFoundError) {
        await (0, response_1.sendError)(reply, 404, { code: 'CONTACT_NOT_FOUND', message: error.message });
        return;
    }
    if (error instanceof errors_1.ThreadNotFoundError) {
        await (0, response_1.sendError)(reply, 404, { code: 'THREAD_NOT_FOUND', message: error.message });
        return;
    }
    if (error instanceof errors_1.CooldownActiveError) {
        await (0, response_1.sendError)(reply, 429, { code: 'COOLDOWN', message: error.message });
        return;
    }
    if (error instanceof errors_1.ForbiddenKeywordError) {
        await (0, response_1.sendError)(reply, 422, { code: 'CONTENT', message: error.message });
        return;
    }
    if (error instanceof errors_1.MessageSendError) {
        await (0, response_1.sendError)(reply, 502, { code: 'SEND_FAIL', message: error.message });
        return;
    }
    if (error instanceof zod_1.ZodError) {
        await (0, response_1.sendError)(reply, 400, {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request payload',
            details: error.flatten(),
        });
        return;
    }
    logger_1.logger.error({ err: error, url: request.url }, 'Unhandled error');
    await (0, response_1.sendError)(reply, 500, { code: 'INTERNAL_ERROR', message: 'Internal Server Error' });
};
const serializeContact = (contact) => ({
    ...contact,
    cooldownUntil: contact.cooldownUntil ? contact.cooldownUntil.toISOString() : null,
    createdAt: contact.createdAt.toISOString(),
    updatedAt: contact.updatedAt.toISOString(),
});
const serializeContactSummary = (contact, now = new Date()) => ({
    id: contact.id,
    phoneE164: contact.phoneE164,
    name: contact.name,
    cooldownUntil: contact.cooldownUntil ? contact.cooldownUntil.toISOString() : null,
    cooldownRemainingSeconds: (0, contact_service_1.computeCooldownRemainingSeconds)(contact.cooldownUntil, now),
});
const serializeThreadListItem = (thread, now = new Date()) => ({
    id: thread.id,
    contactId: thread.contactId,
    aiEnabled: thread.aiEnabled,
    lastHumanAt: thread.lastHumanAt ? thread.lastHumanAt.toISOString() : null,
    lastBotAt: thread.lastBotAt ? thread.lastBotAt.toISOString() : null,
    createdAt: thread.createdAt.toISOString(),
    updatedAt: thread.updatedAt.toISOString(),
    messagesCount: thread.messagesCount,
    latestMessageAt: thread.latestMessageAt ? thread.latestMessageAt.toISOString() : null,
    contact: serializeContactSummary(thread.contact, now),
});
const serializeThreadWithMessages = (thread, now = new Date()) => ({
    id: thread.id,
    contactId: thread.contactId,
    aiEnabled: thread.aiEnabled,
    lastHumanAt: thread.lastHumanAt ? thread.lastHumanAt.toISOString() : null,
    lastBotAt: thread.lastBotAt ? thread.lastBotAt.toISOString() : null,
    createdAt: thread.createdAt.toISOString(),
    updatedAt: thread.updatedAt.toISOString(),
    contact: serializeContactSummary(thread.contact, now),
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
async function buildServer() {
    const app = (0, fastify_1.default)({
        logger: true,
    });
    // Register CORS plugin
    await app.register(require('@fastify/cors'), {
        origin: ['http://localhost:3000', 'http://localhost:3001'], // Allow frontend origins
        credentials: true,
    });
    app.addHook('onRequest', authHook);
    app.setErrorHandler(errorHandler);
    app.get('/status', async (_request, reply) => {
        const status = whatsapp_service_1.whatsappService.getStatus();
        const onlineStates = new Set(['READY', 'AUTHENTICATING']);
        const online = onlineStates.has(status.status);
        const sessionReady = status.status === 'READY';
        const [contactCount, latestMessage] = await Promise.all([
            prisma_1.prisma.contact.count(),
            prisma_1.prisma.message.aggregate({
                _max: { createdAt: true },
            }),
        ]);
        return (0, response_1.sendOk)(reply, 200, {
            online,
            sessionReady,
            qr: status.qr,
            status: status.status,
            state: status.state, // 新增状态机状态
            phoneE164: status.phoneE164, // 新增手机号
            lastOnline: status.lastOnline?.toISOString() ?? null, // 新增最后在线时间
            cooldownHours: config_1.appConfig.cooldownHours,
            perContactReplyCooldownMinutes: config_1.appConfig.perContactReplyCooldown,
            contactCount,
            latestMessageAt: latestMessage._max.createdAt
                ? latestMessage._max.createdAt.toISOString()
                : null,
        });
    });
    // 新增：启动登录流程
    app.post('/auth/login/start', async (_request, reply) => {
        try {
            logger_1.logger.info('Received login start request');
            await whatsapp_service_1.whatsappService.startLogin();
            logger_1.logger.info('Login process started successfully');
            return (0, response_1.sendOk)(reply, 200, { message: 'Login process started' });
        }
        catch (error) {
            logger_1.logger.error({
                error: error instanceof Error ? {
                    name: error.name,
                    message: error.message,
                    stack: error.stack
                } : error
            }, 'Failed to start login process');
            return (0, response_1.sendError)(reply, 500, {
                code: 'LOGIN_START_FAILED',
                message: `Failed to start login process: ${error instanceof Error ? error.message : String(error)}`
            });
        }
    });
    // 增强的二维码端点
    app.get('/auth/qr', async (_request, reply) => {
        try {
            const status = whatsapp_service_1.whatsappService.getStatus();
            return (0, response_1.sendOk)(reply, 200, {
                qr: status.qr,
                status: status.status,
                state: status.state,
            });
        }
        catch (error) {
            logger_1.logger.error({ error }, 'Failed to get QR code');
            return (0, response_1.sendError)(reply, 500, { code: 'QR_FETCH_FAILED', message: 'Failed to get QR code' });
        }
    });
    app.get('/ai/config', async (_request, reply) => {
        const config = await (0, ai_config_service_1.getAiConfig)();
        return (0, response_1.sendOk)(reply, 200, (0, ai_config_service_1.serializeAiConfig)(config));
    });
    app.put('/ai/config', async (request, reply) => {
        const body = aiConfigSchema.parse(request.body);
        const updated = await (0, ai_config_service_1.updateAiConfig)(body);
        return (0, response_1.sendOk)(reply, 200, (0, ai_config_service_1.serializeAiConfig)(updated));
    });
    app.post('/ai/test', async (request, reply) => {
        const payload = aiTestSchema.parse(request.body);
        const preview = await (0, pipeline_1.generatePreviewReply)({ user: payload.user, context: payload.context });
        return (0, response_1.sendOk)(reply, 200, { reply: preview });
    });
    app.post('/contacts', async (request, reply) => {
        const body = createContactSchema.parse(request.body);
        const contact = await (0, contact_service_1.createContact)(body);
        const view = serializeContact((0, contact_service_1.withCooldownRemaining)(contact));
        return (0, response_1.sendOk)(reply, 201, view);
    });
    app.get('/contacts', async (_request, reply) => {
        const contacts = await (0, contact_service_1.listContacts)();
        return (0, response_1.sendOk)(reply, 200, {
            contacts: contacts.map(serializeContact),
        });
    });
    app.delete('/contacts/:id', async (request, reply) => {
        const params = contactIdSchema.parse(request.params);
        await (0, contact_service_1.deleteContact)(params.id);
        return (0, response_1.sendOk)(reply, 200, { message: 'Contact deleted successfully' });
    });
    app.post('/contacts/:id/outreach', async (request, reply) => {
        const params = contactIdSchema.parse(request.params);
        const body = outreachBodySchema.parse(request.body);
        const result = await (0, outreach_service_1.sendOutreach)({
            contactId: params.id,
            content: body.content,
        }, async ({ phoneE164, content }) => {
            const response = await whatsapp_service_1.whatsappService.sendTextMessage(phoneE164, content);
            return { externalId: response.id ?? null };
        });
        return (0, response_1.sendOk)(reply, 202, {
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
    app.get('/threads', async (_request, reply) => {
        const threads = await (0, thread_service_1.listThreads)();
        const now = new Date();
        return (0, response_1.sendOk)(reply, 200, {
            threads: threads.map((thread) => serializeThreadListItem(thread, now)),
        });
    });
    app.get('/threads/:id/messages', async (request, reply) => {
        const params = contactIdSchema.parse(request.params);
        const query = messagesQuerySchema.parse(request.query);
        const thread = await (0, thread_service_1.getThreadWithMessages)(params.id, query.limit ?? 50);
        return (0, response_1.sendOk)(reply, 200, serializeThreadWithMessages(thread));
    });
    app.post('/threads/:id/takeover', async (request, reply) => {
        const params = contactIdSchema.parse(request.params);
        await (0, thread_service_1.setAiEnabled)(params.id, false);
        const thread = await (0, thread_service_1.getThreadSummary)(params.id);
        return (0, response_1.sendOk)(reply, 200, { thread: serializeThreadListItem(thread) });
    });
    app.post('/threads/:id/release', async (request, reply) => {
        const params = contactIdSchema.parse(request.params);
        await (0, thread_service_1.setAiEnabled)(params.id, true);
        const thread = await (0, thread_service_1.getThreadSummary)(params.id);
        return (0, response_1.sendOk)(reply, 200, { thread: serializeThreadListItem(thread) });
    });
    // 退出登录 - 使用GET请求避免Content-Type问题
    app.get('/auth/logout', async (_request, reply) => {
        try {
            logger_1.logger.info('Received logout request (GET)');
            // 获取退出前的状态
            const statusBefore = whatsapp_service_1.whatsappService.getStatus();
            logger_1.logger.info({ statusBefore }, 'Status before logout');
            // 执行简化的退出（不等待异步操作）
            whatsapp_service_1.whatsappService.logout();
            // 获取退出后的状态
            const statusAfter = whatsapp_service_1.whatsappService.getStatus();
            logger_1.logger.info({ statusAfter }, 'Status after logout');
            logger_1.logger.info('WhatsApp logout completed successfully');
            return (0, response_1.sendOk)(reply, 200, {
                message: 'Logged out successfully',
                statusBefore,
                statusAfter
            });
        }
        catch (error) {
            logger_1.logger.error({
                error: error instanceof Error ? {
                    name: error.name,
                    message: error.message,
                    stack: error.stack
                } : error
            }, 'Failed to logout');
            // 即使出错，也尝试返回当前状态
            const currentStatus = whatsapp_service_1.whatsappService.getStatus();
            return (0, response_1.sendError)(reply, 500, {
                code: 'LOGOUT_FAILED',
                message: `Failed to logout: ${error instanceof Error ? error.message : String(error)}`,
                details: { currentStatus }
            });
        }
    });
    // 保留POST方法作为备用
    app.post('/auth/logout', async (_request, reply) => {
        try {
            logger_1.logger.info('Received logout request (POST)');
            // 获取退出前的状态
            const statusBefore = whatsapp_service_1.whatsappService.getStatus();
            logger_1.logger.info({ statusBefore }, 'Status before logout');
            // 执行简化的退出（不等待异步操作）
            whatsapp_service_1.whatsappService.logout();
            // 获取退出后的状态
            const statusAfter = whatsapp_service_1.whatsappService.getStatus();
            logger_1.logger.info({ statusAfter }, 'Status after logout');
            logger_1.logger.info('WhatsApp logout completed successfully');
            return (0, response_1.sendOk)(reply, 200, {
                message: 'Logged out successfully',
                statusBefore,
                statusAfter
            });
        }
        catch (error) {
            logger_1.logger.error({
                error: error instanceof Error ? {
                    name: error.name,
                    message: error.message,
                    stack: error.stack
                } : error
            }, 'Failed to logout');
            // 即使出错，也尝试返回当前状态
            const currentStatus = whatsapp_service_1.whatsappService.getStatus();
            return (0, response_1.sendError)(reply, 500, {
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
            await (0, thread_service_1.deleteThread)(params.id);
            logger_1.logger.info({ threadId: params.id }, 'Thread deleted successfully');
            return (0, response_1.sendOk)(reply, 200, { message: 'Thread deleted successfully' });
        }
        catch (error) {
            logger_1.logger.error({ error, threadId: params.id }, 'Failed to delete thread');
            return (0, response_1.sendError)(reply, 500, { code: 'DELETE_FAILED', message: 'Failed to delete thread' });
        }
    });
    app.get('/contacts/:id', async (request, reply) => {
        const params = contactIdSchema.parse(request.params);
        const contact = await (0, contact_service_1.getContactById)(params.id);
        const view = serializeContact((0, contact_service_1.withCooldownRemaining)(contact));
        return (0, response_1.sendOk)(reply, 200, view);
    });
    // 获取系统设置
    app.get('/settings', async (_request, reply) => {
        try {
            const settings = {
                cooldownHours: config_1.appConfig.cooldownHours,
                perContactReplyCooldownMinutes: config_1.appConfig.perContactReplyCooldown,
                globalAiEnabled: true, // 可以从数据库或配置中获取
                welcomeTemplate: config_1.appConfig.welcomeTemplate || '您好！我是AI助手，很高兴为您服务。',
                apiUrl: process.env.API_BASE_URL || 'http://localhost:4000',
                theme: 'light',
                language: 'zh-CN'
            };
            return (0, response_1.sendOk)(reply, 200, settings);
        }
        catch (error) {
            logger_1.logger.error({ error }, 'Failed to get settings');
            return (0, response_1.sendError)(reply, 500, { code: 'SETTINGS_GET_FAILED', message: 'Failed to get settings' });
        }
    });
    // 保存系统设置
    app.put('/settings', async (request, reply) => {
        try {
            const settings = settingsSchema.parse(request.body);
            // 这里可以将设置保存到数据库或更新配置
            // 目前作为演示，我们只返回成功消息
            logger_1.logger.info({ settings }, 'Settings updated');
            return (0, response_1.sendOk)(reply, 200, {
                message: 'Settings saved successfully',
                settings: settings
            });
        }
        catch (error) {
            logger_1.logger.error({ error }, 'Failed to save settings');
            if (error instanceof zod_1.z.ZodError) {
                return (0, response_1.sendError)(reply, 400, {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid settings data',
                    details: error.flatten()
                });
            }
            return (0, response_1.sendError)(reply, 500, { code: 'SETTINGS_SAVE_FAILED', message: 'Failed to save settings' });
        }
    });
    if (!config_1.isAuthEnabled) {
        logger_1.logger.warn('AUTH_TOKEN is not configured. Authentication is disabled.');
    }
    return app;
}
//# sourceMappingURL=server.js.map