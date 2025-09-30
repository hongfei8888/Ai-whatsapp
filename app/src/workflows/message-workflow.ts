import { Message as WhatsAppMessage } from '../../../index.js';
import { MessageDirection, MessageStatus } from '@prisma/client';
import { logger } from '../logger';
import { appConfig } from '../config';
import { chatIdToE164 } from '../utils/phone';
import { prisma } from '../prisma';
import { getContactByPhone, touchCooldown } from '../services/contact-service';
import {
  getOrCreateThread,
  getThreadById,
  setAiEnabled,
  shouldSendAutoReply,
  updateThread,
} from '../services/thread-service';
import { listMessages, recordMessage, recordMessageIfMissing } from '../services/message-service';
import { whatsappService } from '../whatsapp-service';
import { buildAiReply, FALLBACK_REPLY } from '../ai/pipeline';
import { containsForbiddenKeyword, ensureNoForbiddenKeyword } from '../guards/keyword-guard';

const WELCOME_MESSAGE = appConfig.welcomeTemplate || '��л�ظ�����������ר�����֣����κ����⻶ӭ��ʱ������~';

export async function handleIncomingMessage(message: WhatsAppMessage): Promise<void> {
  const phoneE164 = chatIdToE164(message.from);
  const body = message.body ?? '';
  const now = new Date();

  const meta = message as unknown as { notifyName?: string; pushname?: string };
  const displayName = meta.notifyName ?? meta.pushname ?? null;

  let contact = await getContactByPhone(phoneE164);
  if (!contact) {
    contact = await prisma.contact.create({
      data: {
        phoneE164,
        name: displayName,
      },
    });
  }

  const thread = await getOrCreateThread(contact.id);

  await recordMessageIfMissing({
    threadId: thread.id,
    direction: MessageDirection.IN,
    text: body,
    externalId: message.id?._serialized ?? null,
    status: MessageStatus.SENT,
  });

  await Promise.all([
    touchCooldown(contact.id, null),
    updateThread(thread.id, { lastHumanAt: now }),
  ]);

  const refreshedThread = await getThreadById(thread.id);

  // 确保AI总是启用（除非被人工禁用）
  if (!refreshedThread.aiEnabled) {
    // 自动启用AI并发送欢迎消息（如果是首次对话）
    await setAiEnabled(thread.id, true);
    if (!refreshedThread.lastBotAt) {
      await sendAndRecordReply({
        contactId: contact.id,
        threadId: thread.id,
        phoneE164,
        text: WELCOME_MESSAGE,
        now,
      });
      return; // 发送欢迎消息后结束，下次消息会正常处理
    }
  }

  const canSendAutoReply = await shouldSendAutoReply(thread.id, now);
  if (!canSendAutoReply) {
    logger.debug({ threadId: thread.id }, 'Skipping auto reply due to per-contact cooldown');
    return;
  }

  const history = await listMessages(thread.id, 20);

  try {
    const turns = history
      .slice(-10)
      .map((item) => ({
        role: item.direction === MessageDirection.IN ? ('user' as const) : ('assistant' as const),
        content: item.text ?? '',
      }))
      .filter((turn) => turn.content.length > 0);

    const reply = await buildAiReply({
      latestMessage: body,
      contactName: contact.name,
      history: turns,
    });

    const forbidden = containsForbiddenKeyword(reply);
    if (forbidden) {
      logger.warn({ threadId: thread.id, keyword: forbidden }, 'AI reply blocked by forbidden keyword, using fallback');
      await sendAndRecordReply({
        contactId: contact.id,
        threadId: thread.id,
        phoneE164,
        text: FALLBACK_REPLY,
        now,
      });
      return;
    }

    await sendAndRecordReply({
      contactId: contact.id,
      threadId: thread.id,
      phoneE164,
      text: reply,
      now,
    });
  } catch (error) {
    logger.error({ err: error, contactId: contact.id }, 'Failed to build AI reply');
    await sendAndRecordReply({
      contactId: contact.id,
      threadId: thread.id,
      phoneE164,
      text: FALLBACK_REPLY,
      now,
    });
  }
}

export async function handleOutgoingMessage(message: WhatsAppMessage): Promise<void> {
  try {
    const phoneE164 = chatIdToE164(message.to);
    const contact = await getContactByPhone(phoneE164);
    if (!contact) {
      return;
    }

    const thread = await getOrCreateThread(contact.id);

    await recordMessageIfMissing({
      threadId: thread.id,
      direction: MessageDirection.OUT,
      text: message.body ?? '',
      externalId: message.id?._serialized ?? null,
      status: MessageStatus.SENT,
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to record outgoing message');
  }
}

interface SendAndRecordArgs {
  contactId: string;
  threadId: string;
  phoneE164: string;
  text: string;
  now: Date;
}

async function sendAndRecordReply(args: SendAndRecordArgs): Promise<void> {
  try {
    ensureNoForbiddenKeyword(args.text);

    const result = await whatsappService.sendTextMessage(args.phoneE164, args.text);
    await Promise.all([
      recordMessage({
        threadId: args.threadId,
        direction: MessageDirection.OUT,
        text: args.text,
        externalId: result.id ?? null,
        status: MessageStatus.SENT,
      }),
      updateThread(args.threadId, { lastBotAt: args.now }),
    ]);
  } catch (error) {
    logger.error({ err: error, contactId: args.contactId }, 'Failed to send WhatsApp message');
    await Promise.all([
      recordMessage({
        threadId: args.threadId,
        direction: MessageDirection.OUT,
        text: args.text,
        status: MessageStatus.FAILED,
      }),
      updateThread(args.threadId, { lastBotAt: args.now }),
    ]);
  }
}