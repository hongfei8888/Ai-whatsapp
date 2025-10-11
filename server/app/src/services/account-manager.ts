import { EventEmitter } from 'events';
import { WPPConnectService } from '../wppconnect-service';
import { PrismaClient } from '@prisma/client';
import { logger } from '../logger';
import * as path from 'path';
import * as fs from 'fs/promises';
import { handleIncomingMessage, handleOutgoingMessage } from '../workflows/message-workflow';

export interface AccountStatus {
  id: string;
  name: string;
  phoneNumber: string | null;
  status: string;
  state: string;
  isActive: boolean;
  lastOnline: Date | null;
  qr: string | null;
}

/**
 * AccountManager 负责管理多个 WhatsApp 账号实例
 */
export class AccountManager extends EventEmitter {
  private accounts: Map<string, WPPConnectService> = new Map();
  private prisma: PrismaClient;
  private sessionsPath: string;

  constructor(prisma: PrismaClient, sessionsPath: string = './.sessions') {
    super();
    this.prisma = prisma;
    this.sessionsPath = sessionsPath;
    logger.info({ sessionsPath }, 'AccountManager initialized');
  }

  /**
   * 从数据库加载所有活跃账号
   */
  async loadExistingAccounts(): Promise<void> {
    try {
      logger.info('Loading existing accounts from database...');
      
      const accounts = await this.prisma.account.findMany({
        where: { isActive: true }
      });

      logger.info({ count: accounts.length }, 'Found active accounts');

      for (const account of accounts) {
        try {
          // 创建 WPPConnect 服务实例
          const service = new WPPConnectService(account.id, account.sessionPath);
          
          this.accounts.set(account.id, service);
          
          // 注册消息处理器
          service.onIncomingMessage((msg) => handleIncomingMessage(account.id, service, msg));
          service.onOutgoingMessage((msg) => handleOutgoingMessage(account.id, msg));
          
          // 转发事件
          this.forwardServiceEvents(account.id, service);
          
          logger.info({ accountId: account.id, name: account.name, service: 'VenomBot' }, 'Account service created');
          
          // 🔥 如果账号状态为在线，自动启动账号（恢复连接）
          if (account.status === 'online' || account.status === 'READY') {
            logger.info({ accountId: account.id, name: account.name, status: account.status }, 'Auto-starting online account after server restart');
            
            // 异步启动账号，不阻塞其他账号的加载
            service.start().then(() => {
              logger.info({ accountId: account.id }, 'Account auto-started successfully');
              
              // 更新数据库状态
              this.prisma.account.update({
                where: { id: account.id },
                data: { 
                  status: 'online',
                  lastOnline: new Date()
                }
              }).catch((err: any) => {
                logger.error({ accountId: account.id, error: err }, 'Failed to update account status after auto-start');
              });
            }).catch((error: any) => {
              logger.error({ accountId: account.id, error }, 'Failed to auto-start account');
              
              // 启动失败，更新数据库状态为离线
              this.prisma.account.update({
                where: { id: account.id },
                data: { status: 'offline' }
              }).catch((err: any) => {
                logger.error({ accountId: account.id, error: err }, 'Failed to update account status after auto-start failure');
              });
            });
          }
        } catch (error) {
          logger.error({ accountId: account.id, error }, 'Failed to create account service');
        }
      }

      logger.info({ loaded: this.accounts.size }, 'Accounts loaded');
    } catch (error) {
      logger.error({ error }, 'Failed to load existing accounts');
      throw error;
    }
  }

  /**
   * 创建新账号
   */
  async createAccount(name: string): Promise<AccountStatus> {
    try {
      logger.info({ name }, 'Creating new account');

      // 确保会话目录存在
      await fs.mkdir(this.sessionsPath, { recursive: true });

      // 创建账号记录
      const account = await this.prisma.account.create({
        data: {
          name,
          sessionPath: '', // 临时占位，下面会更新
          status: 'offline',
          isActive: true,
        }
      });

      // 更新 sessionPath，使用账号ID作为唯一标识
      const sessionPath = path.join(this.sessionsPath, `account_${account.id}`);
      await this.prisma.account.update({
        where: { id: account.id },
        data: { sessionPath }
      });

      // 创建 WPPConnect 服务实例
      const service = new WPPConnectService(account.id, sessionPath);
      
      this.accounts.set(account.id, service);

      // 注册消息处理器
      service.onIncomingMessage((msg) => handleIncomingMessage(account.id, service, msg));
      service.onOutgoingMessage((msg) => handleOutgoingMessage(account.id, msg));

      // 转发事件
      this.forwardServiceEvents(account.id, service);

      logger.info({ accountId: account.id, name, service: 'WPPConnect' }, 'Account created successfully');

      return this.getAccountStatus(account.id);
    } catch (error) {
      logger.error({ name, error }, 'Failed to create account');
      throw error;
    }
  }

  /**
   * 获取账号服务实例
   */
  getAccountService(accountId: string): WPPConnectService | null {
    const service = this.accounts.get(accountId);
    if (!service) {
      logger.warn({ accountId }, 'Account service not found');
      return null;
    }
    return service;
  }

  /**
   * 启动账号（开始登录流程）
   */
  async startAccount(accountId: string): Promise<void> {
    try {
      logger.info({ accountId }, 'Starting account');

      const service = this.getAccountService(accountId);
      if (!service) {
        throw new Error(`Account ${accountId} not found`);
      }

      // 更新数据库状态
      await this.prisma.account.update({
        where: { id: accountId },
        data: { status: 'connecting' }
      });

      // 启动登录流程（不等待完成，让它在后台运行）
      service.startLogin().catch((error) => {
        logger.error({ accountId, error }, 'Login process failed');
        // 错误会通过事件系统通知前端
      });

      logger.info({ accountId }, 'Account login process started');
    } catch (error) {
      logger.error({ accountId, error }, 'Failed to start account');
      
      // 更新失败状态
      await this.prisma.account.update({
        where: { id: accountId },
        data: { status: 'offline' }
      });

      throw error;
    }
  }

  /**
   * 停止账号
   */
  async stopAccount(accountId: string): Promise<void> {
    try {
      logger.info({ accountId }, 'Stopping account');

      const service = this.getAccountService(accountId);
      if (!service) {
        throw new Error(`Account ${accountId} not found`);
      }

      // 登出
      service.logout();

      // 更新数据库状态
      await this.prisma.account.update({
        where: { id: accountId },
        data: { 
          status: 'offline',
          phoneNumber: null,
          lastOnline: new Date()
        }
      });

      logger.info({ accountId }, 'Account stopped successfully');
    } catch (error) {
      logger.error({ accountId, error }, 'Failed to stop account');
      throw error;
    }
  }

  /**
   * 删除账号
   */
  async removeAccount(accountId: string): Promise<void> {
    try {
      logger.info({ accountId }, 'Removing account');

      // 先停止账号
      const service = this.getAccountService(accountId);
      if (service) {
        try {
          service.logout();
        } catch (error) {
          logger.warn({ accountId, error }, 'Failed to logout during removal');
        }
        this.accounts.delete(accountId);
      }

      // 🔧 手动删除所有关联数据（确保不会出现外键约束错误）
      logger.info({ accountId }, 'Deleting all related data...');
      
      // 1. 删除批量操作明细
      await this.prisma.batchOperationItem.deleteMany({
        where: { batch: { accountId } }
      });
      
      // 2. 删除批量操作
      await this.prisma.batchOperation.deleteMany({
        where: { accountId }
      });
      
      // 3. 删除群组活动
      await this.prisma.groupActivity.deleteMany({
        where: { group: { accountId } }
      });
      
      // 4. 删除群消息
      await this.prisma.groupMessage.deleteMany({
        where: { group: { accountId } }
      });
      
      // 5. 删除群成员
      await this.prisma.groupMember.deleteMany({
        where: { group: { accountId } }
      });
      
      // 6. 删除群发记录
      await this.prisma.groupBroadcast.deleteMany({
        where: { accountId }
      });
      
      // 7. 删除群组
      await this.prisma.whatsAppGroup.deleteMany({
        where: { accountId }
      });
      
      // 8. 删除进群任务
      await this.prisma.joinGroupTask.deleteMany({
        where: { accountId }
      });
      
      // 9. 删除活动接收者
      await this.prisma.campaignRecipient.deleteMany({
        where: { campaign: { accountId } }
      });
      
      // 10. 删除活动
      await this.prisma.campaign.deleteMany({
        where: { accountId }
      });
      
      // 11. 删除消息
      await this.prisma.message.deleteMany({
        where: { accountId }
      });
      
      // 12. 删除会话
      await this.prisma.thread.deleteMany({
        where: { accountId }
      });
      
      // 13. 删除联系人
      await this.prisma.contact.deleteMany({
        where: { accountId }
      });
      
      // 14. 删除翻译
      await this.prisma.translation.deleteMany({
        where: { accountId }
      });
      
      // 15. 删除知识库
      await this.prisma.knowledgeBase.deleteMany({
        where: { accountId }
      });
      
      // 16. 删除模板
      await this.prisma.messageTemplate.deleteMany({
        where: { accountId }
      });
      
      // 17. 最后删除账号本身
      await this.prisma.account.delete({
        where: { id: accountId }
      });

      logger.info({ accountId }, 'Account and all related data removed successfully');
    } catch (error) {
      logger.error({ accountId, error }, 'Failed to remove account');
      throw error;
    }
  }

  /**
   * 获取账号状态
   */
  getAccountStatus(accountId: string): AccountStatus {
    const service = this.getAccountService(accountId);
    
    if (!service) {
      throw new Error(`Account ${accountId} not found`);
    }

    const whatsappStatus = service.getStatus();
    
    // 从数据库获取账号基本信息（同步）
    // 注意：这里需要使用 findUniqueSync 或在外层包装为异步
    return {
      id: accountId,
      name: '', // 需要从数据库查询
      phoneNumber: whatsappStatus.phoneE164,
      status: whatsappStatus.status,
      state: whatsappStatus.state,
      isActive: true,
      lastOnline: whatsappStatus.lastOnline,
      qr: whatsappStatus.qr
    };
  }

  /**
   * 获取所有账号状态
   */
  async getAllAccountStatuses(): Promise<AccountStatus[]> {
    try {
      const accounts = await this.prisma.account.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' }
      });

      return accounts.map(account => {
        const service = this.getAccountService(account.id);
        
        // 🔧 如果 service 不存在，使用数据库中的状态（而不是强制返回 offline）
        if (!service) {
          return {
            id: account.id,
            name: account.name,
            phoneNumber: account.phoneNumber,
            status: account.status, // ← 使用数据库状态
            state: account.status === 'online' ? 'READY' : 'UNINITIALIZED',
            isActive: account.isActive,
            lastOnline: account.lastOnline,
            qr: null
          };
        }

        const whatsappStatus = service.getStatus();
        
        return {
          id: account.id,
          name: account.name,
          phoneNumber: whatsappStatus.phoneE164 || account.phoneNumber,
          status: whatsappStatus.status,
          state: whatsappStatus.state,
          isActive: account.isActive,
          lastOnline: whatsappStatus.lastOnline || account.lastOnline,
          qr: whatsappStatus.qr
        };
      });
    } catch (error) {
      logger.error({ error }, 'Failed to get all account statuses');
      throw error;
    }
  }

  /**
   * 获取账号二维码
   */
  getAccountQRCode(accountId: string): string | null {
    const service = this.getAccountService(accountId);
    if (!service) {
      return null;
    }
    return service.getQrCodeBase64();
  }

  /**
   * 转发 WPPConnectService 事件到 AccountManager
   */
  private forwardServiceEvents(accountId: string, service: WPPConnectService): void {
    // 状态变化事件
    service.on('statusChanged', async (data) => {
      logger.info({ accountId, status: data.status, state: data.state }, 'Account status changed');
      
      // 更新数据库
      try {
        await this.prisma.account.update({
          where: { id: accountId },
          data: {
            status: this.mapWhatsAppStatusToAccountStatus(data.status),
            phoneNumber: data.phoneE164,
            lastOnline: data.online ? new Date() : undefined
          }
        });
      } catch (error) {
        logger.error({ accountId, error }, 'Failed to update account status in database');
      }

      // 转发事件（添加 accountId）
      this.emit('accountStatusChanged', {
        accountId,
        ...data
      });
    });

    // QR码更新事件
    service.on('qr', (qr: string) => {
      this.emit('accountQRUpdated', {
        accountId,
        qr
      });
    });

    // 新消息事件
    service.on('newMessage', (message: any) => {
      this.emit('accountNewMessage', {
        accountId,
        ...message
      });
    });

    // 就绪事件（🎯 添加数据库状态更新）
    service.on('ready', async () => {
      logger.info({ accountId }, '✅ Account is ready, updating database status');
      
      // 更新数据库状态为在线
      try {
        const serviceStatus = service.getStatus();
        await this.prisma.account.update({
          where: { id: accountId },
          data: {
            status: 'online',
            phoneNumber: serviceStatus.phoneE164,
            lastOnline: new Date()
          }
        });
        logger.info({ accountId, phone: serviceStatus.phoneE164 }, '✅ Database status updated to online');
      } catch (error) {
        logger.error({ accountId, error }, 'Failed to update account status on ready');
      }
      
      this.emit('accountReady', { accountId });
    });

    // 断开连接事件
    service.on('disconnected', async () => {
      logger.info({ accountId }, '⚠️ Account disconnected, updating database status');
      
      // 更新数据库状态为离线
      try {
        await this.prisma.account.update({
          where: { id: accountId },
          data: {
            status: 'offline'
          }
        });
        logger.info({ accountId }, '✅ Database status updated to offline');
      } catch (error) {
        logger.error({ accountId, error }, 'Failed to update account status on disconnect');
      }
      
      this.emit('accountDisconnected', { accountId });
    });

    // 消息状态更新事件
    service.on('messageStatusUpdate', (data: any) => {
      this.emit('messageStatusUpdate', {
        accountId,
        ...data
      });
    });
  }

  /**
   * 映射 WhatsApp 状态到账号状态
   */
  private mapWhatsAppStatusToAccountStatus(whatsappStatus: string): string {
    const statusMap: Record<string, string> = {
      'INITIALIZING': 'connecting',
      'QR': 'connecting',
      'AUTHENTICATING': 'connecting',
      'READY': 'online',
      'DISCONNECTED': 'offline',
      'FAILED': 'offline'
    };
    return statusMap[whatsappStatus] || 'offline';
  }

  /**
   * 关闭所有账号
   */
  async shutdownAll(): Promise<void> {
    logger.info('Shutting down all accounts...');
    
    for (const [accountId, service] of this.accounts.entries()) {
      try {
        service.logout();
        logger.info({ accountId }, 'Account shut down');
      } catch (error) {
        logger.error({ accountId, error }, 'Failed to shutdown account');
      }
    }
    
    this.accounts.clear();
    logger.info('All accounts shut down');
  }
}

