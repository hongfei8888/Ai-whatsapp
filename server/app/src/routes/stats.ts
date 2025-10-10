import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../prisma';
import { logger } from '../logger';

/**
 * 统计聚合路由
 */
export async function statsRoutes(fastify: FastifyInstance) {
  
  // 系统总览统计
  fastify.get('/stats/overview', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // 并行获取各项统计
      const [
        contactsCount,
        messagesCount,
        threadsCount,
        templatesCount,
        batchOperationsCount,
        knowledgeCount,
        campaignsCount,
      ] = await Promise.all([
        prisma.contact.count(),
        prisma.message.count(),
        prisma.thread.count(),
        prisma.messageTemplate.count(),
        prisma.batchOperation.count(),
        prisma.knowledgeBase.count(),
        prisma.campaign.count(),
      ]);
      
      // 获取今日消息数
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayMessages = await prisma.message.count({
        where: {
          createdAt: {
            gte: today,
          },
        },
      });
      
      // 获取本周消息数
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const weekMessages = await prisma.message.count({
        where: {
          createdAt: {
            gte: weekAgo,
          },
        },
      });
      
      // 获取活跃联系人数（最近7天有消息的）
      const activeContacts = await prisma.thread.count({
        where: {
          updatedAt: {
            gte: weekAgo,
          },
        },
      });
      
      const stats = {
        contacts: {
          total: contactsCount,
          active: activeContacts,
        },
        messages: {
          total: messagesCount,
          today: todayMessages,
          thisWeek: weekMessages,
        },
        threads: {
          total: threadsCount,
        },
        templates: {
          total: templatesCount,
        },
        batchOperations: {
          total: batchOperationsCount,
        },
        knowledge: {
          total: knowledgeCount,
        },
        campaigns: {
          total: campaignsCount,
        },
      };
      
      logger.info('System overview stats retrieved', { stats } as any);
      
      return reply.send({
        ok: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Failed to get overview stats', { error } as any);
      
      return reply.code(500).send({
        ok: false,
        code: 'STATS_ERROR',
        message: error instanceof Error ? error.message : '获取统计数据失败',
      });
    }
  });
  
  // 消息统计
  fastify.get('/stats/messages', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const now = new Date();
      
      // 今日统计
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      
      const todayStats = await prisma.message.groupBy({
        by: ['direction', 'status'],
        where: {
          createdAt: {
            gte: todayStart,
          },
        },
        _count: true,
      });
      
      // 本周每日统计（用于趋势图）
      const weeklyTrend = [];
      for (let i = 6; i >= 0; i--) {
        const dayStart = new Date(now);
        dayStart.setDate(dayStart.getDate() - i);
        dayStart.setHours(0, 0, 0, 0);
        
        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);
        
        const dayCount = await prisma.message.count({
          where: {
            createdAt: {
              gte: dayStart,
              lte: dayEnd,
            },
          },
        });
        
        weeklyTrend.push({
          date: dayStart.toISOString().split('T')[0],
          count: dayCount,
        });
      }
      
      // 统计发送和接收
      const todaySent = todayStats
        .filter(s => s.direction === 'OUT')
        .reduce((sum, s) => sum + s._count, 0);
        
      const todayReceived = todayStats
        .filter(s => s.direction === 'IN')
        .reduce((sum, s) => sum + s._count, 0);
      
      // 统计成功率
      const todaySuccess = todayStats
        .filter(s => s.status === 'SENT')
        .reduce((sum, s) => sum + s._count, 0);
        
      const todayFailed = todayStats
        .filter(s => s.status === 'FAILED')
        .reduce((sum, s) => sum + s._count, 0);
        
      const totalToday = todaySent + todayReceived;
      const successRate = totalToday > 0 
        ? Math.round((todaySuccess / totalToday) * 100) 
        : 100;
      
      const stats = {
        today: {
          sent: todaySent,
          received: todayReceived,
          total: totalToday,
          success: todaySuccess,
          failed: todayFailed,
          successRate,
        },
        weeklyTrend,
      };
      
      logger.info('Message stats retrieved', { stats } as any);
      
      return reply.send({
        ok: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Failed to get message stats', { error } as any);
      
      return reply.code(500).send({
        ok: false,
        code: 'STATS_ERROR',
        message: error instanceof Error ? error.message : '获取消息统计失败',
      });
    }
  });
  
  // 活动统计
  fastify.get('/stats/activity', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      // 最近活跃的联系人（按消息数排序）
      const activeThreads = await prisma.thread.findMany({
        where: {
          updatedAt: {
            gte: weekAgo,
          },
        },
        include: {
          contact: {
            select: {
              id: true,
              name: true,
              phoneE164: true,
            },
          },
          _count: {
            select: {
              messages: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
        take: 10,
      });
      
      const recentContacts = activeThreads.map(thread => ({
        id: thread.contact.id,
        name: thread.contact.name || thread.contact.phoneE164,
        phoneE164: thread.contact.phoneE164,
        messageCount: thread._count.messages,
        lastActivity: thread.updatedAt,
      }));
      
      // 最近的批量操作
      const recentBatches = await prisma.batchOperation.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
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
        },
      });
      
      const stats = {
        recentContacts,
        recentBatches,
      };
      
      logger.info('Activity stats retrieved');
      
      return reply.send({
        ok: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Failed to get activity stats', { error } as any);
      
      return reply.code(500).send({
        ok: false,
        code: 'STATS_ERROR',
        message: error instanceof Error ? error.message : '获取活动统计失败',
      });
    }
  });
}

