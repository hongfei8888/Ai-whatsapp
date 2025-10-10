import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { TranslationService } from '../services/translation-service';
import { logger } from '../logger';

// 请求验证 Schema
const translateRequestSchema = z.object({
  text: z.string().min(1),
  targetLang: z.string().optional().default('zh'),
});

const batchTranslateSchema = z.object({
  messageIds: z.array(z.string()),
});

const toggleAutoTranslateSchema = z.object({
  threadId: z.string(),
  enabled: z.boolean(),
});

// 翻译路由处理器
export async function translationRoutes(fastify: FastifyInstance) {
  // 翻译单条文本
  fastify.post('/translate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { text, targetLang } = translateRequestSchema.parse(request.body);
      
      logger.info('Translation request received', {
        textLength: text.length,
        targetLang,
      } as any);
      
      const result = await TranslationService.translateText(text, targetLang);
      
      logger.info('Translation completed', {
        sourceLang: result.sourceLang,
        fromCache: result.fromCache,
      } as any);
      
      return reply.send({
        ok: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Translation failed', {
        error: error.message,
      } as any);
      
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          ok: false,
          code: 'VALIDATION_ERROR',
          message: '请求数据无效',
          details: error.errors,
        });
      }
      
      return reply.code(500).send({
        ok: false,
        code: 'TRANSLATION_ERROR',
        message: error.message || '翻译失败',
      });
    }
  });

  // 批量翻译消息
  fastify.post('/translate/messages', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { messageIds } = batchTranslateSchema.parse(request.body);
      
      logger.info('Batch translation request received', {
        messageCount: messageIds.length,
      } as any);
      
      const results = await TranslationService.translateMessages(messageIds);
      
      logger.info('Batch translation completed', {
        totalMessages: results.length,
        translatedCount: results.filter(m => m.translatedText).length,
      } as any);
      
      return reply.send({
        ok: true,
        data: results,
        meta: {
          total: results.length,
          translated: results.filter(m => m.translatedText).length,
        },
      });
    } catch (error: any) {
      logger.error('Batch translation failed', {
        error: error.message,
      } as any);
      
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          ok: false,
          code: 'VALIDATION_ERROR',
          message: '请求数据无效',
          details: error.errors,
        });
      }
      
      return reply.code(500).send({
        ok: false,
        code: 'BATCH_TRANSLATION_ERROR',
        message: error.message || '批量翻译失败',
      });
    }
  });

  // 切换会话自动翻译
  fastify.post('/translate/toggle', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { threadId, enabled } = toggleAutoTranslateSchema.parse(request.body);
      
      const thread = await TranslationService.toggleThreadAutoTranslate(threadId, enabled);
      
      logger.info('Auto-translate toggled', {
        threadId,
        enabled,
      } as any);
      
      return reply.send({
        ok: true,
        data: thread,
        message: enabled ? '已开启自动翻译' : '已关闭自动翻译',
      });
    } catch (error: any) {
      logger.error('Toggle auto-translate failed', {
        error: error.message,
      } as any);
      
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          ok: false,
          code: 'VALIDATION_ERROR',
          message: '请求数据无效',
          details: error.errors,
        });
      }
      
      return reply.code(500).send({
        ok: false,
        code: 'TOGGLE_ERROR',
        message: error.message || '切换失败',
      });
    }
  });

  // 获取翻译统计
  fastify.get('/translate/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const stats = await TranslationService.getTranslationStats();
      
      logger.info('Translation stats retrieved', {
        totalTranslations: stats.totalTranslations,
        totalUsage: stats.totalUsage,
      } as any);
      
      return reply.send({
        ok: true,
        data: stats,
      });
    } catch (error: any) {
      logger.error('Failed to get translation stats', {
        error: error.message,
      } as any);
      
      return reply.code(500).send({
        ok: false,
        code: 'STATS_ERROR',
        message: '获取统计数据失败',
      });
    }
  });

  // 清理旧的翻译缓存（管理员功能）
  fastify.post('/translate/cleanup', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const schema = z.object({
        daysOld: z.number().int().min(30).optional().default(90),
      });
      
      const { daysOld } = schema.parse(request.body);
      
      const deletedCount = await TranslationService.cleanupOldTranslations(daysOld);
      
      logger.info('Translation cleanup completed', {
        deletedCount,
        daysOld,
      } as any);
      
      return reply.send({
        ok: true,
        data: {
          deletedCount,
          message: `已清理 ${deletedCount} 条旧翻译缓存`,
        },
      });
    } catch (error: any) {
      logger.error('Translation cleanup failed', {
        error: error.message,
      } as any);
      
      return reply.code(500).send({
        ok: false,
        code: 'CLEANUP_ERROR',
        message: '清理失败',
      });
    }
  });
}

