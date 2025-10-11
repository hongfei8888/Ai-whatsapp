import { prisma } from '../prisma';
import { logger } from '../logger';
import { MessageDirection } from '@prisma/client';

export class StatsService {
  /**
   * 获取最活跃群组TOP10
   */
  static async getTopGroups(options: { startDate?: Date; endDate?: Date } = {}) {
    try {
      const { startDate, endDate } = options;
      
      const where: any = {};
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
      }

      // 统计每个群组的消息数
      const groupMessages = await prisma.groupMessage.groupBy({
        by: ['groupId'],
        _count: {
          id: true,
        },
        where,
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: 10,
      });

      // 获取群组详情
      const topGroups = await Promise.all(
        groupMessages.map(async (gm) => {
          const group = await prisma.whatsAppGroup.findUnique({
            where: { id: gm.groupId },
            select: {
              id: true,
              name: true,
              groupId: true,
              memberCount: true,
            },
          });

          return {
            id: group?.id || '',
            name: group?.name || '未知群组',
            messageCount: gm._count.id,
            memberCount: group?.memberCount || 0,
          };
        })
      );

      return topGroups;
    } catch (error) {
      logger.error('Failed to get top groups', { error } as any);
      throw error;
    }
  }

  /**
   * 获取最多消息联系人TOP10
   */
  static async getTopContacts(options: { startDate?: Date; endDate?: Date } = {}) {
    try {
      const { startDate, endDate } = options;
      
      const where: any = {};
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
      }

      // 通过Thread统计消息数
      const threads = await prisma.thread.findMany({
        select: {
          id: true,
          contactId: true,
          contact: {
            select: {
              name: true,
              phoneE164: true,
            },
          },
          _count: {
            select: {
              messages: {
                where: where.createdAt ? { createdAt: where.createdAt } : undefined,
              },
            },
          },
        },
        orderBy: {
          messages: {
            _count: 'desc',
          },
        },
        take: 10,
      });

      return threads.map((thread) => ({
        id: thread.contactId,
        name: thread.contact.name,
        phoneE164: thread.contact.phoneE164,
        messageCount: thread._count.messages,
      }));
    } catch (error) {
      logger.error('Failed to get top contacts', { error } as any);
      throw error;
    }
  }

  /**
   * 获取最常用模板TOP10
   */
  static async getTopTemplates(options: { startDate?: Date; endDate?: Date } = {}) {
    try {
      const { startDate, endDate } = options;

      // 由于没有直接的使用次数字段，我们基于消息内容匹配模板
      // 这里简化处理，直接返回所有模板并按创建时间排序
      const templates = await prisma.messageTemplate.findMany({
        select: {
          id: true,
          name: true,
          content: true,
          category: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      });

      // 返回模板列表，使用次数设为0（实际使用需要跟踪机制）
      return templates.map((template) => ({
        id: template.id,
        title: template.name,
        category: template.category,
        usageCount: 0, // 需要实现使用跟踪
        content: template.content.substring(0, 50) + '...',
      }));
    } catch (error) {
      logger.error('Failed to get top templates', { error } as any);
      throw error;
    }
  }

  /**
   * 获取响应时间最快TOP10
   */
  static async getTopResponseTimes(options: { startDate?: Date; endDate?: Date } = {}) {
    try {
      const { startDate, endDate } = options;

      const where: any = {
        direction: 'OUT',
      };
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
      }

      // 获取所有外发消息
      const outgoingMessages = await prisma.message.findMany({
        where,
        select: {
          threadId: true,
          createdAt: true,
          thread: {
            select: {
              contact: {
                select: {
                  name: true,
                  phoneE164: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 100, // 先取100条计算平均响应时间
      });

      // 计算每个thread的平均响应时间
      const threadResponseTimes = new Map<string, { times: number[]; contact: any }>();

      for (const msg of outgoingMessages) {
        // 找到该消息前的最后一条incoming消息
        const prevIncoming = await prisma.message.findFirst({
          where: {
            threadId: msg.threadId,
            direction: MessageDirection.IN,
            createdAt: {
              lt: msg.createdAt,
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        if (prevIncoming) {
          const responseTime = msg.createdAt.getTime() - prevIncoming.createdAt.getTime();
          if (!threadResponseTimes.has(msg.threadId)) {
            threadResponseTimes.set(msg.threadId, {
              times: [],
              contact: msg.thread.contact,
            });
          }
          threadResponseTimes.get(msg.threadId)!.times.push(responseTime);
        }
      }

      // 计算平均响应时间并排序
      const avgResponseTimes = Array.from(threadResponseTimes.entries())
        .map(([threadId, data]) => ({
          threadId,
          name: data.contact.name,
          phoneE164: data.contact.phoneE164,
          avgResponseTime: data.times.reduce((a, b) => a + b, 0) / data.times.length,
          responseCount: data.times.length,
        }))
        .sort((a, b) => a.avgResponseTime - b.avgResponseTime)
        .slice(0, 10);

      return avgResponseTimes.map((item) => ({
        ...item,
        avgResponseTimeFormatted: `${(item.avgResponseTime / 1000 / 60).toFixed(1)}分钟`,
      }));
    } catch (error) {
      logger.error('Failed to get top response times', { error } as any);
      throw error;
    }
  }

  /**
   * 获取批量操作成功率TOP5
   */
  static async getTopBatchSuccess(options: { startDate?: Date; endDate?: Date } = {}) {
    try {
      const { startDate, endDate } = options;

      const where: any = {
        status: 'completed',
      };
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
      }

      const batches = await prisma.batchOperation.findMany({
        where,
        select: {
          id: true,
          title: true,
          type: true,
          totalCount: true,
          successCount: true,
          failedCount: true,
        },
      });

      // 计算成功率
      const batchesWithRate = batches
        .map((batch) => ({
          ...batch,
          successRate: batch.totalCount > 0
            ? Math.round((batch.successCount / batch.totalCount) * 100)
            : 0,
        }))
        .sort((a, b) => b.successRate - a.successRate)
        .slice(0, 5);

      return batchesWithRate;
    } catch (error) {
      logger.error('Failed to get top batch success', { error } as any);
      throw error;
    }
  }

  /**
   * 获取热力图数据（7天×24小时消息分布）
   */
  static async getHeatMapData(options: { startDate?: Date; endDate?: Date } = {}) {
    try {
      const { startDate, endDate } = options;

      // 默认最近7天
      const end = endDate || new Date();
      const start = startDate || new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);

      const messages = await prisma.message.findMany({
        where: {
          createdAt: {
            gte: start,
            lte: end,
          },
        },
        select: {
          createdAt: true,
        },
      });

      // 统计每个小时的消息数
      const heatMapData: Array<{ hour: number; day: number; value: number }> = [];
      const countMap = new Map<string, number>();

      messages.forEach((msg) => {
        const date = new Date(msg.createdAt);
        const day = date.getDay(); // 0-6
        const hour = date.getHours(); // 0-23
        const key = `${day}-${hour}`;
        countMap.set(key, (countMap.get(key) || 0) + 1);
      });

      // 生成完整数据（填充0）
      for (let day = 0; day < 7; day++) {
        for (let hour = 0; hour < 24; hour++) {
          const key = `${day}-${hour}`;
          heatMapData.push({
            day,
            hour,
            value: countMap.get(key) || 0,
          });
        }
      }

      return heatMapData;
    } catch (error) {
      logger.error('Failed to get heat map data', { error } as any);
      throw error;
    }
  }

  /**
   * 计算趋势数据（与上一周期对比）
   */
  static async calculateTrend(currentValue: number, previousValue: number) {
    if (previousValue === 0) {
      return {
        value: 100,
        isPositive: currentValue > 0,
      };
    }

    const change = ((currentValue - previousValue) / previousValue) * 100;
    return {
      value: Math.abs(Math.round(change)),
      isPositive: change >= 0,
    };
  }
}

