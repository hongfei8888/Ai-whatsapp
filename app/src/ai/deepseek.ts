import { appConfig } from '../config';
import { logger } from '../logger';

interface DeepseekUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

interface GenerateDeepseekParams {
  system: string;
  user: string;
  context?: string;
  maxTokens: number;
  temperature: number;
  requestId?: string;
}

interface DeepseekChoice {
  index: number;
  message?: { content?: string };
}

interface DeepseekResponse {
  model?: string;
  choices?: DeepseekChoice[];
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

export interface DeepseekResult {
  text: string;
  usage?: DeepseekUsage;
  model?: string;
}

const GUARDRAILS = '请确保回答语句完整，不要中途截断。若问题包含多个点，逐条回答。默认 80-160 字，必要时扩展到 240 字。';
const MAX_ATTEMPTS = 3;

const wait = async (ms: number) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

export async function generateDeepseek(params: GenerateDeepseekParams): Promise<DeepseekResult> {
  if (!appConfig.deepseekApiKey) {
    throw new Error('DeepSeek API key is not configured');
  }

  const apiUrl = `${appConfig.deepseekApiUrl.replace(/\/$/, '')}/v1/chat/completions`;
  const systemWithGuardrails = `${params.system}

${GUARDRAILS}`.trim();

  let attempt = 0;
  let lastError: unknown;

  while (attempt < MAX_ATTEMPTS) {
    try {
      const body: Record<string, unknown> = {
        model: appConfig.deepseekModel,
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
          Authorization: `Bearer ${appConfig.deepseekApiKey}`,
        },
        body: JSON.stringify(body),
      });

      const durationMs = Date.now() - startedAt;

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        const status = response.status;
        const shouldRetry = status === 429 || status >= 500;
        logger.warn({ status, text, attempt, durationMs }, 'DeepSeek API request failed');
        if (shouldRetry && attempt < MAX_ATTEMPTS - 1) {
          attempt += 1;
          const delay = 500 * 2 ** (attempt - 1) + Math.floor(Math.random() * 200);
          await wait(delay);
          continue;
        }
        throw new Error(`DeepSeek API error: ${status}`);
      }

      const data = (await response.json()) as DeepseekResponse;
      const text = data.choices?.[0]?.message?.content?.trim();
      if (!text) {
        throw new Error('DeepSeek returned empty response');
      }

      const result: DeepseekResult = {
        text,
        model: data.model,
        usage: {
          promptTokens: data.usage?.prompt_tokens,
          completionTokens: data.usage?.completion_tokens,
          totalTokens: data.usage?.total_tokens,
        },
      };

      logger.debug({ durationMs, usage: result.usage, attempt }, 'DeepSeek call succeeded');
      return result;
    } catch (error) {
      lastError = error;
      attempt += 1;
      if (attempt >= MAX_ATTEMPTS) {
        break;
      }
      const delay = 500 * 2 ** (attempt - 1) + Math.floor(Math.random() * 200);
      logger.warn({ err: error, attempt }, 'DeepSeek call failed, retrying');
      await wait(delay);
    }
  }

  throw lastError instanceof Error ? lastError : new Error('DeepSeek call failed');
}
