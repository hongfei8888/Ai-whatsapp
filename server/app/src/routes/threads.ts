import { FastifyInstance } from 'fastify';
import * as threadService from '../services/thread-service';

export async function threadRoutes(fastify: FastifyInstance) {
  // 置顶/取消置顶会话
  fastify.post('/threads/:id/pin', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { pinned = true } = request.body as any;

      const thread = await threadService.pinThread(id, pinned);

      // 新增：触发 WebSocket 事件
      const whatsappService = fastify.whatsappService;
      if (whatsappService) {
        whatsappService.emitThreadPinned(id, pinned);
      }

      return reply.send({
        ok: true,
        data: thread,
      });
    } catch (error: any) {
      console.error('置顶会话失败:', error);
      return reply.code(500).send({
        ok: false,
        code: 'PIN_FAILED',
        message: error.message || '置顶会话失败',
      });
    }
  });

  // 归档/取消归档会话
  fastify.post('/threads/:id/archive', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { archived = true } = request.body as any;

      const thread = await threadService.archiveThread(id, archived);

      // 新增：触发 WebSocket 事件
      const whatsappService = fastify.whatsappService;
      if (whatsappService) {
        whatsappService.emitThreadArchived(id, archived);
      }

      return reply.send({
        ok: true,
        data: thread,
      });
    } catch (error: any) {
      console.error('归档会话失败:', error);
      return reply.code(500).send({
        ok: false,
        code: 'ARCHIVE_FAILED',
        message: error.message || '归档会话失败',
      });
    }
  });

  // 更新会话标签
  fastify.put('/threads/:id/labels', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { labels = [] } = request.body as any;

      if (!Array.isArray(labels)) {
        return reply.code(400).send({
          ok: false,
          code: 'INVALID_INPUT',
          message: '标签必须是数组',
        });
      }

      const thread = await threadService.updateThreadLabels(id, labels);

      return reply.send({
        ok: true,
        data: thread,
      });
    } catch (error: any) {
      console.error('更新标签失败:', error);
      return reply.code(500).send({
        ok: false,
        code: 'UPDATE_LABELS_FAILED',
        message: error.message || '更新标签失败',
      });
    }
  });

  // 标记会话已读
  fastify.post('/threads/:id/read', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const thread = await threadService.markThreadAsRead(id);

      return reply.send({
        ok: true,
        data: thread,
      });
    } catch (error: any) {
      console.error('标记已读失败:', error);
      return reply.code(500).send({
        ok: false,
        code: 'MARK_READ_FAILED',
        message: error.message || '标记已读失败',
      });
    }
  });

  // 保存草稿
  fastify.put('/threads/:id/draft', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { draft = '' } = request.body as any;

      const thread = await threadService.saveDraft(id, draft);

      return reply.send({
        ok: true,
        data: thread,
      });
    } catch (error: any) {
      console.error('保存草稿失败:', error);
      return reply.code(500).send({
        ok: false,
        code: 'SAVE_DRAFT_FAILED',
        message: error.message || '保存草稿失败',
      });
    }
  });

  // 获取草稿
  fastify.get('/threads/:id/draft', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const draft = await threadService.getDraft(id);

      return reply.send({
        ok: true,
        data: { draft },
      });
    } catch (error: any) {
      console.error('获取草稿失败:', error);
      return reply.code(500).send({
        ok: false,
        code: 'GET_DRAFT_FAILED',
        message: error.message || '获取草稿失败',
      });
    }
  });

  // 按筛选条件获取会话列表
  fastify.get('/threads/filtered', async (request, reply) => {
    try {
      const { isPinned, isArchived, labels, hasUnread } = request.query as any;

      const filter: threadService.ThreadFilter = {};

      if (isPinned !== undefined) {
        filter.isPinned = isPinned === 'true';
      }

      if (isArchived !== undefined) {
        filter.isArchived = isArchived === 'true';
      }

      if (labels) {
        filter.labels = Array.isArray(labels) ? labels : [labels];
      }

      if (hasUnread !== undefined) {
        filter.hasUnread = hasUnread === 'true';
      }

      const threads = await threadService.listThreadsFiltered(filter);

      return reply.send({
        ok: true,
        data: {
          threads,
          count: threads.length,
        },
      });
    } catch (error: any) {
      console.error('获取筛选会话失败:', error);
      return reply.code(500).send({
        ok: false,
        code: 'GET_FILTERED_THREADS_FAILED',
        message: error.message || '获取筛选会话失败',
      });
    }
  });

  // 获取会话和消息（初始加载时使用，包含完整 thread 信息）
  fastify.get('/threads/:id/messages', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { limit } = request.query as any;

      const parsedLimit = limit ? parseInt(limit) : 50;

      // 使用 getThreadWithMessages 返回完整 thread 信息
      const thread = await threadService.getThreadWithMessages(id, parsedLimit);

      // 序列化 thread 和 messages（使用 server.ts 中的格式）
      const serialized = {
        id: thread.id,
        contactId: thread.contactId,
        aiEnabled: thread.aiEnabled,
        lastHumanAt: thread.lastHumanAt ? thread.lastHumanAt.toISOString() : null,
        lastBotAt: thread.lastBotAt ? thread.lastBotAt.toISOString() : null,
        createdAt: thread.createdAt.toISOString(),
        updatedAt: thread.updatedAt.toISOString(),
        contact: {
          id: thread.contact.id,
          phoneE164: thread.contact.phoneE164,
          name: thread.contact.name,
        },
        messages: thread.messages.map((message: any) => ({
          id: message.id,
          threadId: message.threadId,
          direction: message.direction,
          body: message.text,
          fromMe: message.direction === 'OUT',
          text: message.text,
          status: message.status,
          externalId: message.externalId || null,
          createdAt: message.createdAt ? message.createdAt.toISOString() : new Date().toISOString(),
          updatedAt: message.updatedAt ? message.updatedAt.toISOString() : new Date().toISOString(),
          translatedText: message.translatedText || null,
          translatedFrom: message.translatedFrom || null,
          // 媒体字段（所有可选）
          mediaUrl: message.mediaUrl || null,
          mediaType: message.mediaType || null,
          mediaMimeType: message.mediaMimeType || null,
          mediaSize: message.mediaSize || null,
          mediaFileName: message.mediaFileName || null,
          thumbnailUrl: message.thumbnailUrl || null,
          duration: message.duration || null,
          // 消息关系（所有可选）
          replyToId: message.replyToId || null,
          replyTo: message.replyTo ? {
            id: message.replyTo.id,
            text: message.replyTo.text,
            fromMe: message.replyTo.direction === 'OUT',
          } : null,
          // 消息状态（所有可选）
          isEdited: message.isEdited || false,
          editedAt: message.editedAt ? message.editedAt.toISOString() : null,
          originalText: message.originalText || null,
          isDeleted: message.isDeleted || false,
          deletedAt: message.deletedAt ? message.deletedAt.toISOString() : null,
          isForwarded: message.isForwarded || false,
          forwardedFrom: message.forwardedFrom || null,
          isStarred: message.isStarred || false,
          starredAt: message.starredAt ? message.starredAt.toISOString() : null,
          deliveredAt: message.deliveredAt ? message.deliveredAt.toISOString() : null,
          readAt: message.readAt ? message.readAt.toISOString() : null,
        })),
      };

      return reply.send({
        ok: true,
        data: serialized,
      });
    } catch (error: any) {
      console.error('获取会话消息失败:', error);
      return reply.code(500).send({
        ok: false,
        code: 'GET_MESSAGES_FAILED',
        message: error.message || '获取会话消息失败',
      });
    }
  });

  // 分页加载更多消息（向上滚动时使用）
  fastify.get('/threads/:id/messages/more', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { limit, before, after } = request.query as any;

      const parsedLimit = limit ? parseInt(limit) : 50;
      const beforeDate = before ? new Date(before) : undefined;
      const afterDate = after ? new Date(after) : undefined;

      const result = await threadService.getThreadMessagesPage({
        threadId: id,
        limit: parsedLimit,
        before: beforeDate,
        after: afterDate,
      });

      return reply.send({
        ok: true,
        data: result,
      });
    } catch (error: any) {
      console.error('分页获取消息失败:', error);
      return reply.code(500).send({
        ok: false,
        code: 'GET_MORE_MESSAGES_FAILED',
        message: error.message || '分页获取消息失败',
      });
    }
  });
}

