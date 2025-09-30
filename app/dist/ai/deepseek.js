"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDeepseek = generateDeepseek;
const config_1 = require("../config");
const logger_1 = require("../logger");
const GUARDRAILS = '请确保回答语句完整，不要中途截断。若问题包含多个点，逐条回答。默认 80-160 字，必要时扩展到 240 字。';
const MAX_ATTEMPTS = 3;
const wait = async (ms) => new Promise((resolve) => {
    setTimeout(resolve, ms);
});
async function generateDeepseek(params) {
    if (!config_1.appConfig.deepseekApiKey) {
        throw new Error('DeepSeek API key is not configured');
    }
    const apiUrl = `${config_1.appConfig.deepseekApiUrl.replace(/\/$/, '')}/v1/chat/completions`;
    const systemWithGuardrails = `${params.system}

${GUARDRAILS}`.trim();
    let attempt = 0;
    let lastError;
    while (attempt < MAX_ATTEMPTS) {
        try {
            const body = {
                model: config_1.appConfig.deepseekModel,
                messages: [
                    { role: 'system', content: systemWithGuardrails },
                    ...(params.context
                        ? [{ role: 'system', content: `【参考】
${params.context.trim()}` }]
                        : []),
                    { role: 'user', content: params.user },
                ],
                temperature: params.temperature,
                max_tokens: Math.max(16, Math.round(params.maxTokens)),
                top_p: 0.95,
            };
            const startedAt = Date.now();
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${config_1.appConfig.deepseekApiKey}`,
                },
                body: JSON.stringify(body),
            });
            const durationMs = Date.now() - startedAt;
            if (!response.ok) {
                const text = await response.text().catch(() => '');
                const status = response.status;
                const shouldRetry = status === 429 || status >= 500;
                logger_1.logger.warn({ status, text, attempt, durationMs }, 'DeepSeek API request failed');
                if (shouldRetry && attempt < MAX_ATTEMPTS - 1) {
                    attempt += 1;
                    const delay = 500 * 2 ** (attempt - 1) + Math.floor(Math.random() * 200);
                    await wait(delay);
                    continue;
                }
                throw new Error(`DeepSeek API error: ${status}`);
            }
            const data = (await response.json());
            const text = data.choices?.[0]?.message?.content?.trim();
            if (!text) {
                throw new Error('DeepSeek returned empty response');
            }
            const result = {
                text,
                model: data.model,
                usage: {
                    promptTokens: data.usage?.prompt_tokens,
                    completionTokens: data.usage?.completion_tokens,
                    totalTokens: data.usage?.total_tokens,
                },
            };
            logger_1.logger.debug({ durationMs, usage: result.usage, attempt }, 'DeepSeek call succeeded');
            return result;
        }
        catch (error) {
            lastError = error;
            attempt += 1;
            if (attempt >= MAX_ATTEMPTS) {
                break;
            }
            const delay = 500 * 2 ** (attempt - 1) + Math.floor(Math.random() * 200);
            logger_1.logger.warn({ err: error, attempt }, 'DeepSeek call failed, retrying');
            await wait(delay);
        }
    }
    throw lastError instanceof Error ? lastError : new Error('DeepSeek call failed');
}
//# sourceMappingURL=deepseek.js.map