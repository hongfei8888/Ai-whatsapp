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
        groupsCount,
        groupMessagesCount,
      ] = await Promise.all([
        prisma.contact.count(),
        prisma.message.count(),
        prisma.thread.count(),
        prisma.messageTemplate.count(),
        prisma.batchOperation.count(),
        prisma.knowledgeBase.count(),
        prisma.campaign.count(),
        prisma.whatsAppGroup.count(),
        prisma.groupMessage.count(),
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
      
      // 获取监控中的群组数
      const monitoringGroups = await prisma.whatsAppGroup.count({
        where: {
          isMonitoring: true,
        },
      });
      
      // 获取活跃群组数（最近7天有消息的）
      const activeGroups = await prisma.whatsAppGroup.count({
        where: {
          isActive: true,
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
        groups: {
          total: groupsCount,
          monitoring: monitoringGroups,
          active: activeGroups,
          messages: groupMessagesCount,
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

  // TOP榜单 - 最活跃群组
  fastify.get('/stats/top-groups', async (request: FastifyRequest<{
    Querystring: { startDate?: string; endDate?: string }
  }>, reply: FastifyReply) => {
    try {
      const { StatsService } = await import('../services/stats-service');
      const { startDate, endDate } = request.query;
      
      const options: any = {};
      if (startDate) options.startDate = new Date(startDate);
      if (endDate) options.endDate = new Date(endDate);

      const topGroups = await StatsService.getTopGroups(options);
      
      return reply.send({
        ok: true,
        data: topGroups,
      });
    } catch (error) {
      logger.error('Failed to get top groups', { error } as any);
      
      return reply.code(500).send({
        ok: false,
        code: 'STATS_ERROR',
        message: error instanceof Error ? error.message : '获取TOP群组失败',
      });
    }
  });

  // TOP榜单 - 最多消息联系人
  fastify.get('/stats/top-contacts', async (request: FastifyRequest<{
    Querystring: { startDate?: string; endDate?: string }
  }>, reply: FastifyReply) => {
    try {
      const { StatsService } = await import('../services/stats-service');
      const { startDate, endDate } = request.query;
      
      const options: any = {};
      if (startDate) options.startDate = new Date(startDate);
      if (endDate) options.endDate = new Date(endDate);

      const topContacts = await StatsService.getTopContacts(options);
      
      return reply.send({
        ok: true,
        data: topContacts,
      });
    } catch (error) {
      logger.error('Failed to get top contacts', { error } as any);
      
      return reply.code(500).send({
        ok: false,
        code: 'STATS_ERROR',
        message: error instanceof Error ? error.message : '获取TOP联系人失败',
      });
    }
  });

  // TOP榜单 - 最常用模板
  fastify.get('/stats/top-templates', async (request: FastifyRequest<{
    Querystring: { startDate?: string; endDate?: string }
  }>, reply: FastifyReply) => {
    try {
      const { StatsService } = await import('../services/stats-service');
      const { startDate, endDate } = request.query;
      
      const options: any = {};
      if (startDate) options.startDate = new Date(startDate);
      if (endDate) options.endDate = new Date(endDate);

      const topTemplates = await StatsService.getTopTemplates(options);
      
      return reply.send({
        ok: true,
        data: topTemplates,
      });
    } catch (error) {
      logger.error('Failed to get top templates', { error } as any);
      
      return reply.code(500).send({
        ok: false,
        code: 'STATS_ERROR',
        message: error instanceof Error ? error.message : '获取TOP模板失败',
      });
    }
  });

  // TOP榜单 - 响应时间最快
  fastify.get('/stats/top-response-times', async (request: FastifyRequest<{
    Querystring: { startDate?: string; endDate?: string }
  }>, reply: FastifyReply) => {
    try {
      const { StatsService } = await import('../services/stats-service');
      const { startDate, endDate } = request.query;
      
      const options: any = {};
      if (startDate) options.startDate = new Date(startDate);
      if (endDate) options.endDate = new Date(endDate);

      const topResponseTimes = await StatsService.getTopResponseTimes(options);
      
      return reply.send({
        ok: true,
        data: topResponseTimes,
      });
    } catch (error) {
      logger.error('Failed to get top response times', { error } as any);
      
      return reply.code(500).send({
        ok: false,
        code: 'STATS_ERROR',
        message: error instanceof Error ? error.message : '获取TOP响应时间失败',
      });
    }
  });

  // TOP榜单 - 批量操作成功率
  fastify.get('/stats/top-batch-success', async (request: FastifyRequest<{
    Querystring: { startDate?: string; endDate?: string }
  }>, reply: FastifyReply) => {
    try {
      const { StatsService } = await import('../services/stats-service');
      const { startDate, endDate } = request.query;
      
      const options: any = {};
      if (startDate) options.startDate = new Date(startDate);
      if (endDate) options.endDate = new Date(endDate);

      const topBatchSuccess = await StatsService.getTopBatchSuccess(options);
      
      return reply.send({
        ok: true,
        data: topBatchSuccess,
      });
    } catch (error) {
      logger.error('Failed to get top batch success', { error } as any);
      
      return reply.code(500).send({
        ok: false,
        code: 'STATS_ERROR',
        message: error instanceof Error ? error.message : '获取TOP批量操作失败',
      });
    }
  });

  // 热力图数据
  fastify.get('/stats/heatmap', async (request: FastifyRequest<{
    Querystring: { startDate?: string; endDate?: string }
  }>, reply: FastifyReply) => {
    try {
      const { StatsService } = await import('../services/stats-service');
      const { startDate, endDate } = request.query;
      
      const options: any = {};
      if (startDate) options.startDate = new Date(startDate);
      if (endDate) options.endDate = new Date(endDate);

      const heatMapData = await StatsService.getHeatMapData(options);
      
      return reply.send({
        ok: true,
        data: heatMapData,
      });
    } catch (error) {
      logger.error('Failed to get heat map data', { error } as any);
      
      return reply.code(500).send({
        ok: false,
        code: 'STATS_ERROR',
        message: error instanceof Error ? error.message : '获取热力图数据失败',
      });
    }
  });
}

