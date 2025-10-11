import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { 
  KnowledgeService, 
  knowledgeCreateSchema, 
  knowledgeUpdateSchema,
  categoryCreateSchema 
} from '../services/knowledge-service';
import { logger } from '../logger';

// 请求验证Schema
const knowledgeParamsSchema = z.object({
  id: z.string().min(1),
});

const knowledgeQuerySchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  tags: z.string().optional(), // JSON string array
  isActive: z.string().transform(val => val === 'true').optional(),
  limit: z.string().transform(val => parseInt(val, 10)).optional(),
  offset: z.string().transform(val => parseInt(val, 10)).optional(),
});

const categoryParamsSchema = z.object({
  id: z.string().min(1),
});

// 知识库路由处理器
export async function knowledgeRoutes(fastify: FastifyInstance) {
  // 搜索知识库（必须在 :id 之前）
  fastify.post('/knowledge/search', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = z.object({
        query: z.string().min(1),
        category: z.string().optional(),
        limit: z.number().int().min(1).max(50).optional(),
        minScore: z.number().min(0).max(1).optional(),
      }).parse(request.body);
      
      const results = await KnowledgeService.searchKnowledge(
        body.query, 
        { 
          category: body.category, 
          limit: body.limit,
          minScore: body.minScore
        }
      );
      
      logger.info('Knowledge search completed', { query: body.query, count: results.length } as any);
      
      return reply.send({
        ok: true,
        data: results,
        meta: {
          query: body.query,
          count: results.length,
        },
      });
    } catch (error) {
      logger.error('Failed to search knowledge', { error } as any);
      
      return reply.code(500).send({
        ok: false,
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // 获取最佳答案（必须在 :id 之前）
  fastify.post('/knowledge/best-answer', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = z.object({
        question: z.string().min(1),
      }).parse(request.body);
      
      const answer = await KnowledgeService.findBestAnswer(body.question);
      
      if (answer) {
        // 增加使用计数
        await KnowledgeService.incrementUsage(answer.id);
      }
      
      return reply.send({
        ok: true,
        data: answer,
        meta: {
          question: body.question,
          found: !!answer,
        },
      });
    } catch (error) {
      logger.error('Failed to find best answer', { error } as any);
      
      return reply.code(500).send({
        ok: false,
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // 获取热门知识库条目（必须在 :id 之前）
  fastify.get('/knowledge/popular', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = z.object({
        limit: z.string().transform(val => parseInt(val, 10)).optional(),
      }).parse(request.query);
      
      const items = await KnowledgeService.getPopularItems(query.limit);
      
      logger.info('Fetched popular knowledge items', { count: items.length } as any);
      
      return reply.send({
        ok: true,
        data: items,
      });
    } catch (error) {
      logger.error('Failed to get popular knowledge items', { error } as any);
      
      return reply.code(500).send({
        ok: false,
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // 获取知识库统计（必须在 :id 之前）
  fastify.get('/knowledge/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const stats = await KnowledgeService.getKnowledgeStats();
      
      logger.info('Fetched knowledge stats', { totalItems: stats.total } as any);
      
      return reply.send({
        ok: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Failed to get knowledge stats', { error } as any);
      
      return reply.code(500).send({
        ok: false,
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // 创建知识库条目
  fastify.post('/knowledge', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const accountId = request.accountId!;
      const data = knowledgeCreateSchema.parse(request.body);
      const knowledge = await KnowledgeService.createKnowledge(accountId, data);
      
      logger.info('Knowledge item created', { knowledgeId: knowledge.id, title: knowledge.title } as any);
      
      return reply.code(201).send({
        ok: true,
        data: knowledge,
      });
    } catch (error) {
      logger.error('Failed to create knowledge item', { error } as any);
      
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          ok: false,
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.errors,
        });
      }
      
      return reply.code(500).send({
        ok: false,
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // 获取知识库列表
  fastify.get('/knowledge', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = knowledgeQuerySchema.parse(request.query);
      
      // 处理tags参数
      let tags: string[] | undefined;
      if (query.tags) {
        try {
          tags = JSON.parse(query.tags as string);
        } catch {
          return reply.code(400).send({
            ok: false,
            code: 'INVALID_TAGS',
            message: 'Tags must be a valid JSON array',
          });
        }
      }
      
      const filters = {
        category: query.category,
        search: query.search,
        tags,
        isActive: query.isActive,
        limit: query.limit,
        offset: query.offset,
      };
      
      const knowledgeItems = await KnowledgeService.getKnowledgeList(filters);
      
      logger.info('Fetched knowledge list', { count: knowledgeItems.length, filters } as any);
      
      return reply.send({
        ok: true,
        data: knowledgeItems,
        meta: {
          count: knowledgeItems.length,
        },
      });
    } catch (error) {
      logger.error('Failed to get knowledge list', { error } as any);
      
      return reply.code(500).send({
        ok: false,
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // 获取单个知识库条目
  fastify.get('/knowledge/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = knowledgeParamsSchema.parse(request.params);
      const knowledge = await KnowledgeService.getKnowledgeById(id);
      
      if (!knowledge) {
        return reply.code(404).send({
          ok: false,
          code: 'KNOWLEDGE_NOT_FOUND',
          message: 'Knowledge item not found',
        });
      }
      
      logger.info('Fetched knowledge item', { knowledgeId: id } as any);
      
      return reply.send({
        ok: true,
        data: knowledge,
      });
    } catch (error) {
      logger.error('Failed to get knowledge item', { error } as any);
      
      return reply.code(500).send({
        ok: false,
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // 更新知识库条目
  fastify.put('/knowledge/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = knowledgeParamsSchema.parse(request.params);
      const data = knowledgeUpdateSchema.parse(request.body);
      
      const knowledge = await KnowledgeService.updateKnowledge(id, data);
      
      logger.info('Knowledge item updated', { knowledgeId: id, title: knowledge.title } as any);
      
      return reply.send({
        ok: true,
        data: knowledge,
      });
    } catch (error) {
      logger.error('Failed to update knowledge item', { error } as any);
      
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          ok: false,
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.errors,
        });
      }
      
      if (error instanceof Error && error.message === 'Knowledge item not found') {
        return reply.code(404).send({
          ok: false,
          code: 'KNOWLEDGE_NOT_FOUND',
          message: 'Knowledge item not found',
        });
      }
      
      return reply.code(500).send({
        ok: false,
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // 删除知识库条目
  fastify.delete('/knowledge/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = knowledgeParamsSchema.parse(request.params);
      
      await KnowledgeService.deleteKnowledge(id);
      
      logger.info('Knowledge item deleted', { knowledgeId: id } as any);
      
      return reply.send({
        ok: true,
        message: 'Knowledge item deleted successfully',
      });
    } catch (error) {
      logger.error('Failed to delete knowledge item', { error } as any);
      
      if (error instanceof Error && error.message === 'Knowledge item not found') {
        return reply.code(404).send({
          ok: false,
          code: 'KNOWLEDGE_NOT_FOUND',
          message: 'Knowledge item not found',
        });
      }
      
      return reply.code(500).send({
        ok: false,
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // 增加使用计数
  fastify.post('/knowledge/:id/use', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = knowledgeParamsSchema.parse(request.params);
      
      await KnowledgeService.incrementUsage(id);
      
      logger.info('Knowledge item usage incremented', { knowledgeId: id } as any);
      
      return reply.send({
        ok: true,
        message: 'Usage count updated',
      });
    } catch (error) {
      logger.error('Failed to increment usage', { error } as any);
      
      return reply.code(500).send({
        ok: false,
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}

// 分类路由处理器
export async function knowledgeCategoryRoutes(fastify: FastifyInstance) {
  // 获取分类列表
  fastify.get('/knowledge/categories', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const categories = await KnowledgeService.getCategories();
      
      return reply.send({
        ok: true,
        data: categories,
      });
    } catch (error) {
      logger.error('Failed to get knowledge categories', { error } as any);
      
      return reply.code(500).send({
        ok: false,
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // 创建分类
  fastify.post('/knowledge/categories', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = categoryCreateSchema.parse(request.body);
      const category = await KnowledgeService.createCategory(data);
      
      logger.info('Knowledge category created', { categoryId: category.id, name: category.name } as any);
      
      return reply.code(201).send({
        ok: true,
        data: category,
      });
    } catch (error) {
      logger.error('Failed to create knowledge category', { error } as any);
      
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          ok: false,
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.errors,
        });
      }
      
      return reply.code(500).send({
        ok: false,
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // 更新分类
  fastify.put('/knowledge/categories/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = categoryParamsSchema.parse(request.params);
      const data = categoryCreateSchema.partial().parse(request.body);
      
      const category = await KnowledgeService.updateCategory(id, data);
      
      logger.info('Knowledge category updated', { categoryId: id, name: category.name } as any);
      
      return reply.send({
        ok: true,
        data: category,
      });
    } catch (error) {
      logger.error('Failed to update knowledge category', { error } as any);
      
      return reply.code(500).send({
        ok: false,
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // 删除分类
  fastify.delete('/knowledge/categories/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = categoryParamsSchema.parse(request.params);
      
      await KnowledgeService.deleteCategory(id);
      
      logger.info('Knowledge category deleted', { categoryId: id } as any);
      
      return reply.send({
        ok: true,
        message: 'Knowledge category deleted successfully',
      });
    } catch (error) {
      logger.error('Failed to delete knowledge category', { error } as any);
      
      if (error instanceof Error && error.message.includes('existing knowledge items')) {
        return reply.code(400).send({
          ok: false,
          code: 'CATEGORY_IN_USE',
          message: 'Cannot delete category with existing knowledge items',
        });
      }
      
      return reply.code(500).send({
        ok: false,
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}
