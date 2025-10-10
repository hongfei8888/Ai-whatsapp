import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../prisma';
import { logger } from '../logger';
import * as fs from 'fs/promises';
import * as path from 'path';

// 请求验证Schema
const exportSchema = z.object({
  types: z.array(z.enum(['contacts', 'messages', 'templates', 'batches', 'knowledge'])),
  format: z.enum(['json', 'csv']).default('json'),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

const cleanupSchema = z.object({
  types: z.array(z.enum(['messages', 'batches', 'translations'])),
  daysOld: z.number().min(1).max(365),
});

/**
 * 数据管理路由
 */
export async function dataManagementRoutes(fastify: FastifyInstance) {
  
  // 导出数据
  fastify.post('/data/export', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const config = exportSchema.parse(request.body);
      
      logger.info('Data export started', { config } as any);
      
      const exportData: any = {};
      
      // 根据请求的类型导出数据
      for (const type of config.types) {
        switch (type) {
          case 'contacts':
            exportData.contacts = await prisma.contact.findMany({
              select: {
                id: true,
                phoneE164: true,
                name: true,
                tags: true,
                source: true,
                notes: true,
                createdAt: true,
              },
            });
            break;
            
          case 'messages':
            const messageWhere: any = {};
            if (config.dateFrom || config.dateTo) {
              messageWhere.createdAt = {};
              if (config.dateFrom) {
                messageWhere.createdAt.gte = new Date(config.dateFrom);
              }
              if (config.dateTo) {
                messageWhere.createdAt.lte = new Date(config.dateTo);
              }
            }
            
            exportData.messages = await prisma.message.findMany({
              where: messageWhere,
              select: {
                id: true,
                direction: true,
                text: true,
                status: true,
                createdAt: true,
                thread: {
                  select: {
                    contact: {
                      select: {
                        phoneE164: true,
                        name: true,
                      },
                    },
                  },
                },
              },
              take: 10000, // 限制最多10000条
            });
            break;
            
          case 'templates':
            exportData.templates = await prisma.messageTemplate.findMany({
              select: {
                id: true,
                name: true,
                content: true,
                category: true,
                tags: true,
                usageCount: true,
                createdAt: true,
              },
            });
            break;
            
          case 'batches':
            exportData.batches = await prisma.batchOperation.findMany({
              select: {
                id: true,
                type: true,
                status: true,
                title: true,
                totalCount: true,
                processedCount: true,
                successCount: true,
                failedCount: true,
                createdAt: true,
                completedAt: true,
              },
              take: 1000,
            });
            break;
            
          case 'knowledge':
            exportData.knowledge = await prisma.knowledgeBase.findMany({
              select: {
                id: true,
                title: true,
                content: true,
                category: true,
                tags: true,
                keywords: true,
                usageCount: true,
                createdAt: true,
              },
            });
            break;
        }
      }
      
      // 根据格式返回数据
      if (config.format === 'json') {
        return reply
          .header('Content-Type', 'application/json')
          .header('Content-Disposition', `attachment; filename="export-${Date.now()}.json"`)
          .send({
            ok: true,
            data: exportData,
            exportedAt: new Date().toISOString(),
          });
      } else {
        // CSV格式（简单实现）
        const csv = convertToCSV(exportData);
        return reply
          .header('Content-Type', 'text/csv')
          .header('Content-Disposition', `attachment; filename="export-${Date.now()}.csv"`)
          .send(csv);
      }
    } catch (error) {
      logger.error('Data export failed', { error } as any);
      
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
        code: 'EXPORT_ERROR',
        message: error instanceof Error ? error.message : '导出失败',
      });
    }
  });
  
  // 清理旧数据
  fastify.post('/data/cleanup', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const config = cleanupSchema.parse(request.body);
      
      logger.info('Data cleanup started', { config } as any);
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - config.daysOld);
      
      const results: any = {};
      
      // 清理各类型的数据
      for (const type of config.types) {
        switch (type) {
          case 'messages':
            const deletedMessages = await prisma.message.deleteMany({
              where: {
                createdAt: {
                  lt: cutoffDate,
                },
              },
            });
            results.messages = deletedMessages.count;
            break;
            
          case 'batches':
            const deletedBatches = await prisma.batchOperation.deleteMany({
              where: {
                AND: [
                  {
                    createdAt: {
                      lt: cutoffDate,
                    },
                  },
                  {
                    status: {
                      in: ['completed', 'failed', 'cancelled'],
                    },
                  },
                ],
              },
            });
            results.batches = deletedBatches.count;
            break;
            
          case 'translations':
            const deletedTranslations = await prisma.translation.deleteMany({
              where: {
                AND: [
                  {
                    createdAt: {
                      lt: cutoffDate,
                    },
                  },
                  {
                    usageCount: {
                      lte: 2, // 只删除使用次数少的
                    },
                  },
                ],
              },
            });
            results.translations = deletedTranslations.count;
            break;
        }
      }
      
      logger.info('Data cleanup completed', { results } as any);
      
      return reply.send({
        ok: true,
        data: results,
        message: '数据清理完成',
      });
    } catch (error) {
      logger.error('Data cleanup failed', { error } as any);
      
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
        code: 'CLEANUP_ERROR',
        message: error instanceof Error ? error.message : '清理失败',
      });
    }
  });
  
  // 获取存储信息
  fastify.get('/data/storage-info', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // 获取各表的记录数
      const [
        contactsCount,
        messagesCount,
        threadsCount,
        templatesCount,
        batchesCount,
        knowledgeCount,
        translationsCount,
        campaignsCount,
      ] = await Promise.all([
        prisma.contact.count(),
        prisma.message.count(),
        prisma.thread.count(),
        prisma.messageTemplate.count(),
        prisma.batchOperation.count(),
        prisma.knowledgeBase.count(),
        prisma.translation.count(),
        prisma.campaign.count(),
      ]);
      
      // 尝试获取数据库文件大小
      let dbSize = 0;
      try {
        const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
        const stats = await fs.stat(dbPath);
        dbSize = stats.size;
      } catch (error) {
        logger.warn('Could not get database file size', { error } as any);
      }
      
      const storageInfo = {
        database: {
          size: dbSize,
          sizeFormatted: formatBytes(dbSize),
        },
        tables: {
          contacts: contactsCount,
          messages: messagesCount,
          threads: threadsCount,
          templates: templatesCount,
          batchOperations: batchesCount,
          knowledge: knowledgeCount,
          translations: translationsCount,
          campaigns: campaignsCount,
        },
        total: {
          records: contactsCount + messagesCount + threadsCount + templatesCount + 
                   batchesCount + knowledgeCount + translationsCount + campaignsCount,
        },
      };
      
      logger.info('Storage info retrieved', { storageInfo } as any);
      
      return reply.send({
        ok: true,
        data: storageInfo,
      });
    } catch (error) {
      logger.error('Failed to get storage info', { error } as any);
      
      return reply.code(500).send({
        ok: false,
        code: 'STORAGE_INFO_ERROR',
        message: error instanceof Error ? error.message : '获取存储信息失败',
      });
    }
  });
}

/**
 * 将数据转换为CSV格式
 */
function convertToCSV(data: any): string {
  const lines: string[] = [];
  
  for (const [key, items] of Object.entries(data)) {
    if (!Array.isArray(items) || items.length === 0) continue;
    
    // 添加表名作为标题
    lines.push(`\n=== ${key.toUpperCase()} ===`);
    
    // 获取列名
    const headers = Object.keys(items[0]);
    lines.push(headers.join(','));
    
    // 添加数据行
    for (const item of items) {
      const values = headers.map(header => {
        const value = item[header];
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value).replace(/,/g, ';'); // 替换逗号避免CSV解析错误
      });
      lines.push(values.join(','));
    }
  }
  
  return lines.join('\n');
}

/**
 * 格式化字节大小
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

