import { EventEmitter } from 'events';
import * as wppconnect from '@wppconnect-team/wppconnect';
import * as fs from 'fs/promises';
import * as path from 'path';
import { logger } from './logger';

export type WhatsAppStatus =
  | 'INITIALIZING'
  | 'QR'
  | 'AUTHENTICATING'
  | 'READY'
  | 'DISCONNECTED'
  | 'FAILED';

export type WhatsAppState = 'UNINITIALIZED' | 'NEED_QR' | 'CONNECTING' | 'ONLINE' | 'OFFLINE';

type MessageHandler = (message: any) => Promise<void> | void;
type OutgoingHandler = (message: any) => Promise<void> | void;

export interface SendMessageResult {
  id?: string;
}

export interface WhatsAppContact {
  id: string;
  name?: string;
  number: string;
  isGroup: boolean;
  isUser: boolean;
  isWAContact: boolean;
  profilePicUrl?: string;
}

export interface WhatsAppMessage {
  id: any;
  from: string;
  to: string;
  body?: string;
  fromMe: boolean;
  timestamp: number;
  hasMedia?: boolean;
  type: string;
  isGroupMsg?: boolean;
  chatId?: string;
  author?: string;
  quotedMsg?: any;
  _serialized?: string;
  // 🖼️ 媒体相关字段
  mimetype?: string;
  filename?: string;
}

/**
 * WPPConnectService - WhatsApp 服务适配器（使用 WPPConnect）
 */
export class WPPConnectService extends EventEmitter {
  private accountId: string;
  private sessionPath: string;
  private client: any = null;
  private status: WhatsAppStatus = 'DISCONNECTED';
  private state: WhatsAppState = 'UNINITIALIZED';
  private lastQr: string | null = null;
  private lastQrBase64: string | null = null;
  private phoneE164: string | null = null;
  private lastOnline: Date | null = null;
  private incomingHandler: MessageHandler | null = null;
  private outgoingHandler: OutgoingHandler | null = null;
  private isStarting: boolean = false;
  private isDestroying: boolean = false;
  private hasEverConnected: boolean = false; // 跟踪是否曾经连接过

  constructor(accountId: string, sessionPath: string) {
    super();
    this.accountId = accountId;
    this.sessionPath = sessionPath;
    this.status = 'DISCONNECTED';
    this.state = 'UNINITIALIZED';
    logger.info({ accountId, sessionPath }, '✨ WPPConnectService instance created');
  }

  // ==================== 基础方法 ====================

  public getAccountId(): string {
    return this.accountId;
  }

  public getClient(): any {
    return this.client;
  }

  public getStatus(): {
    status: WhatsAppStatus;
    state: WhatsAppState;
    phoneE164: string | null;
    lastOnline: Date | null;
    qr: string | null;
  } {
    return {
      status: this.status,
      state: this.state,
      phoneE164: this.phoneE164,
      lastOnline: this.lastOnline,
      qr: this.lastQrBase64,
    };
  }

  public getQrCodeBase64(): string | null {
    return this.lastQrBase64;
  }

  public getLatestQr(): string | null {
    return this.lastQr;
  }

  public onIncomingMessage(handler: MessageHandler): void {
    this.incomingHandler = handler;
  }

  public onOutgoingMessage(handler: OutgoingHandler): void {
    this.outgoingHandler = handler;
  }

  // ==================== 启动和登录 ====================

  public async start(): Promise<void> {
    if (!this.client) {
      await this.startLogin();
    }
  }

  public async startLogin(): Promise<void> {
    if (this.isStarting) {
      logger.warn({ accountId: this.accountId }, '⚠️ Login already in progress');
      return;
    }

    try {
      this.isStarting = true;
      logger.info({ accountId: this.accountId }, '=== Starting WPPConnect login process ===');
      
      this.status = 'INITIALIZING';
      this.state = 'CONNECTING';
      this.emit('status', { status: this.status, state: this.state });

      // 确保会话目录存在
      await fs.mkdir(this.sessionPath, { recursive: true });
      logger.info({ accountId: this.accountId, sessionPath: this.sessionPath }, '📁 Session directory created');

      // 创建 WPPConnect 客户端
      logger.info({ accountId: this.accountId }, '🚀 Calling wppconnect.create...');
      
      this.client = await wppconnect.create({
        session: this.accountId,
        headless: true,
        devtools: false,
        useChrome: true,
        debug: false,
        logQR: false,
        disableWelcome: true,
        updatesLog: false,
        autoClose: 60000,
        tokenStore: 'file',
        folderNameToken: this.sessionPath,
        // QR 码回调
        catchQR: (base64Qr: string, asciiQR: string, attempts: number, urlCode?: string) => {
          logger.info({ accountId: this.accountId, attempts, qrReceived: true }, '🎯 QR callback invoked');
          this.handleQRCode(base64Qr, asciiQR);
        },
        // 状态回调
        statusFind: (statusSession: string, session: string) => {
          logger.info({ accountId: this.accountId, statusSession, session }, 'WPPConnect status update');
          
          if (statusSession === 'qrReadSuccess') {
            this.status = 'AUTHENTICATING';
            this.state = 'CONNECTING';
            logger.info({ accountId: this.accountId }, '📱 QR Code scanned successfully');
            this.emit('authenticated');
          } else if (statusSession === 'isLogged') {
            this.handleReady();
          } else if (statusSession === 'notLogged') {
            this.status = 'QR';
            this.state = 'NEED_QR';
            logger.info({ accountId: this.accountId }, '📱 Waiting for QR code scan');
          } else if (statusSession === 'browserClose') {
            logger.warn({ accountId: this.accountId }, '⚠️ Browser closed');
            this.handleDisconnect();
          } else if (statusSession === 'desconnectedMobile') {
            // 只在已经连接后才处理断开连接
            // 初始状态下的 desconnectedMobile 是正常的（还没连接手机）
            if (this.hasEverConnected) {
              logger.warn({ accountId: this.accountId }, '⚠️ Mobile disconnected after connection');
              this.handleDisconnect();
            } else {
              logger.info({ accountId: this.accountId }, 'ℹ️ Initial desconnectedMobile status (normal, waiting for connection)');
            }
          }
        },
      });

      logger.info({ accountId: this.accountId, hasClient: !!this.client }, '✅ wppconnect.create completed');

      // 注册事件监听器
      this.registerEventListeners();

      // 获取电话号码
      if (this.client) {
        try {
          const hostDevice = await this.client.getHostDevice();
          if (hostDevice?.id?.user) {
            this.phoneE164 = `+${hostDevice.id.user}`;
          }
        } catch (error) {
          logger.warn({ accountId: this.accountId, error }, 'Failed to get phone number');
        }
      }

      logger.info({ accountId: this.accountId }, '✅ WPPConnect client initialization completed');
      
    } catch (error) {
      logger.error({ accountId: this.accountId, error }, '❌ Failed to start WPPConnect login');
      this.status = 'FAILED';
      this.state = 'OFFLINE';
      this.emit('status', { status: this.status, state: this.state });
      throw error;
    } finally {
      this.isStarting = false;
    }
  }

  private registerEventListeners(): void {
    if (!this.client) return;

    logger.info({ accountId: this.accountId }, 'Registering WPPConnect event listeners');

    // 监听消息
    this.client.onMessage((message: any) => {
      this.handleIncomingMessage(message);
    });

    // 监听状态变化
    this.client.onStateChange((state: string) => {
      logger.info({ accountId: this.accountId, state }, 'WPPConnect state changed');
      
      if (state === 'CONNECTED') {
        this.handleReady();
      } else if (state === 'DISCONNECTED') {
        this.handleDisconnect();
      }
    });

    logger.info({ accountId: this.accountId }, '✅ Event listeners registered');
  }

  private async handleQRCode(base64Qr: string, asciiQR?: string): Promise<void> {
    try {
      logger.info({ 
        accountId: this.accountId, 
        hasBase64: !!base64Qr,
        hasAscii: !!asciiQR,
        base64Length: base64Qr?.length || 0
      }, '📱 QR code callback triggered');
      
      this.lastQr = asciiQR || base64Qr;
      this.lastQrBase64 = base64Qr;
      this.status = 'QR';
      this.state = 'NEED_QR';
      
      logger.info({ accountId: this.accountId }, '✅ QR code processed, emitting events');
      this.emit('qr', base64Qr);
      this.emit('status', { status: this.status, state: this.state });
      
      logger.info({ accountId: this.accountId }, '✅ QR events emitted successfully');
    } catch (error) {
      logger.error({ accountId: this.accountId, error }, 'Failed to handle QR code');
    }
  }

  private async handleReady(): Promise<void> {
    try {
      this.status = 'READY';
      this.state = 'ONLINE';
      this.lastQr = null;
      this.lastQrBase64 = null;
      this.lastOnline = new Date();
      this.hasEverConnected = true; // 标记已经连接过
      
      logger.info({ accountId: this.accountId, phoneE164: this.phoneE164 }, '✅ WPPConnect client ready');
      this.emit('ready');
      this.emit('status', { status: this.status, state: this.state });
    } catch (error) {
      logger.error({ accountId: this.accountId, error }, 'Error in handleReady');
    }
  }

  private handleDisconnect(): void {
    this.status = 'DISCONNECTED';
    this.state = 'OFFLINE';
    logger.warn({ accountId: this.accountId }, '⚠️ WPPConnect client disconnected');
    this.emit('disconnected');
    this.emit('status', { status: this.status, state: this.state });
  }

  private handleIncomingMessage(message: any): void {
    if (!this.incomingHandler) return;

    try {
      // 🖼️ 检测是否为媒体消息
      // WPPConnect 通过 type 字段来标识媒体类型
      const mediaTypes = ['image', 'video', 'audio', 'ptt', 'document', 'sticker'];
      const hasMedia = message.hasMedia || mediaTypes.includes(message.type);
      
      logger.info({ 
        accountId: this.accountId,
        messageType: message.type,
        hasMediaField: message.hasMedia,
        calculatedHasMedia: hasMedia,
        mimetype: message.mimetype,
        isMedia: message.isMedia 
      }, '📥 收到消息');
      
      const standardMessage = {
        id: message.id,
        from: message.from,
        to: message.to,
        body: message.body,
        fromMe: message.fromMe,
        timestamp: message.timestamp || Math.floor(Date.now() / 1000),
        hasMedia: hasMedia, // 使用计算后的值
        type: message.type,
        isGroupMsg: message.isGroupMsg || false,
        chatId: message.chatId,
        author: message.author,
        quotedMsg: message.quotedMsg,
        // 🖼️ 添加媒体相关字段
        mimetype: message.mimetype,
        filename: message.filename,
      };
      
      this.incomingHandler(standardMessage);
    } catch (error) {
      logger.error({ accountId: this.accountId, error }, 'Error handling incoming message');
    }
  }

  // ==================== 消息发送 ====================

  public async sendTextMessage(phoneE164: string, content: string): Promise<SendMessageResult> {
    if (this.status !== 'READY' || !this.client) {
      throw new Error('WPPConnect client not ready');
    }

    // 验证电话号码不为空
    if (!phoneE164 || phoneE164.trim() === '') {
      logger.error({ accountId: this.accountId, phoneE164 }, 'Invalid phone number: empty or null');
      throw new Error('Invalid phone number: phoneE164 is empty or null');
    }

    try {
      const chatId = this.formatChatId(phoneE164);
      logger.info({ accountId: this.accountId, chatId, phoneE164, content: content.substring(0, 50) }, 'Sending text message via WPPConnect');

      const result = await this.client.sendText(chatId, content);
      
      // 触发 outgoing handler
      if (this.outgoingHandler) {
        this.outgoingHandler({
          id: result.id,
          from: result.from,
          to: chatId,
          body: content,
          fromMe: true,
          timestamp: Math.floor(Date.now() / 1000),
          type: 'chat',
        });
      }

      return { id: result.id };
    } catch (error) {
      logger.error({ accountId: this.accountId, error }, 'Failed to send text message');
      throw error;
    }
  }

  public async sendMediaMessage(
    phoneE164: string,
    filePath: string,
    caption?: string
  ): Promise<SendMessageResult> {
    if (this.status !== 'READY' || !this.client) {
      throw new Error('WPPConnect client not ready');
    }

    try {
      const chatId = this.formatChatId(phoneE164);
      const fileName = path.basename(filePath);
      
      logger.info({ accountId: this.accountId, chatId, filePath, fileName }, 'Sending media via WPPConnect');

      const result = await this.client.sendFile(chatId, filePath, fileName, caption || '');
      
      return { id: result.id };
    } catch (error) {
      logger.error({ accountId: this.accountId, error }, 'Failed to send media');
      throw error;
    }
  }

  /**
   * 📥 下载接收到的媒体消息
   */
  public async downloadMedia(message: any): Promise<Buffer | null> {
    if (!this.client || this.status !== 'READY') {
      throw new Error('WPPConnect client not ready');
    }

    try {
      logger.info({ 
        accountId: this.accountId, 
        messageId: message.id?._serialized,
        hasMedia: message.hasMedia,
        messageType: message.type 
      }, '📥 开始下载媒体');

      // WPPConnect 下载媒体的正确方法是 downloadMedia
      const mediaData = await this.client.downloadMedia(message);
      
      if (!mediaData) {
        logger.warn({ accountId: this.accountId, messageId: message.id?._serialized }, '⚠️ 媒体数据为空');
        return null;
      }

      logger.info({ 
        accountId: this.accountId,
        mediaDataType: typeof mediaData,
        isBuffer: Buffer.isBuffer(mediaData),
        hasDataField: mediaData?.data ? true : false
      }, '📊 媒体数据类型');

      // 将 base64 或 buffer 转换为 Buffer
      let buffer: Buffer;
      if (typeof mediaData === 'string') {
        // 如果是 base64 字符串
        const base64Data = mediaData.replace(/^data:.*;base64,/, '');
        buffer = Buffer.from(base64Data, 'base64');
      } else if (Buffer.isBuffer(mediaData)) {
        buffer = mediaData;
      } else if (mediaData.data) {
        // 如果是包含 data 字段的对象
        buffer = Buffer.from(mediaData.data, 'base64');
      } else {
        logger.warn({ accountId: this.accountId, messageId: message.id?._serialized, mediaData: JSON.stringify(mediaData).substring(0, 200) }, '⚠️ 未知的媒体数据格式');
        return null;
      }

      logger.info({ 
        accountId: this.accountId, 
        messageId: message.id?._serialized,
        bufferSize: buffer.length 
      }, '✅ 媒体下载成功');

      return buffer;
    } catch (error) {
      logger.error({ 
        accountId: this.accountId, 
        messageId: message.id?._serialized,
        error,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined
      }, '❌ 下载媒体失败');
      return null;
    }
  }

  // ==================== 联系人和群组 ====================

  public async getWhatsAppContacts(): Promise<WhatsAppContact[]> {
    if (!this.client || this.status !== 'READY') {
      throw new Error('WPPConnect client not ready');
    }

    try {
      logger.info({ accountId: this.accountId }, 'Fetching WhatsApp contacts from WPPConnect');
      
      const contacts = await this.client.getAllContacts();
      
      return contacts
        .filter((contact: any) => {
          // ✅ 只同步真正的 WhatsApp 联系人
          // 排除：群组、没有 user ID、非 WhatsApp 联系人
          return !contact.isGroup && 
                 contact.id?.user && 
                 contact.isWAContact === true;  // 🔥 关键：只要 isWAContact 为 true 的
        })
        .map((contact: any) => ({
          id: contact.id._serialized || contact.id,
          name: contact.name || contact.pushname,
          number: `+${contact.id.user}`,
          isGroup: false,
          isUser: true,
          isWAContact: true,
          profilePicUrl: contact.profilePicThumbObj?.eurl,
        }));
    } catch (error) {
      logger.error({ accountId: this.accountId, error }, 'Failed to get WhatsApp contacts');
      throw error;
    }
  }

  public async syncContactsToDatabase(): Promise<{
    added: number;
    updated: number;
    total: number;
  }> {
    try {
      logger.info({ accountId: this.accountId }, 'Starting contact sync to database');
      
      const contacts = await this.getWhatsAppContacts();
      const { prisma } = await import('./prisma');
      
      let added = 0;
      let updated = 0;

      for (const contact of contacts) {
        try {
          const existing = await prisma.contact.findFirst({
            where: {
              accountId: this.accountId,
              phoneE164: contact.number,
            },
          });

          if (existing) {
            await prisma.contact.update({
              where: { id: existing.id },
              data: {
                name: contact.name || existing.name,
                avatarUrl: contact.profilePicUrl || existing.avatarUrl,
                source: 'whatsapp_sync' as any,
              },
            });
            updated++;
          } else {
            await prisma.contact.create({
              data: {
                accountId: this.accountId,
                phoneE164: contact.number,
                name: contact.name || null,
                avatarUrl: contact.profilePicUrl || null,
                consent: true,
                source: 'whatsapp_sync' as any,
                tags: ['wppconnect_sync'] as any,
              },
            });
            added++;
          }
        } catch (contactError) {
          logger.warn({ accountId: this.accountId, contact: contact.number, error: contactError }, 'Failed to sync individual contact');
        }
      }

      const result = { added, updated, total: contacts.length };
      logger.info({ accountId: this.accountId, result }, '✅ Contact sync completed');
      return result;
      
    } catch (error) {
      logger.error({ accountId: this.accountId, error }, 'Failed to sync contacts to database');
      throw error;
    }
  }

  /**
   * 📥 获取群组成员列表
   */
  public async getGroupParticipants(groupChatId: string): Promise<Array<{
    phoneE164: string;
    name?: string;
    isAdmin: boolean;
    profilePicUrl?: string;
  }>> {
    if (!this.client || this.status !== 'READY') {
      throw new Error('WPPConnect client not ready');
    }

    try {
      logger.info({ accountId: this.accountId, groupChatId }, '📥 获取群组成员列表');

      // 使用 WPPConnect 的 getGroupMembers 方法
      const members = await this.client.getGroupMembers(groupChatId);
      
      if (!members || members.length === 0) {
        logger.warn({ accountId: this.accountId, groupChatId }, '⚠️ 群组没有成员或无法访问');
        return [];
      }

      // 转换为标准格式，并获取头像
      const participants = await Promise.all(members.map(async (member: any) => {
        // 🔍 提取真正的电话号码（不是群组ID）
        // member.id 的格式通常是: { user: '8613989899718', server: 'c.us', _serialized: '8613989899718@c.us' }
        let phoneNumber = '';
        
        if (member.id?.user) {
          // 优先使用 user 字段（这是纯数字部分）
          phoneNumber = member.id.user;
        } else if (member.id?._serialized) {
          // 从 _serialized 中提取（格式: '8613989899718@c.us'）
          phoneNumber = member.id._serialized.split('@')[0];
        } else if (typeof member.id === 'string') {
          // 如果 id 直接是字符串
          phoneNumber = member.id.split('@')[0];
        }
        
        // 清理号码（移除非数字字符）
        phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
        
        // 格式化为 E.164 格式（添加 + 前缀）
        const phoneE164 = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
        
        // 记录调试信息
        logger.debug({
          rawId: member.id,
          extractedPhone: phoneNumber,
          phoneE164,
          name: member.name || member.pushname,
        }, '📞 提取群组成员电话号码');
        
        // 尝试获取头像
        let profilePicUrl: string | undefined = undefined;
        try {
          const memberId = member.id?._serialized || `${phoneNumber}@c.us`;
          // WPPConnect API: getProfilePicFromServer
          const picData = await (this.client as any).getProfilePicFromServer(memberId);
          if (picData && picData.imgFull) {
            profilePicUrl = picData.imgFull;
          }
        } catch (err) {
          // 获取头像失败不影响整体流程
          logger.debug({ memberId: member.id?._serialized, error: err }, '⚠️ 获取头像失败');
        }
        
        return {
          phoneE164,
          name: member.name || member.pushname || null,
          isAdmin: member.isAdmin || member.isSuperAdmin || false,
          profilePicUrl,
        };
      }));

      logger.info({ 
        accountId: this.accountId, 
        groupChatId, 
        participantCount: participants.length 
      }, '✅ 获取群组成员成功');

      return participants;
    } catch (error) {
      logger.error({ accountId: this.accountId, groupChatId, error }, '❌ 获取群组成员失败');
      throw error;
    }
  }

  // ==================== 工具方法 ====================

  private formatChatId(phoneE164: string): string {
    // 如果已经包含 @g.us（群组）或 @c.us（联系人），直接返回
    if (phoneE164.includes('@g.us') || phoneE164.includes('@c.us')) {
      return phoneE164;
    }
    
    // 否则，格式化为联系人格式
    const digits = phoneE164.replace(/[^0-9]/g, '');
    return `${digits}@c.us`;
  }

  // ==================== 生命周期管理 ====================

  public logout(): void {
    try {
      logger.info({ accountId: this.accountId }, 'Starting WPPConnect logout');
      
      if (this.client) {
        this.client.close();
      }
      
      this.status = 'DISCONNECTED';
      this.state = 'OFFLINE';
      
      logger.info({ accountId: this.accountId }, '✅ Logout completed');
    } catch (error) {
      logger.error({ accountId: this.accountId, error }, 'Logout failed');
    }
  }

  public async destroy(): Promise<void> {
    if (this.isDestroying) {
      logger.warn({ accountId: this.accountId }, 'Already destroying');
      return;
    }

    try {
      this.isDestroying = true;
      logger.info({ accountId: this.accountId }, 'Starting WPPConnect service destruction');

      if (this.client) {
        await this.client.close();
        this.client = null;
      }

      this.status = 'DISCONNECTED';
      this.state = 'OFFLINE';
      this.removeAllListeners();

      logger.info({ accountId: this.accountId }, '✅ WPPConnect service destroyed');
    } catch (error) {
      logger.error({ accountId: this.accountId, error }, 'Failed to destroy service');
    } finally {
      this.isDestroying = false;
    }
  }

  // ==================== WebSocket 事件触发 ====================

  emitMessageEdited(messageId: string, threadId: string, text: string): void {
    this.emit('messageEdited', { messageId, threadId, text });
  }

  emitMessageDeleted(messageId: string, threadId: string, deletedBy: string): void {
    this.emit('messageDeleted', { messageId, threadId, deletedBy });
  }

  emitMessageStarred(messageId: string, threadId: string, starred: boolean): void {
    this.emit('messageStarred', { messageId, threadId, starred });
  }

  emitThreadPinned(threadId: string, pinned: boolean): void {
    this.emit('threadPinned', { threadId, pinned });
  }

  emitThreadArchived(threadId: string, archived: boolean): void {
    this.emit('threadArchived', { threadId, archived });
  }
}

