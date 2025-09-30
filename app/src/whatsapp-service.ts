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

    this.client.on('message', async (message: Message) => {
      try {
        if (message.fromMe) {
          if (this.outgoingHandler) {
            await this.outgoingHandler(message);
          }
          return;
        }
        if (this.incomingHandler) {
          await this.incomingHandler(message);
        }
      } catch (err) {
        logger.error({ err, messageId: message.id._serialized }, 'Failed to process message');
      }
    });
  }

  // 新增：启动登录流程
  public async startLogin(): Promise<void> {
    try {
      logger.info('Starting WhatsApp login process...');
      
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
            '--disable-gpu'
          ],
        },
        authStrategy: new LocalAuth({ 
          dataPath: SESSION_PATH,
          clientId: 'whatsapp-automation'
        }),
      });

      // 设置初始状态
      this.status = 'INITIALIZING';
      this.state = 'NEED_QR';
      this.lastQr = null;
      this.lastQrBase64 = null;

      // 注册事件处理器
      this.registerEventHandlers();

      logger.info('Starting WhatsApp client initialization...');
      
      // 开始初始化（不等待完成，让它在后台运行）
      this.client.initialize().catch((err) => {
        logger.error({ err }, 'WhatsApp client initialization failed');
        this.status = 'FAILED';
        this.state = 'OFFLINE';
      });
      
      logger.info('WhatsApp client initialization started successfully');
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
    logger.debug({ chatId }, 'Sending WhatsApp message');

    const client = this.client;
    if (!client) {
      throw new Error('WhatsApp client not available');
    }

    const send = async () => {
      const response = await client.sendMessage(chatId, content);
      return { id: response.id ? response.id._serialized : undefined };
    };

    return this.retry(send, 'sendTextMessage');
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
}

export const whatsappService = new WhatsAppService();
