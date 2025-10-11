import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../logger';

interface CreateAccountBody {
  name: string;
}

interface UpdateAccountBody {
  name?: string;
  isActive?: boolean;
}

/**
 * 账号管理路由
 */
export async function accountRoutes(app: FastifyInstance) {
  const { prisma, accountManager } = app;

  /**
   * GET /accounts - 获取所有账号列表
   */
  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      logger.info('Fetching all accounts');
      
      const statuses = await accountManager.getAllAccountStatuses();
      
      return reply.send({
        ok: true,
        data: statuses
      });
    } catch (error) {
      logger.error({ error }, 'Failed to fetch accounts');
      return reply.status(500).send({
        ok: false,
        code: 'FETCH_ACCOUNTS_ERROR',
        message: 'Failed to fetch accounts'
      });
    }
  });

  /**
   * GET /accounts/:id - 获取单个账号详情
   */
  app.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      logger.info({ accountId: id }, 'Fetching account details');

      const account = await prisma.account.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              contacts: true,
              threads: true,
              messages: true,
              campaigns: true,
              groups: true
            }
          }
        }
      });

      if (!account) {
        return reply.status(404).send({
          ok: false,
          code: 'ACCOUNT_NOT_FOUND',
          message: 'Account not found'
        });
      }

      // 获取实时状态
      const service = accountManager.getAccountService(id);
      let whatsappStatus = null;
      if (service) {
        whatsappStatus = service.getStatus();
      }

      return reply.send({
        ok: true,
        data: {
          ...account,
          whatsappStatus,
          counts: account._count
        }
      });
    } catch (error) {
      logger.error({ error }, 'Failed to fetch account details');
      return reply.status(500).send({
        ok: false,
        code: 'FETCH_ACCOUNT_ERROR',
        message: 'Failed to fetch account details'
      });
    }
  });

  /**
   * POST /accounts - 创建新账号
   */
  app.post('/', async (request: FastifyRequest<{ Body: CreateAccountBody }>, reply: FastifyReply) => {
    try {
      const { name } = request.body;

      if (!name || name.trim().length === 0) {
        return reply.status(400).send({
          ok: false,
          code: 'INVALID_ACCOUNT_NAME',
          message: 'Account name is required'
        });
      }

      logger.info({ name }, 'Creating new account');

      const accountStatus = await accountManager.createAccount(name);

      return reply.status(201).send({
        ok: true,
        data: accountStatus
      });
    } catch (error) {
      logger.error({ error }, 'Failed to create account');
      return reply.status(500).send({
        ok: false,
        code: 'CREATE_ACCOUNT_ERROR',
        message: 'Failed to create account'
      });
    }
  });

  /**
   * PUT /accounts/:id - 更新账号信息
   */
  app.put('/:id', async (request: FastifyRequest<{ Params: { id: string }; Body: UpdateAccountBody }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const updateData = request.body;

      logger.info({ accountId: id, updateData }, 'Updating account');

      const account = await prisma.account.update({
        where: { id },
        data: updateData
      });

      return reply.send({
        ok: true,
        data: account
      });
    } catch (error) {
      logger.error({ error }, 'Failed to update account');
      return reply.status(500).send({
        ok: false,
        code: 'UPDATE_ACCOUNT_ERROR',
        message: 'Failed to update account'
      });
    }
  });

  /**
   * DELETE /accounts/:id - 删除账号
   */
  app.delete('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      logger.info({ accountId: id }, 'Deleting account');

      await accountManager.removeAccount(id);

      return reply.send({
        ok: true,
        data: { message: 'Account deleted successfully' }
      });
    } catch (error) {
      logger.error({ error }, 'Failed to delete account');
      return reply.status(500).send({
        ok: false,
        code: 'DELETE_ACCOUNT_ERROR',
        message: 'Failed to delete account'
      });
    }
  });

  /**
   * POST /accounts/:id/start - 启动账号（开始登录）
   */
  app.post('/:id/start', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      logger.info({ accountId: id }, 'Starting account');

      await accountManager.startAccount(id);

      return reply.send({
        ok: true,
        data: { message: 'Account login process started' }
      });
    } catch (error) {
      logger.error({ error }, 'Failed to start account');
      return reply.status(500).send({
        ok: false,
        code: 'START_ACCOUNT_ERROR',
        message: error instanceof Error ? error.message : 'Failed to start account'
      });
    }
  });

  /**
   * POST /accounts/:id/stop - 停止账号
   */
  app.post('/:id/stop', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      logger.info({ accountId: id }, 'Stopping account');

      await accountManager.stopAccount(id);

      return reply.send({
        ok: true,
        data: { message: 'Account stopped successfully' }
      });
    } catch (error) {
      logger.error({ error }, 'Failed to stop account');
      return reply.status(500).send({
        ok: false,
        code: 'STOP_ACCOUNT_ERROR',
        message: 'Failed to stop account'
      });
    }
  });

  /**
   * GET /accounts/:id/status - 获取账号状态
   */
  app.get('/:id/status', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;

      const service = accountManager.getAccountService(id);
      if (!service) {
        return reply.status(404).send({
          ok: false,
          code: 'ACCOUNT_NOT_FOUND',
          message: 'Account not found'
        });
      }

      const status = service.getStatus();
      const onlineStates = new Set(['READY', 'AUTHENTICATING']);
      const online = onlineStates.has(status.status);
      const sessionReady = status.status === 'READY';

      // 获取联系人数量和最后一条消息时间
      const [contactCount, latestMessage] = await Promise.all([
        app.prisma.contact.count({ where: { accountId: id } }),
        app.prisma.message.aggregate({
          where: { accountId: id },
          _max: { createdAt: true },
        }),
      ]);

      return reply.send({
        ok: true,
        data: {
          online,
          sessionReady,
          qr: status.qr,
          status: status.status,
          state: status.state,
          phoneE164: status.phoneE164,
          lastOnline: status.lastOnline?.toISOString() ?? null,
          contactCount,
          lastMessageAt: latestMessage._max.createdAt?.toISOString() ?? null,
        }
      });
    } catch (error) {
      logger.error({ error }, 'Failed to get account status');
      return reply.status(500).send({
        ok: false,
        code: 'GET_STATUS_ERROR',
        message: 'Failed to get account status'
      });
    }
  });

  /**
   * GET /accounts/:id/qr - 获取账号二维码
   */
  app.get('/:id/qr', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;

      const qrBase64 = accountManager.getAccountQRCode(id);

      if (!qrBase64) {
        return reply.status(404).send({
          ok: false,
          code: 'QR_NOT_AVAILABLE',
          message: 'QR code not available'
        });
      }

      return reply.send({
        ok: true,
        data: {
          qr: qrBase64
        }
      });
    } catch (error) {
      logger.error({ error }, 'Failed to get QR code');
      return reply.status(500).send({
        ok: false,
        code: 'GET_QR_ERROR',
        message: 'Failed to get QR code'
      });
    }
  });

  /**
   * POST /accounts/:id/sync-contacts - 同步 WhatsApp 联系人
   */
  app.post('/:id/sync-contacts', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const{ id } = request.params;
      logger.info({ accountId: id }, 'Syncing contacts');

      const service = accountManager.getAccountService(id);
      if (!service) {
        return reply.status(404).send({
          ok: false,
          code: 'ACCOUNT_NOT_FOUND',
          message: 'Account not found'
        });
      }

      const result = await service.syncContactsToDatabase();

      return reply.send({
        ok: true,
        data: result
      });
    } catch (error) {
      logger.error({ error }, 'Failed to sync contacts');
      return reply.status(500).send({
        ok: false,
        code: 'SYNC_CONTACTS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to sync contacts'
      });
    }
  });

  /**
   * DELETE /accounts/cleanup - 清理离线账号
   */
  app.delete('/cleanup', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      logger.info('Cleaning up offline accounts');

      // 查找所有离线账号（排除在线状态：READY, ONLINE, QR, AUTHENTICATING, CONNECTING）
      const offlineAccounts = await prisma.account.findMany({
        where: {
          status: {
            notIn: ['READY', 'ONLINE', 'online', 'QR', 'AUTHENTICATING', 'CONNECTING']
          }
        },
        select: {
          id: true,
          name: true,
          phoneNumber: true,
          status: true
        }
      });

      logger.info({ count: offlineAccounts.length }, 'Found offline accounts to clean');

      if (offlineAccounts.length === 0) {
        return reply.send({
          ok: true,
          data: {
            deletedCount: 0,
            deletedAccounts: [],
            message: 'No offline accounts to clean'
          }
        });
      }

      const offlineIds = offlineAccounts.map(acc => acc.id);

      // 按顺序删除关联数据（彻底清理，避免外键约束）
      logger.info('Deleting all related data for offline accounts...');
      
      // 1. 删除批量操作明细
      await prisma.batchOperationItem.deleteMany({
        where: { batch: { accountId: { in: offlineIds } } }
      });
      
      // 2. 删除批量操作
      await prisma.batchOperation.deleteMany({
        where: { accountId: { in: offlineIds } }
      });
      
      // 3. 删除群组活动
      await prisma.groupActivity.deleteMany({
        where: { group: { accountId: { in: offlineIds } } }
      });
      
      // 4. 删除群消息
      await prisma.groupMessage.deleteMany({
        where: { group: { accountId: { in: offlineIds } } }
      });
      
      // 5. 删除群成员
      await prisma.groupMember.deleteMany({
        where: { group: { accountId: { in: offlineIds } } }
      });
      
      // 6. 删除群发记录
      await prisma.groupBroadcast.deleteMany({
        where: { accountId: { in: offlineIds } }
      });
      
      // 7. 删除群组
      await prisma.whatsAppGroup.deleteMany({
        where: { accountId: { in: offlineIds } }
      });
      
      // 8. 删除进群任务
      await prisma.joinGroupTask.deleteMany({
        where: { accountId: { in: offlineIds } }
      });
      
      // 9. 删除活动接收者
      await prisma.campaignRecipient.deleteMany({
        where: { campaign: { accountId: { in: offlineIds } } }
      });
      
      // 10. 删除活动
      await prisma.campaign.deleteMany({
        where: { accountId: { in: offlineIds } }
      });
      
      // 11. 删除消息
      await prisma.message.deleteMany({
        where: { accountId: { in: offlineIds } }
      });
      
      // 12. 删除会话
      await prisma.thread.deleteMany({
        where: { accountId: { in: offlineIds } }
      });
      
      // 13. 删除联系人
      await prisma.contact.deleteMany({
        where: { accountId: { in: offlineIds } }
      });
      
      // 14. 删除翻译
      await prisma.translation.deleteMany({
        where: { accountId: { in: offlineIds } }
      });
      
      // 15. 删除知识库
      await prisma.knowledgeBase.deleteMany({
        where: { accountId: { in: offlineIds } }
      });
      
      // 16. 删除模板
      await prisma.messageTemplate.deleteMany({
        where: { accountId: { in: offlineIds } }
      });
      
      // 17. 最后删除账号
      const result = await prisma.account.deleteMany({
        where: {
          id: { in: offlineIds }
        }
      });

      logger.info({ deletedCount: result.count }, 'Cleaned up offline accounts');

      return reply.send({
        ok: true,
        data: {
          deletedCount: result.count,
          deletedAccounts: offlineAccounts,
          message: `Successfully deleted ${result.count} offline accounts`
        }
      });
    } catch (error) {
      logger.error({ error }, 'Failed to cleanup accounts');
      return reply.status(500).send({
        ok: false,
        code: 'CLEANUP_ERROR',
        message: error instanceof Error ? error.message : 'Failed to cleanup accounts'
      });
    }
  });

  /**
   * GET /accounts/aggregate/stats - 获取所有账号聚合统计
   */
  app.get('/aggregate/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      logger.info('Fetching aggregate stats for all accounts');

      const accounts = await prisma.account.findMany({
        where: { isActive: true }
      });

      // 获取所有账号的状态
      const statuses = await accountManager.getAllAccountStatuses();
      const onlineAccounts = statuses.filter(s => s.status === 'online').length;

      // 聚合消息统计
      const messageStats = await prisma.message.groupBy({
        by: ['accountId'],
        _count: { id: true },
        where: {
          accountId: { in: accounts.map(a => a.id) }
        }
      });

      const totalMessages = messageStats.reduce((sum, stat) => sum + stat._count.id, 0);

      // 聚合联系人统计
      const contactStats = await prisma.contact.groupBy({
        by: ['accountId'],
        _count: { id: true },
        where: {
          accountId: { in: accounts.map(a => a.id) }
        }
      });

      const totalContacts = contactStats.reduce((sum, stat) => sum + stat._count.id, 0);

      // 每个账号的详细统计
      const accountStats = accounts.map(account => {
        const messages = messageStats.find(m => m.accountId === account.id)?._count.id || 0;
        const contacts = contactStats.find(c => c.accountId === account.id)?._count.id || 0;
        const status = statuses.find(s => s.id === account.id);

        return {
          accountId: account.id,
          accountName: account.name,
          status: status?.status || 'offline',
          messages,
          contacts
        };
      });

      return reply.send({
        ok: true,
        data: {
          totalAccounts: accounts.length,
          onlineAccounts,
          offlineAccounts: accounts.length - onlineAccounts,
          totalMessages,
          totalContacts,
          accountStats: accountStats.sort((a, b) => b.messages - a.messages)
        }
      });
    } catch (error) {
      logger.error({ error }, 'Failed to fetch aggregate stats');
      return reply.status(500).send({
        ok: false,
        code: 'FETCH_AGGREGATE_STATS_ERROR',
        message: 'Failed to fetch aggregate stats'
      });
    }
  });

  /**
   * GET /accounts/aggregate/health - 获取所有账号健康监控
   */
  app.get('/aggregate/health', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      logger.info('Fetching health monitoring for all accounts');

      const statuses = await accountManager.getAllAccountStatuses();
      
      const healthData = statuses.map(status => ({
        accountId: status.id,
        accountName: status.name,
        status: status.status,
        isHealthy: status.status === 'online',
        lastOnline: status.lastOnline,
        phoneNumber: status.phoneNumber
      }));

      const totalAccounts = healthData.length;
      const healthyAccounts = healthData.filter(h => h.isHealthy).length;
      const unhealthyAccounts = totalAccounts - healthyAccounts;
      const healthPercentage = totalAccounts > 0 ? Math.round((healthyAccounts / totalAccounts) * 100) : 0;

      return reply.send({
        ok: true,
        data: {
          totalAccounts,
          healthyAccounts,
          unhealthyAccounts,
          healthPercentage,
          accounts: healthData
        }
      });
    } catch (error) {
      logger.error({ error }, 'Failed to fetch health monitoring');
      return reply.status(500).send({
        ok: false,
        code: 'FETCH_HEALTH_ERROR',
        message: 'Failed to fetch health monitoring'
      });
    }
  });
}

