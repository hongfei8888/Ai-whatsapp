"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordMessage = recordMessage;
exports.recordMessageIfMissing = recordMessageIfMissing;
exports.listMessages = listMessages;
const client_1 = require("@prisma/client");
const prisma_1 = require("../prisma");
async function recordMessage(input) {
    const data = {
        direction: input.direction,
        status: input.status ?? client_1.MessageStatus.SENT,
        text: input.text ?? null,
        externalId: input.externalId ?? null,
        thread: { connect: { id: input.threadId } },
    };
    return prisma_1.prisma.message.create({ data });
}
async function recordMessageIfMissing(input) {
    try {
        return await recordMessage(input);
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            return null;
        }
        throw error;
    }
}
async function listMessages(threadId, take = 100) {
    return prisma_1.prisma.message.findMany({
        where: { threadId },
        orderBy: { createdAt: 'asc' },
        take,
    });
}
//# sourceMappingURL=message-service.js.map