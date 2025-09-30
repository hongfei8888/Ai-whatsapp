import { EventEmitter } from 'events';
import { Client, LocalAuth, Message } from '../../index.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import QRCode from 'qrcode';
import { appConfig } from './config';
import { logger } from './logger';

export type WhatsAppStatus =
  | 'INITIALIZING'
  | 'QR'
  | 'AUTHENTICATING'
  | 'READY'
  | 'DISCONNECTED'
  | 'FAILED';

// 新增状态机枚举
export type WhatsAppState = 'UNINITIALIZED' | 'NEED_QR' | 'CONNECTING' | 'ONLINE' | 'OFFLINE';

type MessageHandler = (message: Message) => Promise<void> | void;

type OutgoingHandler = (message: Message) => Promise<void> | void;

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 500;
const SESSION_PATH = './.session';

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

export class WhatsAppService extends EventEmitter {
  private client: Client | null = null;
  private status: WhatsAppStatus = 'INITIALIZING';
  private state: WhatsAppState = 'UNINITIALIZED';
  private lastQr: string | null = null;
  private lastQrBase64: string | null = null;
  private phoneE164: string | null = null;
  private lastOnline: Date | null = null;
  private incomingHandler: MessageHandler | null = null;
  private outgoingHandler: OutgoingHandler | null = null;

  constructor() {
    super();
    // 客户端将在 startLogin 方法中创建
  }

  private registerEventHandlers(): void {
    if (!this.client) return;
    
    this.client.on('qr', async (qr: string) => {
      this.status = 'QR';
      this.state = 'NEED_QR';
      this.lastQr = qr;
      
      // 生成base64二维码
      try {
        this.lastQrBase64 = await QRCode.toDataURL(qr);
      } catch (err) {
        logger.error({ err }, 'Failed to generate QR code');
        this.lastQrBase64 = null;
      }
      
      logger.info('WhatsApp QR code updated');
      this.emit('qr', qr);
    });

    this.client.on('loading_screen', (percent: number, message: string) => {
      logger.debug({ percent, message }, 'WhatsApp loading');
    });

    this.client.on('authenticated', () => {
      this.status = 'AUTHENTICATING';
      this.state = 'CONNECTING';
      this.lastQr = null;
      this.lastQrBase64 = null;
      logger.info('WhatsApp authenticated');
    });

    this.client.on('auth_failure', (err: any) => {
      this.status = 'FAILED';
      this.state = 'OFFLINE';
      logger.error({ err }, 'WhatsApp authentication failed');
    });

    this.client.on('ready', async () => {
      this.status = 'READY';
      this.state = 'ONLINE';
      this.lastQr = null;
      this.lastQrBase64 = null;
      this.lastOnline = new Date();
      
      // 获取当前手机号
      try {
        const info = this.client!.info;
        if (info && info.wid && info.wid.user) {
          this.phoneE164 = `+${info.wid.user}`;
        }
      } catch (err) {
        logger.error({ err }, 'Failed to get phone number');
      }
      logger.info('WhatsApp client ready');
      this.emit('ready');
    });

    this.client.on('disconnected', (reason: any) => {
      this.status = 'DISCONNECTED';
      this.state = 'OFFLINE';
      this.lastQr = null;
      this.lastQrBase64 = null;
      logger.warn({ reason }, 'WhatsApp disconnected');
      this.emit('disconnected', reason);
    });

    // 添加更多事件监听器来调试
    this.client.on('message_create', async (message: Message) => {
      logger.info({
        messageId: message.id._serialized,
        messageTo: message.to,
        messageFrom: message.from,
        messageBody: message.body,
        messageFromMe: message.fromMe,
        eventType: 'message_create'
      }, 'WhatsApp message_create event received');
    });

    this.client.on('message_ack', async (message: Message, ack: any) => {
      logger.info({
        messageId: message.id._serialized,
        messageTo: message.to,
        ack: ack,
        eventType: 'message_ack'
      }, 'WhatsApp message_ack event received');
    });

    this.client.on('message', async (message: Message) => {
      try {
        logger.info({
          messageId: message.id._serialized,
          messageTo: message.to,
          messageFrom: message.from,
          messageBody: message.body,
          messageFromMe: message.fromMe,
          messageType: message.type,
          messageTimestamp: message.timestamp,
          hasOutgoingHandler: !!this.outgoingHandler,
          hasIncomingHandler: !!this.incomingHandler,
          eventType: 'message'
        }, 'WhatsApp message event received');
        
        if (message.fromMe) {
          logger.info({ messageId: message.id._serialized }, 'Processing outgoing message');
          if (this.outgoingHandler) {
            await this.outgoingHandler(message);
            logger.info({ messageId: message.id._serialized }, 'Outgoing message handler completed');
          } else {
            logger.warn({ messageId: message.id._serialized }, 'No outgoing handler registered');
          }
          return;
        }
        
        logger.info({ messageId: message.id._serialized }, 'Processing incoming message');
        if (this.incomingHandler) {
          await this.incomingHandler(message);
          logger.info({ messageId: message.id._serialized }, 'Incoming message handler completed');
        } else {
          logger.warn({ messageId: message.id._serialized }, 'No incoming handler registered');
        }
      } catch (err) {
        logger.error({ 
          err, 
          messageId: message.id._serialized,
          messageTo: message.to,
          messageFrom: message.from,
          messageFromMe: message.fromMe
        }, 'Failed to process message');
      }
    });
  }

  // 新增：启动登录流程
  public async startLogin(): Promise<void> {
    try {
      logger.info('Starting WhatsApp login process...');
      
      // 检查是否已经在处理中
      if (this.status === 'QR') {
        logger.info('WhatsApp client is already showing QR, returning current status');
        return;
      }
      
      if (this.status === 'INITIALIZING') {
        logger.info('WhatsApp client is already initializing, waiting for completion...');
        // 等待初始化完成，最多等待30秒
        let attempts = 0;
        const maxAttempts = 30; // 30秒
        while (this.status === 'INITIALIZING' && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          attempts++;
        }
        
        if (this.status === 'INITIALIZING') {
          logger.warn('WhatsApp client initialization timed out, forcing restart');
          // 超时后强制重启
          if (this.client) {
            await this.destroyClient();
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        } else {
          logger.info(`WhatsApp client initialization completed with status: ${this.status}`);
          return;
        }
      }
      
      // 如果已经有客户端，先销毁
      if (this.client) {
        logger.info('Destroying existing client before creating new one');
        await this.destroyClient();
        // 等待一段时间确保完全清理
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      logger.info('Creating new WhatsApp client with Puppeteer');
      
      // 创建新的客户端实例
      this.client = new Client({
        puppeteer: {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding'
          ],
          timeout: 60000,
          protocolTimeout: 60000,
        },
        authStrategy: new LocalAuth({ 
          dataPath: SESSION_PATH,
          clientId: 'whatsapp-automation'
        }),
        webVersionCache: {
          type: 'remote',
          remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
        },
        restartOnAuthFail: true,
        takeoverOnConflict: true,
        takeoverTimeoutMs: 0,
      });

      // 设置初始状态
      this.status = 'INITIALIZING';
      this.state = 'NEED_QR';
      this.lastQr = null;
      this.lastQrBase64 = null;

      // 注册事件处理器
      this.registerEventHandlers();

      logger.info('Starting WhatsApp client initialization...');
      
      // 开始初始化并等待完成
      try {
        await this.client.initialize();
        logger.info('WhatsApp client initialization completed successfully');
      } catch (err) {
        logger.error({ 
          err: err instanceof Error ? {
            name: err.name,
            message: err.message,
            stack: err.stack
          } : err
        }, 'WhatsApp client initialization failed');
        this.status = 'FAILED';
        this.state = 'OFFLINE';
        throw err;
      }
    } catch (err) {
      logger.error({ err }, 'Failed to start WhatsApp login process');
      this.status = 'FAILED';
      this.state = 'OFFLINE';
      throw err;
    }
  }

  // 旧的start方法保持兼容性
  public async start(): Promise<void> {
    if (!this.client) {
      await this.startLogin();
      return;
    }
    
    if (this.status === 'READY') {
      return;
    }

    try {
      this.status = 'INITIALIZING';
      await this.client.initialize();
    } catch (err) {
      logger.error({ err }, 'Failed to initialize WhatsApp client');
      this.status = 'FAILED';
      throw err;
    }
  }

  private async restart(): Promise<void> {
    try {
      this.status = 'INITIALIZING';
      const client = this.client;
      if (!client) {
        logger.warn('Cannot restart WhatsApp client because client is not initialized');
        this.status = 'FAILED';
        return;
      }
      await client.initialize();
    } catch (err) {
      logger.error({ err }, 'Failed to restart WhatsApp client');
      this.status = 'FAILED';
    }
  }

  // 销毁客户端
  private async destroyClient(): Promise<void> {
    if (!this.client) {
      logger.info('No client to destroy');
      return;
    }

    const clientToDestroy = this.client;
    this.client = null; // 立即清空引用，避免重复调用

    try {
      // 尝试销毁客户端，设置超时
      const destroyPromise = clientToDestroy.destroy();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Destroy timeout')), 5000)
      );
      
      await Promise.race([destroyPromise, timeoutPromise]);
      logger.info('WhatsApp client destroyed successfully');
    } catch (destroyErr) {
      logger.warn({ destroyErr }, 'WhatsApp client destroy failed or timed out, continuing with cleanup');
    }
    
    // 清理所有状态
    this.status = 'DISCONNECTED';
    this.state = 'UNINITIALIZED';
    this.lastQr = null;
    this.lastQrBase64 = null;
    logger.info('WhatsApp client state cleaned up');
  }

  // 获取状态（扩展版本）
  public getStatus(): { 
    status: WhatsAppStatus; 
    state: WhatsAppState;
    qr: string | null;
    phoneE164: string | null;
    sessionReady: boolean;
    lastOnline: Date | null;
  } {
    return { 
      status: this.status, 
      state: this.state,
      qr: this.lastQr,
      phoneE164: this.phoneE164,
      sessionReady: this.status === 'READY',
      lastOnline: this.lastOnline
    };
  }

  // 获取二维码（base64格式）
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

  public async sendTextMessage(phoneE164: string, content: string): Promise<SendMessageResult> {
    if (this.status !== 'READY') {
      throw new Error('WhatsApp client not ready');
    }

    const chatId = this.toChatId(phoneE164);
    logger.info({ 
      chatId, 
      phoneE164, 
      content,
      clientStatus: this.status,
      clientReady: !!this.client
    }, 'Sending WhatsApp message');

    const client = this.client;
    if (!client) {
      throw new Error('WhatsApp client not available');
    }

    const send = async () => {
      logger.info({ chatId, content }, 'Calling client.sendMessage');
      const response = await client.sendMessage(chatId, content);
      logger.info({ 
        chatId, 
        content,
        responseId: response.id,
        responseIdSerialized: response.id ? response.id._serialized : undefined
      }, 'Client.sendMessage completed');
      
      // 手动触发outgoing handler，因为WhatsApp Web.js库的事件可能不触发
      if (this.outgoingHandler && response.id) {
        logger.info({ responseId: response.id._serialized }, 'Manually triggering outgoing handler');
        try {
          // 创建一个模拟的消息对象来触发outgoing handler
          const mockMessage = {
            id: response.id,
            to: chatId,
            from: this.phoneE164 ? `${this.phoneE164.replace('+', '')}@c.us` : 'unknown',
            body: content,
            fromMe: true,
            type: 'chat',
            timestamp: Math.floor(Date.now() / 1000),
            _serialized: response.id._serialized
          } as any;
          
          await this.outgoingHandler(mockMessage);
          logger.info({ responseId: response.id._serialized }, 'Manual outgoing handler completed');
        } catch (error) {
          logger.error({ 
            error: error.message, 
            responseId: response.id._serialized 
          }, 'Manual outgoing handler failed');
        }
      } else {
        logger.warn({ 
          hasOutgoingHandler: !!this.outgoingHandler,
          hasResponseId: !!response.id
        }, 'Cannot trigger outgoing handler manually');
      }
      
      return { id: response.id ? response.id._serialized : undefined };
    };

    const result = await this.retry(send, 'sendTextMessage');
    logger.info({ 
      chatId, 
      phoneE164, 
      result,
      resultId: result.id
    }, 'sendTextMessage completed');
    
    return result;
  }

  async sendMediaMessage(phoneE164: string, filePath: string, caption?: string): Promise<SendMessageResult> {
    if (this.status !== 'READY') {
      throw new Error('WhatsApp client not ready');
    }

    const chatId = this.toChatId(phoneE164);
    logger.debug({ chatId, filePath }, 'Sending WhatsApp media message');

    const client = this.client;
    if (!client) {
      throw new Error('WhatsApp client not available');
    }

    const send = async () => {
      const response = await client.sendMessage(chatId, filePath, { caption: caption || '' });
      return { id: response.id ? response.id._serialized : undefined };
    };

    return this.retry(send, 'sendMediaMessage');
  }

  private async retry<T>(fn: () => Promise<T>, operation: string): Promise<T> {
    let attempt = 0;
    let delay = BASE_DELAY_MS;

    while (true) {
      try {
        return await fn();
      } catch (err) {
        attempt += 1;
        logger.warn({ err, attempt, operation }, 'WhatsApp operation failed');
        if (attempt >= MAX_RETRIES) {
          logger.error({ err, operation }, 'Max retries exhausted');
          throw err;
        }
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2;
      }
    }
  }

  public logout(): void {
    logger.info('Starting WhatsApp logout process');
    
    // 立即重置状态，避免状态不一致
    const originalPhone = this.phoneE164;
    this.phoneE164 = null;
    this.lastOnline = null;
    this.status = 'DISCONNECTED';
    this.state = 'OFFLINE';
    
    // 立即清理客户端引用
    const clientToCleanup = this.client;
    this.client = null;
    
    logger.info(`WhatsApp logout state reset for phone: ${originalPhone}`);
    
    // 异步清理操作（不等待结果，不抛出错误）
    if (clientToCleanup) {
      // 异步销毁客户端
      setImmediate(() => {
        clientToCleanup.destroy().catch((err) => {
          logger.warn({ err }, 'Client destroy failed in background');
        });
      });
    }
    
    // 异步清理会话数据
    setImmediate(() => {
      this.clearSessionData().catch((err) => {
        logger.warn({ err }, 'Session data clear failed in background');
      });
    });
    
    logger.info('WhatsApp logout completed (cleanup running in background)');
  }

  // 清理会话数据
  private async clearSessionData(): Promise<void> {
    try {
      logger.info(`Attempting to clear session data at: ${SESSION_PATH}`);
      
      // 检查会话目录是否存在
      const sessionExists = await fs.access(SESSION_PATH).then(() => true).catch(() => false);
      if (!sessionExists) {
        logger.info('No session data to clear');
        return;
      }

      // 延迟删除，避免文件锁定
      setTimeout(async () => {
        try {
          logger.info('Starting delayed session cleanup...');
          
          // 尝试多次删除，处理文件锁定
          let attempts = 0;
          const maxAttempts = 3;
          
          while (attempts < maxAttempts) {
            try {
              await fs.rm(SESSION_PATH, { recursive: true, force: true });
              logger.info('Session data cleared successfully');
              return;
            } catch (deleteErr: any) {
              attempts++;
              if (deleteErr.code === 'EBUSY' || deleteErr.code === 'ENOTEMPTY') {
                logger.warn({ attempt: attempts, err: deleteErr }, 'Session files locked, retrying...');
                await new Promise(resolve => setTimeout(resolve, 2000 * attempts));
              } else {
                throw deleteErr;
              }
            }
          }
          
          logger.warn('Failed to clear session data after multiple attempts, but logout will continue');
        } catch (err) {
          logger.warn({ err }, 'Delayed session cleanup failed');
        }
      }, 3000); // 延迟3秒执行
      
      logger.info('Session cleanup scheduled for later execution');
    } catch (err) {
      logger.warn({ err }, 'Failed to schedule session cleanup');
    }
  }

  private toChatId(phoneE164: string): string {
    const digits = phoneE164.replace(/[^\d]/g, '');
    return `${digits}@c.us`;
  }

  /**
   * 获取WhatsApp中的所有联系人
   */
  async getWhatsAppContacts(): Promise<WhatsAppContact[]> {
    if (!this.client || this.status !== 'READY') {
      throw new Error('WhatsApp client is not ready');
    }

    try {
      logger.info('Fetching WhatsApp contacts...');
      
      // 获取所有聊天（包括个人和群组）
      const chats = await this.client.getChats();
      
      const contacts: WhatsAppContact[] = [];
      
      for (const chat of chats) {
        // 只处理个人聊天，跳过群组
        if (chat.isGroup) {
          continue;
        }

        const contact = chat as any; // 类型断言，因为whatsapp-web.js的类型定义可能不完整
        
        // 提取联系人信息
        const contactInfo: WhatsAppContact = {
          id: contact.id._serialized || contact.id,
          name: contact.name || contact.pushname || undefined,
          number: this.extractPhoneNumber(contact.id._serialized || contact.id),
          isGroup: contact.isGroup || false,
          isUser: contact.isUser || false,
          isWAContact: contact.isWAContact || false,
          profilePicUrl: contact.profilePicUrl || undefined,
        };

        // 只添加有效的个人联系人
        if (contactInfo.number && !contactInfo.isGroup) {
          contacts.push(contactInfo);
        }
      }

      logger.info(`Successfully fetched ${contacts.length} WhatsApp contacts`);
      return contacts;
      
    } catch (error) {
      logger.error({ error }, 'Failed to fetch WhatsApp contacts');
      throw new Error(`Failed to fetch WhatsApp contacts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 从WhatsApp ID中提取手机号
   */
  private extractPhoneNumber(whatsappId: string): string {
    // WhatsApp ID格式通常是: 8613800138001@c.us
    const match = whatsappId.match(/^(\d+)@c\.us$/);
    if (match) {
      const phoneNumber = match[1];
      // 添加+号前缀
      return phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
    }
    return whatsappId;
  }

  /**
   * 同步WhatsApp联系人到数据库
   */
  async syncContactsToDatabase(): Promise<{ added: number; updated: number; total: number }> {
    try {
      logger.info('Starting WhatsApp contacts sync to database...');
      
      const whatsappContacts = await this.getWhatsAppContacts();
      logger.info(`Found ${whatsappContacts.length} WhatsApp contacts to sync`);
      
      const { prisma } = await import('./prisma');
      logger.info('Prisma client imported successfully');
      
      let added = 0;
      let updated = 0;
      
      for (const whatsappContact of whatsappContacts) {
        try {
          // 检查联系人是否已存在
          const existingContact = await prisma.contact.findUnique({
            where: { phoneE164: whatsappContact.number }
          });

          const contactData = {
            phoneE164: whatsappContact.number,
            name: whatsappContact.name || null,
            consent: true, // WhatsApp联系人默认同意接收消息
            source: 'whatsapp_sync' as any,
            tags: whatsappContact.isWAContact ? ['whatsapp_contact'] : ['whatsapp_user'] as any,
          };

          if (existingContact) {
            // 更新现有联系人
            await prisma.contact.update({
              where: { phoneE164: whatsappContact.number },
              data: {
                name: whatsappContact.name || existingContact.name,
                source: 'whatsapp_sync' as any,
                tags: whatsappContact.isWAContact ? ['whatsapp_contact'] : ['whatsapp_user'] as any,
              }
            });
            updated++;
          } else {
            // 创建新联系人
            await prisma.contact.create({
              data: contactData
            });
            added++;
          }
        } catch (contactError) {
          logger.warn({ 
            contact: whatsappContact.number, 
            error: contactError 
          }, 'Failed to sync individual contact');
        }
      }

      const result = {
        added,
        updated,
        total: whatsappContacts.length
      };

      logger.info({ result }, 'WhatsApp contacts sync completed');
      return result;
      
    } catch (error) {
      logger.error({ error }, 'Failed to sync WhatsApp contacts to database');
      throw error;
    }
  }
}

export const whatsappService = new WhatsAppService();
