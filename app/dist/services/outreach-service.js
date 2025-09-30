"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOutreach = sendOutreach;
const client_1 = require("@prisma/client");
const config_1 = require("../config");
const errors_1 = require("../errors");
const logger_1 = require("../logger");
const keyword_guard_1 = require("../guards/keyword-guard");
const contact_service_1 = require("./contact-service");
const thread_service_1 = require("./thread-service");
const message_service_1 = require("./message-service");
async function sendOutreach(request, sendMessage) {
    const now = new Date();
    const contact = await (0, contact_service_1.getContactById)(request.contactId);
    if ((0, contact_service_1.isCooldownActive)(contact, now)) {
        throw new errors_1.CooldownActiveError();
    }
    (0, keyword_guard_1.ensureNoForbiddenKeyword)(request.content);
    const thread = await (0, thread_service_1.getOrCreateThread)(contact.id);
    // 保持AI启用状态，准备接收回复后自动响应
    await (0, thread_service_1.setAiEnabled)(thread.id, true);
    try {
        const sendResult = await sendMessage({
            contactId: contact.id,
            phoneE164: contact.phoneE164,
            content: request.content,
        });
        const message = await (0, message_service_1.recordMessage)({
            threadId: thread.id,
            direction: client_1.MessageDirection.OUT,
            text: request.content,
            externalId: sendResult.externalId ?? null,
            status: client_1.MessageStatus.SENT,
        });
        const cooldownUntil = new Date(now.getTime() + config_1.appConfig.cooldownMs);
        await (0, contact_service_1.touchCooldown)(contact.id, cooldownUntil);
        return { threadId: thread.id, message };
    }
    catch (error) {
        logger_1.logger.error({
            contactId: contact.id,
            threadId: thread.id,
            err: error,
        }, 'Failed to send manual outreach');
        await (0, message_service_1.recordMessage)({
            threadId: thread.id,
            direction: client_1.MessageDirection.OUT,
            text: request.content,
            status: client_1.MessageStatus.FAILED,
        });
        throw new errors_1.MessageSendError();
    }
}
//# sourceMappingURL=outreach-service.js.map