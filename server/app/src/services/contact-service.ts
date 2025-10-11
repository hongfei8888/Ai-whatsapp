import { Contact, Prisma } from '@prisma/client';
import { prisma } from '../prisma';
import { ContactAlreadyExistsError, ContactNotFoundError } from '../errors';
import { normalizeE164 } from '../utils/phone';

export interface CreateContactInput {
  phoneE164: string;
  name?: string;
  consent?: boolean;
}

export interface ContactView extends Contact {
  consent: boolean;
  optedOutAt: Date | null;
  source: string | null;
  tags: any;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}


export async function createContact(accountId: string, input: CreateContactInput): Promise<Contact> {
  const data: Prisma.ContactUncheckedCreateInput = {
    accountId,
    phoneE164: normalizeE164(input.phoneE164),
    name: input.name?.trim() || null,
    consent: input.consent ?? true,
  };

  try {
    return await prisma.contact.create({ data });
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ContactAlreadyExistsError();
    }
    throw error;
  }
}

export async function listContacts(accountId: string): Promise<ContactView[]> {
  const contacts = await prisma.contact.findMany({
    where: { accountId },
    orderBy: { createdAt: 'desc' },
  });

  return contacts;
}

export async function getContactById(accountId: string, id: string): Promise<Contact> {
  const contact = await prisma.contact.findFirst({ 
    where: { accountId, id } 
  });
  if (!contact) {
    throw new ContactNotFoundError();
  }
  return contact;
}

export async function getContactByPhone(accountId: string, phoneE164: string): Promise<Contact | null> {
  return prisma.contact.findFirst({ 
    where: { 
      accountId, 
      phoneE164 
    } 
  });
}

export async function updateContact(
  accountId: string,
  id: string,
  input: { name?: string; tags?: string[]; consent?: boolean }
): Promise<Contact> {
  const contact = await prisma.contact.findFirst({ where: { accountId, id } });
  if (!contact) {
    throw new ContactNotFoundError();
  }

  const data: Prisma.ContactUpdateInput = {};
  if (input.name !== undefined) data.name = input.name.trim() || null;
  if (input.tags !== undefined) data.tags = input.tags;
  if (input.consent !== undefined) data.consent = input.consent;

  return await prisma.contact.update({
    where: { id },
    data,
  });
}

export async function deleteContact(accountId: string, id: string): Promise<void> {
  try {
    const contact = await prisma.contact.findFirst({ where: { accountId, id } });
    if (!contact) {
      throw new ContactNotFoundError();
    }

    // 使用事务确保数据一致性
    await prisma.$transaction(async (tx) => {
      // 1. 删除相关的消息记录
      await tx.message.deleteMany({
        where: { 
          accountId,
          thread: { 
            contactId: id 
          } 
        },
      });

      // 2. 删除相关的对话线程
      await tx.thread.deleteMany({
        where: { accountId, contactId: id },
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
  } catch (error) {
    console.error('删除联系人时出错:', error);
    console.error('错误详情:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}