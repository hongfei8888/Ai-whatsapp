"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatIdToE164 = chatIdToE164;
exports.normalizeE164 = normalizeE164;
function chatIdToE164(chatId) {
    const [raw] = chatId.split('@');
    const digits = raw.replace(/[^\d]/g, '');
    return `+${digits}`;
}
function normalizeE164(phone) {
    const digits = phone.replace(/[^\d]/g, '');
    return `+${digits}`;
}
//# sourceMappingURL=phone.js.map