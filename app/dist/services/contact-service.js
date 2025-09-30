"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeCooldownRemainingSeconds = void 0;
exports.createContact = createContact;
exports.listContacts = listContacts;
exports.getContactById = getContactById;
exports.getContactByPhone = getContactByPhone;
exports.touchCooldown = touchCooldown;
exports.isCooldownActive = isCooldownActive;
exports.withCooldownRemaining = withCooldownRemaining;
exports.deleteContact = deleteContact;
const client_1 = require("@prisma/client");
const prisma_1 = require("../prisma");
const errors_1 = require("../errors");
const phone_1 = require("../utils/phone");
const computeCooldownRemainingSeconds = (cooldownUntil, now = new Date()) => {
    if (!cooldownUntil) {
        return null;
    }
    const remaining = cooldownUntil.getTime() - now.getTime();
    return remaining > 0 ? Math.ceil(remaining / 1000) : null;
};
exports.computeCooldownRemainingSeconds = computeCooldownRemainingSeconds;
async function createContact(input) {
    const data = {
        phoneE164: (0, phone_1.normalizeE164)(input.phoneE164),
        name: input.name?.trim() || null,
    };
    try {
        return await prisma_1.prisma.contact.create({ data });
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            throw new errors_1.ContactAlreadyExistsError();
        }
        throw error;
    }
}
async function listContacts() {
    const contacts = await prisma_1.prisma.contact.findMany({
        orderBy: { createdAt: 'desc' },
    });
    const now = new Date();
    return contacts.map((contact) => ({
        ...contact,
        cooldownRemainingSeconds: (0, exports.computeCooldownRemainingSeconds)(contact.cooldownUntil, now),
    }));
}
async function getContactById(id) {
    const contact = await prisma_1.prisma.contact.findUnique({ where: { id } });
    if (!contact) {
        throw new errors_1.ContactNotFoundError();
    }
    return contact;
}
async function getContactByPhone(phoneE164) {
    return prisma_1.prisma.contact.findUnique({ where: { phoneE164 } });
}
async function touchCooldown(contactId, cooldownUntil) {
    return prisma_1.prisma.contact.update({
        where: { id: contactId },
        data: { cooldownUntil },
    });
}
function isCooldownActive(contact, now = new Date()) {
    return Boolean(contact.cooldownUntil && contact.cooldownUntil.getTime() > now.getTime());
}
function withCooldownRemaining(contact, now = new Date()) {
    return {
        ...contact,
        cooldownRemainingSeconds: (0, exports.computeCooldownRemainingSeconds)(contact.cooldownUntil, now),
    };
}
async function deleteContact(id) {
    const contact = await prisma_1.prisma.contact.findUnique({ where: { id } });
    if (!contact) {
        throw new errors_1.ContactNotFoundError();
    }
    // 删除相关的消息记录
    await prisma_1.prisma.message.deleteMany({
        where: {
            thread: {
                contactId: id
            }
        },
    });
    // 删除相关的对话线程
    await prisma_1.prisma.thread.deleteMany({
        where: { contactId: id },
    });
    // 删除联系人
    await prisma_1.prisma.contact.delete({
        where: { id },
    });
}
//# sourceMappingURL=contact-service.js.map