import { CampaignRecipientStatus, CampaignStatus, MessageDirection } from '@prisma/client';
import { appConfig } from '../config';
import { ensureNoForbiddenKeyword } from '../guards/keyword-guard';
import { logger } from '../logger';
import { prisma } from '../prisma';
import type { WPPConnectService } from '../wppconnect-service';
import { createContact } from './contact-service';
import { recordMessage } from './message-service';
import { renderCampaignMessage, updateCampaignCounters, maybeCompleteCampaign } from './campaign-service';
import { getOrCreateThread, updateThread } from './thread-service';

// TODO: campaign-runner 需要重构以支持多账号
// 当前设计使用全局定时器，需要改为每个账号独立的运行器

const TICK_INTERVAL_MS = 1000;
let timer: NodeJS.Timeout | null = null;
let processing = false;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function computeBatchSize(ratePerMinute: number): number {
  return Math.max(1, Math.ceil(ratePerMinute / 60));
}

async function promoteScheduledCampaigns(now: Date): Promise<void> {
  await prisma.campaign.updateMany({
    where: {
      status: CampaignStatus.SCHEDULED,
      scheduleAt: {
        lte: now,
      },
    },
    data: {
      status: CampaignStatus.RUNNING,
    },
  });
}

async function processCampaigns(): Promise<void> {
  const now = new Date();
  await promoteScheduledCampaigns(now);

  const campaigns = await prisma.campaign.findMany({
    where: { status: CampaignStatus.RUNNING },
    include: { template: true },
    orderBy: { updatedAt: 'asc' },
    take: 3,
  });

  for (const campaign of campaigns) {
    const batchSize = computeBatchSize(campaign.ratePerMinute);
    const recipients = await prisma.campaignRecipient.findMany({
      where: {
        campaignId: campaign.id,
        status: CampaignRecipientStatus.PENDING,
      },
      orderBy: { createdAt: 'asc' },
      take: batchSize,
    });

    if (recipients.length === 0) {
      await maybeCompleteCampaign(campaign.id);
      continue;
    }

    for (const recipient of recipients) {
      const latestCampaign = await prisma.campaign.findUnique({ where: { id: campaign.id } });
      if (!latestCampaign || latestCampaign.status !== CampaignStatus.RUNNING) {
        break;
      }

      await prisma.campaignRecipient.update({
        where: { id: recipient.id },
        data: { status: CampaignRecipientStatus.PROCESSING },
      });

      await handleSend(campaign, recipient).catch(async (error) => {
        logger.warn({ campaignId: campaign.id, recipientId: recipient.id, err: error }, 'Failed to send campaign message');
        await onSendFailure(recipient.id, error instanceof Error ? error.message : String(error));
      });

      if (campaign.jitterMs > 0) {
        await sleep(Math.floor(Math.random() * campaign.jitterMs));
      }
    }

    await updateCampaignCounters(campaign.id);
    await maybeCompleteCampaign(campaign.id);
  }
}

async function handleSend(campaign: Awaited<ReturnType<typeof prisma.campaign.findMany>>[number], recipient: { id: string; contactId: string | null; phoneE164: string }): Promise<void> {
  const contact = recipient.contactId ? await prisma.contact.findUnique({ where: { id: recipient.contactId } }) : null;

  if (contact && (!contact.consent || contact.optedOutAt)) {
    await prisma.campaignRecipient.update({
      where: { id: recipient.id },
      data: {
        status: CampaignRecipientStatus.SKIPPED,
        lastError: 'Contact opted out',
      },
    });
    return;
  }

  const targetContact = contact ?? await ensureTransientContact(campaign.accountId, recipient.phoneE164);

  if (!targetContact) {
    await prisma.campaignRecipient.update({
      where: { id: recipient.id },
      data: {
        status: CampaignRecipientStatus.FAILED,
        lastError: 'Contact not found',
      },
    });
    return;
  }


  // TODO: 需要从 AccountManager 获取对应账号的 whatsappService 实例
  const accountId = campaign.accountId;
  
  const message = renderCampaignMessage(campaign, { contact: targetContact });
  ensureNoForbiddenKeyword(message);

  const thread = await getOrCreateThread(accountId, targetContact.id);

  // TODO: 需要获取对应账号的 whatsappService 实例
  // if (whatsappService.getStatus().status !== 'READY') {
  //   throw new Error('WhatsApp client not ready');
  // }
  // const sendResult = await whatsappService.sendTextMessage(targetContact.phoneE164, message);
  
  throw new Error('Campaign runner needs refactoring for multi-account support');
  
  // await recordMessage({
  //   accountId,
  //   threadId: thread.id,
  //   direction: MessageDirection.OUT,
  //   text: message,
  //   externalId: sendResult.id ?? null,
  // });

  const now = new Date();
  await Promise.all([
    prisma.campaignRecipient.update({
      where: { id: recipient.id },
      data: {
        status: CampaignRecipientStatus.SENT,
        sentAt: now,
        tries: { increment: 1 },
      },
    }),
    updateThread(thread.id, { lastOutboundAt: now } as any),
  ]);
}

async function ensureTransientContact(accountId: string, phoneE164: string) {
  const existing = await prisma.contact.findUnique({ 
    where: { 
      accountId_phoneE164: {
        accountId,
        phoneE164
      }
    }
  });
  if (existing) {
    return existing;
  }
  return createContact(accountId, { phoneE164 });
}

async function onSendFailure(recipientId: string, reason: string): Promise<void> {
  const recipient = await prisma.campaignRecipient.findUnique({ where: { id: recipientId } });
  if (!recipient) {
    return;
  }

  const tries = recipient.tries + 1;
  if (tries >= recipient.maxTries) {
    await prisma.campaignRecipient.update({
      where: { id: recipientId },
      data: {
        status: CampaignRecipientStatus.FAILED,
        tries,
        lastError: reason,
      },
    });
  } else {
    await prisma.campaignRecipient.update({
      where: { id: recipientId },
      data: {
        status: CampaignRecipientStatus.PENDING,
        tries,
        lastError: reason,
      },
    });
  }
}

export function startCampaignRunner(): void {
  if (timer) {
    return;
  }
  timer = setInterval(async () => {
    if (processing) {
      return;
    }
    processing = true;
    try {
      await processCampaigns();
    } catch (error) {
      logger.error({ err: error }, 'Campaign runner tick failed');
    } finally {
      processing = false;
    }
  }, TICK_INTERVAL_MS);
  logger.info('Campaign runner started');
}
