"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_SYSTEM_PROMPT = void 0;
exports.clearAiConfigCache = clearAiConfigCache;
exports.ensureAiConfig = ensureAiConfig;
exports.getAiConfig = getAiConfig;
exports.updateAiConfig = updateAiConfig;
exports.serializeAiConfig = serializeAiConfig;
const prisma_1 = require("../prisma");
const config_1 = require("../config");
const logger_1 = require("../logger");
const CACHE_TTL_MS = 30000;
exports.DEFAULT_SYSTEM_PROMPT = `你是 WhatsApp 智能客服助手：
- 语言：中文简体，友好、专业。
- 长度：优先 80-160 字；多问题可到 240 字，最多 6 句。
- 结构：先直答，再给 1–2 条可操作建议；需要信息时给明确追问。
- 禁止：夸大承诺（如“百分百保证/永久有效/官方合作”）、价格猜测、收集隐私。
- 不确定时：说“我记录下来了，会尽快为你确认具体细节。”
- 可用变量：{{user_name}}、{{brand}}、{{working_hours}}，若未提供则忽略。
只输出正文文本。`;
let cache = null;
const resolveDefaultPrompt = () => {
    return process.env.LLM_SYSTEM_PROMPT?.trim() || exports.DEFAULT_SYSTEM_PROMPT;
};
const resolveDefaultStyle = () => config_1.appConfig.llmDefaultStylePreset;
const resolveDefaultMaxTokens = () => config_1.appConfig.llmDefaultMaxTokens;
const resolveDefaultTemperature = () => config_1.appConfig.llmDefaultTemperature;
const resolveDefaultMinChars = () => config_1.appConfig.llmDefaultMinChars;
const refreshCache = (config) => {
    cache = {
        value: config,
        expiresAt: Date.now() + CACHE_TTL_MS,
    };
};
function clearAiConfigCache() {
    cache = null;
}
async function ensureAiConfig() {
    const existing = await prisma_1.prisma.aiConfig.findUnique({ where: { id: 'global' } });
    if (existing) {
        return existing;
    }
    const created = await prisma_1.prisma.aiConfig.create({
        data: {
            id: 'global',
            systemPrompt: resolveDefaultPrompt(),
            maxTokens: Math.max(128, Math.round(resolveDefaultMaxTokens())),
            temperature: Math.min(1, Math.max(0, resolveDefaultTemperature())),
            minChars: Math.max(20, Math.round(resolveDefaultMinChars())),
            stylePreset: resolveDefaultStyle(),
        },
    });
    logger_1.logger.info({ component: 'ai-config' }, 'Seeded default AI configuration');
    refreshCache(created);
    return created;
}
async function getAiConfig(options) {
    if (!options?.force && cache && cache.expiresAt > Date.now()) {
        return cache.value;
    }
    const config = await prisma_1.prisma.aiConfig.findUnique({ where: { id: 'global' } });
    if (config) {
        refreshCache(config);
        return config;
    }
    const ensured = await ensureAiConfig();
    refreshCache(ensured);
    return ensured;
}
async function updateAiConfig(input) {
    await ensureAiConfig();
    const updated = await prisma_1.prisma.aiConfig.update({
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
function serializeAiConfig(config) {
    return {
        id: config.id,
        systemPrompt: config.systemPrompt,
        maxTokens: config.maxTokens,
        temperature: config.temperature,
        minChars: config.minChars,
        stylePreset: config.stylePreset,
        createdAt: config.createdAt.toISOString(),
        updatedAt: config.updatedAt.toISOString(),
    };
}
//# sourceMappingURL=ai-config-service.js.map