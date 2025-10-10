import { FastifyInstance } from 'fastify';
import * as messageService from '../services/message-service';
import { MessageDirection, MessageStatus } from '@prisma/client';
import * as mediaService from '../services/media-service';
import * as contactService from '../services/contact-service';
import * as threadService from '../services/thread-service';
import { MessageMedia } from 'whatsapp-web.js';

export async function messageRoutes(fastify: FastifyInstance) {
  // 引用回复消息
  fastify.post('/messages/reply', async (request, reply) => {
    try {
      const {
        threadId,
        replyToId,
        text,
        direction = 'OUT',
        externalId,
      } = request.body as any;

      if (!threadId || !replyToId || !text) {
        return reply.code(400).send({
          ok: false,
          code: 'INVALID_INPUT',
          message: '缺少必要参数',
        });
      }

      const message = await messageService.replyToMessage({
        threadId,
        replyToId,
        text,
        direction: direction as MessageDirection,
        externalId,
      });

      return reply.send({
        ok: true,
        data: message,
      });
    } catch (error: any) {
      console.error('引用回复消息失败:', error);
      return reply.code(500).send({
        ok: false,
        code: 'REPLY_FAILED',
        message: error.message || '引用回复消息失败',
      });
    }
  });

  // 编辑消息
  fastify.put('/messages/:id/edit', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { text } = request.body as any;

      if (!text) {
        return reply.code(400).send({
          ok: false,
          code: 'INVALID_INPUT',
          message: '消息内容不能为空',
        });
      }

      const message = await messageService.editMessage(id, text);

      // 新增：触发 WebSocket 事件
      const whatsappService = fastify.whatsappService;
      if (whatsappService && message) {
        whatsappService.emitMessageEdited(id, message.threadId, text);
      }

      return reply.send({
        ok: true,
        data: message,
      });
    } catch (error: any) {
      console.error('编辑消息失败:', error);
      return reply.code(500).send({
        ok: false,
        code: 'EDIT_FAILED',
        message: error.message || '编辑消息失败',
      });
    }
  });

  // 删除消息
  fastify.delete('/messages/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { deletedBy = 'user' } = request.body as any;

      const message = await messageService.deleteMessage(id, deletedBy);

      // 新增：触发 WebSocket 事件
      const whatsappService = fastify.whatsappService;
      if (whatsappService && message) {
        whatsappService.emitMessageDeleted(id, message.threadId, deletedBy);
      }

      return reply.send({
        ok: true,
        data: message,
      });
    } catch (error: any) {
      console.error('删除消息失败:', error);
      return reply.code(500).send({
        ok: false,
        code: 'DELETE_FAILED',
        message: error.message || '删除消息失败',
      });
    }
  });

  // 转发消息
  fastify.post('/messages/:id/forward', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { targetThreadIds, direction = 'OUT' } = request.body as any;

      if (!targetThreadIds || !Array.isArray(targetThreadIds) || targetThreadIds.length === 0) {
        return reply.code(400).send({
          ok: false,
          code: 'INVALID_INPUT',
          message: '请选择转发目标',
        });
      }

      const messages = await messageService.forwardMessage({
        messageId: id,
        targetThreadIds,
        direction: direction as MessageDirection,
      });

      return reply.send({
        ok: true,
        data: {
          messages,
          count: messages.length,
        },
      });
    } catch (error: any) {
      console.error('转发消息失败:', error);
      return reply.code(500).send({
        ok: false,
        code: 'FORWARD_FAILED',
        message: error.message || '转发消息失败',
      });
    }
  });

  // 标记/取消标记消息
  fastify.post('/messages/:id/star', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { starred = true } = request.body as any;

      const message = await messageService.starMessage(id, starred);

      // 新增：触发 WebSocket 事件
      const whatsappService = fastify.whatsappService;
      if (whatsappService && message) {
        whatsappService.emitMessageStarred(id, message.threadId, starred);
      }

      return reply.send({
        ok: true,
        data: message,
      });
    } catch (error: any) {
      console.error('标记消息失败:', error);
      return reply.code(500).send({
        ok: false,
        code: 'STAR_FAILED',
        message: error.message || '标记消息失败',
      });
    }
  });

  // 搜索消息
  fastify.get('/messages/search', async (request, reply) => {
    try {
      const { query, threadId, limit, offset } = request.query as any;

      if (!query) {
        return reply.code(400).send({
          ok: false,
          code: 'INVALID_INPUT',
          message: '搜索关键词不能为空',
        });
      }

      const result = await messageService.searchMessages({
        query,
        threadId,
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : undefined,
      });

      return reply.send({
        ok: true,
        data: result,
      });
    } catch (error: any) {
      console.error('搜索消息失败:', error);
      return reply.code(500).send({
        ok: false,
        code: 'SEARCH_FAILED',
        message: error.message || '搜索消息失败',
      });
    }
  });

  // 获取星标消息
  fastify.get('/messages/starred', async (request, reply) => {
    try {
      const { threadId } = request.query as any;

      const messages = await messageService.getStarredMessages(threadId);

      return reply.send({
        ok: true,
        data: {
          messages,
          count: messages.length,
        },
      });
    } catch (error: any) {
      console.error('获取星标消息失败:', error);
      return reply.code(500).send({
        ok: false,
        code: 'GET_STARRED_FAILED',
        message: error.message || '获取星标消息失败',
      });
    }
  });

  // 获取消息详情（包含引用关系）
  fastify.get('/messages/:id/details', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const message = await messageService.getMessageWithRelations(id);

      if (!message) {
        return reply.code(404).send({
          ok: false,
          code: 'MESSAGE_NOT_FOUND',
          message: '消息不存在',
        });
      }

      return reply.send({
        ok: true,
        data: message,
      });
    } catch (error: any) {
      console.error('获取消息详情失败:', error);
      return reply.code(500).send({
        ok: false,
        code: 'GET_DETAILS_FAILED',
        message: error.message || '获取消息详情失败',
      });
    }
  });

  // 发送媒体消息
  fastify.post('/messages/send-media', async (request, reply) => {
    try {
      const { phoneE164, mediaFileName, mediaType, caption, originalFileName } = request.body as any;

      if (!phoneE164 || !mediaFileName) {
        return reply.code(400).send({
          ok: false,
          code: 'INVALID_INPUT',
          message: '缺少必要参数',
        });
      }

      const whatsappService = fastify.whatsappService;
      if (!whatsappService) {
        return reply.code(500).send({
          ok: false,
          code: 'SERVICE_NOT_AVAILABLE',
          message: 'WhatsApp 服务不可用',
        });
      }

      // 获取文件路径
      const filePath = mediaService.getFilePath(mediaFileName);
      const fileInfo = await mediaService.getFileInfo(mediaFileName);

      if (!fileInfo.exists) {
        return reply.code(404).send({
          ok: false,
          code: 'FILE_NOT_FOUND',
          message: '文件不存在',
        });
      }

      // 查找或创建联系人
      let contact = await contactService.getContactByPhone(phoneE164);
      if (!contact) {
        contact = await contactService.createContact({ phoneE164 });
      }

      // 获取或创建对话线程
      const thread = await threadService.getOrCreateThread(contact.id);

      // 发送媒体消息（使用 MessageMedia）
      const media = MessageMedia.fromFilePath(filePath);
      
      // ✅ 设置原始文件名，这样客户收到的文件就是原始文件名
      if (originalFileName) {
        media.filename = originalFileName;
        console.log('📤 [发送媒体] 设置文件名:', {
          服务器文件名: mediaFileName,
          原始文件名: originalFileName,
          MessageMedia文件名: media.filename,
        });
      }
      
      const chatId = (whatsappService as any).toChatId(phoneE164);
      const client = (whatsappService as any).client;
      
      if (!client) {
        throw new Error('WhatsApp client 不可用');
      }

      console.log('📤 [发送媒体] 准备发送到 WhatsApp:', {
        chatId,
        mediaType: media.mimetype,
        filename: media.filename,
        hasCaption: !!caption,
      });

      const response = await client.sendMessage(chatId, media, { caption: caption || '' });
      
      console.log('📤 [发送媒体] WhatsApp 发送成功:', {
        messageId: response.id?._serialized,
        filename: media.filename,
      });

      // 记录消息到数据库
      const message = await messageService.recordMessage({
        threadId: thread.id,
        direction: MessageDirection.OUT,
        text: caption || '',
        externalId: response.id?._serialized || null,
        status: MessageStatus.SENT,
        mediaUrl: `/media/files/${mediaFileName}`,
        mediaType: mediaType || 'image',
        mediaMimeType: media.mimetype,
        mediaSize: fileInfo.size,
        mediaFileName,
      });

      // ✅ 触发 WebSocket 事件，通知前端新消息
      const wsEvent = {
        id: response.id?._serialized || message.id,
        from: chatId.includes('@c.us') ? chatId : `${phoneE164.replace('+', '')}@c.us`,
        to: chatId,
        body: caption || `[${originalFileName || mediaFileName}]`,
        fromMe: true,
        type: mediaType || 'image',
        timestamp: Math.floor(Date.now() / 1000),
        threadId: chatId,
        hasMedia: true,
        // 完整的媒体信息
        mediaUrl: `/media/files/${mediaFileName}`,
        mediaType: mediaType || 'image',
        mediaMimeType: media.mimetype,
        mediaSize: fileInfo.size,
        mediaFileName: mediaFileName, // 服务器文件名
        originalFileName: originalFileName || mediaFileName, // 原始文件名（用于显示）
        thumbnailUrl: `/media/thumbnails/thumb-${mediaFileName}`,
      };
      
      console.log('📤 [发送媒体] 触发 WebSocket 事件:', wsEvent);
      whatsappService.emit('newMessage', wsEvent);

      return reply.send({
        ok: true,
        data: {
          message,
          threadId: thread.id,
        },
      });
    } catch (error: any) {
      console.error('发送媒体消息失败:', error);
      return reply.code(500).send({
        ok: false,
        code: 'SEND_MEDIA_FAILED',
        message: error.message || '发送媒体消息失败',
      });
    }
  });
}

