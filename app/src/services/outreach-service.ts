import { Message, MessageDirection, MessageStatus } from '@prisma/client';
import { appConfig } from '../config';
import { CooldownActiveError, MessageSendError } from '../errors';
import { logger } from '../logger';
import { ensureNoForbiddenKeyword } from '../guards/keyword-guard';
import { getContactById, isCooldownActive, touchCooldown } from './contact-service';
import { getOrCreateThread, setAiEnabled } from './thread-service';
import { recordMessage } from './message-service';

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

  if (isCooldownActive(contact, now)) {
    throw new CooldownActiveError();
  }

  ensureNoForbiddenKeyword(request.content);

  const thread = await getOrCreateThread(contact.id);
  // 保持AI启用状态，准备接收回复后自动响应
  await setAiEnabled(thread.id, true);

  try {
    const sendResult = await sendMessage({
      contactId: contact.id,
      phoneE164: contact.phoneE164,
      content: request.content,
    });

    const message = await recordMessage({
      threadId: thread.id,
      direction: MessageDirection.OUT,
      text: request.content,
      externalId: sendResult.externalId ?? null,
      status: MessageStatus.SENT,
    });

    const cooldownUntil = new Date(now.getTime() + appConfig.cooldownMs);
    await touchCooldown(contact.id, cooldownUntil);

    return { threadId: thread.id, message };
  } catch (error) {
    logger.error({
      contactId: contact.id,
      threadId: thread.id,
      err: error,
    }, 'Failed to send manual outreach');

    await recordMessage({
      threadId: thread.id,
      direction: MessageDirection.OUT,
      text: request.content,
      status: MessageStatus.FAILED,
    });

    throw new MessageSendError();
  }
}