import { Campaign, CampaignRecipientStatus, CampaignStatus, Contact, MessageTemplate } from '@prisma/client';
import { prisma } from '../prisma';
import { ensureNoForbiddenKeyword } from '../guards/keyword-guard';
import { logger } from '../logger';
import { ValidationError } from '../errors';

export interface CreateCampaignInput {
  name: string;
  templateId?: string;
  content?: string;
  contactIds?: string[];
  scheduleAt?: Date | null;
  ratePerMinute?: number;
  jitterMs?: number;
}

export interface CampaignFilters {
  status?: CampaignStatus;
}

export type CampaignWithTemplate = Campaign & { template?: MessageTemplate | null };

function normalizeContent(content: string): string {
  return content.trim();
}

async function resolveTemplate(templateId?: string): Promise<MessageTemplate | null> {
  if (!templateId) {
    return null;
  }
  const template = await prisma.messageTemplate.findUnique({ where: { id: templateId } });
  if (!template) {
    throw new ValidationError('Template not found');
  }
  return template;
}

async function selectRecipients(contactIds?: string[]): Promise<Contact[]> {
  if (contactIds && contactIds.length > 0) {
    return prisma.contact.findMany({ where: { id: { in: contactIds } } });
  }
  return prisma.contact.findMany({ where: { consent: true, optedOutAt: null } });
}

export async function createCampaign(input: CreateCampaignInput): Promise<CampaignWithTemplate> {
  const template = await resolveTemplate(input.templateId);
  const baseContent = input.content ?? template?.content ?? '';
  const content = normalizeContent(baseContent);
  if (!content) {
    throw new ValidationError('Campaign content is required');
  }
  ensureNoForbiddenKeyword(content);

  const contacts = await selectRecipients(input.contactIds);
  if (contacts.length === 0) {
    throw new ValidationError('No recipients matched the campaign criteria');
  }

  const scheduleAt = input.scheduleAt ?? null;
  const initialStatus = scheduleAt && scheduleAt > new Date() ? CampaignStatus.SCHEDULED : CampaignStatus.DRAFT;

  const campaign = await prisma.campaign.create({
    data: {
      name: input.name,
      templateId: template ? template.id : null,
      content,
      scheduleAt,
      ratePerMinute: input.ratePerMinute ?? 8,
      jitterMs: input.jitterMs ?? 300,
      status: initialStatus,
      total: contacts.length,
      recipients: {
        createMany: {
          data: contacts.map((contact) => ({
            contactId: contact.id,
            phoneE164: contact.phoneE164,
          })),
        },
      },
    },
    include: { template: true },
  });

  logger.info({ campaignId: campaign.id, total: contacts.length }, 'Campaign created');
  return campaign;
}

export async function listCampaigns(filters?: CampaignFilters): Promise<CampaignWithTemplate[]> {
  return prisma.campaign.findMany({
    where: filters?.status ? { status: filters.status } : undefined,
    orderBy: { createdAt: 'desc' },
    include: { template: true },
  });
}

export async function getCampaignById(id: string): Promise<CampaignWithTemplate | null> {
  return prisma.campaign.findUnique({ where: { id }, include: { template: true } });
}

export async function getCampaignRecipients(campaignId: string, status?: CampaignRecipientStatus, take = 100, cursor?: string) {
  return prisma.campaignRecipient.findMany({
    where: {
      campaignId,
      status: status ? status : undefined,
    },
    orderBy: { createdAt: 'asc' },
    take,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  });
}

export async function startCampaign(id: string): Promise<CampaignWithTemplate> {
  const campaign = await prisma.campaign.update({
    where: { id },
    data: {
      status: CampaignStatus.RUNNING,
    },
    include: { template: true },
  });
  logger.info({ campaignId: id }, 'Campaign started');
  return campaign;
}

export async function scheduleCampaign(id: string): Promise<void> {
  await prisma.campaign.update({
    where: { id },
    data: { status: CampaignStatus.SCHEDULED },
  });
}

export async function pauseCampaign(id: string): Promise<void> {
  await prisma.campaign.update({ where: { id }, data: { status: CampaignStatus.PAUSED } });
  logger.info({ campaignId: id }, 'Campaign paused');
}

export async function cancelCampaign(id: string): Promise<void> {
  await prisma.$transaction([
    prisma.campaign.update({ where: { id }, data: { status: CampaignStatus.CANCELLED } }),
    prisma.campaignRecipient.updateMany({
      where: { campaignId: id, status: { in: [CampaignRecipientStatus.PENDING, CampaignRecipientStatus.PROCESSING] } },
      data: { status: CampaignRecipientStatus.SKIPPED },
    }),
  ]);
  logger.info({ campaignId: id }, 'Campaign cancelled');
}

export async function updateCampaignCounters(id: string): Promise<void> {
  const aggregate = await prisma.campaignRecipient.groupBy({
    by: ['status'],
    where: { campaignId: id },
    _count: { _all: true },
  });

  let sent = 0;
  let failed = 0;
  aggregate.forEach((item) => {
    if (item.status === CampaignRecipientStatus.SENT) {
      sent += item._count._all;
    }
    if (item.status === CampaignRecipientStatus.FAILED) {
      failed += item._count._all;
    }
  });

  await prisma.campaign.update({
    where: { id },
    data: { sent, failed },
  });
}

export async function maybeCompleteCampaign(id: string): Promise<void> {
  const remaining = await prisma.campaignRecipient.count({
    where: {
      campaignId: id,
      status: {
        in: [CampaignRecipientStatus.PENDING, CampaignRecipientStatus.PROCESSING],
      },
    },
  });

  if (remaining === 0) {
    await prisma.campaign.update({ where: { id }, data: { status: CampaignStatus.DONE } });
    logger.info({ campaignId: id }, 'Campaign marked as done');
  }
}

export interface RenderContext {
  contact?: Contact | null;
}

export function renderCampaignMessage(campaign: CampaignWithTemplate, context: RenderContext): string {
  const baseContent = campaign.content ?? campaign.template?.content ?? '';
  const replacements: Record<string, string> = {};
  const contact = context.contact;
  if (contact) {
    replacements.name = contact.name ?? '';
    replacements.user_name = contact.name ?? '';
    replacements.phone = contact.phoneE164;
  }

  return baseContent.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (full, key: string) => {
    const normalized = (key ?? '').trim();
    if (!normalized) {
      return full;
    }
    const replacement = replacements[normalized];
    return replacement !== undefined ? replacement : '';
  });
}

export async function previewCampaignMessages(id: string, limit = 5): Promise<Array<{ recipientId: string; phoneE164: string; message: string }>> {
  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: { template: true },
  });
  if (!campaign) {
    throw new ValidationError('Campaign not found');
  }

  const recipients = await prisma.campaignRecipient.findMany({
    where: { campaignId: id },
    include: { contact: true },
    orderBy: { createdAt: 'asc' },
    take: limit,
  });

  return recipients.map((recipient) => ({
    recipientId: recipient.id,
    phoneE164: recipient.phoneE164,
    message: renderCampaignMessage(campaign, { contact: recipient.contact ?? null }),
  }));
}

export function serializeCampaign(campaign: CampaignWithTemplate) {
  return {
    id: campaign.id,
    name: campaign.name,
    templateId: campaign.templateId,
    content: campaign.content,
    scheduleAt: campaign.scheduleAt ? campaign.scheduleAt.toISOString() : null,
    ratePerMinute: campaign.ratePerMinute,
    jitterMs: campaign.jitterMs,
    status: campaign.status,
    total: campaign.total,
    sent: campaign.sent,
    failed: campaign.failed,
    createdAt: campaign.createdAt.toISOString(),
    updatedAt: campaign.updatedAt.toISOString(),
    template: campaign.template
      ? {
          id: campaign.template.id,
          name: campaign.template.name,
          variables: (campaign.template.variables as string[] | undefined) ?? [],
        }
      : null,
  };
}

export function serializeRecipient(recipient: { id: string; phoneE164: string; status: CampaignRecipientStatus; lastError: string | null; sentAt: Date | null; tries: number; maxTries: number; createdAt: Date; updatedAt: Date; contact?: Contact | null }) {
  return {
    id: recipient.id,
    phoneE164: recipient.phoneE164,
    status: recipient.status,
    lastError: recipient.lastError,
    sentAt: recipient.sentAt ? recipient.sentAt.toISOString() : null,
    tries: recipient.tries,
    maxTries: recipient.maxTries,
    createdAt: recipient.createdAt.toISOString(),
    updatedAt: recipient.updatedAt.toISOString(),
    contact: recipient.contact
      ? {
          id: recipient.contact.id,
          name: recipient.contact.name,
          phoneE164: recipient.contact.phoneE164,
        }
      : null,
  };
}
