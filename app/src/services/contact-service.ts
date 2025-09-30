import { Contact, Prisma } from '@prisma/client';
import { prisma } from '../prisma';
import { ContactAlreadyExistsError, ContactNotFoundError } from '../errors';
import { normalizeE164 } from '../utils/phone';

export interface CreateContactInput {
  phoneE164: string;
  name?: string;
}

export interface ContactView extends Contact {
  cooldownRemainingSeconds: number | null;
}

export const computeCooldownRemainingSeconds = (cooldownUntil: Date | null, now = new Date()): number | null => {
  if (!cooldownUntil) {
    return null;
  }

  const remaining = cooldownUntil.getTime() - now.getTime();
  return remaining > 0 ? Math.ceil(remaining / 1000) : null;
};

export async function createContact(input: CreateContactInput): Promise<Contact> {
  const data: Prisma.ContactCreateInput = {
    phoneE164: normalizeE164(input.phoneE164),
    name: input.name?.trim() || null,
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

export async function listContacts(): Promise<ContactView[]> {
  const contacts = await prisma.contact.findMany({
    orderBy: { createdAt: 'desc' },
  });

  const now = new Date();
  return contacts.map((contact) => ({
    ...contact,
    cooldownRemainingSeconds: computeCooldownRemainingSeconds(contact.cooldownUntil, now),
  }));
}

export async function getContactById(id: string): Promise<Contact> {
  const contact = await prisma.contact.findUnique({ where: { id } });
  if (!contact) {
    throw new ContactNotFoundError();
  }
  return contact;
}

export async function getContactByPhone(phoneE164: string): Promise<Contact | null> {
  return prisma.contact.findUnique({ where: { phoneE164 } });
}

export async function touchCooldown(contactId: string, cooldownUntil: Date | null): Promise<Contact> {
  return prisma.contact.update({
    where: { id: contactId },
    data: { cooldownUntil },
  });
}

export function isCooldownActive(contact: Contact, now = new Date()): boolean {
  return Boolean(contact.cooldownUntil && contact.cooldownUntil.getTime() > now.getTime());
}

export function withCooldownRemaining(contact: Contact, now = new Date()): ContactView {
  return {
    ...contact,
    cooldownRemainingSeconds: computeCooldownRemainingSeconds(contact.cooldownUntil, now),
  };
}

export async function deleteContact(id: string): Promise<void> {
  const contact = await prisma.contact.findUnique({ where: { id } });
  if (!contact) {
    throw new ContactNotFoundError();
  }

  // 删除相关的消息记录
  await prisma.message.deleteMany({
    where: { 
      thread: { 
        contactId: id 
      } 
    },
  });

  // 删除相关的对话线程
  await prisma.thread.deleteMany({
    where: { contactId: id },
  });

  // 删除联系人
  await prisma.contact.delete({
    where: { id },
  });
}