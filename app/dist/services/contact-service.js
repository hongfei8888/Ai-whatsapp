"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createContact = createContact;
exports.listContacts = listContacts;
exports.getContactById = getContactById;
exports.getContactByPhone = getContactByPhone;
exports.deleteContact = deleteContact;
const client_1 = require("@prisma/client");
const prisma_1 = require("../prisma");
const errors_1 = require("../errors");
const phone_1 = require("../utils/phone");
async function createContact(input) {
    const data = {
        phoneE164: (0, phone_1.normalizeE164)(input.phoneE164),
        name: input.name?.trim() || null,
        consent: input.consent ?? true,
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
    return contacts;
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
async function deleteContact(id) {
    try {
        const contact = await prisma_1.prisma.contact.findUnique({ where: { id } });
        if (!contact) {
            throw new errors_1.ContactNotFoundError();
        }
        // 使用事务确保数据一致性
        await prisma_1.prisma.$transaction(async (tx) => {
            // 1. 删除相关的消息记录
            await tx.message.deleteMany({
                where: {
                    thread: {
                        contactId: id
                    }
                },
            });
            // 2. 删除相关的对话线程
            await tx.thread.deleteMany({
                where: { contactId: id },
            });
            // 3. 删除相关的活动接收者记录
            await tx.campaignRecipient.deleteMany({
                where: { contactId: id },
            });
            // 4. 最后删除联系人
            await tx.contact.delete({
                where: { id },
            });
        });
    }
    catch (error) {
        console.error('删除联系人时出错:', error);
        console.error('错误详情:', {
            name: error instanceof Error ? error.name : 'Unknown',
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
        });
        throw error;
    }
}
//# sourceMappingURL=contact-service.js.map