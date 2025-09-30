import { AiConfig } from '@prisma/client';
import { prisma } from '../prisma';
import { appConfig } from '../config';
import { logger } from '../logger';

export type AiStylePreset = 'concise-cn' | 'sales-cn' | 'support-cn';

export interface AiConfigDTO {
  id: string;
  systemPrompt: string;
  maxTokens: number;
  temperature: number;
  minChars: number;
  stylePreset: AiStylePreset;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateAiConfigInput {
  systemPrompt: string;
  maxTokens: number;
  temperature: number;
  minChars: number;
  stylePreset: AiStylePreset;
}

const CACHE_TTL_MS = 30_000;
export const DEFAULT_SYSTEM_PROMPT = `你是 WhatsApp 智能客服助手：
- 语言：中文简体，友好、专业。
- 长度：优先 80-160 字；多问题可到 240 字，最多 6 句。
- 结构：先直答，再给 1–2 条可操作建议；需要信息时给明确追问。
- 禁止：夸大承诺（如“百分百保证/永久有效/官方合作”）、价格猜测、收集隐私。
- 不确定时：说“我记录下来了，会尽快为你确认具体细节。”
- 可用变量：{{user_name}}、{{brand}}、{{working_hours}}，若未提供则忽略。
只输出正文文本。`;

let cache: { value: AiConfig; expiresAt: number } | null = null;

const resolveDefaultPrompt = (): string => {
  return process.env.LLM_SYSTEM_PROMPT?.trim() || DEFAULT_SYSTEM_PROMPT;
};

const resolveDefaultStyle = (): AiStylePreset => appConfig.llmDefaultStylePreset;

const resolveDefaultMaxTokens = (): number => appConfig.llmDefaultMaxTokens;

const resolveDefaultTemperature = (): number => appConfig.llmDefaultTemperature;

const resolveDefaultMinChars = (): number => appConfig.llmDefaultMinChars;

const refreshCache = (config: AiConfig) => {
  cache = {
    value: config,
    expiresAt: Date.now() + CACHE_TTL_MS,
  };
};

export function clearAiConfigCache(): void {
  cache = null;
}

export async function ensureAiConfig(): Promise<AiConfig> {
  const existing = await prisma.aiConfig.findUnique({ where: { id: 'global' } });
  if (existing) {
    return existing;
  }

  const created = await prisma.aiConfig.create({
    data: {
      id: 'global',
      systemPrompt: resolveDefaultPrompt(),
      maxTokens: Math.max(128, Math.round(resolveDefaultMaxTokens())),
      temperature: Math.min(1, Math.max(0, resolveDefaultTemperature())),
      minChars: Math.max(20, Math.round(resolveDefaultMinChars())),
      stylePreset: resolveDefaultStyle(),
    },
  });

  logger.info({ component: 'ai-config' }, 'Seeded default AI configuration');
  refreshCache(created);
  return created;
}

export async function getAiConfig(options?: { force?: boolean }): Promise<AiConfig> {
  if (!options?.force && cache && cache.expiresAt > Date.now()) {
    return cache.value;
  }

  const config = await prisma.aiConfig.findUnique({ where: { id: 'global' } });
  if (config) {
    refreshCache(config);
    return config;
  }

  const ensured = await ensureAiConfig();
  refreshCache(ensured);
  return ensured;
}

export async function updateAiConfig(input: UpdateAiConfigInput): Promise<AiConfig> {
  await ensureAiConfig();

  const updated = await prisma.aiConfig.update({
    where: { id: 'global' },
    data: {
      systemPrompt: input.systemPrompt,
      maxTokens: Math.max(128, Math.round(input.maxTokens)),
      temperature: Math.min(1, Math.max(0, input.temperature)),
      minChars: Math.max(20, Math.round(input.minChars)),
      stylePreset: input.stylePreset,
    },
  });

  refreshCache(updated);
  return updated;
}

export function serializeAiConfig(config: AiConfig): AiConfigDTO {
  return {
    id: config.id,
    systemPrompt: config.systemPrompt,
    maxTokens: config.maxTokens,
    temperature: config.temperature,
    minChars: config.minChars,
    stylePreset: config.stylePreset as AiStylePreset,
    createdAt: config.createdAt.toISOString(),
    updatedAt: config.updatedAt.toISOString(),
  };
}
