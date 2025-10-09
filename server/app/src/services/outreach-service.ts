import { Message, MessageDirection, MessageStatus } from '@prisma/client';
import { prisma } from '../prisma';
import { appConfig } from '../config';
import { MessageSendError } from '../errors';
import { logger } from '../logger';
import { ensureNoForbiddenKeyword } from '../guards/keyword-guard';
import { getContactById } from './contact-service';
import { getOrCreateThread, setAiEnabled } from './thread-service';
import { recordMessage, recordMessageIfMissing } from './message-service';

export interface OutreachRequest {
  contactId: string;
  content: string;
}

export interface OutreachSendResult {
  threadId: string;
  message: Message;
}

export type SendOutboundMessageFn = (params: {
  contactId: string;
  phoneE164: string;
  content: string;
}) => Promise<{ externalId?: string | null }>;

export async function sendOutreach(
  request: OutreachRequest,
  sendMessage: SendOutboundMessageFn,
): Promise<OutreachSendResult> {
  const now = new Date();
  const contact = await getContactById(request.contactId);

  // 禁用冷却期检查 - 允许立即发送消息
  // if (isCooldownActive(contact, now)) {
  //   throw new CooldownActiveError();
  // }

  ensureNoForbiddenKeyword(request.content);

  const thread = await getOrCreateThread(contact.id);
  // 保持AI启用状态，准备接收回复后自动响应
  await setAiEnabled(thread.id, true);

  try {
    logger.info({
      contactId: contact.id,
      phoneE164: contact.phoneE164,
      content: request.content,
      threadId: thread.id
    }, 'Attempting to send outreach message');
    
    const sendResult = await sendMessage({
      contactId: contact.id,
      phoneE164: contact.phoneE164,
      content: request.content,
    });

    logger.info({
      contactId: contact.id,
      sendResult,
      threadId: thread.id
    }, 'Outreach message sent successfully');

    const message = await recordMessageIfMissing({
      threadId: thread.id,
      direction: MessageDirection.OUT,
      text: request.content,
      externalId: sendResult.externalId ?? null,
      status: MessageStatus.SENT,
    });

    if (!message) {
      logger.warn({
        contactId: contact.id,
        threadId: thread.id,
        externalId: sendResult.externalId
      }, 'Message already exists in database, finding existing message');
      
      // 查找现有消息
      const existingMessage = await prisma.message.findFirst({
        where: {
          threadId: thread.id,
          externalId: sendResult.externalId ?? null,
          direction: MessageDirection.OUT,
        },
      });
      
      if (existingMessage) {
        logger.info({
          messageId: existingMessage.id,
          contactId: contact.id,
          threadId: thread.id
        }, 'Using existing message from database');
        return { threadId: thread.id, message: existingMessage };
      } else {
        logger.error({
          contactId: contact.id,
          threadId: thread.id,
          externalId: sendResult.externalId
        }, 'Could not find existing message after duplicate constraint error');
        throw new Error('Message duplicate constraint error but existing message not found');
      }
    }

    logger.info({
      contactId: contact.id,
      messageId: message.id,
      threadId: thread.id
    }, 'Outreach message recorded in database');

    // 禁用冷却期设置 - 不设置冷却时间
    // const cooldownUntil = new Date(now.getTime() + appConfig.cooldownMs);
    // await touchCooldown(contact.id, cooldownUntil);

    return { threadId: thread.id, message };
  } catch (error) {
    logger.error({
      contactId: contact.id,
      threadId: thread.id,
      phoneE164: contact.phoneE164,
      content: request.content,
      error: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      errorName: error instanceof Error ? error.name : 'UnknownError'
    }, 'Failed to send manual outreach via WhatsApp, but will still record message');

    // 即使WhatsApp发送失败，也记录消息到数据库，标记为FAILED状态
    const message = await recordMessage({
      threadId: thread.id,
      direction: MessageDirection.OUT,
      text: request.content,
      externalId: null,
      status: MessageStatus.FAILED,
    });

    logger.info({
      contactId: contact.id,
      messageId: message.id,
      threadId: thread.id,
      status: 'FAILED'
    }, 'Outreach message recorded in database with FAILED status');

    // 不抛出异常，而是返回失败状态的消息
    return { threadId: thread.id, message };
  }
}