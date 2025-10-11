import { MessageDirection, MessageStatus } from '@prisma/client';
import { logger } from '../logger';
import { appConfig } from '../config';
import { chatIdToE164 } from '../utils/phone';
import { prisma } from '../prisma';
import { getContactByPhone } from '../services/contact-service';
import {
  getOrCreateThread,
  getThreadById,
  setAiEnabled,
  shouldSendAutoReply,
  updateThread,
} from '../services/thread-service';
import { listMessages, recordMessage, recordMessageIfMissing } from '../services/message-service';
import type { WPPConnectService, WhatsAppMessage } from '../wppconnect-service';
import { buildAiReply, FALLBACK_REPLY } from '../ai/pipeline';
import { containsForbiddenKeyword, ensureNoForbiddenKeyword } from '../guards/keyword-guard';
import { webSocketService } from '../websocket-service';

const WELCOME_MESSAGE = appConfig.welcomeTemplate || '��л�ظ�����������ר�����֣����κ����⻶ӭ��ʱ������~';

/**
 * 处理接收到的群组消息
 */
async function handleIncomingGroupMessage(accountId: string, whatsappService: WPPConnectService, message: WhatsAppMessage): Promise<void> {
  try {
    const groupChatId = message.from; // WhatsApp 群组 ID (如: 12345@g.us)
    const senderId = message.author || message.from; // 发送者 ID
    const body = message.body ?? '';
    
    logger.info({ 
      groupChatId, 
      senderId, 
      messageType: message.type 
    }, '📨 处理群组消息');
    
    // 查找群组记录
    const group = await prisma.whatsAppGroup.findFirst({
      where: {
        groupId: groupChatId,
        accountId,
      },
    });
    
    if (!group) {
      logger.warn({ groupChatId }, '⚠️ 群组不在数据库中，忽略消息');
      return;
    }
    
    // 🖼️ 处理媒体消息
    let mediaData: any = {};
    let displayText = body;
    
    // ✅ 修复：正确检测媒体消息（不仅检查 hasMedia，还要检查 type）
    const mediaTypes = ['image', 'video', 'audio', 'ptt', 'document', 'sticker'];
    const hasMedia = message.hasMedia || mediaTypes.includes(message.type || '');
    
    logger.info({
      messageId: message.id?._serialized,
      type: message.type,
      hasMediaField: message.hasMedia,
      calculatedHasMedia: hasMedia,
    }, '📊 群组消息媒体检测');
    
    if (hasMedia) {
      try {
        logger.info({ messageId: message.id?._serialized, type: message.type }, '📥 开始下载群组媒体消息');
        
        const mediaBuffer = await whatsappService.downloadMedia(message);
        
        if (mediaBuffer) {
          const fs = require('fs/promises');
          const path = require('path');
          const crypto = require('crypto');
          
          const timestamp = Date.now();
          const randomHash = crypto.randomBytes(16).toString('hex');
          const ext = getFileExtension(message.type || 'unknown');
          const fileName = `${timestamp}-${randomHash}.${ext}`;
          const filePath = path.join(process.cwd(), 'uploads', fileName);
          
          await fs.writeFile(filePath, mediaBuffer);
          
          mediaData = {
            mediaUrl: `/media/files/${fileName}`,
            mediaType: getMediaType(message.type || 'unknown'),
            mediaMimeType: message.mimetype || 'application/octet-stream',
            mediaSize: mediaBuffer.length,
            mediaFileName: fileName,
            originalFileName: message.filename || fileName,
          };
          
          // 为媒体消息生成简短描述（不包含 body，因为 body 是 base64 编码数据）
          const mediaType = getMediaType(message.type || 'unknown');
          displayText = `[${
            mediaType === 'image' ? '图片' :
            mediaType === 'video' ? '视频' :
            mediaType === 'audio' ? '语音' :
            mediaType === 'document' ? '文件' : '媒体'
          }]`;
          
          logger.info({ displayText, originalBodyLength: body?.length }, '📝 群组媒体消息描述已生成');
          
          logger.info({ fileName, size: mediaBuffer.length }, '✅ 群组媒体文件已保存');
          
          // 生成缩略图（如果是图片）
          if (mediaData.mediaType === 'image') {
            try {
              const sharp = require('sharp');
              const thumbFileName = `thumb-${fileName}`;
              const thumbPath = path.join(process.cwd(), 'uploads', 'thumbnails', thumbFileName);
              
              await fs.mkdir(path.join(process.cwd(), 'uploads', 'thumbnails'), { recursive: true });
              await sharp(filePath)
                .resize(400, 400, { fit: 'inside' })
                .jpeg({ quality: 90 })
                .toFile(thumbPath);
              
              mediaData.thumbnailUrl = `/media/thumbnails/${thumbFileName}`;
            } catch (thumbError) {
              logger.warn({ error: thumbError }, '⚠️ 群组消息缩略图生成失败');
            }
          }
        }
      } catch (error) {
        logger.error({ error, messageId: message.id?._serialized }, '❌ 下载群组媒体失败');
      }
    }
    
    // 保存群组消息到数据库
    const messageIdStr = message.id?._serialized || `msg_${Date.now()}`;
    const senderPhone = senderId.replace('@c.us', '').replace('@s.whatsapp.net', '');
    const senderName = (message as any).notifyName || (message as any).pushname || senderPhone;
    
    const savedMessage = await prisma.groupMessage.create({
      data: {
        groupId: group.id,
        messageId: messageIdStr,
        fromPhone: senderPhone,
        fromName: senderName,
        text: displayText,
        mediaType: mediaData.mediaType || 'chat',
        mediaUrl: mediaData.mediaUrl || null,
        mediaMimeType: mediaData.mediaMimeType || null,
        mediaFileName: mediaData.mediaFileName || null,
        originalFileName: mediaData.originalFileName || null,
        thumbnailUrl: mediaData.thumbnailUrl || null,
      },
    });
    
    logger.info({ 
      messageId: savedMessage.id, 
      groupId: group.id,
      hasMedia: !!mediaData.mediaUrl 
    }, '✅ 群组消息已保存到数据库');
    
    // 🔥 广播群组消息到前端（实时更新）
    webSocketService.broadcast({
      type: 'group_message',
      data: {
        groupId: group.id,           // ✅ 数据库 ID
        groupName: group.name,
        messageId: messageIdStr,
        from: senderPhone,
        fromName: senderName,
        body: displayText,           // 使用处理后的文本
        text: displayText,
        mediaType: mediaData.mediaType || 'chat',
        mediaUrl: mediaData.mediaUrl || null,
        mediaMimeType: mediaData.mediaMimeType || null,
        mediaFileName: mediaData.mediaFileName || null,
        originalFileName: mediaData.originalFileName || null,
        thumbnailUrl: mediaData.thumbnailUrl || null,
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
    });
    
    logger.info({ 
      messageId: savedMessage.id, 
      groupId: group.id 
    }, '📨 群组消息已广播到前端');
    
  } catch (error) {
    logger.error({ error, from: message.from }, '❌ 处理群组消息失败');
  }
}

export async function handleIncomingMessage(accountId: string, whatsappService: WPPConnectService, message: WhatsAppMessage): Promise<void> {
  // 🔍 检查是否为群组消息
  const isGroupMessage = message.isGroupMsg || message.from?.endsWith('@g.us') || false;
  
  logger.info({ 
    messageId: message.id?._serialized, 
    from: message.from,
    isGroupMessage,
    type: message.type 
  }, isGroupMessage ? '📨 接收到群组消息' : '📨 接收到个人消息');
  
  // 🔥 如果是群组消息，使用专门的群组消息处理逻辑
  if (isGroupMessage) {
    return handleIncomingGroupMessage(accountId, whatsappService, message);
  }
  
  // 以下是个人消息的处理逻辑
  const phoneE164 = chatIdToE164(message.from);
  const body = message.body ?? '';
  const now = new Date();

  const meta = message as unknown as { notifyName?: string; pushname?: string };
  const displayName = meta.notifyName ?? meta.pushname ?? null;

  let contact = await getContactByPhone(accountId, phoneE164);
  if (!contact) {
    contact = await prisma.contact.create({
      data: {
        accountId,
        phoneE164,
        name: displayName,
      },
    });
  }

  const thread = await getOrCreateThread(accountId, contact.id);

  // 🖼️ 处理媒体消息
  let mediaData: any = {};
  
  // ✅ 修复：正确检测媒体消息（不仅检查 hasMedia，还要检查 type）
  const mediaTypes = ['image', 'video', 'audio', 'ptt', 'document', 'sticker'];
  const hasMedia = message.hasMedia || mediaTypes.includes(message.type || '');
  
  logger.info({
    messageId: message.id?._serialized,
    type: message.type,
    hasMediaField: message.hasMedia,
    calculatedHasMedia: hasMedia,
  }, '📊 个人消息媒体检测');
  
  if (hasMedia) {
    try {
      logger.info({ messageId: message.id?._serialized, type: message.type }, '📥 开始下载接收到的媒体消息');
      
      // 使用 WPPConnect 下载媒体
      const mediaBuffer = await whatsappService.downloadMedia(message);
      
      if (mediaBuffer) {
        // 保存媒体文件到本地
        const fs = require('fs/promises');
        const path = require('path');
        const crypto = require('crypto');
        
        const timestamp = Date.now();
        const randomHash = crypto.randomBytes(16).toString('hex');
        const ext = getFileExtension(message.type || 'unknown');
        const fileName = `${timestamp}-${randomHash}.${ext}`;
        const filePath = path.join(process.cwd(), 'uploads', fileName);
        
        await fs.writeFile(filePath, mediaBuffer);
        
        // 设置媒体数据
        mediaData = {
          mediaUrl: `/media/files/${fileName}`,
          mediaType: getMediaType(message.type || 'unknown'),
          mediaMimeType: message.mimetype || 'application/octet-stream',
          mediaSize: mediaBuffer.length,
          mediaFileName: fileName,
          originalFileName: message.filename || fileName,
        };
        
        logger.info({ 
          fileName, 
          size: mediaBuffer.length,
          type: message.type 
        }, '✅ 接收到的媒体文件已保存');
        
        // 如果是图片，生成缩略图
        if (mediaData.mediaType === 'image') {
          try {
            const sharp = require('sharp');
            const thumbFileName = `thumb-${fileName}`;
            const thumbPath = path.join(process.cwd(), 'uploads', 'thumbnails', thumbFileName);
            
            await fs.mkdir(path.join(process.cwd(), 'uploads', 'thumbnails'), { recursive: true });
            await sharp(filePath)
              .resize(400, 400, { fit: 'inside' })
              .jpeg({ quality: 90 })
              .toFile(thumbPath);
            
            mediaData.thumbnailUrl = `/media/thumbnails/${thumbFileName}`;
            logger.info({ thumbFileName }, '✅ 缩略图生成成功');
          } catch (thumbError) {
            logger.warn({ error: thumbError }, '⚠️ 缩略图生成失败，继续处理');
          }
        }
      }
    } catch (error) {
      logger.error({ error, messageId: message.id?._serialized }, '❌ 下载媒体失败');
    }
  }

  // 🖼️ 对于媒体消息，使用简短的描述而不是完整的 base64
  let displayText = body;
  
  // ✅ 正确检测媒体消息（复用上面检测过的 hasMedia 变量）
  const isMediaMessage = hasMedia;
  
  if (isMediaMessage && mediaData.mediaType) {
    const mediaTypeNames: Record<string, string> = {
      image: '[图片]',
      video: '[视频]',
      audio: '[语音]',
      document: '[文档]',
      sticker: '[贴纸]',
    };
    displayText = mediaTypeNames[mediaData.mediaType] || '[媒体文件]';
    
    // ❌ 不再添加 body，因为 body 通常是 base64 编码的数据，不适合显示
    // 媒体消息应该通过前端的 mediaUrl 来展示，而不是通过文本
    logger.info({ displayText, originalBodyLength: body?.length }, '📝 个人媒体消息描述已生成');
  }

  const savedMessage = await recordMessageIfMissing({
    accountId,
    threadId: thread.id,
    direction: MessageDirection.IN,
    text: displayText,
    externalId: message.id?._serialized ?? null,
    status: MessageStatus.SENT,
    ...mediaData, // 包含媒体数据
  });

  // 🔥 广播接收到的消息到前端（实时更新）
  if (savedMessage) {
    const chatId = message.from;
    webSocketService.broadcast({
      type: 'new_message',
      data: {
        id: savedMessage.externalId || savedMessage.id,
        from: chatId,
        to: whatsappService.getAccountId(), // 账号ID
        body: displayText, // 使用处理后的文本（媒体消息显示简短描述）
        fromMe: false, // 接收的消息
        type: message.type || 'chat',
        timestamp: Math.floor(savedMessage.createdAt.getTime() / 1000),
        threadId: thread.id,
        messageId: savedMessage.id,
        hasMedia: message.hasMedia || false,
        // 🎨 媒体字段 - 从数据库消息对象中获取
        mediaUrl: savedMessage.mediaUrl || null,
        mediaType: savedMessage.mediaType || null,
        mediaMimeType: savedMessage.mediaMimeType || null,
        mediaSize: savedMessage.mediaSize || null,
        mediaFileName: savedMessage.mediaFileName || null,
        originalFileName: savedMessage.originalFileName || null,
        thumbnailUrl: savedMessage.thumbnailUrl || null,
        duration: savedMessage.duration || null,
      },
      timestamp: Date.now(),
    });
    logger.info({ 
      messageId: savedMessage.id, 
      threadId: thread.id,
      hasMedia: !!savedMessage.mediaUrl,
      mediaType: savedMessage.mediaType 
    }, '📨 接收消息已广播到前端');
  }

  await updateThread(thread.id, { lastHumanAt: now });

  const refreshedThread = await getThreadById(thread.id);

  // ✅ 检查AI是否启用（尊重用户设置）
  if (!refreshedThread.aiEnabled) {
    logger.info({ threadId: thread.id }, '❌ AI自动回复已关闭，跳过回复');
    return; // AI已关闭，不发送自动回复
  }

  logger.info({ threadId: thread.id }, '✅ AI自动回复已启用，准备回复');

  // 冷却期功能已移除，允许立即发送自动回复

  const history = await listMessages(accountId, thread.id, 20);

  try {
    const turns = history
      .slice(-10)
      .map((item) => ({
        role: item.direction === MessageDirection.IN ? ('user' as const) : ('assistant' as const),
        content: item.text ?? '',
      }))
      .filter((turn) => turn.content.length > 0);

    const reply = await buildAiReply({
      latestMessage: body,
      contactName: contact.name,
      history: turns,
    });

    const forbidden = containsForbiddenKeyword(reply);
    if (forbidden) {
      logger.warn({ threadId: thread.id, keyword: forbidden }, 'AI reply blocked by forbidden keyword, using fallback');
      await sendAndRecordReply({
        accountId,
        whatsappService,
        contactId: contact.id,
        threadId: thread.id,
        phoneE164,
        text: FALLBACK_REPLY,
        now,
      });
      return;
    }

    await sendAndRecordReply({
      accountId,
      whatsappService,
      contactId: contact.id,
      threadId: thread.id,
      phoneE164,
      text: reply,
      now,
    });
  } catch (error) {
    logger.error({ err: error, accountId, contactId: contact.id }, 'Failed to build AI reply');
    await sendAndRecordReply({
      accountId,
      whatsappService,
      contactId: contact.id,
      threadId: thread.id,
      phoneE164,
      text: FALLBACK_REPLY,
      now,
    });
  }
}

export async function handleOutgoingMessage(accountId: string, message: WhatsAppMessage): Promise<void> {
  try {
    logger.info({ 
      accountId,
      messageId: message.id?._serialized,
      messageTo: message.to,
      messageBody: message.body,
      messageFromMe: message.fromMe
    }, 'Processing outgoing message');
    
    const phoneE164 = chatIdToE164(message.to);
    logger.info({ accountId, phoneE164 }, 'Converted chatId to phoneE164');
    
    const contact = await getContactByPhone(accountId, phoneE164);
    if (!contact) {
      logger.warn({ accountId, phoneE164 }, 'Contact not found for outgoing message, creating new contact');
      // 创建新联系人而不是直接返回
      const newContact = await prisma.contact.create({
        data: {
          accountId,
          phoneE164,
          name: null,
        },
      });
      logger.info({ accountId, contactId: newContact.id, phoneE164 }, 'Created new contact for outgoing message');
      
      const thread = await getOrCreateThread(accountId, newContact.id);
      
      await recordMessageIfMissing({
        accountId,
        threadId: thread.id,
        direction: MessageDirection.OUT,
        text: message.body ?? '',
        externalId: message.id?._serialized ?? null,
        status: MessageStatus.SENT,
      });
      
      // ℹ️ 不在这里广播 WebSocket，因为：
      // 1. 手动发送的消息已经在 POST /messages API 中广播了
      // 2. AI 回复的消息已经在 sendAndRecordReply 中广播了
      // handleOutgoingMessage 只是记录 WPPConnect 回调的消息，避免遗漏
      
      logger.info({ 
        accountId,
        threadId: thread.id, 
        messageId: message.id?._serialized,
        phoneE164 
      }, 'Recorded outgoing message for new contact');
      return;
    }

    logger.info({ accountId, contactId: contact.id, phoneE164 }, 'Found existing contact for outgoing message');
    
    const thread = await getOrCreateThread(accountId, contact.id);

    await recordMessageIfMissing({
      accountId,
      threadId: thread.id,
      direction: MessageDirection.OUT,
      text: message.body ?? '',
      externalId: message.id?._serialized ?? null,
      status: MessageStatus.SENT,
    });
    
    // ℹ️ 不在这里广播 WebSocket，因为：
    // 1. 手动发送的消息已经在 POST /messages API 中广播了
    // 2. AI 回复的消息已经在 sendAndRecordReply 中广播了
    // handleOutgoingMessage 只是记录 WPPConnect 回调的消息，避免遗漏
    
    logger.info({ 
      threadId: thread.id, 
      messageId: message.id?._serialized,
      phoneE164,
      contactId: contact.id
    }, 'Successfully recorded outgoing message');
    
  } catch (error) {
    logger.error({ 
      err: error, 
      messageId: message.id?._serialized,
      messageTo: message.to,
      messageBody: message.body
    }, 'Failed to record outgoing message');
  }
}

interface SendAndRecordArgs {
  accountId: string;
  whatsappService: WPPConnectService;
  contactId: string;
  threadId: string;
  phoneE164: string;
  text: string;
  now: Date;
}

async function sendAndRecordReply(args: SendAndRecordArgs): Promise<void> {
  try {
    ensureNoForbiddenKeyword(args.text);

    const result = await args.whatsappService.sendTextMessage(args.phoneE164, args.text);
    const [savedMessage] = await Promise.all([
      recordMessageIfMissing({
        accountId: args.accountId,
        threadId: args.threadId,
        direction: MessageDirection.OUT,
        text: args.text,
        externalId: result.id ?? null,
        status: MessageStatus.SENT,
      }),
      updateThread(args.threadId, { lastBotAt: args.now }),
    ]);
    
    // 🔥 广播 AI 自动回复消息到前端（实时更新）
    if (savedMessage) {
      const chatId = args.phoneE164.replace('+', '') + '@c.us';
      webSocketService.broadcast({
        type: 'new_message',
        data: {
          id: savedMessage.externalId || savedMessage.id,
          from: chatId, // 从用户角度看，这是发给用户的
          to: chatId,
          body: args.text,
          fromMe: true, // AI 回复，显示为我们发送的
          type: 'chat',
          timestamp: Math.floor(savedMessage.createdAt.getTime() / 1000),
          threadId: args.threadId,
          messageId: savedMessage.id,
          hasMedia: false,
          isAiReply: true, // 标记为 AI 回复
          // 🎨 媒体字段 - 从数据库消息对象中获取（AI 回复通常是文本，但为了完整性包含这些字段）
          mediaUrl: savedMessage.mediaUrl || null,
          mediaType: savedMessage.mediaType || null,
          mediaMimeType: savedMessage.mediaMimeType || null,
          mediaSize: savedMessage.mediaSize || null,
          mediaFileName: savedMessage.mediaFileName || null,
          originalFileName: savedMessage.originalFileName || null,
          thumbnailUrl: savedMessage.thumbnailUrl || null,
          duration: savedMessage.duration || null,
        },
        timestamp: Date.now(),
      });
      logger.info({ messageId: savedMessage.id, threadId: args.threadId }, '🤖 AI 回复已广播到前端');
    }
  } catch (error) {
    logger.error({ err: error, accountId: args.accountId, contactId: args.contactId }, 'Failed to send WhatsApp message');
    await Promise.all([
      recordMessage({
        accountId: args.accountId,
        threadId: args.threadId,
        direction: MessageDirection.OUT,
        text: args.text,
        status: MessageStatus.FAILED,
      }),
      updateThread(args.threadId, { lastBotAt: args.now }),
    ]);
  }
}

// 🖼️ 辅助函数：根据消息类型获取文件扩展名
function getFileExtension(messageType: string): string {
  const typeMap: Record<string, string> = {
    'image': 'jpg',
    'video': 'mp4',
    'audio': 'ogg',
    'ptt': 'ogg', // Push-to-talk audio
    'document': 'pdf',
    'sticker': 'webp',
  };
  return typeMap[messageType] || 'bin';
}

// 🖼️ 辅助函数：根据消息类型获取媒体类型
function getMediaType(messageType: string): string {
  const typeMap: Record<string, string> = {
    'image': 'image',
    'video': 'video',
    'audio': 'audio',
    'ptt': 'audio',
    'document': 'document',
    'sticker': 'sticker',
  };
  return typeMap[messageType] || 'document';
}