import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { 
  BatchService, 
  batchImportSchema, 
  batchSendSchema, 
  batchTagSchema 
} from '../services/batch-service';
import { logger } from '../logger';

// 请求验证Schema
const batchParamsSchema = z.object({
  batchId: z.string().min(1),
});

const batchQuerySchema = z.object({
  type: z.string().optional(),
  status: z.string().optional(),
  createdAfter: z.string().optional(),
  limit: z.string().transform(val => parseInt(val, 10)).optional(),
  offset: z.string().transform(val => parseInt(val, 10)).optional(),
});

// 批量操作路由处理器
export async function batchRoutes(fastify: FastifyInstance) {
  // 批量导入联系人
  fastify.post('/batch/import', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const config = batchImportSchema.parse(request.body);
      const batch = await BatchService.importContacts(config);
      
      logger.info('Batch import started', { 
        batchId: batch.id, 
        contactCount: config.contacts.length 
      } as any);
      
      return reply.code(201).send({
        ok: true,
        data: batch,
      });
    } catch (error) {
      logger.error('Failed to start batch import', { error } as any);
      
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

  // 批量发送消息
  fastify.post('/batch/send', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const config = batchSendSchema.parse(request.body);
      const batch = await BatchService.sendBatchMessages(config);
      
      logger.info('Batch send started', { 
        batchId: batch.id, 
        contactCount: batch.totalCount 
      } as any);
      
      return reply.code(201).send({
        ok: true,
        data: batch,
      });
    } catch (error) {
      logger.error('Failed to start batch send', { error } as any);
      
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

  // 批量标签管理
  fastify.post('/batch/tags', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const config = batchTagSchema.parse(request.body);
      const batch = await BatchService.manageTags(config);
      
      logger.info('Batch tags started', { 
        batchId: batch.id, 
        contactCount: config.contactIds.length,
        operation: config.operation 
      } as any);
      
      return reply.code(201).send({
        ok: true,
        data: batch,
      });
    } catch (error) {
      logger.error('Failed to start batch tags', { error } as any);
      
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

  // 批量删除联系人
  fastify.post('/batch/delete', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = z.object({
        contactIds: z.array(z.string()).min(1),
      }).parse(request.body);
      
      const batch = await BatchService.deleteContacts(body.contactIds);
      
      logger.info('Batch delete started', { 
        batchId: batch.id, 
        contactCount: body.contactIds.length 
      } as any);
      
      return reply.code(201).send({
        ok: true,
        data: batch,
      });
    } catch (error) {
      logger.error('Failed to start batch delete', { error } as any);
      
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

  // 获取批量操作状态
  fastify.get('/batch/:batchId/status', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { batchId } = batchParamsSchema.parse(request.params);
      const batch = await BatchService.getBatchStatus(batchId);
      
      return reply.send({
        ok: true,
        data: batch,
      });
    } catch (error) {
      logger.error('Failed to get batch status', { error } as any);
      
      if (error instanceof Error && error.message === 'Batch operation not found') {
        return reply.code(404).send({
          ok: false,
          code: 'BATCH_NOT_FOUND',
          message: 'Batch operation not found',
        });
      }
      
      return reply.code(500).send({
        ok: false,
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // 取消批量操作
  fastify.post('/batch/:batchId/cancel', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { batchId } = batchParamsSchema.parse(request.params);
      
      await BatchService.cancelBatch(batchId);
      
      logger.info('Batch operation cancelled', { batchId } as any);
      
      return reply.send({
        ok: true,
        message: 'Batch operation cancelled successfully',
      });
    } catch (error) {
      logger.error('Failed to cancel batch operation', { error } as any);
      
      if (error instanceof Error && error.message === 'Batch operation not found') {
        return reply.code(404).send({
          ok: false,
          code: 'BATCH_NOT_FOUND',
          message: 'Batch operation not found',
        });
      }
      
      if (error instanceof Error && error.message.includes('Cannot cancel')) {
        return reply.code(400).send({
          ok: false,
          code: 'INVALID_OPERATION',
          message: error.message,
        });
      }
      
      return reply.code(500).send({
        ok: false,
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // 获取批量操作统计（必须在 :batchId 之前）
  fastify.get('/batch/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = batchQuerySchema.parse(request.query);
      
      const filters = {
        type: query.type,
        status: query.status,
        createdAfter: query.createdAfter,
      };
      
      const batches = await BatchService.getBatchList({ ...filters, limit: 1000 });
      
      const stats = {
        total: batches.length,
        byType: {} as Record<string, number>,
        byStatus: {} as Record<string, number>,
        successRate: 0,
        totalProcessed: 0,
        totalSuccess: 0,
        totalFailed: 0,
      };
      
      batches.forEach(batch => {
        // 按类型统计
        stats.byType[batch.type] = (stats.byType[batch.type] || 0) + 1;
        
        // 按状态统计
        stats.byStatus[batch.status] = (stats.byStatus[batch.status] || 0) + 1;
        
        // 累计处理数量
        stats.totalProcessed += batch.processedCount;
        stats.totalSuccess += batch.successCount;
        stats.totalFailed += batch.failedCount;
      });
      
      // 计算成功率
      if (stats.totalProcessed > 0) {
        stats.successRate = Math.round((stats.totalSuccess / stats.totalProcessed) * 100);
      }
      
      return reply.send({
        ok: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Failed to get batch stats', { error } as any);
      
      return reply.code(500).send({
        ok: false,
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // 获取批量操作列表
  fastify.get('/batch', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = batchQuerySchema.parse(request.query);
      
      const filters = {
        type: query.type,
        status: query.status,
        createdAfter: query.createdAfter,
        limit: query.limit,
        offset: query.offset,
      };
      
      const batches = await BatchService.getBatchList(filters);
      
      return reply.send({
        ok: true,
        data: batches,
        meta: {
          count: batches.length,
        },
      });
    } catch (error) {
      logger.error('Failed to get batch list', { error } as any);
      
      return reply.code(500).send({
        ok: false,
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // 获取批量操作详情
  fastify.get('/batch/:batchId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { batchId } = batchParamsSchema.parse(request.params);
      const batch = await BatchService.getBatchStatus(batchId);
      
      return reply.send({
        ok: true,
        data: batch,
      });
    } catch (error) {
      logger.error('Failed to get batch details', { error } as any);
      
      if (error instanceof Error && error.message === 'Batch operation not found') {
        return reply.code(404).send({
          ok: false,
          code: 'BATCH_NOT_FOUND',
          message: 'Batch operation not found',
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
