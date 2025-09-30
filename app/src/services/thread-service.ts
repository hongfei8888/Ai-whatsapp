import { Message, Prisma, Thread } from '@prisma/client';
import { prisma } from '../prisma';
import { ThreadNotFoundError } from '../errors';
import { appConfig } from '../config';

export interface ThreadContact {
  id: string;
  phoneE164: string;
  name: string | null;
  cooldownUntil: Date | null;
}

export interface ThreadWithMessages extends Thread {
  contact: ThreadContact;
  messages: Message[];
}

export interface ThreadListItem extends Thread {
  contact: ThreadContact;
  messagesCount: number;
  latestMessageAt: Date | null;
}

type ThreadRecord = Thread & {
  contact: ThreadContact;
  _count: { messages: number };
};

export async function getThreadById(id: string): Promise<Thread> {
  const thread = await prisma.thread.findUnique({ where: { id } });
  if (!thread) {
    throw new ThreadNotFoundError();
  }
  return thread;
}

export async function getThreadByContactId(contactId: string): Promise<Thread | null> {
  return prisma.thread.findUnique({ where: { contactId } });
}

export async function getOrCreateThread(contactId: string): Promise<Thread> {
  return prisma.thread.upsert({
    where: { contactId },
    create: {
      contactId,
      aiEnabled: true, // 默认启用AI自动回复
    },
    update: {},
  });
}

export async function setAiEnabled(threadId: string, aiEnabled: boolean): Promise<Thread> {
  return prisma.thread.update({
    where: { id: threadId },
    data: { aiEnabled },
  });
}

export async function updateThread(threadId: string, data: Prisma.ThreadUpdateInput): Promise<void> {
  await prisma.thread.update({
    where: { id: threadId },
    data,
  });
}

export async function listThreads(): Promise<ThreadListItem[]> {
  const threads = await prisma.thread.findMany({
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

  return threads.map((thread) => mapToListItem(thread as ThreadRecord));
}

export async function getThreadSummary(threadId: string): Promise<ThreadListItem> {
  const thread = await prisma.thread.findUnique({
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
    throw new ThreadNotFoundError();
  }

  return mapToListItem(thread as ThreadRecord);
}

export async function getThreadWithMessages(threadId: string, limit = 50): Promise<ThreadWithMessages> {
  const thread = await prisma.thread.findUnique({
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
    throw new ThreadNotFoundError();
  }

  return thread as ThreadWithMessages;
}

function mapToListItem(thread: ThreadRecord): ThreadListItem {
  const { _count, ...rest } = thread;
  const latestMessageAt = computeLatestMessageAt(rest);
  return {
    ...rest,
    messagesCount: _count.messages,
    latestMessageAt,
  };
}

export function computeLatestMessageAt(thread: Pick<Thread, 'lastHumanAt' | 'lastBotAt' | 'updatedAt'>): Date | null {
  const timestamps = [thread.lastHumanAt, thread.lastBotAt].filter((value) => value != null) as Date[];
  if (timestamps.length === 0) {
    return null;
  }
  return timestamps.reduce((acc, current) => (acc.getTime() > current.getTime() ? acc : current));
}

export async function shouldSendAutoReply(threadId: string, now = new Date()): Promise<boolean> {
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

export async function deleteThread(threadId: string): Promise<void> {
  // 首先删除相关的消息
  await prisma.message.deleteMany({
    where: { threadId }
  });

  // 然后删除线程
  await prisma.thread.delete({
    where: { id: threadId }
  });
}