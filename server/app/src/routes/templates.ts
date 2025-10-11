import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { 
  EnhancedTemplateService, 
  templateCreateSchema, 
  templateUpdateSchema,
  categoryCreateSchema 
} from '../services/enhanced-template-service';
import { logger } from '../logger';

// 请求验证Schema
const templateParamsSchema = z.object({
  id: z.string().min(1),
});

const templateQuerySchema = z.object({
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

// 模板路由处理器
export async function templateRoutes(fastify: FastifyInstance) {
  // 创建模板
  fastify.post('/templates', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const accountId = request.accountId!;
      const data = templateCreateSchema.parse(request.body);
      const template = await EnhancedTemplateService.createTemplate(accountId, data);
      
      logger.info('Template created', { templateId: template.id, name: template.name } as any);
      
      return reply.code(201).send({
        ok: true,
        data: template,
      });
    } catch (error) {
      logger.error('Failed to create template', { error } as any);
      
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

  // 获取热门模板（必须在 :id 之前）
  fastify.get('/templates/popular', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = z.object({
        limit: z.string().transform(val => parseInt(val, 10)).optional(),
      }).parse(request.query);
      
      const templates = await EnhancedTemplateService.getPopularTemplates(query.limit);
      
      return reply.send({
        ok: true,
        data: templates,
      });
    } catch (error) {
      logger.error('Failed to get popular templates', { error } as any);
      
      return reply.code(500).send({
        ok: false,
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // 获取模板统计（必须在 :id 之前）
  fastify.get('/templates/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const stats = await EnhancedTemplateService.getTemplateStats();
      
      return reply.send({
        ok: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Failed to get template stats', { error } as any);
      
      return reply.code(500).send({
        ok: false,
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // 搜索模板（必须在 :id 之前）
  fastify.post('/templates/search', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = z.object({
        query: z.string().min(1),
        category: z.string().optional(),
        limit: z.number().int().min(1).max(50).optional(),
      }).parse(request.body);
      
      const templates = await EnhancedTemplateService.searchTemplates(
        body.query, 
        { category: body.category, limit: body.limit }
      );
      
      return reply.send({
        ok: true,
        data: templates,
        meta: {
          query: body.query,
          count: templates.length,
        },
      });
    } catch (error) {
      logger.error('Failed to search templates', { error } as any);
      
      return reply.code(500).send({
        ok: false,
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // 获取模板列表
  fastify.get('/templates', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = templateQuerySchema.parse(request.query);
      
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
      
      const templates = await EnhancedTemplateService.getTemplates(filters);
      
      logger.info('Templates fetched', { count: templates.length } as any);
      
      return reply.send({
        ok: true,
        data: templates,
        meta: {
          count: templates.length,
        },
      });
    } catch (error) {
      logger.error('Failed to get templates', { error } as any);
      
      return reply.code(500).send({
        ok: false,
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // 获取单个模板
  fastify.get('/templates/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = templateParamsSchema.parse(request.params);
      const template = await EnhancedTemplateService.getTemplateById(id);
      
      if (!template) {
        return reply.code(404).send({
          ok: false,
          code: 'TEMPLATE_NOT_FOUND',
          message: 'Template not found',
        });
      }
      
      return reply.send({
        ok: true,
        data: template,
      });
    } catch (error) {
      logger.error('Failed to get template', { error } as any);
      
      return reply.code(500).send({
        ok: false,
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // 更新模板
  fastify.put('/templates/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = templateParamsSchema.parse(request.params);
      const data = templateUpdateSchema.parse(request.body);
      
      const template = await EnhancedTemplateService.updateTemplate(id, data);
      
      logger.info('Template updated', { templateId: id, name: template.name } as any);
      
      return reply.send({
        ok: true,
        data: template,
      });
    } catch (error) {
      logger.error('Failed to update template', { error } as any);
      
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          ok: false,
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.errors,
        });
      }
      
      if (error instanceof Error && error.message === 'Template not found') {
        return reply.code(404).send({
          ok: false,
          code: 'TEMPLATE_NOT_FOUND',
          message: 'Template not found',
        });
      }
      
      return reply.code(500).send({
        ok: false,
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // 删除模板
  fastify.delete('/templates/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = templateParamsSchema.parse(request.params);
      
      await EnhancedTemplateService.deleteTemplate(id);
      
      logger.info('Template deleted', { templateId: id } as any);
      
      return reply.send({
        ok: true,
        message: 'Template deleted successfully',
      });
    } catch (error) {
      logger.error('Failed to delete template', { error } as any);
      
      if (error instanceof Error && error.message === 'Template not found') {
        return reply.code(404).send({
          ok: false,
          code: 'TEMPLATE_NOT_FOUND',
          message: 'Template not found',
        });
      }
      
      return reply.code(500).send({
        ok: false,
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // 使用模板
  fastify.post('/templates/:id/use', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = templateParamsSchema.parse(request.params);
      
      const template = await EnhancedTemplateService.useTemplate(id);
      
      logger.info('Template used', { templateId: id, name: template.name } as any);
      
      return reply.send({
        ok: true,
        data: template,
      });
    } catch (error) {
      logger.error('Failed to use template', { error } as any);
      
      return reply.code(500).send({
        ok: false,
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // 复制模板
  fastify.post('/templates/:id/duplicate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = templateParamsSchema.parse(request.params);
      const body = z.object({ name: z.string().optional() }).parse(request.body);
      
      const template = await EnhancedTemplateService.duplicateTemplate(id, body.name);
      
      logger.info('Template duplicated', { 
        originalId: id, 
        newId: template.id, 
        name: template.name 
      } as any);
      
      return reply.code(201).send({
        ok: true,
        data: template,
      });
    } catch (error) {
      logger.error('Failed to duplicate template', { error } as any);
      
      if (error instanceof Error && error.message === 'Template not found') {
        return reply.code(404).send({
          ok: false,
          code: 'TEMPLATE_NOT_FOUND',
          message: 'Template not found',
        });
      }
      
      return reply.code(500).send({
        ok: false,
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // 渲染模板
  fastify.post('/templates/:id/render', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = templateParamsSchema.parse(request.params);
      const body = z.object({
        variables: z.record(z.string(), z.string()).optional(),
      }).parse(request.body);
      
      const template = await EnhancedTemplateService.getTemplateById(id);
      if (!template) {
        return reply.code(404).send({
          ok: false,
          code: 'TEMPLATE_NOT_FOUND',
          message: 'Template not found',
        });
      }
      
      const renderedContent = EnhancedTemplateService.renderTemplate(
        template, 
        body.variables || {}
      );
      
      return reply.send({
        ok: true,
        data: {
          original: template.content,
          rendered: renderedContent,
          variables: template.variables,
        },
      });
    } catch (error) {
      logger.error('Failed to render template', { error } as any);
      
      return reply.code(500).send({
        ok: false,
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}

// 分类路由处理器
export async function categoryRoutes(fastify: FastifyInstance) {
  // 获取分类列表
  fastify.get('/templates/categories', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const categories = await EnhancedTemplateService.getCategories();
      
      return reply.send({
        ok: true,
        data: categories,
      });
    } catch (error) {
      logger.error('Failed to get categories', { error } as any);
      
      return reply.code(500).send({
        ok: false,
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // 创建分类
  fastify.post('/templates/categories', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = categoryCreateSchema.parse(request.body);
      const category = await EnhancedTemplateService.createCategory(data);
      
      logger.info('Category created', { categoryId: category.id, name: category.name } as any);
      
      return reply.code(201).send({
        ok: true,
        data: category,
      });
    } catch (error) {
      logger.error('Failed to create category', { error } as any);
      
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
  fastify.put('/templates/categories/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = categoryParamsSchema.parse(request.params);
      const data = categoryCreateSchema.partial().parse(request.body);
      
      const category = await EnhancedTemplateService.updateCategory(id, data);
      
      logger.info('Category updated', { categoryId: id, name: category.name } as any);
      
      return reply.send({
        ok: true,
        data: category,
      });
    } catch (error) {
      logger.error('Failed to update category', { error } as any);
      
      return reply.code(500).send({
        ok: false,
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // 删除分类
  fastify.delete('/templates/categories/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = categoryParamsSchema.parse(request.params);
      
      await EnhancedTemplateService.deleteCategory(id);
      
      logger.info('Category deleted', { categoryId: id } as any);
      
      return reply.send({
        ok: true,
        message: 'Category deleted successfully',
      });
    } catch (error) {
      logger.error('Failed to delete category', { error } as any);
      
      if (error instanceof Error && error.message.includes('existing templates')) {
        return reply.code(400).send({
          ok: false,
          code: 'CATEGORY_IN_USE',
          message: 'Cannot delete category with existing templates',
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
