import { Message, MessageDirection, MessageStatus, Prisma } from '@prisma/client';
import { prisma } from '../prisma';

export interface RecordMessageInput {
  threadId: string;
  externalId?: string | null;
  direction: MessageDirection;
  text?: string | null;
  status?: MessageStatus;
}

export async function recordMessage(input: RecordMessageInput): Promise<Message> {
  const data: Prisma.MessageCreateInput = {
    direction: input.direction,
    status: input.status ?? MessageStatus.SENT,
    text: input.text ?? null,
    externalId: input.externalId ?? null,
    thread: { connect: { id: input.threadId } },
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
