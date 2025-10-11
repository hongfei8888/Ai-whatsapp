import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { GroupService } from '../services/group-service';
import { logger } from '../logger';
import { prisma } from '../prisma';
import { webSocketService } from '../websocket-service';
import { getFilePath, getFileInfo } from '../services/media-service';

// 请求验证Schema
const joinBatchSchema = z.object({
  title: z.string().min(1, '任务标题不能为空'),
  inviteLinks: z.array(z.string()).min(1, '至少需要一个邀请链接'),
  config: z.object({
    delayMin: z.number().min(1).optional(),
    delayMax: z.number().min(1).optional(),
    autoGreet: z.boolean().optional(),
    greetMessage: z.string().optional(),
  }).optional(),
});

const taskIdParamsSchema = z.object({
  taskId: z.string().min(1),
});

const listTasksQuerySchema = z.object({
  status: z.string().optional(),
  limit: z.string().transform(val => parseInt(val, 10)).optional(),
  offset: z.string().transform(val => parseInt(val, 10)).optional(),
});

const listGroupsQuerySchema = z.object({
  search: z.string().optional(),
  isActive: z.string().transform(val => val === 'true').optional(),
  isMonitoring: z.string().transform(val => val === 'true').optional(),
  limit: z.string().transform(val => parseInt(val, 10)).optional(),
  offset: z.string().transform(val => parseInt(val, 10)).optional(),
});

/**
 * 群组管理路由
 */
export async function groupRoutes(fastify: FastifyInstance) {
  
  // ==================== 批量进群 ====================
  
  /**
   * 创建批量进群任务
   * POST /groups/join-batch
   */
  fastify.post('/join-batch', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const accountId = request.accountId!;
      const body = joinBatchSchema.parse(request.body);
      
      // 获取 WhatsApp 服务实例
      const whatsappService = fastify.accountManager.getAccountService(accountId);
      if (!whatsappService) {
        return reply.code(404).send({
          ok: false,
          code: 'ACCOUNT_NOT_FOUND',
          message: 'Account not found or not started',
        });
      }
      
      const task = await GroupService.joinGroupsBatch(
        accountId,
        body.title,
        body.inviteLinks,
        body.config,
        whatsappService
      );
      
      logger.info('批量进群任务已创建', { 
        taskId: task.id, 
        totalLinks: task.totalLinks 
      } as any);
      
      return reply.code(201).send({
        ok: true,
        data: task,
      });
    } catch (error) {
      logger.error('创建进群任务失败', { error } as any);
      
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
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : '未知错误',
      });
    }
  });

  /**
   * 获取进群任务状态
   * GET /groups/join-batch/:taskId
   */
  fastify.get('/join-batch/:taskId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const params = taskIdParamsSchema.parse(request.params);
      
      const task = await GroupService.getJoinTaskStatus(params.taskId);
      
      return reply.send({
        ok: true,
        data: task,
      });
    } catch (error) {
      logger.error('获取任务状态失败', { error } as any);
      
      if (error instanceof Error && error.message === '任务不存在') {
        return reply.code(404).send({
          ok: false,
          code: 'NOT_FOUND',
          message: '任务不存在',
        });
      }
      
      return reply.code(500).send({
        ok: false,
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : '未知错误',
      });
    }
  });

  /**
   * 获取进群任务列表
   * GET /groups/join-batch
   */
  fastify.get('/join-batch', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = listTasksQuerySchema.parse(request.query);
      
      const result = await GroupService.listJoinTasks({
        status: query.status,
        limit: query.limit,
        offset: query.offset,
      });
      
      return reply.send({
        ok: true,
        data: result.tasks,
        total: result.total,
      });
    } catch (error) {
      logger.error('获取任务列表失败', { error } as any);
      
      return reply.code(500).send({
        ok: false,
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : '未知错误',
      });
    }
  });

  /**
   * 取消进群任务
   * POST /groups/join-batch/:taskId/cancel
   */
  fastify.post('/join-batch/:taskId/cancel', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const params = taskIdParamsSchema.parse(request.params);
      
      await GroupService.cancelJoinTask(params.taskId);
      
      return reply.send({
        ok: true,
        message: '任务已取消',
      });
    } catch (error) {
      logger.error('取消任务失败', { error } as any);
      
      if (error instanceof Error && error.message === '任务不存在') {
        return reply.code(404).send({
          ok: false,
          code: 'NOT_FOUND',
          message: '任务不存在',
        });
      }
      
      if (error instanceof Error && error.message.includes('只能取消')) {
        return reply.code(400).send({
          ok: false,
          code: 'INVALID_STATUS',
          message: error.message,
        });
      }
      
      return reply.code(500).send({
        ok: false,
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : '未知错误',
      });
    }
  });

  // ==================== 群组管理 ====================
  
  /**
   * 同步群组列表
   * POST /groups/sync
   */
  fastify.post('/sync', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const accountId = request.accountId!;
      const whatsappService = fastify.accountManager.getAccountService(accountId);
      if (!whatsappService) {
        return reply.code(404).send({
          ok: false,
          code: 'ACCOUNT_NOT_FOUND',
          message: 'Account not found or not started',
        });
      }
      // 检查 WPPConnectService 客户端是否可用
      const client = whatsappService.getClient();
      if (client) {
        const result = await GroupService.syncGroups(accountId, whatsappService as any);
        logger.info('群组同步完成', result as any);
        return reply.send({
          ok: true,
          data: result,
          message: `成功同步 ${result.syncedCount} 个群组`,
        });
      } else {
        return reply.send({
          ok: false,
          code: 'NOT_SUPPORTED',
          message: 'Group sync not supported in Baileys mode',
        });
      }
    } catch (error) {
      logger.error('同步群组失败', { error } as any);
      
      return reply.code(500).send({
        ok: false,
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : '未知错误',
      });
    }
  });

  /**
   * 获取群组列表
   * GET /groups
   */
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = listGroupsQuerySchema.parse(request.query);
      
      const result = await GroupService.listGroups({
        search: query.search,
        isActive: query.isActive,
        isMonitoring: query.isMonitoring,
        limit: query.limit,
        offset: query.offset,
      });
      
      return reply.send({
        ok: true,
        data: {
          groups: result.groups,
          total: result.total,
        },
      });
    } catch (error) {
      logger.error('获取群组列表失败', { error } as any);
      
      return reply.code(500).send({
        ok: false,
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : '未知错误',
      });
    }
  });

  // ==================== 群组群发 ====================

  /**
   * 创建群发任务
   * POST /groups/broadcast
   */
  fastify.post('/broadcast', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = z.object({
        title: z.string().min(1, '任务标题不能为空'),
        message: z.string().min(1, '消息内容不能为空'),
        targetGroupIds: z.array(z.string()).min(1, '至少需要选择一个群组'),
        mediaUrl: z.string().optional(),
        scheduledAt: z.string().optional(),
        ratePerMinute: z.number().min(1).optional(),
        jitterMs: z.tuple([z.number(), z.number()]).optional(),
      }).parse(request.body);

      const accountId = request.accountId!;
      
      // 获取 WhatsApp 服务实例
      const whatsappService = fastify.accountManager.getAccountService(accountId);
      if (!whatsappService) {
        return reply.code(404).send({
          ok: false,
          code: 'ACCOUNT_NOT_FOUND',
          message: 'Account not found or not started',
        });
      }
      
      const broadcast = await GroupService.broadcastToGroups(
        accountId,
        body.title,
        body.message,
        body.targetGroupIds,
        {
          mediaUrl: body.mediaUrl,
          scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
          ratePerMinute: body.ratePerMinute,
          jitterMs: body.jitterMs,
          whatsappService: whatsappService,
        }
      );

      logger.info('群发任务已创建', {
        broadcastId: broadcast.id,
        totalGroups: broadcast.totalGroups,
      } as any);

      return reply.code(201).send({
        ok: true,
        data: broadcast,
      });
    } catch (error) {
      logger.error('创建群发任务失败', { error } as any);

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
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : '未知错误',
      });
    }
  });

  /**
   * 获取群发任务状态
   * GET /groups/broadcast/:broadcastId
   */
  fastify.get('/broadcast/:broadcastId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const params = z.object({
        broadcastId: z.string().min(1),
      }).parse(request.params);

      const broadcast = await GroupService.getBroadcastStatus(params.broadcastId);

      return reply.send({
        ok: true,
        data: broadcast,
      });
    } catch (error) {
      logger.error('获取群发任务状态失败', { error } as any);

      if (error instanceof Error && error.message === '任务不存在') {
        return reply.code(404).send({
          ok: false,
          code: 'NOT_FOUND',
          message: '任务不存在',
        });
      }

      return reply.code(500).send({
        ok: false,
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : '未知错误',
      });
    }
  });

  /**
   * 获取群发任务列表
   * GET /groups/broadcast
   */
  fastify.get('/broadcast', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = z.object({
        status: z.string().optional(),
        limit: z.string().transform(val => parseInt(val, 10)).optional(),
        offset: z.string().transform(val => parseInt(val, 10)).optional(),
      }).parse(request.query);

      const result = await GroupService.listBroadcasts({
        status: query.status,
        limit: query.limit,
        offset: query.offset,
      });

      return reply.send({
        ok: true,
        data: result.broadcasts,
        total: result.total,
      });
    } catch (error) {
      logger.error('获取群发任务列表失败', { error } as any);

      return reply.code(500).send({
        ok: false,
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : '未知错误',
      });
    }
  });

  /**
   * 暂停群发任务
   * POST /groups/broadcast/:broadcastId/pause
   */
  fastify.post('/broadcast/:broadcastId/pause', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const params = z.object({
        broadcastId: z.string().min(1),
      }).parse(request.params);

      await GroupService.pauseBroadcast(params.broadcastId);

      return reply.send({
        ok: true,
        message: '任务已暂停',
      });
    } catch (error) {
      logger.error('暂停群发任务失败', { error } as any);

      if (error instanceof Error && error.message === '任务不存在') {
        return reply.code(404).send({
          ok: false,
          code: 'NOT_FOUND',
          message: '任务不存在',
        });
      }

      if (error instanceof Error && error.message.includes('只能')) {
        return reply.code(400).send({
          ok: false,
          code: 'INVALID_STATUS',
          message: error.message,
        });
      }

      return reply.code(500).send({
        ok: false,
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : '未知错误',
      });
    }
  });

  /**
   * 恢复群发任务
   * POST /groups/broadcast/:broadcastId/resume
   */
  fastify.post('/broadcast/:broadcastId/resume', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const params = z.object({
        broadcastId: z.string().min(1),
      }).parse(request.params);

      await GroupService.resumeBroadcast(params.broadcastId);

      return reply.send({
        ok: true,
        message: '任务已恢复',
      });
    } catch (error) {
      logger.error('恢复群发任务失败', { error } as any);

      if (error instanceof Error && error.message === '任务不存在') {
        return reply.code(404).send({
          ok: false,
          code: 'NOT_FOUND',
          message: '任务不存在',
        });
      }

      if (error instanceof Error && error.message.includes('只能')) {
        return reply.code(400).send({
          ok: false,
          code: 'INVALID_STATUS',
          message: error.message,
        });
      }

      return reply.code(500).send({
        ok: false,
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : '未知错误',
      });
    }
  });

  /**
   * 取消群发任务
   * POST /groups/broadcast/:broadcastId/cancel
   */
  fastify.post('/broadcast/:broadcastId/cancel', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const params = z.object({
        broadcastId: z.string().min(1),
      }).parse(request.params);

      await GroupService.cancelBroadcast(params.broadcastId);

      return reply.send({
        ok: true,
        message: '任务已取消',
      });
    } catch (error) {
      logger.error('取消群发任务失败', { error } as any);

      if (error instanceof Error && error.message === '任务不存在') {
        return reply.code(404).send({
          ok: false,
          code: 'NOT_FOUND',
          message: '任务不存在',
        });
      }

      if (error instanceof Error && error.message.includes('只能')) {
        return reply.code(400).send({
          ok: false,
          code: 'INVALID_STATUS',
          message: error.message,
        });
      }

      return reply.code(500).send({
        ok: false,
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : '未知错误',
      });
    }
  });

  // ==================== 群消息监控 ====================

  /**
   * 发送群组消息
   * POST /groups/:groupId/send
   */
  fastify.post('/:groupId/send', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const params = z.object({
        groupId: z.string().min(1),
      }).parse(request.params);

      const accountId = request.accountId!;
      const body = z.object({
        message: z.string().min(1),
      }).parse(request.body);

      const whatsappService = fastify.accountManager.getAccountService(accountId);
      if (!whatsappService) {
        return reply.code(404).send({
          ok: false,
          code: 'ACCOUNT_NOT_FOUND',
          message: 'Account not found or not started',
        });
      }

      // 获取群组信息
      const group = await prisma.whatsAppGroup.findUnique({
        where: { id: params.groupId },
      });

      if (!group) {
        return reply.code(404).send({
          ok: false,
          code: 'NOT_FOUND',
          message: '群组不存在',
        });
      }

      // 发送消息 (使用 WPPConnect API)
      const sentMessage = await whatsappService.sendTextMessage(group.groupId, body.message);

      logger.info('群组消息发送成功', {
        groupId: params.groupId,
        messageId: sentMessage.id,
      } as any);

      // 保存消息到数据库
      try {
        const messageIdStr = sentMessage.id || `msg_${Date.now()}`;
        const timestamp = Date.now();
        
        // 通过 API 发送的消息都标记为 'me'（自己发送的）
        await prisma.groupMessage.create({
          data: {
            groupId: params.groupId,
            messageId: messageIdStr,
            fromPhone: 'me',  // 明确标记为自己发送
            fromName: '我',
            text: body.message,
            mediaType: 'chat',
          },
        });
        logger.info('群组消息已保存到数据库', { groupId: params.groupId } as any);

        // 通过 WebSocket 广播新消息
        webSocketService.broadcast({
          type: 'group_message',
          data: {
            groupId: params.groupId,
            groupName: group.name,
            messageId: messageIdStr,
            from: 'me',  // 明确标记为自己发送
            fromName: '我',
            body: body.message,
            mediaType: 'chat',
            timestamp,
          },
          timestamp,
        });
        logger.info('群组消息 WebSocket 事件已广播', { groupId: params.groupId } as any);
      } catch (dbError) {
        logger.error('保存群组消息到数据库失败', { error: dbError } as any);
      }

      return reply.send({
        ok: true,
        data: {
          messageId: sentMessage.id || `msg_${Date.now()}`,
          timestamp: Date.now(),
        },
      });
    } catch (error) {
      logger.error('发送群组消息失败', { error } as any);

      return reply.code(500).send({
        ok: false,
        code: 'SEND_FAILED',
        message: error instanceof Error ? error.message : '发送失败',
      });
    }
  });

  /**
   * 发送群组媒体消息
   * POST /groups/:groupId/send-media
   */
  fastify.post('/:groupId/send-media', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const params = z.object({
        groupId: z.string().min(1),
      }).parse(request.params);

      const body = z.object({
        mediaFileName: z.string().min(1),
        mediaType: z.string(),
        caption: z.string().optional(),
        originalFileName: z.string().optional(),
      }).parse(request.body);

      const accountId = request.accountId!;
      const whatsappService = fastify.accountManager.getAccountService(accountId);
      if (!whatsappService) {
        return reply.code(404).send({
          ok: false,
          code: 'ACCOUNT_NOT_FOUND',
          message: 'Account not found or not started',
        });
      }

      // 获取群组信息
      const group = await prisma.whatsAppGroup.findUnique({
        where: { id: params.groupId },
      });

      if (!group) {
        return reply.code(404).send({
          ok: false,
          code: 'NOT_FOUND',
          message: '群组不存在',
        });
      }

      // 获取文件信息
      const filePath = getFilePath(body.mediaFileName);
      const fileInfo = await getFileInfo(body.mediaFileName);

      if (!fileInfo.exists) {
        return reply.code(404).send({
          ok: false,
          code: 'FILE_NOT_FOUND',
          message: '文件不存在',
        });
      }

      // 使用 WPPConnect 发送媒体到群组
      // group.groupId 格式应该已经是 xxxxx@g.us
      logger.info('📤 准备发送媒体消息到WhatsApp', {
        groupChatId: group.groupId,
        filePath,
        mediaType: body.mediaType,
        caption: body.caption,
      } as any);

      const result = await whatsappService.sendMediaMessage(
        group.groupId,
        filePath,
        body.caption || ''
      );

      logger.info('✅ 群组媒体消息发送成功（WhatsApp已接收）', {
        groupId: params.groupId,
        groupChatId: group.groupId,
        messageId: result.id,
        mediaType: body.mediaType,
      } as any);

      // 保存消息到数据库
      try {
        const messageIdStr = result.id || String(Date.now());
        
        // 通过 API 发送的媒体消息都标记为 'me'（自己发送的）
        await prisma.groupMessage.create({
          data: {
            groupId: params.groupId,
            messageId: messageIdStr,
            fromPhone: 'me',  // 明确标记为自己发送
            fromName: '我',
            text: body.caption || `[${body.mediaType}]`,
            mediaType: body.mediaType,
            // 🖼️ 添加媒体字段
            mediaUrl: `/media/files/${body.mediaFileName}`,
            mediaMimeType: null,
            mediaFileName: body.mediaFileName,
            originalFileName: body.originalFileName || body.mediaFileName,
            thumbnailUrl: null,
          },
        });

        // 通过 WebSocket 广播新消息（包含完整媒体信息）
        webSocketService.broadcast({
          type: 'group_message',
          data: {
            groupId: params.groupId,
            groupName: group.name,
            messageId: messageIdStr,
            from: 'me',  // 明确标记为自己发送
            fromName: '我',
            body: body.caption || `[${body.mediaType}]`,
            text: body.caption || `[${body.mediaType}]`,
            mediaType: body.mediaType,
            // 🖼️ 添加完整的媒体字段
            mediaUrl: `/media/files/${body.mediaFileName}`,
            mediaMimeType: null,  // 从文件系统获取时没有这个信息
            mediaFileName: body.mediaFileName,
            originalFileName: body.originalFileName || body.mediaFileName,
            thumbnailUrl: null,  // 如果需要缩略图，需要在这里生成
            timestamp: Date.now(),
          },
          timestamp: Date.now(),
        });
        
        logger.info('群组媒体消息已保存到数据库', { groupId: params.groupId } as any);
      } catch (dbError) {
        logger.error('保存群组媒体消息到数据库失败', { error: dbError } as any);
      }

      return reply.send({
        ok: true,
        data: {
          messageId: result.id,
          timestamp: Date.now(),
        },
      });
    } catch (error) {
      logger.error('发送群组媒体消息失败', { error } as any);

      return reply.code(500).send({
        ok: false,
        code: 'SEND_FAILED',
        message: error instanceof Error ? error.message : '发送失败',
      });
    }
  });

  /**
   * 获取群组详情
   * GET /groups/:groupId/details
   */
  fastify.get('/:groupId/details', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const params = z.object({
        groupId: z.string().min(1),
      }).parse(request.params);

      const group = await GroupService.getGroupDetails(params.groupId);

      return reply.send({
        ok: true,
        data: group,
      });
    } catch (error) {
      logger.error('获取群组详情失败', { error } as any);

      if (error instanceof Error && error.message === '群组不存在') {
        return reply.code(404).send({
          ok: false,
          code: 'NOT_FOUND',
          message: '群组不存在',
        });
      }

      return reply.code(500).send({
        ok: false,
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : '未知错误',
      });
    }
  });

  /**
   * 更新群组设置
   * PUT /groups/:groupId/settings
   */
  fastify.put('/:groupId/settings', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const params = z.object({
        groupId: z.string().min(1),
      }).parse(request.params);

      const body = z.object({
        isMonitoring: z.boolean().optional(),
        keywords: z.array(z.string()).optional(),
        tags: z.array(z.string()).optional(),
      }).parse(request.body);

      const group = await GroupService.updateGroupSettings(params.groupId, body);

      return reply.send({
        ok: true,
        data: group,
      });
    } catch (error) {
      logger.error('更新群组设置失败', { error } as any);

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
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : '未知错误',
      });
    }
  });

  /**
   * 获取群消息列表
   * GET /groups/:groupId/messages
   */
  fastify.get('/:groupId/messages', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const params = z.object({
        groupId: z.string().min(1),
      }).parse(request.params);

      const query = z.object({
        fromPhone: z.string().optional(),
        keyword: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        limit: z.string().transform(val => parseInt(val, 10)).optional(),
        offset: z.string().transform(val => parseInt(val, 10)).optional(),
      }).parse(request.query);

      const result = await GroupService.getGroupMessages(params.groupId, query);

      return reply.send({
        ok: true,
        data: result.messages,
        total: result.total,
      });
    } catch (error) {
      logger.error('获取群消息列表失败', { error } as any);

      return reply.code(500).send({
        ok: false,
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : '未知错误',
      });
    }
  });

  /**
   * 获取群组统计
   * GET /groups/:groupId/stats
   */
  fastify.get('/:groupId/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const params = z.object({
        groupId: z.string().min(1),
      }).parse(request.params);

      const query = z.object({
        period: z.enum(['7d', '30d', '90d']).optional(),
      }).parse(request.query);

      const stats = await GroupService.getGroupStats(params.groupId, query.period || '7d');

      return reply.send({
        ok: true,
        data: stats,
      });
    } catch (error) {
      logger.error('获取群组统计失败', { error } as any);

      return reply.code(500).send({
        ok: false,
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : '未知错误',
      });
    }
  });

  /**
   * 获取群成员列表
   * GET /groups/:groupId/members
   */
  fastify.get('/:groupId/members', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const params = z.object({
        groupId: z.string().min(1),
      }).parse(request.params);

      const query = z.object({
        isActive: z.string().transform(val => val === 'true').optional(),
        search: z.string().optional(),
        limit: z.string().transform(val => parseInt(val, 10)).optional(),
        offset: z.string().transform(val => parseInt(val, 10)).optional(),
      }).parse(request.query);

      const result = await GroupService.getGroupMembers(params.groupId, query);

      return reply.send({
        ok: true,
        data: result.members,
        total: result.total,
      });
    } catch (error) {
      logger.error('获取群成员列表失败', { error } as any);

      return reply.code(500).send({
        ok: false,
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : '未知错误',
      });
    }
  });

  /**
   * 同步群成员
   * POST /groups/:groupId/sync-members
   */
  fastify.post('/:groupId/sync-members', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const params = z.object({
        groupId: z.string().min(1),
      }).parse(request.params);

      // 🔧 多账号支持：获取当前账号的 WhatsApp 服务实例
      const accountId = (request as any).accountId;
      if (!accountId) {
        return reply.code(400).send({
          ok: false,
          code: 'MISSING_ACCOUNT_ID',
          message: '缺少账号ID',
        });
      }

      const whatsappService = fastify.accountManager.getAccountService(accountId);
      if (!whatsappService) {
        return reply.code(404).send({
          ok: false,
          code: 'ACCOUNT_NOT_FOUND',
          message: '账号未找到或未启动',
        });
      }

      const result = await GroupService.syncGroupMembers(params.groupId, whatsappService);

      return reply.send({
        ok: true,
        data: result,
      });
    } catch (error) {
      logger.error('同步群成员失败', { error } as any);

      return reply.code(500).send({
        ok: false,
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : '未知错误',
      });
    }
  });

  // ==================== 统计和导出 ====================

  /**
   * 获取群组概览统计
   * GET /groups/stats/overview
   */
  fastify.get('/stats/overview', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const stats = await GroupService.getOverviewStats();
      
      return reply.send({
        ok: true,
        data: stats,
      });
    } catch (error) {
      logger.error('获取概览统计失败', { error } as any);
      
      return reply.code(500).send({
        ok: false,
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : '未知错误',
      });
    }
  });

  /**
   * 获取进群任务统计
   * GET /groups/stats/join-tasks
   */
  fastify.get('/stats/join-tasks', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = z.object({
        period: z.enum(['7d', '30d', '90d']).optional(),
      }).parse(request.query);

      const stats = await GroupService.getJoinTasksStats(query.period || '7d');
      
      return reply.send({
        ok: true,
        data: stats,
      });
    } catch (error) {
      logger.error('获取进群任务统计失败', { error } as any);
      
      return reply.code(500).send({
        ok: false,
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : '未知错误',
      });
    }
  });

  /**
   * 获取群发任务统计
   * GET /groups/stats/broadcasts
   */
  fastify.get('/stats/broadcasts', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = z.object({
        period: z.enum(['7d', '30d', '90d']).optional(),
      }).parse(request.query);

      const stats = await GroupService.getBroadcastsStats(query.period || '7d');
      
      return reply.send({
        ok: true,
        data: stats,
      });
    } catch (error) {
      logger.error('获取群发任务统计失败', { error } as any);
      
      return reply.code(500).send({
        ok: false,
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : '未知错误',
      });
    }
  });
}

