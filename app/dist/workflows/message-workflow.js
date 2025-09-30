"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleIncomingMessage = handleIncomingMessage;
exports.handleOutgoingMessage = handleOutgoingMessage;
const client_1 = require("@prisma/client");
const logger_1 = require("../logger");
const config_1 = require("../config");
const phone_1 = require("../utils/phone");
const prisma_1 = require("../prisma");
const contact_service_1 = require("../services/contact-service");
const thread_service_1 = require("../services/thread-service");
const message_service_1 = require("../services/message-service");
const whatsapp_service_1 = require("../whatsapp-service");
const pipeline_1 = require("../ai/pipeline");
const keyword_guard_1 = require("../guards/keyword-guard");
const WELCOME_MESSAGE = config_1.appConfig.welcomeTemplate || '��л�ظ�����������ר�����֣����κ����⻶ӭ��ʱ������~';
async function handleIncomingMessage(message) {
    const phoneE164 = (0, phone_1.chatIdToE164)(message.from);
    const body = message.body ?? '';
    const now = new Date();
    const meta = message;
    const displayName = meta.notifyName ?? meta.pushname ?? null;
    let contact = await (0, contact_service_1.getContactByPhone)(phoneE164);
    if (!contact) {
        contact = await prisma_1.prisma.contact.create({
            data: {
                phoneE164,
                name: displayName,
            },
        });
    }
    const thread = await (0, thread_service_1.getOrCreateThread)(contact.id);
    await (0, message_service_1.recordMessageIfMissing)({
        threadId: thread.id,
        direction: client_1.MessageDirection.IN,
        text: body,
        externalId: message.id?._serialized ?? null,
        status: client_1.MessageStatus.SENT,
    });
    await Promise.all([
        (0, contact_service_1.touchCooldown)(contact.id, null),
        (0, thread_service_1.updateThread)(thread.id, { lastHumanAt: now }),
    ]);
    const refreshedThread = await (0, thread_service_1.getThreadById)(thread.id);
    // 确保AI总是启用（除非被人工禁用）
    if (!refreshedThread.aiEnabled) {
        // 自动启用AI并发送欢迎消息（如果是首次对话）
        await (0, thread_service_1.setAiEnabled)(thread.id, true);
        if (!refreshedThread.lastBotAt) {
            await sendAndRecordReply({
                contactId: contact.id,
                threadId: thread.id,
                phoneE164,
                text: WELCOME_MESSAGE,
                now,
            });
            return; // 发送欢迎消息后结束，下次消息会正常处理
        }
    }
    const canSendAutoReply = await (0, thread_service_1.shouldSendAutoReply)(thread.id, now);
    if (!canSendAutoReply) {
        logger_1.logger.debug({ threadId: thread.id }, 'Skipping auto reply due to per-contact cooldown');
        return;
    }
    const history = await (0, message_service_1.listMessages)(thread.id, 20);
    try {
        const turns = history
            .slice(-10)
            .map((item) => ({
            role: item.direction === client_1.MessageDirection.IN ? 'user' : 'assistant',
            content: item.text ?? '',
        }))
            .filter((turn) => turn.content.length > 0);
        const reply = await (0, pipeline_1.buildAiReply)({
            latestMessage: body,
            contactName: contact.name,
            history: turns,
        });
        const forbidden = (0, keyword_guard_1.containsForbiddenKeyword)(reply);
        if (forbidden) {
            logger_1.logger.warn({ threadId: thread.id, keyword: forbidden }, 'AI reply blocked by forbidden keyword, using fallback');
            await sendAndRecordReply({
                contactId: contact.id,
                threadId: thread.id,
                phoneE164,
                text: pipeline_1.FALLBACK_REPLY,
                now,
            });
            return;
        }
        await sendAndRecordReply({
            contactId: contact.id,
            threadId: thread.id,
            phoneE164,
            text: reply,
            now,
        });
    }
    catch (error) {
        logger_1.logger.error({ err: error, contactId: contact.id }, 'Failed to build AI reply');
        await sendAndRecordReply({
            contactId: contact.id,
            threadId: thread.id,
            phoneE164,
            text: pipeline_1.FALLBACK_REPLY,
            now,
        });
    }
}
async function handleOutgoingMessage(message) {
    try {
        const phoneE164 = (0, phone_1.chatIdToE164)(message.to);
        const contact = await (0, contact_service_1.getContactByPhone)(phoneE164);
        if (!contact) {
            return;
        }
        const thread = await (0, thread_service_1.getOrCreateThread)(contact.id);
        await (0, message_service_1.recordMessageIfMissing)({
            threadId: thread.id,
            direction: client_1.MessageDirection.OUT,
            text: message.body ?? '',
            externalId: message.id?._serialized ?? null,
            status: client_1.MessageStatus.SENT,
        });
    }
    catch (error) {
        logger_1.logger.error({ err: error }, 'Failed to record outgoing message');
    }
}
async function sendAndRecordReply(args) {
    try {
        (0, keyword_guard_1.ensureNoForbiddenKeyword)(args.text);
        const result = await whatsapp_service_1.whatsappService.sendTextMessage(args.phoneE164, args.text);
        await Promise.all([
            (0, message_service_1.recordMessage)({
                threadId: args.threadId,
                direction: client_1.MessageDirection.OUT,
                text: args.text,
                externalId: result.id ?? null,
                status: client_1.MessageStatus.SENT,
            }),
            (0, thread_service_1.updateThread)(args.threadId, { lastBotAt: args.now }),
        ]);
    }
    catch (error) {
        logger_1.logger.error({ err: error, contactId: args.contactId }, 'Failed to send WhatsApp message');
        await Promise.all([
            (0, message_service_1.recordMessage)({
                threadId: args.threadId,
                direction: client_1.MessageDirection.OUT,
                text: args.text,
                status: client_1.MessageStatus.FAILED,
            }),
            (0, thread_service_1.updateThread)(args.threadId, { lastBotAt: args.now }),
        ]);
    }
}
//# sourceMappingURL=message-workflow.js.map