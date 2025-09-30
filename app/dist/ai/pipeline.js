"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FALLBACK_REPLY = void 0;
exports.buildAiReply = buildAiReply;
exports.generatePreviewReply = generatePreviewReply;
const node_perf_hooks_1 = require("node:perf_hooks");
const logger_1 = require("../logger");
const rules_1 = require("./rules");
const deepseek_1 = require("./deepseek");
const config_1 = require("../config");
const ai_config_service_1 = require("../services/ai-config-service");
exports.FALLBACK_REPLY = "我记录下来了，会尽快回复你。";
const STYLE_HINTS = {
    'concise-cn': '语气要求：简洁、专业、友好，避免冗长寒暄。',
    'sales-cn': '语气要求：适度热情，突出方案价值与下一步行动建议，保持真诚。',
    'support-cn': '语气要求：耐心、安抚且富有同理心，明确步骤并提供跟进承诺。',
};
const WHITESPACE_REGEX = /\s+/g;
const CONTEXT_MAX_LENGTH = 1200;
const normalizeLength = (text) => text.replace(WHITESPACE_REGEX, '').length;
const buildHistoryContext = (history) => {
    if (history.length === 0) {
        return null;
    }
    const recent = history.slice(-6);
    const summary = recent
        .map((turn, index) => {
        const label = turn.role === 'user' ? '用户' : '助手';
        return `${label}${recent.length - index}: ${turn.content}`;
    })
        .join('\n');
    if (summary.length <= CONTEXT_MAX_LENGTH) {
        return summary;
    }
    return summary.slice(summary.length - CONTEXT_MAX_LENGTH);
};
const composeContext = (params) => {
    const segments = [];
    if (params.contactName) {
        segments.push(`联系人：${params.contactName}`);
    }
    if (params.historyContext) {
        segments.push(`最近对话：\n${params.historyContext}`);
    }
    if (params.extraContext) {
        segments.push(params.extraContext);
    }
    if (segments.length === 0) {
        return undefined;
    }
    const combined = segments.join('\n\n');
    if (combined.length <= CONTEXT_MAX_LENGTH) {
        return combined;
    }
    return combined.slice(combined.length - CONTEXT_MAX_LENGTH);
};
const combineReplies = (primary, supplement) => {
    if (!supplement) {
        return primary.trim();
    }
    const trimmedSupplement = supplement.trim();
    if (!trimmedSupplement) {
        return primary.trim();
    }
    return `${primary.trim()}\n${trimmedSupplement}`.trim();
};
async function generateReply(latestMessage, contactName, history, previewContext) {
    const keywordReply = (0, rules_1.matchKeywordRule)(latestMessage);
    if (keywordReply) {
        return keywordReply;
    }
    if (!config_1.appConfig.deepseekApiKey) {
        return exports.FALLBACK_REPLY;
    }
    const aiConfig = await (0, ai_config_service_1.getAiConfig)();
    const styleHint = STYLE_HINTS[aiConfig.stylePreset] ?? '';
    const systemPrompt = styleHint ? `${aiConfig.systemPrompt}\n${styleHint}` : aiConfig.systemPrompt;
    const historyContext = buildHistoryContext(history);
    const composedContext = composeContext({ contactName, historyContext, extraContext: previewContext });
    const maxTokens = Math.max(320, aiConfig.maxTokens);
    const temperature = aiConfig.temperature;
    const start = node_perf_hooks_1.performance.now();
    try {
        const firstPass = await (0, deepseek_1.generateDeepseek)({
            system: systemPrompt,
            user: latestMessage,
            context: composedContext,
            maxTokens,
            temperature,
        });
        let reply = firstPass.text.trim();
        const primaryLength = normalizeLength(reply);
        let supplementAttempted = false;
        if (primaryLength < aiConfig.minChars) {
            supplementAttempted = true;
            const supplementContext = composeContext({
                contactName,
                historyContext,
                extraContext: `已有回复：\n${reply}`,
            });
            try {
                const supplement = await (0, deepseek_1.generateDeepseek)({
                    system: systemPrompt,
                    user: '补充要点：请继续完善刚才的回复，补充缺失的关键信息，保持同样语气。',
                    context: supplementContext,
                    maxTokens: Math.min(128, Math.max(64, aiConfig.maxTokens)),
                    temperature,
                });
                reply = combineReplies(reply, supplement.text);
            }
            catch (supplementError) {
                logger_1.logger.warn({ err: supplementError }, 'Failed to generate supplemental reply');
            }
        }
        const totalMs = Math.round(node_perf_hooks_1.performance.now() - start);
        logger_1.logger.info({
            component: 'ai',
            model: firstPass.model ?? config_1.appConfig.deepseekModel,
            ms: totalMs,
            usage: firstPass.usage,
            supplementAttempted,
        }, 'Generated DeepSeek reply');
        return reply || exports.FALLBACK_REPLY;
    }
    catch (error) {
        logger_1.logger.error({ err: error }, 'DeepSeek generation failed');
        return exports.FALLBACK_REPLY;
    }
}
async function buildAiReply(input) {
    return generateReply(input.latestMessage, input.contactName ?? null, input.history);
}
async function generatePreviewReply(params) {
    return generateReply(params.user, null, [], params.context);
}
//# sourceMappingURL=pipeline.js.map