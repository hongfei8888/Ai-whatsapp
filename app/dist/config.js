"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAuthEnabled = exports.appConfig = void 0;
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const parsePositiveNumber = (value, fallback) => {
    const parsed = Number.parseInt((value ?? '').trim(), 10);
    if (Number.isNaN(parsed) || parsed <= 0) {
        return fallback;
    }
    return parsed;
};
const parseNumber = (value, fallback) => {
    if (!value) {
        return fallback;
    }
    const parsed = Number.parseFloat(value.trim());
    return Number.isFinite(parsed) ? parsed : fallback;
};
const parseKeywordList = (value) => {
    const normalized = (value ?? '').replace(/\r/g, '\n');
    const items = normalized
        .split(/\n|,/)
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
        .map((item) => item.toLowerCase());
    return Object.freeze(items);
};
const parseStylePreset = (value, fallback) => {
    if (!value) {
        return fallback;
    }
    const normalized = value.trim();
    if (normalized === 'concise-cn' || normalized === 'sales-cn' || normalized === 'support-cn') {
        return normalized;
    }
    return fallback;
};
const cooldownHours = parsePositiveNumber(process.env.COOLDOWN_HOURS, 24);
const perContactReplyCooldown = parsePositiveNumber(process.env.PER_CONTACT_REPLY_COOLDOWN, 10);
const defaultBannedKeywords = ['保证', '永久', '群发', '官方'];
const llmDefaultMaxTokens = Math.max(320, Math.round(parseNumber(process.env.LLM_MAX_TOKENS, 384)));
const llmDefaultTemperature = Math.min(1, Math.max(0, parseNumber(process.env.LLM_TEMPERATURE, 0.4)));
const llmDefaultMinChars = Math.max(20, Math.round(parseNumber(process.env.LLM_MIN_CHARS, 80)));
const llmDefaultStylePreset = parseStylePreset(process.env.LLM_STYLE_PRESET, 'concise-cn');
exports.appConfig = {
    databaseUrl: process.env.DATABASE_URL ?? 'file:./dev.db',
    sessionPath: process.env.SESSION_PATH ?? './.session',
    cooldownHours,
    cooldownMs: cooldownHours * 60 * 60 * 1000,
    perContactReplyCooldown,
    perContactReplyCooldownMs: perContactReplyCooldown * 60 * 1000,
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
if (!exports.appConfig.databaseUrl) {
    throw new Error('DATABASE_URL is required');
}
exports.isAuthEnabled = Boolean(exports.appConfig.authToken);
//# sourceMappingURL=config.js.map