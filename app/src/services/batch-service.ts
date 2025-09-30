import { prisma } from '../prisma';
import { z } from 'zod';
import { logger } from '../logger';
import { whatsappService } from '../whatsapp-service';
import { recordMessageIfMissing } from './message-service';
import { getOrCreateThread } from './thread-service';
import { MessageDirection, MessageStatus } from '@prisma/client';

// 类型定义
export interface BatchImportConfig {
  contacts: Array<{
    phoneE164: string;
    name?: string;
    tags?: string[];
    notes?: string;
  }>;
  tags?: string[];
  source?: string;
  skipDuplicates?: boolean;
}

export interface BatchSendConfig {
  templateId?: string;
  content?: string;
  contactIds?: string[];
  contactFilters?: {
    tags?: string[];
    source?: string;
    createdAfter?: string;
  };
  scheduleAt?: string;
  ratePerMinute?: number;
  jitterMs?: number;
}

export interface BatchTagConfig {
  contactIds: string[];
  tags: string[];
  operation: 'add' | 'remove' | 'replace';
}

export interface BatchOperation {
  id: string;
  type: string;
  status: string;
  title: string;
  description?: string;
  totalCount: number;
  processedCount: number;
  successCount: number;
  failedCount: number;
  config?: any;
  result?: any;
  errorMessage?: string;
  progress: number;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  createdBy: string;
}

export interface BatchOperationWithItems extends BatchOperation {
  items: Array<{
    id: string;
    itemIndex: number;
    itemData: any;
    status: string;
    errorMessage?: string;
    result?: any;
    processedAt?: Date;
  }>;
}

// 数据验证Schema
export const batchImportSchema = z.object({
  contacts: z.array(z.object({
    phoneE164: z.string().regex(/^\+[1-9]\d{1,14}$/),
    name: z.string().optional(),
    tags: z.array(z.string()).optional(),
    notes: z.string().optional(),
  })),
  tags: z.array(z.string()).optional(),
  source: z.string().optional(),
  skipDuplicates: z.boolean().optional(),
});

export const batchSendSchema = z.object({
  templateId: z.string().optional(),
  content: z.string().min(1).optional(),
  contactIds: z.array(z.string()).optional(),
  contactFilters: z.object({
    tags: z.array(z.string()).optional(),
    source: z.string().optional(),
    createdAfter: z.string().optional(),
  }).optional(),
  scheduleAt: z.string().optional(),
  ratePerMinute: z.number().int().min(1).max(60).optional(),
  jitterMs: z.number().int().min(0).max(5000).optional(),
});

export const batchTagSchema = z.object({
  contactIds: z.array(z.string()).min(1),
  tags: z.array(z.string()).min(1),
  operation: z.enum(['add', 'remove', 'replace']),
});

// 批量操作服务类
export class BatchService {
  // 批量导入联系人
  static async importContacts(config: BatchImportConfig): Promise<BatchOperation> {
    const validatedConfig = batchImportSchema.parse(config);
    
    const batch = await prisma.batchOperation.create({
      data: {
        type: 'import',
        status: 'pending',
        title: '批量导入联系人',
        description: `导入 ${validatedConfig.contacts.length} 个联系人`,
        totalCount: validatedConfig.contacts.length,
        config: JSON.stringify({
          tags: validatedConfig.tags,
          source: validatedConfig.source || 'import',
          skipDuplicates: validatedConfig.skipDuplicates,
        }),
        progress: 0,
      },
    });

    // 创建批量操作明细
    const items = validatedConfig.contacts.map((contact, index) => ({
      batchId: batch.id,
      itemIndex: index,
      itemData: JSON.stringify(contact),
    }));

    await prisma.batchOperationItem.createMany({
      data: items,
    });

    // 异步处理批量导入
    this.processBatchImport(batch.id);
    
    return batch as any;
  }

  // 批量发送消息
  static async sendBatchMessages(config: BatchSendConfig): Promise<BatchOperation> {
    const validatedConfig = batchSendSchema.parse(config);
    
    // 获取目标联系人
    let contactIds: string[] = [];
    
    if (validatedConfig.contactIds?.length) {
      contactIds = validatedConfig.contactIds;
    } else if (validatedConfig.contactFilters) {
      const where: any = {};
      
      if (validatedConfig.contactFilters.tags?.length) {
        where.tags = { hasSome: validatedConfig.contactFilters.tags };
      }
      
      if (validatedConfig.contactFilters.source) {
        where.source = validatedConfig.contactFilters.source;
      }
      
      if (validatedConfig.contactFilters.createdAfter) {
        where.createdAt = { gte: new Date(validatedConfig.contactFilters.createdAfter) };
      }
      
      const contacts = await prisma.contact.findMany({
        where,
        select: { id: true },
      });
      
      contactIds = contacts.map(c => c.id);
    }

    if (contactIds.length === 0) {
      throw new Error('No contacts found for batch send');
    }

    const batch = await prisma.batchOperation.create({
      data: {
        type: 'send',
        status: 'pending',
        title: '批量发送消息',
        description: `向 ${contactIds.length} 个联系人发送消息`,
        totalCount: contactIds.length,
        config: JSON.stringify({
          templateId: validatedConfig.templateId,
          content: validatedConfig.content,
          scheduleAt: validatedConfig.scheduleAt,
          ratePerMinute: validatedConfig.ratePerMinute || 8,
          jitterMs: validatedConfig.jitterMs || 300,
        }),
        progress: 0,
      },
    });

    // 获取联系人信息并验证
    const contacts = await prisma.contact.findMany({
      where: { id: { in: contactIds } },
      select: { id: true, phoneE164: true, name: true },
    });

    // 验证找到的联系人数量
    if (contacts.length === 0) {
      throw new Error('No valid contacts found for batch send');
    }

    if (contacts.length !== contactIds.length) {
      const foundIds = contacts.map(c => c.id);
      const missingIds = contactIds.filter(id => !foundIds.includes(id));
      logger.warn('Some contact IDs not found in database', { missingIds } as any);
    }

    const items = contacts.map((contact, index) => ({
      batchId: batch.id,
      itemIndex: index,
      itemData: JSON.stringify({
        contactId: contact.id,
        phoneE164: contact.phoneE164,
        name: contact.name,
      }),
    }));

    await prisma.batchOperationItem.createMany({
      data: items,
    });

    // 更新批量操作的实际总数
    await prisma.batchOperation.update({
      where: { id: batch.id },
      data: {
        totalCount: contacts.length,
        description: `向 ${contacts.length} 个联系人发送消息`,
      },
    });

    // 异步处理批量发送
    this.processBatchSend(batch.id);
    
    return batch as any;
  }

  // 批量标签管理
  static async manageTags(config: BatchTagConfig): Promise<BatchOperation> {
    const validatedConfig = batchTagSchema.parse(config);
    
    const batch = await prisma.batchOperation.create({
      data: {
        type: 'tag',
        status: 'pending',
        title: '批量标签管理',
        description: `对 ${validatedConfig.contactIds.length} 个联系人进行标签${validatedConfig.operation === 'add' ? '添加' : validatedConfig.operation === 'remove' ? '移除' : '替换'}操作`,
        totalCount: validatedConfig.contactIds.length,
        config: JSON.stringify({
          tags: validatedConfig.tags,
          operation: validatedConfig.operation,
        }),
        progress: 0,
      },
    });

    // 创建批量操作明细
    const items = validatedConfig.contactIds.map((contactId, index) => ({
      batchId: batch.id,
      itemIndex: index,
      itemData: JSON.stringify({ contactId }),
    }));

    await prisma.batchOperationItem.createMany({
      data: items,
    });

    // 异步处理批量标签管理
    this.processBatchTags(batch.id);
    
    return batch as any;
  }

  // 批量删除联系人
  static async deleteContacts(contactIds: string[]): Promise<BatchOperation> {
    if (contactIds.length === 0) {
      throw new Error('No contacts to delete');
    }

    const batch = await prisma.batchOperation.create({
      data: {
        type: 'delete',
        status: 'pending',
        title: '批量删除联系人',
        description: `删除 ${contactIds.length} 个联系人`,
        totalCount: contactIds.length,
        config: JSON.stringify({ contactIds }),
        progress: 0,
      },
    });

    // 创建批量操作明细
    const items = contactIds.map((contactId, index) => ({
      batchId: batch.id,
      itemIndex: index,
      itemData: JSON.stringify({ contactId }),
    }));

    await prisma.batchOperationItem.createMany({
      data: items,
    });

    // 异步处理批量删除
    this.processBatchDelete(batch.id);
    
    return batch as any;
  }

  // 获取批量操作状态
  static async getBatchStatus(batchId: string): Promise<BatchOperationWithItems> {
    const batch = await prisma.batchOperation.findUnique({
      where: { id: batchId },
      include: {
        items: {
          where: { status: { in: ['failed', 'skipped'] } },
          select: { 
            id: true, 
            itemIndex: true, 
            itemData: true, 
            status: true, 
            errorMessage: true,
            result: true,
            processedAt: true,
          },
        },
      },
    });

    if (!batch) {
      throw new Error('Batch operation not found');
    }

    return batch as BatchOperationWithItems;
  }

  // 取消批量操作
  static async cancelBatch(batchId: string): Promise<boolean> {
    const batch = await prisma.batchOperation.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      throw new Error('Batch operation not found');
    }

    if (batch.status === 'completed' || batch.status === 'cancelled') {
      throw new Error('Cannot cancel completed or cancelled batch operation');
    }

    await prisma.batchOperation.update({
      where: { id: batchId },
      data: {
        status: 'cancelled',
        completedAt: new Date(),
        errorMessage: 'Operation cancelled by user',
      },
    });

    return true;
  }

  // 获取批量操作列表
  static async getBatchList(filters?: {
    type?: string;
    status?: string;
    createdAfter?: string;
    limit?: number;
    offset?: number;
  }): Promise<BatchOperation[]> {
    const where: any = {};

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.createdAfter) {
      where.createdAt = { gte: new Date(filters.createdAfter) };
    }

    const queryOptions: any = {
      where,
      orderBy: { createdAt: 'desc' },
    };

    if (filters?.limit) {
      queryOptions.take = filters.limit;
    }

    if (filters?.offset) {
      queryOptions.skip = filters.offset;
    }

    const batches = await prisma.batchOperation.findMany(queryOptions);
    return batches as any;
  }

  // 处理批量导入
  private static async processBatchImport(batchId: string) {
    const batch = await prisma.batchOperation.findUnique({
      where: { id: batchId },
    });

    if (!batch) return;

    try {
      await prisma.batchOperation.update({
        where: { id: batchId },
        data: { 
          status: 'processing',
          startedAt: new Date(),
        },
      });

      const items = await prisma.batchOperationItem.findMany({
        where: { batchId, status: 'pending' },
        orderBy: { itemIndex: 'asc' },
      });

      const config = JSON.parse((batch.config as string) || '{}');
      let successCount = 0;
      let failedCount = 0;

      for (const item of items) {
        try {
          const contactData = JSON.parse(item.itemData as string);
          
          // 检查联系人是否已存在
          const existing = await prisma.contact.findUnique({
            where: { phoneE164: contactData.phoneE164 },
          });

          if (existing) {
            if (config.skipDuplicates) {
              // 跳过重复联系人
              await prisma.batchOperationItem.update({
                where: { id: item.id },
                data: {
                  status: 'skipped',
                  result: JSON.stringify({ message: 'Contact already exists' }),
                  processedAt: new Date(),
                },
              });
              continue;
            }

            // 更新现有联系人
            const existingTags = (existing.tags as string[]) || [];
            const newTags = Array.from(new Set([
              ...existingTags,
              ...(config.tags || []),
              ...(contactData.tags || []),
            ]));

            await prisma.contact.update({
              where: { id: existing.id },
              data: {
                name: contactData.name || existing.name,
                tags: newTags,
                source: config.source || existing.source,
              },
            });
          } else {
            // 创建新联系人
            await prisma.contact.create({
              data: {
                phoneE164: contactData.phoneE164,
                name: contactData.name,
                tags: Array.from(new Set([
                  ...(config.tags || []),
                  ...(contactData.tags || []),
                ])),
                source: config.source,
                importBatchId: batchId,
                notes: contactData.notes,
              },
            });
          }

          await prisma.batchOperationItem.update({
            where: { id: item.id },
            data: {
              status: 'completed',
              result: JSON.stringify({ success: true }),
              processedAt: new Date(),
            },
          });

          successCount++;
        } catch (error) {
          await prisma.batchOperationItem.update({
            where: { id: item.id },
            data: {
              status: 'failed',
              errorMessage: error instanceof Error ? error.message : 'Unknown error',
              processedAt: new Date(),
            },
          });

          failedCount++;
        }

        // 更新进度
        const progress = Math.round(((successCount + failedCount) / items.length) * 100);
        await prisma.batchOperation.update({
          where: { id: batchId },
          data: { progress },
        });
      }

      await prisma.batchOperation.update({
        where: { id: batchId },
        data: {
          status: 'completed',
          processedCount: items.length,
          successCount,
          failedCount,
          completedAt: new Date(),
        },
      });

      logger.info('Batch import completed', { 
        batchId, 
        total: items.length, 
        success: successCount, 
        failed: failedCount 
      } as any);

    } catch (error) {
      await prisma.batchOperation.update({
        where: { id: batchId },
        data: {
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date(),
        },
      });

      logger.error('Batch import failed', { batchId, error } as any);
    }
  }

  // 处理批量发送
  private static async processBatchSend(batchId: string) {
    const batch = await prisma.batchOperation.findUnique({
      where: { id: batchId },
    });

    if (!batch) return;

    try {
      await prisma.batchOperation.update({
        where: { id: batchId },
        data: { 
          status: 'processing',
          startedAt: new Date(),
        },
      });

      const config = JSON.parse((batch.config as string) || '{}');
      const items = await prisma.batchOperationItem.findMany({
        where: { batchId, status: 'pending' },
        orderBy: { itemIndex: 'asc' },
      });

      let successCount = 0;
      let failedCount = 0;

      // 获取WhatsApp服务实例
      
      // 检查WhatsApp服务是否就绪
      const whatsappStatus = whatsappService.getStatus();
      if (whatsappStatus.status !== 'READY') {
        logger.error('WhatsApp service not ready', { 
          status: whatsappStatus.status,
          state: whatsappStatus.state,
          phoneE164: whatsappStatus.phoneE164
        } as any);
        throw new Error(`WhatsApp service is not ready, status: ${whatsappStatus.status}`);
      }

      // 获取发送内容
      let messageContent = '';
      if (config.templateId) {
        // 如果使用模板，需要从模板中获取内容
        const template = await prisma.messageTemplate.findUnique({
          where: { id: config.templateId },
          select: { content: true },
        });
        if (!template) {
          throw new Error(`Template not found: ${config.templateId}`);
        }
        messageContent = template.content;
      } else if (config.content) {
        messageContent = config.content;
      } else {
        throw new Error('No message content specified');
      }

      // 实现定时发送和速率限制
      const ratePerMinute = config.ratePerMinute || 8;
      const jitterMs = config.jitterMs || 300;
      const baseDelayMs = (60 * 1000) / ratePerMinute; // 每分钟发送数量转换为毫秒间隔

      for (const item of items) {
        try {
          const itemData = JSON.parse(item.itemData as string);
          
          logger.info('Starting batch message send', { 
            batchId, 
            contactId: itemData.contactId,
            phoneE164: itemData.phoneE164,
            content: messageContent.substring(0, 50) + '...'
          } as any);
          
          // 发送WhatsApp消息
          const result = await whatsappService.sendTextMessage(itemData.phoneE164, messageContent);
          
          logger.info('WhatsApp message sent, saving to database', { 
            batchId, 
            contactId: itemData.contactId,
            phoneE164: itemData.phoneE164,
            messageId: result.id
          } as any);
          
          // 获取或创建线程
          const thread = await getOrCreateThread(itemData.contactId);
          
          // 保存消息到数据库（使用recordMessageIfMissing避免重复保存）
          const message = await recordMessageIfMissing({
            threadId: thread.id,
            direction: MessageDirection.OUT,
            text: messageContent,
            externalId: result.id ?? null,
            status: MessageStatus.SENT,
          });
          
          if (!message) {
            logger.warn('Message already exists in database', { 
              batchId, 
              contactId: itemData.contactId,
              phoneE164: itemData.phoneE164,
              externalId: result.id
            } as any);
            
            // 查找现有消息
            const existingMessage = await prisma.message.findFirst({
              where: {
                threadId: thread.id,
                externalId: result.id ?? null,
                direction: MessageDirection.OUT,
              },
            });
            
            if (existingMessage) {
              logger.info('Using existing message from database', { 
                batchId, 
                contactId: itemData.contactId,
                messageId: existingMessage.id
              } as any);
            }
          } else {
            logger.info('Message saved to database', { 
              batchId, 
              contactId: itemData.contactId,
              messageId: message.id
            } as any);
          }
          
          await prisma.batchOperationItem.update({
            where: { id: item.id },
            data: {
              status: 'completed',
              result: JSON.stringify({ 
                success: true, 
                messageId: result.id,
                phoneE164: itemData.phoneE164,
                sentAt: new Date().toISOString(),
                savedToDatabase: !!message
              }),
              processedAt: new Date(),
            },
          });

          successCount++;
          
          logger.info('Batch message completed successfully', { 
            batchId, 
            contactId: itemData.contactId,
            phoneE164: itemData.phoneE164,
            messageId: result.id,
            savedToDatabase: !!message
          } as any);

        } catch (error) {
          logger.error('Batch message send failed', { 
            batchId, 
            contactId: itemData.contactId,
            phoneE164: itemData.phoneE164,
            error: error instanceof Error ? error.message : 'Unknown error',
            errorStack: error instanceof Error ? error.stack : undefined
          } as any);
          
          await prisma.batchOperationItem.update({
            where: { id: item.id },
            data: {
              status: 'failed',
              errorMessage: error instanceof Error ? error.message : 'Unknown error',
              processedAt: new Date(),
            },
          });

          failedCount++;
        }

        // 速率限制：在发送之间添加延迟（除了最后一个消息）
        if (item !== items[items.length - 1]) {
          const jitter = Math.random() * jitterMs - (jitterMs / 2); // -jitterMs/2 到 +jitterMs/2
          const delay = Math.max(baseDelayMs + jitter, 100); // 最少100ms延迟
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

        // 更新进度
        const progress = Math.round(((successCount + failedCount) / items.length) * 100);
        await prisma.batchOperation.update({
          where: { id: batchId },
          data: { progress },
        });

      await prisma.batchOperation.update({
        where: { id: batchId },
        data: {
          status: 'completed',
          processedCount: items.length,
          successCount,
          failedCount,
          completedAt: new Date(),
        },
      });

      logger.info('Batch send completed', { 
        batchId, 
        total: items.length, 
        success: successCount, 
        failed: failedCount 
      } as any);

    } catch (error) {
      await prisma.batchOperation.update({
        where: { id: batchId },
        data: {
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date(),
        },
      });

      logger.error('Batch send failed', { batchId, error } as any);
    }
  }

  // 处理批量标签管理
  private static async processBatchTags(batchId: string) {
    const batch = await prisma.batchOperation.findUnique({
      where: { id: batchId },
    });

    if (!batch) return;

    try {
      await prisma.batchOperation.update({
        where: { id: batchId },
        data: { 
          status: 'processing',
          startedAt: new Date(),
        },
      });

      const config = JSON.parse((batch.config as string) || '{}');
      const items = await prisma.batchOperationItem.findMany({
        where: { batchId, status: 'pending' },
        orderBy: { itemIndex: 'asc' },
      });

      let successCount = 0;
      let failedCount = 0;

      for (const item of items) {
        try {
          const itemData = JSON.parse(item.itemData as string);
          const contact = await prisma.contact.findUnique({
            where: { id: itemData.contactId },
          });

          if (!contact) {
            throw new Error('Contact not found');
          }

          const existingTags = (contact.tags as string[]) || [];
          let newTags: string[];

          switch (config.operation) {
            case 'add':
              newTags = Array.from(new Set([...existingTags, ...config.tags]));
              break;
            case 'remove':
              newTags = existingTags.filter(tag => !config.tags.includes(tag));
              break;
            case 'replace':
              newTags = config.tags;
              break;
            default:
              throw new Error('Invalid operation');
          }

          await prisma.contact.update({
            where: { id: itemData.contactId },
            data: { tags: newTags },
          });

          await prisma.batchOperationItem.update({
            where: { id: item.id },
            data: {
              status: 'completed',
              result: JSON.stringify({ success: true, newTags }),
              processedAt: new Date(),
            },
          });

          successCount++;
        } catch (error) {
          await prisma.batchOperationItem.update({
            where: { id: item.id },
            data: {
              status: 'failed',
              errorMessage: error instanceof Error ? error.message : 'Unknown error',
              processedAt: new Date(),
            },
          });

          failedCount++;
        }

        // 更新进度
        const progress = Math.round(((successCount + failedCount) / items.length) * 100);
        await prisma.batchOperation.update({
          where: { id: batchId },
          data: { progress },
        });
      }

      await prisma.batchOperation.update({
        where: { id: batchId },
        data: {
          status: 'completed',
          processedCount: items.length,
          successCount,
          failedCount,
          completedAt: new Date(),
        },
      });

      logger.info('Batch tags completed', { 
        batchId, 
        total: items.length, 
        success: successCount, 
        failed: failedCount 
      } as any);

    } catch (error) {
      await prisma.batchOperation.update({
        where: { id: batchId },
        data: {
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date(),
        },
      });

      logger.error('Batch tags failed', { batchId, error } as any);
    }
  }

  // 处理批量删除
  private static async processBatchDelete(batchId: string) {
    const batch = await prisma.batchOperation.findUnique({
      where: { id: batchId },
    });

    if (!batch) return;

    try {
      await prisma.batchOperation.update({
        where: { id: batchId },
        data: { 
          status: 'processing',
          startedAt: new Date(),
        },
      });

      const items = await prisma.batchOperationItem.findMany({
        where: { batchId, status: 'pending' },
        orderBy: { itemIndex: 'asc' },
      });

      let successCount = 0;
      let failedCount = 0;

      for (const item of items) {
        try {
          const itemData = JSON.parse(item.itemData as string);
          
          // 删除联系人（这会级联删除相关的threads和messages）
          await prisma.contact.delete({
            where: { id: itemData.contactId },
          });

          await prisma.batchOperationItem.update({
            where: { id: item.id },
            data: {
              status: 'completed',
              result: JSON.stringify({ success: true }),
              processedAt: new Date(),
            },
          });

          successCount++;
        } catch (error) {
          await prisma.batchOperationItem.update({
            where: { id: item.id },
            data: {
              status: 'failed',
              errorMessage: error instanceof Error ? error.message : 'Unknown error',
              processedAt: new Date(),
            },
          });

          failedCount++;
        }

        // 更新进度
        const progress = Math.round(((successCount + failedCount) / items.length) * 100);
        await prisma.batchOperation.update({
          where: { id: batchId },
          data: { progress },
        });
      }

      await prisma.batchOperation.update({
        where: { id: batchId },
        data: {
          status: 'completed',
          processedCount: items.length,
          successCount,
          failedCount,
          completedAt: new Date(),
        },
      });

      logger.info('Batch delete completed', { 
        batchId, 
        total: items.length, 
        success: successCount, 
        failed: failedCount 
      } as any);

    } catch (error) {
      await prisma.batchOperation.update({
        where: { id: batchId },
        data: {
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date(),
        },
      });

      logger.error('Batch delete failed', { batchId, error } as any);
    }
  }
}
