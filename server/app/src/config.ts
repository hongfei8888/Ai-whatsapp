import { config as loadEnv } from 'dotenv';

loadEnv();

type PositiveNumber = number & { readonly brand?: unique symbol };

type StylePreset = 'concise-cn' | 'sales-cn' | 'support-cn';

const parsePositiveNumber = (value: string | undefined, fallback: number): PositiveNumber => {
  const parsed = Number.parseInt((value ?? '').trim(), 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback as PositiveNumber;
  }
  return parsed as PositiveNumber;
};

const parseNumber = (value: string | undefined, fallback: number): number => {
  if (!value) {
    return fallback;
  }
  const parsed = Number.parseFloat(value.trim());
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseKeywordList = (value: string | undefined): readonly string[] => {
  const normalized = (value ?? '').replace(/\r/g, '\n');
  const items = normalized
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .map((item) => item.toLowerCase());

  return Object.freeze(items);
};

const parseStylePreset = (value: string | undefined, fallback: StylePreset): StylePreset => {
  if (!value) {
    return fallback;
  }
  const normalized = value.trim() as StylePreset;
  if (normalized === 'concise-cn' || normalized === 'sales-cn' || normalized === 'support-cn') {
    return normalized;
  }
  return fallback;
};

export interface AppConfig {
  readonly databaseUrl: string;
  readonly sessionPath: string;
  readonly authToken: string | null;
  readonly deepseekApiKey: string | null;
  readonly deepseekApiUrl: string;
  readonly deepseekModel: string;
  readonly llmDefaultMaxTokens: number;
  readonly llmDefaultTemperature: number;
  readonly llmDefaultMinChars: number;
  readonly llmDefaultStylePreset: StylePreset;
  readonly bannedKeywords: readonly string[];
  readonly welcomeTemplate: string;
}

const defaultBannedKeywords = ['保证', '永久', '群发', '官方'];

const llmDefaultMaxTokens = Math.max(320, Math.round(parseNumber(process.env.LLM_MAX_TOKENS, 384)));
const llmDefaultTemperature = Math.min(1, Math.max(0, parseNumber(process.env.LLM_TEMPERATURE, 0.4)));
const llmDefaultMinChars = Math.max(20, Math.round(parseNumber(process.env.LLM_MIN_CHARS, 80)));
const llmDefaultStylePreset = parseStylePreset(process.env.LLM_STYLE_PRESET, 'concise-cn');

export const appConfig: AppConfig = {
  databaseUrl: process.env.DATABASE_URL ?? 'file:./dev.db',
  sessionPath: process.env.SESSION_PATH ?? './.session',
  authToken: process.env.AUTH_TOKEN ? process.env.AUTH_TOKEN.trim() : null, // 设置为null禁用认证
  deepseekApiKey: process.env.DEEPSEEK_API_KEY ? process.env.DEEPSEEK_API_KEY.trim() : null,
  deepseekApiUrl: process.env.DEEPSEEK_API_URL?.trim() || 'https://api.deepseek.com',
  deepseekModel: process.env.DEEPSEEK_MODEL?.trim() || 'deepseek-chat',
  llmDefaultMaxTokens,
  llmDefaultTemperature,
  llmDefaultMinChars,
  llmDefaultStylePreset,
  bannedKeywords: (() => {
    const keywords = parseKeywordList(process.env.BANNED_KEYWORDS ?? undefined);
    return keywords.length > 0 ? keywords : Object.freeze(defaultBannedKeywords);
  })(),
  welcomeTemplate: process.env.WELCOME_TEMPLATE?.trim() || '感谢回复，我是您的专属助手，有任何问题欢迎随时告诉我~',
};

if (!appConfig.databaseUrl) {
  throw new Error('DATABASE_URL is required');
}

export const isAuthEnabled = Boolean(appConfig.authToken);
