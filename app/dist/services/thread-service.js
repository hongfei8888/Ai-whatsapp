"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getThreadById = getThreadById;
exports.getThreadByContactId = getThreadByContactId;
exports.getOrCreateThread = getOrCreateThread;
exports.setAiEnabled = setAiEnabled;
exports.updateThread = updateThread;
exports.listThreads = listThreads;
exports.getThreadSummary = getThreadSummary;
exports.getThreadWithMessages = getThreadWithMessages;
exports.computeLatestMessageAt = computeLatestMessageAt;
exports.shouldSendAutoReply = shouldSendAutoReply;
exports.deleteThread = deleteThread;
const prisma_1 = require("../prisma");
const errors_1 = require("../errors");
async function getThreadById(id) {
    const thread = await prisma_1.prisma.thread.findUnique({ where: { id } });
    if (!thread) {
        throw new errors_1.ThreadNotFoundError();
    }
    return thread;
}
async function getThreadByContactId(contactId) {
    return prisma_1.prisma.thread.findUnique({ where: { contactId } });
}
async function getOrCreateThread(contactId) {
    return prisma_1.prisma.thread.upsert({
        where: { contactId },
        create: {
            contactId,
            aiEnabled: true, // 默认启用AI自动回复
        },
        update: {},
    });
}
async function setAiEnabled(threadId, aiEnabled) {
    return prisma_1.prisma.thread.update({
        where: { id: threadId },
        data: { aiEnabled },
    });
}
async function updateThread(threadId, data) {
    await prisma_1.prisma.thread.update({
        where: { id: threadId },
        data,
    });
}
async function listThreads() {
    const threads = await prisma_1.prisma.thread.findMany({
        include: {
            contact: {
                select: {
                    id: true,
                    phoneE164: true,
                    name: true,
                    cooldownUntil: true,
                },
            },
            _count: {
                select: { messages: true },
            },
        },
        orderBy: [{ updatedAt: 'desc' }],
    });
    return threads.map((thread) => mapToListItem(thread));
}
async function getThreadSummary(threadId) {
    const thread = await prisma_1.prisma.thread.findUnique({
        where: { id: threadId },
        include: {
            contact: {
                select: {
                    id: true,
                    phoneE164: true,
                    name: true,
                    cooldownUntil: true,
                },
            },
            _count: {
                select: { messages: true },
            },
        },
    });
    if (!thread) {
        throw new errors_1.ThreadNotFoundError();
    }
    return mapToListItem(thread);
}
async function getThreadWithMessages(threadId, limit = 50) {
    const thread = await prisma_1.prisma.thread.findUnique({
        where: { id: threadId },
        include: {
            contact: {
                select: {
                    id: true,
                    phoneE164: true,
                    name: true,
                    cooldownUntil: true,
                },
            },
            messages: {
                orderBy: { createdAt: 'asc' },
                take: limit,
            },
        },
    });
    if (!thread) {
        throw new errors_1.ThreadNotFoundError();
    }
    return thread;
}
function mapToListItem(thread) {
    const { _count, ...rest } = thread;
    const latestMessageAt = computeLatestMessageAt(rest);
    return {
        ...rest,
        messagesCount: _count.messages,
        latestMessageAt,
    };
}
function computeLatestMessageAt(thread) {
    const timestamps = [thread.lastHumanAt, thread.lastBotAt].filter((value) => value != null);
    if (timestamps.length === 0) {
        return null;
    }
    return timestamps.reduce((acc, current) => (acc.getTime() > current.getTime() ? acc : current));
}
async function shouldSendAutoReply(threadId, now = new Date()) {
    const thread = await getThreadById(threadId);
    if (!thread.aiEnabled) {
        return false;
    }
    // 已移除回复冷却检查 - 立即回复每条消息
    // if (thread.lastBotAt) {
    //   const timeSinceLastReply = now.getTime() - thread.lastBotAt.getTime();
    //   if (timeSinceLastReply < appConfig.perContactReplyCooldownMs) {
    //     return false;
    //   }
    // }
    return true;
}
async function deleteThread(threadId) {
    // 首先删除相关的消息
    await prisma_1.prisma.message.deleteMany({
        where: { threadId }
    });
    // 然后删除线程
    await prisma_1.prisma.thread.delete({
        where: { id: threadId }
    });
}
//# sourceMappingURL=thread-service.js.map