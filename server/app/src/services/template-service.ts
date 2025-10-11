import { MessageTemplate } from '@prisma/client';
import { prisma } from '../prisma';
import { ensureNoForbiddenKeyword } from '../guards/keyword-guard';

const PLACEHOLDER_REGEX = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

type MessageTemplateRecord = MessageTemplate;

export interface TemplatePayload {
  name: string;
  content: string;
  variables?: string[];
}

export function extractTemplateVariables(content: string): string[] {
  const variables = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = PLACEHOLDER_REGEX.exec(content)) !== null) {
    const variable = match[1]?.trim();
    if (variable) {
      variables.add(variable);
    }
  }
  return Array.from(variables.values());
}

function sanitizeVariables(variables?: string[]): string[] {
  if (!variables) {
    return [];
  }
  return Array.from(new Set(variables.filter((item) => item.trim().length > 0))).map((item) => item.trim());
}

export async function createTemplate(accountId: string, payload: TemplatePayload): Promise<MessageTemplateRecord> {
  ensureNoForbiddenKeyword(payload.content);
  const autoVariables = extractTemplateVariables(payload.content);
  const explicitVariables = sanitizeVariables(payload.variables);
  const mergedVariables = Array.from(new Set([...autoVariables, ...explicitVariables]));

  return prisma.messageTemplate.create({
    data: {
      accountId,
      name: payload.name,
      content: payload.content,
      variables: mergedVariables,
    },
  });
}

export async function updateTemplate(id: string, payload: Partial<TemplatePayload>): Promise<MessageTemplateRecord> {
  const existing = await prisma.messageTemplate.findUnique({ where: { id } });
  if (!existing) {
    throw new Error('Template not found');
  }

  const content = payload.content ?? existing.content;
  ensureNoForbiddenKeyword(content);

  const explicitVariables = payload.variables ? sanitizeVariables(payload.variables) : (existing.variables as string[] | undefined) ?? [];
  const autoVariables = extractTemplateVariables(content);
  const mergedVariables = Array.from(new Set([...autoVariables, ...explicitVariables]));

  return prisma.messageTemplate.update({
    where: { id },
    data: {
      name: payload.name ?? existing.name,
      content,
      variables: mergedVariables,
    },
  });
}

export async function listTemplates(): Promise<MessageTemplateRecord[]> {
  return prisma.messageTemplate.findMany({
    orderBy: { createdAt: 'desc' },
  });
}

export async function getTemplateById(id: string): Promise<MessageTemplateRecord | null> {
  return prisma.messageTemplate.findUnique({ where: { id } });
}

export function serializeTemplate(template: MessageTemplateRecord) {
  return {
    id: template.id,
    name: template.name,
    content: template.content,
    variables: (template.variables as string[] | undefined) ?? [],
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString(),
  };
}
