import { Message as WhatsAppMessage } from 'whatsapp-web.js';
import { MessageDirection, MessageStatus } from '@prisma/client';
import { logger } from '../logger';
import { appConfig } from '../config';
import { chatIdToE164 } from '../utils/phone';
import { prisma } from '../prisma';
import { getContactByPhone } from '../services/contact-service';
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

  await updateThread(thread.id, { lastHumanAt: now });

  const refreshedThread = await getThreadById(thread.id);

  // ✅ 检查AI是否启用（尊重用户设置）
  if (!refreshedThread.aiEnabled) {
    logger.info({ threadId: thread.id }, '❌ AI自动回复已关闭，跳过回复');
    return; // AI已关闭，不发送自动回复
  }

  logger.info({ threadId: thread.id }, '✅ AI自动回复已启用，准备回复');

  // 冷却期功能已移除，允许立即发送自动回复

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
    logger.info({ 
      messageId: message.id?._serialized,
      messageTo: message.to,
      messageBody: message.body,
      messageFromMe: message.fromMe
    }, 'Processing outgoing message');
    
    const phoneE164 = chatIdToE164(message.to);
    logger.info({ phoneE164 }, 'Converted chatId to phoneE164');
    
    const contact = await getContactByPhone(phoneE164);
    if (!contact) {
      logger.warn({ phoneE164 }, 'Contact not found for outgoing message, creating new contact');
      // 创建新联系人而不是直接返回
      const newContact = await prisma.contact.create({
        data: {
          phoneE164,
          name: null,
        },
      });
      logger.info({ contactId: newContact.id, phoneE164 }, 'Created new contact for outgoing message');
      
      const thread = await getOrCreateThread(newContact.id);
      
      await recordMessageIfMissing({
        threadId: thread.id,
        direction: MessageDirection.OUT,
        text: message.body ?? '',
        externalId: message.id?._serialized ?? null,
        status: MessageStatus.SENT,
      });
      
      logger.info({ 
        threadId: thread.id, 
        messageId: message.id?._serialized,
        phoneE164 
      }, 'Recorded outgoing message for new contact');
      return;
    }

    logger.info({ contactId: contact.id, phoneE164 }, 'Found existing contact for outgoing message');
    
    const thread = await getOrCreateThread(contact.id);

    await recordMessageIfMissing({
      threadId: thread.id,
      direction: MessageDirection.OUT,
      text: message.body ?? '',
      externalId: message.id?._serialized ?? null,
      status: MessageStatus.SENT,
    });
    
    logger.info({ 
      threadId: thread.id, 
      messageId: message.id?._serialized,
      phoneE164,
      contactId: contact.id
    }, 'Successfully recorded outgoing message');
    
  } catch (error) {
    logger.error({ 
      err: error, 
      messageId: message.id?._serialized,
      messageTo: message.to,
      messageBody: message.body
    }, 'Failed to record outgoing message');
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
      recordMessageIfMissing({
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