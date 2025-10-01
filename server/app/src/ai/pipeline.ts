import { performance } from 'node:perf_hooks';
import { logger } from '../logger';
import { matchKeywordRule } from './rules';
import { generateDeepseek } from './deepseek';
import { appConfig } from '../config';
import { AiStylePreset, getAiConfig } from '../services/ai-config-service';

export const FALLBACK_REPLY = "我记录下来了，会尽快回复你。";

export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiReplyInput {
  latestMessage: string;
  contactName?: string | null;
  history: ConversationTurn[];
}

const STYLE_HINTS: Record<AiStylePreset, string> = {
  'concise-cn': '语气要求：简洁、专业、友好，避免冗长寒暄。',
  'sales-cn': '语气要求：适度热情，突出方案价值与下一步行动建议，保持真诚。',
  'support-cn': '语气要求：耐心、安抚且富有同理心，明确步骤并提供跟进承诺。',
};

const WHITESPACE_REGEX = /\s+/g;
const CONTEXT_MAX_LENGTH = 1200;

const normalizeLength = (text: string): number => text.replace(WHITESPACE_REGEX, '').length;

const buildHistoryContext = (history: ConversationTurn[]): string | null => {
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

const composeContext = (params: {
  contactName?: string | null;
  historyContext: string | null;
  extraContext?: string;
}): string | undefined => {
  const segments: string[] = [];
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

const combineReplies = (primary: string, supplement?: string): string => {
  if (!supplement) {
    return primary.trim();
  }
  const trimmedSupplement = supplement.trim();
  if (!trimmedSupplement) {
    return primary.trim();
  }
  return `${primary.trim()}\n${trimmedSupplement}`.trim();
};

async function generateReply(
  latestMessage: string,
  contactName: string | null | undefined,
  history: ConversationTurn[],
  previewContext?: string,
): Promise<string> {
  const keywordReply = matchKeywordRule(latestMessage);
  if (keywordReply) {
    return keywordReply;
  }

  if (!appConfig.deepseekApiKey) {
    return FALLBACK_REPLY;
  }

  const aiConfig = await getAiConfig();
  const styleHint = STYLE_HINTS[aiConfig.stylePreset as AiStylePreset] ?? '';
  const systemPrompt = styleHint ? `${aiConfig.systemPrompt}\n${styleHint}` : aiConfig.systemPrompt;

  const historyContext = buildHistoryContext(history);
  const composedContext = composeContext({ contactName, historyContext, extraContext: previewContext });

  const maxTokens = Math.max(320, aiConfig.maxTokens);
  const temperature = aiConfig.temperature;

  const start = performance.now();

  try {
    const firstPass = await generateDeepseek({
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
        const supplement = await generateDeepseek({
          system: systemPrompt,
          user: '补充要点：请继续完善刚才的回复，补充缺失的关键信息，保持同样语气。',
          context: supplementContext,
          maxTokens: Math.min(128, Math.max(64, aiConfig.maxTokens)),
          temperature,
        });
        reply = combineReplies(reply, supplement.text);
      } catch (supplementError) {
        logger.warn({ err: supplementError }, 'Failed to generate supplemental reply');
      }
    }

    const totalMs = Math.round(performance.now() - start);
    logger.info({
      component: 'ai',
      model: firstPass.model ?? appConfig.deepseekModel,
      ms: totalMs,
      usage: firstPass.usage,
      supplementAttempted,
    }, 'Generated DeepSeek reply');

    return reply || FALLBACK_REPLY;
  } catch (error) {
    logger.error({ err: error }, 'DeepSeek generation failed');
    return FALLBACK_REPLY;
  }
}

export async function buildAiReply(input: AiReplyInput): Promise<string> {
  return generateReply(input.latestMessage, input.contactName ?? null, input.history);
}

export async function generatePreviewReply(params: { user: string; context?: string }): Promise<string> {
  return generateReply(params.user, null, [], params.context);
}
