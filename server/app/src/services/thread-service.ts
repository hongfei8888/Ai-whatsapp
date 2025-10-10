import { Message, Prisma, Thread } from '@prisma/client';
import { prisma } from '../prisma';
import { ThreadNotFoundError } from '../errors';
import { appConfig } from '../config';

export interface ThreadContact {
  id: string;
  phoneE164: string;
  name: string | null;
  avatarUrl?: string | null;
}

export interface LastMessage {
  id: string;
  text: string | null;
  direction: string;
  createdAt: Date;
}

export interface ThreadWithMessages extends Thread {
  contact: ThreadContact;
  messages: Message[];
}

export interface ThreadListItem extends Thread {
  contact: ThreadContact;
  messagesCount: number;
  latestMessageAt: Date | null;
  lastMessage: LastMessage | null;
}

type ThreadRecord = Thread & {
  contact: ThreadContact & { avatarUrl?: string | null };
  _count: { messages: number };
  messages: Message[];
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
          avatarUrl: true,
        },
      },
      _count: {
        select: { messages: true },
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1, // 只获取最后一条消息
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
          avatarUrl: true,
        },
      },
      _count: {
        select: { messages: true },
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
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

// 分页获取会话消息（支持向上加载）
export interface GetMessagesOptions {
  threadId: string;
  limit?: number;
  before?: Date; // 获取此时间之前的消息（向上滚动）
  after?: Date;  // 获取此时间之后的消息（向下滚动）
}

export async function getThreadMessagesPage(options: GetMessagesOptions): Promise<{
  messages: Message[];
  hasMore: boolean;
}> {
  const { threadId, limit = 50, before, after } = options;

  // 验证会话存在
  const thread = await prisma.thread.findUnique({
    where: { id: threadId },
  });

  if (!thread) {
    throw new ThreadNotFoundError();
  }

  const where: any = { threadId };

  if (before) {
    where.createdAt = { lt: before };
  }

  if (after) {
    where.createdAt = { gt: after };
  }

  // 获取 limit + 1 条消息以判断是否还有更多
  const messages = await prisma.message.findMany({
    where,
    orderBy: { createdAt: before ? 'desc' : 'asc' },
    take: limit + 1,
    include: {
      replyTo: {
        select: {
          id: true,
          text: true,
          direction: true,
          createdAt: true,
        },
      },
    },
  });

  const hasMore = messages.length > limit;
  const result = hasMore ? messages.slice(0, limit) : messages;

  // 如果是向上加载（before），需要反转顺序
  if (before) {
    result.reverse();
  }

  return {
    messages: result,
    hasMore,
  };
}

function mapToListItem(thread: ThreadRecord): ThreadListItem {
  const { _count, messages, ...rest } = thread;
  const latestMessageAt = computeLatestMessageAt(rest);
  const lastMessage = messages && messages.length > 0 ? {
    id: messages[0].id,
    text: messages[0].text,
    direction: messages[0].direction,
    createdAt: messages[0].createdAt,
  } : null;
  
  return {
    ...rest,
    messagesCount: _count.messages,
    latestMessageAt,
    lastMessage,
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

// 置顶/取消置顶会话
export async function pinThread(threadId: string, pinned: boolean): Promise<Thread> {
  const thread = await prisma.thread.findUnique({
    where: { id: threadId },
  });

  if (!thread) {
    throw new ThreadNotFoundError();
  }

  return prisma.thread.update({
    where: { id: threadId },
    data: {
      isPinned: pinned,
      pinnedAt: pinned ? new Date() : null,
    },
  });
}

// 归档/取消归档会话
export async function archiveThread(threadId: string, archived: boolean): Promise<Thread> {
  const thread = await prisma.thread.findUnique({
    where: { id: threadId },
  });

  if (!thread) {
    throw new ThreadNotFoundError();
  }

  return prisma.thread.update({
    where: { id: threadId },
    data: {
      isArchived: archived,
      archivedAt: archived ? new Date() : null,
    },
  });
}

// 更新会话标签
export async function updateThreadLabels(threadId: string, labels: string[]): Promise<Thread> {
  const thread = await prisma.thread.findUnique({
    where: { id: threadId },
  });

  if (!thread) {
    throw new ThreadNotFoundError();
  }

  return prisma.thread.update({
    where: { id: threadId },
    data: {
      labels: labels,
    },
  });
}

// 标记会话已读
export async function markThreadAsRead(threadId: string): Promise<Thread> {
  const thread = await prisma.thread.findUnique({
    where: { id: threadId },
  });

  if (!thread) {
    throw new ThreadNotFoundError();
  }

  return prisma.thread.update({
    where: { id: threadId },
    data: {
      unreadCount: 0,
      lastReadAt: new Date(),
    },
  });
}

// 增加未读消息数
export async function incrementUnreadCount(threadId: string): Promise<Thread> {
  const thread = await prisma.thread.findUnique({
    where: { id: threadId },
  });

  if (!thread) {
    throw new ThreadNotFoundError();
  }

  return prisma.thread.update({
    where: { id: threadId },
    data: {
      unreadCount: {
        increment: 1,
      },
    },
  });
}

// 保存草稿
export async function saveDraft(threadId: string, draft: string): Promise<Thread> {
  const thread = await prisma.thread.findUnique({
    where: { id: threadId },
  });

  if (!thread) {
    throw new ThreadNotFoundError();
  }

  return prisma.thread.update({
    where: { id: threadId },
    data: {
      draft: draft || null,
      draftUpdatedAt: draft ? new Date() : null,
    },
  });
}

// 获取草稿
export async function getDraft(threadId: string): Promise<string | null> {
  const thread = await prisma.thread.findUnique({
    where: { id: threadId },
    select: {
      draft: true,
    },
  });

  if (!thread) {
    throw new ThreadNotFoundError();
  }

  return thread.draft;
}

// 按筛选条件获取会话列表
export interface ThreadFilter {
  isPinned?: boolean;
  isArchived?: boolean;
  labels?: string[];
  hasUnread?: boolean;
}

export async function listThreadsFiltered(filter: ThreadFilter): Promise<ThreadListItem[]> {
  const where: Prisma.ThreadWhereInput = {};

  if (filter.isPinned !== undefined) {
    where.isPinned = filter.isPinned;
  }

  if (filter.isArchived !== undefined) {
    where.isArchived = filter.isArchived;
  }

  if (filter.labels && filter.labels.length > 0) {
    // SQLite doesn't support JSON array operations well, so we'll filter in memory
    // For production with PostgreSQL, use: where.labels = { array_contains: filter.labels }
  }

  if (filter.hasUnread) {
    where.unreadCount = { gt: 0 };
  }

  const threads = await prisma.thread.findMany({
    where,
    include: {
      contact: {
        select: {
          id: true,
          phoneE164: true,
          name: true,
          avatarUrl: true,
        },
      },
      _count: {
        select: { messages: true },
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: [
      { isPinned: 'desc' }, // 置顶的在前
      { updatedAt: 'desc' }, // 按更新时间倒序
    ],
  });

  let result = threads.map((thread) => mapToListItem(thread as ThreadRecord));

  // 在内存中过滤标签（SQLite限制）
  if (filter.labels && filter.labels.length > 0) {
    result = result.filter((thread) => {
      if (!thread.labels) return false;
      const threadLabels = Array.isArray(thread.labels) ? thread.labels : [];
      return filter.labels!.some((label) => threadLabels.includes(label));
    });
  }

  return result;
}