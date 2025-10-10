import { Message, MessageDirection, MessageStatus, Prisma } from '@prisma/client';
import { prisma } from '../prisma';

export interface RecordMessageInput {
  threadId: string;
  externalId?: string | null;
  direction: MessageDirection;
  text?: string | null;
  status?: MessageStatus;
  // 媒体文件相关字段
  mediaUrl?: string | null;
  mediaType?: string | null;
  mediaMimeType?: string | null;
  mediaSize?: number | null;
  mediaFileName?: string | null;
  originalFileName?: string | null;
  thumbnailUrl?: string | null;
  duration?: number | null;
}

export async function recordMessage(input: RecordMessageInput): Promise<Message> {
  const data: Prisma.MessageCreateInput = {
    direction: input.direction,
    status: input.status ?? MessageStatus.SENT,
    text: input.text ?? null,
    externalId: input.externalId ?? null,
    thread: { connect: { id: input.threadId } },
    // 媒体文件字段
    mediaUrl: input.mediaUrl ?? null,
    mediaType: input.mediaType ?? null,
    mediaMimeType: input.mediaMimeType ?? null,
    mediaSize: input.mediaSize ?? null,
    mediaFileName: input.mediaFileName ?? null,
    originalFileName: input.originalFileName ?? null,
    thumbnailUrl: input.thumbnailUrl ?? null,
    duration: input.duration ?? null,
  };

  return prisma.message.create({ data });
}

export async function recordMessageIfMissing(input: RecordMessageInput): Promise<Message | null> {
  try {
    return await recordMessage(input);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return null;
    }
    throw error;
  }
}

export async function listMessages(threadId: string, take = 100): Promise<Message[]> {
  return prisma.message.findMany({
    where: { threadId },
    orderBy: { createdAt: 'asc' },
    take,
  });
}

// 引用回复消息
export interface ReplyToMessageInput {
  threadId: string;
  replyToId: string;
  text: string;
  direction: MessageDirection;
  externalId?: string | null;
}

export async function replyToMessage(input: ReplyToMessageInput): Promise<Message> {
  // 验证被引用的消息是否存在
  const replyTo = await prisma.message.findUnique({
    where: { id: input.replyToId },
  });

  if (!replyTo) {
    throw new Error('被引用的消息不存在');
  }

  const data: Prisma.MessageCreateInput = {
    direction: input.direction,
    text: input.text,
    externalId: input.externalId ?? null,
    thread: { connect: { id: input.threadId } },
    replyTo: { connect: { id: input.replyToId } },
  };

  return prisma.message.create({
    data,
    include: {
      replyTo: true,
    },
  });
}

// 编辑消息
export async function editMessage(messageId: string, newText: string): Promise<Message> {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
  });

  if (!message) {
    throw new Error('消息不存在');
  }

  if (message.isDeleted) {
    throw new Error('已删除的消息无法编辑');
  }

  return prisma.message.update({
    where: { id: messageId },
    data: {
      text: newText,
      originalText: message.isEdited ? message.originalText : message.text,
      isEdited: true,
      editedAt: new Date(),
    },
  });
}

// 删除消息
export async function deleteMessage(messageId: string, deletedBy: string): Promise<Message> {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
  });

  if (!message) {
    throw new Error('消息不存在');
  }

  return prisma.message.update({
    where: { id: messageId },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy,
    },
  });
}

// 转发消息
export interface ForwardMessageInput {
  messageId: string;
  targetThreadIds: string[];
  direction: MessageDirection;
}

export async function forwardMessage(input: ForwardMessageInput): Promise<Message[]> {
  const originalMessage = await prisma.message.findUnique({
    where: { id: input.messageId },
    include: {
      thread: {
        include: {
          contact: true,
        },
      },
    },
  });

  if (!originalMessage) {
    throw new Error('消息不存在');
  }

  if (originalMessage.isDeleted) {
    throw new Error('已删除的消息无法转发');
  }

  const forwardedMessages: Message[] = [];

  for (const targetThreadId of input.targetThreadIds) {
    const data: Prisma.MessageCreateInput = {
      direction: input.direction,
      text: originalMessage.text,
      mediaUrl: originalMessage.mediaUrl,
      mediaType: originalMessage.mediaType,
      mediaMimeType: originalMessage.mediaMimeType,
      mediaSize: originalMessage.mediaSize,
      mediaFileName: originalMessage.mediaFileName,
      thumbnailUrl: originalMessage.thumbnailUrl,
      isForwarded: true,
      forwardedFrom: originalMessage.thread.contact.name || originalMessage.thread.contact.phoneE164,
      thread: { connect: { id: targetThreadId } },
    };

    const forwardedMessage = await prisma.message.create({ data });
    forwardedMessages.push(forwardedMessage);
  }

  return forwardedMessages;
}

// 标记/取消标记消息
export async function starMessage(messageId: string, starred: boolean): Promise<Message> {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
  });

  if (!message) {
    throw new Error('消息不存在');
  }

  return prisma.message.update({
    where: { id: messageId },
    data: {
      isStarred: starred,
      starredAt: starred ? new Date() : null,
    },
  });
}

// 搜索消息
export interface SearchMessagesInput {
  query: string;
  threadId?: string;
  limit?: number;
  offset?: number;
}

export async function searchMessages(input: SearchMessagesInput): Promise<{
  messages: Message[];
  total: number;
}> {
  const { query, threadId, limit = 50, offset = 0 } = input;

  const where: Prisma.MessageWhereInput = {
    text: {
      contains: query,
      // 注意：SQLite 不支持 mode: 'insensitive'，仅 PostgreSQL 支持
      // 对于 SQLite，contains 默认是大小写敏感的
    },
    isDeleted: false,
    ...(threadId ? { threadId } : {}),
  };

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        thread: {
          include: {
            contact: true,
          },
        },
      },
    }),
    prisma.message.count({ where }),
  ]);

  return { messages, total };
}

// 获取星标消息
export async function getStarredMessages(threadId?: string): Promise<Message[]> {
  return prisma.message.findMany({
    where: {
      isStarred: true,
      isDeleted: false,
      ...(threadId ? { threadId } : {}),
    },
    orderBy: { starredAt: 'desc' },
    include: {
      thread: {
        include: {
          contact: true,
        },
      },
    },
  });
}

// 获取消息详情（包含引用关系）
export async function getMessageWithRelations(messageId: string) {
  return prisma.message.findUnique({
    where: { id: messageId },
    include: {
      replyTo: true,
      replies: true,
      thread: {
        include: {
          contact: true,
        },
      },
    },
  });
}
