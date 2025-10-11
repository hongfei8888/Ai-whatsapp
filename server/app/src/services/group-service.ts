import { prisma } from '../prisma';
import { logger } from '../logger';
import type { WPPConnectService } from '../wppconnect-service';
import { webSocketService } from '../websocket-service';

/**
 * 批量进群配置
 */
export interface JoinGroupConfig {
  delayMin?: number;  // 最小延迟（秒）
  delayMax?: number;  // 最大延迟（秒）
  autoGreet?: boolean;  // 是否自动打招呼
  greetMessage?: string;  // 打招呼内容
}

/**
 * 群组服务类
 */
export class GroupService {
  private static runningTasks = new Map<string, boolean>();

  /**
   * 创建批量进群任务
   */
  static async joinGroupsBatch(
    accountId: string,
    title: string,
    inviteLinks: string[],
    config: JoinGroupConfig = {},
    whatsappService?: WPPConnectService
  ) {
    try {
      // 验证邀请链接
      const validLinks = inviteLinks.filter(link => 
        link && (link.includes('chat.whatsapp.com') || link.includes('wa.me'))
      );

      if (validLinks.length === 0) {
        throw new Error('没有有效的邀请链接');
      }

      // 创建任务
      const task = await prisma.joinGroupTask.create({
        data: {
          accountId,
          title,
          inviteLinks: validLinks,
          totalLinks: validLinks.length,
          status: 'pending',
          config: config as any,
        },
      });

      logger.info('批量进群任务已创建', { 
        taskId: task.id, 
        totalLinks: validLinks.length 
      } as any);

      // 如果提供了 whatsappService，异步执行任务
      if (whatsappService) {
        this.executeJoinTask(task.id, accountId, whatsappService).catch(error => {
          logger.error('执行进群任务失败', { taskId: task.id, error } as any);
        });
      } else {
        logger.warn('No whatsappService provided, task created but not executed', { taskId: task.id } as any);
      }

      return task;
    } catch (error) {
      logger.error('创建进群任务失败', { error } as any);
      throw error;
    }
  }

  /**
   * 执行进群任务
   * @param taskId - 任务ID  
   * @param accountId - 账号ID
   * @param whatsappService - WhatsApp服务实例
   */
  static async executeJoinTask(taskId: string, accountId: string, whatsappService: WPPConnectService) {
    try {
      // 检查是否已在运行
      if (this.runningTasks.get(taskId)) {
        logger.warn('任务已在运行', { taskId } as any);
        return;
      }

      this.runningTasks.set(taskId, true);

      // 获取任务
      const task = await prisma.joinGroupTask.findUnique({
        where: { id: taskId },
      });

      if (!task) {
        throw new Error('任务不存在');
      }

      if (task.status === 'cancelled') {
        logger.info('任务已取消', { taskId } as any);
        return;
      }

      // 更新任务状态为运行中
      await prisma.joinGroupTask.update({
        where: { id: taskId },
        data: {
          status: 'running',
          startedAt: new Date(),
        },
      });

      const inviteLinks = task.inviteLinks as string[];
      const config = (task.config as JoinGroupConfig) || {};
      const delayMin = (config.delayMin || 3) * 1000;  // 转换为毫秒
      const delayMax = (config.delayMax || 5) * 1000;
      const result: Record<string, any> = {};

      let joinedCount = 0;
      let failedCount = 0;

      // 检查 WhatsApp 客户端状态
      const client = whatsappService.getClient();
      if (!client) {
        throw new Error('WhatsApp 客户端未初始化');
      }
      
      // 逐个加入群组
      for (let i = 0; i < inviteLinks.length; i++) {
        // 检查任务是否被取消
        const currentTask = await prisma.joinGroupTask.findUnique({
          where: { id: taskId },
        });

        if (currentTask?.status === 'cancelled') {
          logger.info('任务已取消', { taskId } as any);
          break;
        }

        const link = inviteLinks[i];
        logger.info(`处理邀请链接 ${i + 1}/${inviteLinks.length}`, { link } as any);

        try {
          // 提取邀请码
          let inviteCode = '';
          if (link.includes('chat.whatsapp.com')) {
            const match = link.match(/chat\.whatsapp\.com\/([A-Za-z0-9]+)/);
            inviteCode = match?.[1] || '';
          } else if (link.includes('wa.me')) {
            const match = link.match(/wa\.me\/([A-Za-z0-9]+)/);
            inviteCode = match?.[1] || '';
          }

          if (!inviteCode) {
            throw new Error('无效的邀请链接');
          }

          // 加入群组 (Venom Bot API)
          const chat: any = await (client as any).joinCodeGroup(inviteCode);
          
          logger.info('成功加入群组', { 
            inviteCode, 
            chatId: chat.id._serialized 
          } as any);

          // 同步群组信息到数据库
          await this.syncGroupToDatabase(accountId, chat);

          // 自动打招呼
          if (config.autoGreet && config.greetMessage) {
            await new Promise(resolve => setTimeout(resolve, 2000));  // 等待2秒
            await chat.sendMessage(config.greetMessage);
            logger.info('已发送欢迎消息', { chatId: chat.id._serialized } as any);
          }

          result[link] = {
            status: 'success',
            groupId: chat.id._serialized,
            groupName: chat.name || '未知群组',
          };

          joinedCount++;
        } catch (error: any) {
          logger.error('加入群组失败', { link, error: error.message } as any);
          
          result[link] = {
            status: 'failed',
            error: error.message || '未知错误',
          };

          failedCount++;
        }

        // 更新进度
        const progress = Math.round(((i + 1) / inviteLinks.length) * 100);
        await prisma.joinGroupTask.update({
          where: { id: taskId },
          data: {
            progress,
            joinedCount,
            failedCount,
            result: result as any,
          },
        });

        // 通过 WebSocket 广播进度
        webSocketService.broadcast({
          type: 'join_task_progress',
          data: {
            taskId,
            progress,
            joinedCount,
            failedCount,
            currentLink: link,
          },
          timestamp: Date.now(),
        });

        // 随机延迟（避免被限制）
        if (i < inviteLinks.length - 1) {
          const delay = Math.floor(Math.random() * (delayMax - delayMin + 1)) + delayMin;
          logger.info(`等待 ${delay}ms 后继续...`, {} as any);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      // 更新任务状态为完成
      await prisma.joinGroupTask.update({
        where: { id: taskId },
        data: {
          status: 'completed',
          progress: 100,
          joinedCount,
          failedCount,
          result: result as any,
          completedAt: new Date(),
        },
      });

      logger.info('批量进群任务完成', { 
        taskId, 
        joinedCount, 
        failedCount 
      } as any);

      // 广播完成事件
      webSocketService.broadcast({
        type: 'join_task_completed',
        data: {
          taskId,
          joinedCount,
          failedCount,
        },
        timestamp: Date.now(),
      });

    } catch (error: any) {
      logger.error('执行进群任务失败', { taskId, error } as any);

      // 更新任务状态为失败
      await prisma.joinGroupTask.update({
        where: { id: taskId },
        data: {
          status: 'failed',
          errorMessage: error.message || '未知错误',
          completedAt: new Date(),
        },
      });

      // 广播失败事件
      webSocketService.broadcast({
        type: 'join_task_failed',
        data: {
          taskId,
          error: error.message,
        },
        timestamp: Date.now(),
      });

    } finally {
      this.runningTasks.delete(taskId);
    }
  }

  /**
   * 获取进群任务状态
   */
  static async getJoinTaskStatus(taskId: string) {
    const task = await prisma.joinGroupTask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new Error('任务不存在');
    }

    return task;
  }

  /**
   * 获取进群任务列表
   */
  static async listJoinTasks(filters: {
    status?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    const { status, limit = 50, offset = 0 } = filters;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [tasks, total] = await Promise.all([
      prisma.joinGroupTask.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.joinGroupTask.count({ where }),
    ]);

    return { tasks, total };
  }

  /**
   * 取消进群任务
   */
  static async cancelJoinTask(taskId: string) {
    const task = await prisma.joinGroupTask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new Error('任务不存在');
    }

    if (task.status !== 'pending' && task.status !== 'running') {
      throw new Error('只能取消待执行或运行中的任务');
    }

    await prisma.joinGroupTask.update({
      where: { id: taskId },
      data: {
        status: 'cancelled',
        completedAt: new Date(),
      },
    });

    logger.info('进群任务已取消', { taskId } as any);

    return { ok: true };
  }

  /**
   * 同步所有群组
   * TODO: 需要重构 - 需要从路由层传入 WPPConnectService 实例
   */
  static async syncGroups(accountId: string, whatsappService: WPPConnectService) {
    try {
      const client = whatsappService.getClient();
      if (!client) {
        throw new Error('WhatsApp 客户端未初始化');
      }

      const chats: any[] = await (client as any).getAllChats();
      const groups = chats.filter((chat: any) => chat.isGroup);

      let syncedCount = 0;
      let newCount = 0;
      let updatedCount = 0;

      for (const group of groups) {
        const groupData: any = group;
        const groupId = groupData.id._serialized;
        
        const existingGroup = await prisma.whatsAppGroup.findUnique({
          where: { 
            accountId_groupId: {
              accountId,
              groupId
            }
          },
        });

        if (existingGroup) {
          // 更新现有群组
          await prisma.whatsAppGroup.update({
            where: { 
              accountId_groupId: {
                accountId,
                groupId
              }
            },
            data: {
              name: groupData.name || '未知群组',
              memberCount: groupData.participants?.length || 0,
              isActive: true,
            },
          });
          updatedCount++;
        } else {
          // 创建新群组
          await prisma.whatsAppGroup.create({
            data: {
              accountId,
              groupId,
              name: groupData.name || '未知群组',
              description: groupData.groupMetadata?.desc || null,
              memberCount: groupData.participants?.length || 0,
              isActive: true,
            },
          });
          newCount++;
        }

        syncedCount++;
      }

      logger.info('群组同步完成', { 
        syncedCount, 
        newCount, 
        updatedCount 
      } as any);

      return { syncedCount, newCount, updatedCount };
    } catch (error) {
      logger.error('同步群组失败', { error } as any);
      throw error;
    }
  }

  /**
   * 获取群组列表
   */
  static async listGroups(filters: {
    search?: string;
    isActive?: boolean;
    isMonitoring?: boolean;
    limit?: number;
    offset?: number;
  } = {}) {
    const { search, isActive, isMonitoring, limit = 50, offset = 0 } = filters;

    const where: any = {};
    
    if (typeof isActive === 'boolean') {
      where.isActive = isActive;
    }
    
    if (typeof isMonitoring === 'boolean') {
      where.isMonitoring = isMonitoring;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { groupId: { contains: search } },
      ];
    }

    const [groups, total] = await Promise.all([
      prisma.whatsAppGroup.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.whatsAppGroup.count({ where }),
    ]);

    return { groups, total };
  }

  // ==================== 群组群发功能 ====================

  /**
   * 创建群发任务
   * @param accountId - 账号ID
   * @param title - 任务标题
   * @param message - 发送的消息内容
   * @param targetGroupIds - 目标群组ID列表
   * @param options - 群发选项
   * @param whatsappService - WhatsApp服务实例（可选，用于异步执行）
   */
  static async broadcastToGroups(
    accountId: string,
    title: string,
    message: string,
    targetGroupIds: string[],
    options: {
      mediaUrl?: string;
      scheduledAt?: Date;
      ratePerMinute?: number;
      jitterMs?: [number, number];
      whatsappService?: WPPConnectService;
    } = {}
  ) {
    try {
      if (targetGroupIds.length === 0) {
        throw new Error('至少需要选择一个群组');
      }

      const { scheduledAt, ratePerMinute = 10, jitterMs = [2000, 4000] } = options;

      // 创建群发任务
      const broadcast = await prisma.groupBroadcast.create({
        data: {
          accountId,
          title,
          message,
          mediaUrl: options.mediaUrl || null,
          targetGroupIds: targetGroupIds as any,
          totalGroups: targetGroupIds.length,
          status: scheduledAt ? 'scheduled' : 'pending',
          scheduledAt: scheduledAt || null,
        },
      });

      logger.info('群发任务已创建', {
        broadcastId: broadcast.id,
        totalGroups: targetGroupIds.length,
        scheduled: !!scheduledAt,
      } as any);

      // 如果不是定时任务且提供了 whatsappService，立即执行
      if (!scheduledAt && options.whatsappService) {
        this.executeBroadcast(broadcast.id, accountId, options.whatsappService, { ratePerMinute, jitterMs }).catch(error => {
          logger.error('执行群发任务失败', { broadcastId: broadcast.id, error } as any);
        });
      } else if (!scheduledAt && !options.whatsappService) {
        logger.warn('No whatsappService provided, broadcast created but not executed', { broadcastId: broadcast.id } as any);
      }

      return broadcast;
    } catch (error) {
      logger.error('创建群发任务失败', { error } as any);
      throw error;
    }
  }

  /**
   * 执行群发任务
   * @param broadcastId - 群发任务ID
   * @param accountId - 账号ID
   * @param whatsappService - WhatsApp服务实例
   * @param options - 发送配置选项
   */
  static async executeBroadcast(
    broadcastId: string,
    accountId: string,
    whatsappService: WPPConnectService,
    options: {
      ratePerMinute?: number;
      jitterMs?: [number, number];
    } = {}
  ) {
    try {
      // 获取任务
      const broadcast = await prisma.groupBroadcast.findUnique({
        where: { id: broadcastId },
      });

      if (!broadcast) {
        throw new Error('任务不存在');
      }

      if (broadcast.status === 'cancelled') {
        logger.info('任务已取消', { broadcastId } as any);
        return;
      }

      // 保存broadcast引用供后续使用
      const broadcastMessage = broadcast.message;
      const broadcastMediaUrl = broadcast.mediaUrl;
      const targetGroupIds = broadcast.targetGroupIds as string[];

      // 更新状态为运行中
      await prisma.groupBroadcast.update({
        where: { id: broadcastId },
        data: {
          status: 'running',
          startedAt: new Date(),
        },
      });

      const { ratePerMinute = 10, jitterMs = [2000, 4000] } = options;
      const result: Record<string, any> = {};

      let sentCount = 0;
      let failedCount = 0;

      // 检查 WhatsApp 客户端状态
      const client = whatsappService.getClient();
      if (!client) {
        throw new Error('WhatsApp 客户端未初始化');
      }
      
      // 获取所有群组信息
      const groups = await prisma.whatsAppGroup.findMany({
        where: {
          accountId,
          groupId: { in: targetGroupIds },
        },
      });

      const groupMap = new Map(groups.map(g => [g.groupId, g]));

      // 逐个群组发送消息
      for (let i = 0; i < targetGroupIds.length; i++) {
        // 检查任务是否被取消
        const currentBroadcast = await prisma.groupBroadcast.findUnique({
          where: { id: broadcastId },
        });

        if (currentBroadcast?.status === 'cancelled') {
          logger.info('任务已取消', { broadcastId } as any);
          break;
        }

        // 检查是否被暂停
        if (currentBroadcast?.status === 'paused') {
          logger.info('任务已暂停', { broadcastId } as any);
          // 等待恢复或取消
          while (true) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            const checkBroadcast = await prisma.groupBroadcast.findUnique({
              where: { id: broadcastId },
            });
            if (checkBroadcast?.status === 'running') {
              logger.info('任务已恢复', { broadcastId } as any);
              break;
            }
            if (checkBroadcast?.status === 'cancelled') {
              logger.info('任务已取消', { broadcastId } as any);
              return;
            }
          }
        }

        const groupId = targetGroupIds[i];
        const group = groupMap.get(groupId);

        logger.info(`发送群发消息 ${i + 1}/${targetGroupIds.length}`, {
          groupId,
          groupName: group?.name,
        } as any);

        try {
          // 获取群聊
          const chat = await client.getChatById(groupId);

          if (!chat.isGroup) {
            throw new Error('不是群聊');
          }

          // 发送消息 (使用 WPPConnectService 发送到群组)
          if (broadcastMediaUrl) {
            // 如果有媒体文件，发送媒体消息
            // 这里需要根据实际情况处理媒体文件
            await whatsappService.sendTextMessage(groupId, broadcastMessage);
          } else {
            // 发送文本消息
            await whatsappService.sendTextMessage(groupId, broadcastMessage);
          }

          logger.info('群发消息发送成功', {
            groupId,
            groupName: group?.name,
          } as any);

          result[groupId] = {
            status: 'success',
            groupName: group?.name || '未知群组',
            sentAt: new Date().toISOString(),
          };

          sentCount++;
        } catch (error: any) {
          logger.error('发送群发消息失败', {
            groupId,
            error: error.message,
          } as any);

          result[groupId] = {
            status: 'failed',
            groupName: group?.name || '未知群组',
            error: error.message || '未知错误',
          };

          failedCount++;
        }

        // 更新进度
        const progress = Math.round(((i + 1) / targetGroupIds.length) * 100);
        await prisma.groupBroadcast.update({
          where: { id: broadcastId },
          data: {
            progress,
            sentCount,
            failedCount,
            result: result as any,
          },
        });

        // 通过 WebSocket 广播进度
        webSocketService.broadcast({
          type: 'broadcast_progress',
          data: {
            broadcastId,
            progress,
            sentCount,
            failedCount,
            currentGroup: groupId,
          },
          timestamp: Date.now(),
        });

        // 计算延迟时间（根据发送速率）
        if (i < targetGroupIds.length - 1) {
          const baseDelay = (60 / ratePerMinute) * 1000; // 基础延迟（毫秒）
          const jitter = Math.floor(Math.random() * (jitterMs[1] - jitterMs[0] + 1)) + jitterMs[0];
          const delay = baseDelay + jitter;

          logger.info(`等待 ${delay}ms 后继续...`, {} as any);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      // 更新任务状态为完成
      await prisma.groupBroadcast.update({
        where: { id: broadcastId },
        data: {
          status: 'completed',
          progress: 100,
          sentCount,
          failedCount,
          result: result as any,
          completedAt: new Date(),
        },
      });

      logger.info('群发任务完成', {
        broadcastId,
        sentCount,
        failedCount,
      } as any);

      // 广播完成事件
      webSocketService.broadcast({
        type: 'broadcast_completed',
        data: {
          broadcastId,
          sentCount,
          failedCount,
        },
        timestamp: Date.now(),
      });

    } catch (error: any) {
      logger.error('执行群发任务失败', { broadcastId, error } as any);

      // 更新任务状态为失败
      await prisma.groupBroadcast.update({
        where: { id: broadcastId },
        data: {
          status: 'failed',
          errorMessage: error.message || '未知错误',
          completedAt: new Date(),
        },
      });

      // 广播失败事件
      webSocketService.broadcast({
        type: 'broadcast_failed',
        data: {
          broadcastId,
          error: error.message,
        },
        timestamp: Date.now(),
      });
    }
  }

  /**
   * 获取群发任务状态
   */
  static async getBroadcastStatus(broadcastId: string) {
    const broadcast = await prisma.groupBroadcast.findUnique({
      where: { id: broadcastId },
    });

    if (!broadcast) {
      throw new Error('任务不存在');
    }

    return broadcast;
  }

  /**
   * 获取群发任务列表
   */
  static async listBroadcasts(filters: {
    status?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    const { status, limit = 50, offset = 0 } = filters;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [broadcasts, total] = await Promise.all([
      prisma.groupBroadcast.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.groupBroadcast.count({ where }),
    ]);

    return { broadcasts, total };
  }

  /**
   * 暂停群发任务
   */
  static async pauseBroadcast(broadcastId: string) {
    const broadcast = await prisma.groupBroadcast.findUnique({
      where: { id: broadcastId },
    });

    if (!broadcast) {
      throw new Error('任务不存在');
    }

    if (broadcast.status !== 'running') {
      throw new Error('只能暂停运行中的任务');
    }

    await prisma.groupBroadcast.update({
      where: { id: broadcastId },
      data: { status: 'paused' },
    });

    logger.info('群发任务已暂停', { broadcastId } as any);

    return { ok: true };
  }

  /**
   * 恢复群发任务
   */
  static async resumeBroadcast(broadcastId: string) {
    const broadcast = await prisma.groupBroadcast.findUnique({
      where: { id: broadcastId },
    });

    if (!broadcast) {
      throw new Error('任务不存在');
    }

    if (broadcast.status !== 'paused') {
      throw new Error('只能恢复暂停的任务');
    }

    await prisma.groupBroadcast.update({
      where: { id: broadcastId },
      data: { status: 'running' },
    });

    logger.info('群发任务已恢复', { broadcastId } as any);

    return { ok: true };
  }

  /**
   * 取消群发任务
   */
  static async cancelBroadcast(broadcastId: string) {
    const broadcast = await prisma.groupBroadcast.findUnique({
      where: { id: broadcastId },
    });

    if (!broadcast) {
      throw new Error('任务不存在');
    }

    if (!['pending', 'running', 'paused', 'scheduled'].includes(broadcast.status)) {
      throw new Error('只能取消待执行、运行中、暂停或定时的任务');
    }

    await prisma.groupBroadcast.update({
      where: { id: broadcastId },
      data: {
        status: 'cancelled',
        completedAt: new Date(),
      },
    });

    logger.info('群发任务已取消', { broadcastId } as any);

    return { ok: true };
  }

  // ==================== 群消息监控功能 ====================

  /**
   * 将单个群组同步到数据库
   */
  private static async syncGroupToDatabase(accountId: string, chat: any) {
    try {
      const groupId = chat.id._serialized;
      const name = chat.name || '未命名群组';
      const memberCount = chat.participants?.length || 0;

      await prisma.whatsAppGroup.upsert({
        where: { 
          accountId_groupId: {
            accountId,
            groupId
          }
        },
        create: {
          accountId,
          groupId,
          name,
          memberCount,
          isActive: true,
        },
        update: {
          name,
          memberCount,
        },
      });

      logger.info('群组已同步到数据库', { groupId, name } as any);
    } catch (error) {
      logger.error('同步群组到数据库失败', { error } as any);
    }
  }

  /**
   * 处理群消息（用于消息监听）
   * TODO: 需要重构 - 需要从路由层传入 accountId
   */
  static async handleGroupMessage(accountId: string, chat: any, message: any) {
    try {
      const groupId = chat.id._serialized;

      // 检查群组是否存在数据库
      let group = await prisma.whatsAppGroup.findUnique({
        where: { 
          accountId_groupId: {
            accountId,
            groupId
          }
        },
      });

      if (!group) {
        // 如果群组不存在数据库，自动创建
        await this.syncGroupToDatabase(accountId, chat);
        group = await prisma.whatsAppGroup.findUnique({
          where: { 
            accountId_groupId: {
              accountId,
              groupId
            }
          },
        });
        
        if (!group) {
          logger.error('创建群组失败', { groupId } as any);
          return;
        }
      }

      // 保存所有群组消息到数据库（不再仅限于监控的群组）
      await this.saveGroupMessage(group.id, message);

      // 更新群组活动
      await prisma.groupActivity.create({
        data: {
          groupId: group.id,
          type: 'message',
          actorPhone: message.from,
          data: {
            messageId: message.id._serialized,
            hasMedia: message.hasMedia,
          } as any,
        },
      });

      // 获取发送者信息用于 WebSocket 广播
      const contact = await message.getContact();
      const fromName = contact?.pushname || contact?.name || message.from;
      // 获取真实的个人电话号码（用于私聊跳转）
      const realPhone = contact?.id?._serialized || contact?.id || message.from;

      // 通过 WebSocket 广播新消息（所有群组消息）
      webSocketService.broadcast({
        type: 'group_message',
        data: {
          groupId: group.id,
          groupName: group.name,
          messageId: message.id._serialized,
          from: realPhone,  // 使用真实的个人电话号码
          fromName: fromName,  // 添加发送者名称
          body: message.body,
          mediaType: message.type || 'chat',  // 添加消息类型
          timestamp: Date.now(),
        },
        timestamp: Date.now(),
      });

      // 如果开启监控，检查关键词
      if (group.isMonitoring && group.keywords) {
        await this.checkKeywords(group, message);
      }

    } catch (error) {
      logger.error('处理群消息失败', { error } as any);
    }
  }

  /**
   * 保存群消息到数据库
   */
  private static async saveGroupMessage(groupId: string, message: any) {
    try {
      const contact = await message.getContact();
      // 优先使用 pushname，然后 name，最后使用电话号码
      const fromName = contact?.pushname || contact?.name || message.from;
      
      // 获取真实的个人电话号码（用于私聊跳转）
      // contact.id._serialized 格式通常是: 8618049718825@c.us
      const realPhone = contact?.id?._serialized || contact?.id || message.from;
      
      logger.info('保存群消息 - 联系人信息:', {
        messageFrom: message.from,
        contactId: realPhone,
        contactName: fromName,
      } as any);

      await prisma.groupMessage.create({
        data: {
          groupId,
          messageId: message.id._serialized,
          fromPhone: realPhone,  // 使用真实的个人电话号码
          fromName: fromName,
          text: message.body || null,
          mediaType: message.type || null,
        },
      });

      // 更新群成员消息计数
      await prisma.groupMember.updateMany({
        where: {
          groupId,
          phoneE164: message.from,
        },
        data: {
          messageCount: { increment: 1 },
          lastMessageAt: new Date(),
        },
      });

      logger.info('群消息已保存', { groupId, messageId: message.id._serialized } as any);
    } catch (error) {
      logger.error('保存群消息失败', { error } as any);
    }
  }

  /**
   * 检查关键词
   */
  private static async checkKeywords(group: any, message: any) {
    try {
      const keywords = group.keywords as string[] || [];
      const text = (message.body || '').toLowerCase();
      const hitKeywords: string[] = [];

      for (const keyword of keywords) {
        if (text.includes(keyword.toLowerCase())) {
          hitKeywords.push(keyword);
        }
      }

      if (hitKeywords.length > 0) {
        // 更新消息记录，标记命中的关键词
        await prisma.groupMessage.updateMany({
          where: { messageId: message.id._serialized },
          data: {
            keywords: hitKeywords as any,
          },
        });

        logger.info('关键词命中', { 
          groupId: group.id, 
          keywords: hitKeywords 
        } as any);
      }
    } catch (error) {
      logger.error('检查关键词失败', { error } as any);
    }
  }

  /**
   * 获取群组详情
   */
  static async getGroupDetails(groupId: string) {
    const group = await prisma.whatsAppGroup.findUnique({
      where: { id: groupId },
      include: {
        members: {
          where: { isActive: true },
          orderBy: { messageCount: 'desc' },
          take: 10,
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!group) {
      throw new Error('群组不存在');
    }

    return group;
  }

  /**
   * 更新群组设置
   */
  static async updateGroupSettings(
    groupId: string,
    settings: {
      isMonitoring?: boolean;
      keywords?: string[];
      tags?: string[];
    }
  ) {
    const updateData: any = {};

    if (typeof settings.isMonitoring === 'boolean') {
      updateData.isMonitoring = settings.isMonitoring;
    }

    if (settings.keywords) {
      updateData.keywords = settings.keywords as any;
    }

    if (settings.tags) {
      updateData.tags = settings.tags as any;
    }

    const group = await prisma.whatsAppGroup.update({
      where: { id: groupId },
      data: updateData,
    });

    logger.info('群组设置已更新', { groupId, settings } as any);

    return group;
  }

  /**
   * 获取群消息列表
   */
  static async getGroupMessages(
    groupId: string,
    filters: {
      fromPhone?: string;
      keyword?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
      offset?: number;
    } = {}
  ) {
    const { fromPhone, keyword, startDate, endDate, limit = 50, offset = 0 } = filters;

    const where: any = { groupId };

    if (fromPhone) {
      where.fromPhone = fromPhone;
    }

    if (keyword) {
      where.OR = [
        { text: { contains: keyword } },
        { keywords: { path: '$', array_contains: keyword } },
      ];
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const [messages, total] = await Promise.all([
      prisma.groupMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.groupMessage.count({ where }),
    ]);

    return { messages, total };
  }

  /**
   * 获取群组统计
   */
  static async getGroupStats(groupId: string, period: '7d' | '30d' | '90d' = '7d') {
    const daysMap = { '7d': 7, '30d': 30, '90d': 90 };
    const days = daysMap[period];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // 消息数量趋势
    const messageTrend = await prisma.$queryRaw<any[]>`
      SELECT 
        DATE(createdAt) as date,
        COUNT(*) as count
      FROM GroupMessage
      WHERE groupId = ${groupId}
        AND createdAt >= ${startDate}
      GROUP BY DATE(createdAt)
      ORDER BY date ASC
    `;

    // 活跃成员统计
    const activeMembers = await prisma.groupMember.findMany({
      where: {
        groupId,
        isActive: true,
        lastMessageAt: { gte: startDate },
      },
      orderBy: { messageCount: 'desc' },
      take: 10,
    });

    // 关键词命中统计
    const keywordHits = await prisma.groupMessage.findMany({
      where: {
        groupId,
        keywords: {
          not: undefined,
        },
        createdAt: { gte: startDate },
      },
      select: { keywords: true },
    });

    // 统计关键词出现次数
    const keywordCount: Record<string, number> = {};
    keywordHits.forEach(msg => {
      const keywords = msg.keywords as string[] || [];
      keywords.forEach(kw => {
        keywordCount[kw] = (keywordCount[kw] || 0) + 1;
      });
    });

    // 成员增长趋势
    const memberTrend = await prisma.$queryRaw<any[]>`
      SELECT 
        DATE(joinedAt) as date,
        COUNT(*) as count
      FROM GroupMember
      WHERE groupId = ${groupId}
        AND joinedAt >= ${startDate}
      GROUP BY DATE(joinedAt)
      ORDER BY date ASC
    `;

    // 总体统计
    const totalMessages = await prisma.groupMessage.count({
      where: { groupId, createdAt: { gte: startDate } },
    });

    const totalMembers = await prisma.groupMember.count({
      where: { groupId, isActive: true },
    });

    return {
      period,
      totalMessages,
      totalMembers,
      messageTrend,
      memberTrend,
      activeMembers,
      keywordHits: keywordCount,
    };
  }

  /**
   * 获取群成员列表
   */
  static async getGroupMembers(
    groupId: string,
    filters: {
      isActive?: boolean;
      search?: string;
      limit?: number;
      offset?: number;
    } = {}
  ) {
    const { isActive, search, limit = 50, offset = 0 } = filters;

    const where: any = { groupId };

    if (typeof isActive === 'boolean') {
      where.isActive = isActive;
    }

    if (search) {
      where.OR = [
        { phoneE164: { contains: search } },
        { displayName: { contains: search } },
      ];
    }

    const [members, total] = await Promise.all([
      prisma.groupMember.findMany({
        where,
        orderBy: { messageCount: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.groupMember.count({ where }),
    ]);

    return { members, total };
  }

  /**
   * 同步群成员
   */
  static async syncGroupMembers(groupId: string, whatsappService: WPPConnectService) {
    try {
      logger.info({ groupId }, '开始同步群成员');

      // 1. 查询数据库中的群组
      const group = await prisma.whatsAppGroup.findUnique({
        where: { id: groupId },
      });

      if (!group) {
        throw new Error('群组不存在');
      }

      // 2. 从 WhatsApp 获取群成员列表
      const participants = await whatsappService.getGroupParticipants(group.groupId);
      
      if (!participants || participants.length === 0) {
        logger.warn({ groupId, whatsappGroupId: group.groupId }, '未获取到群成员');
        return {
          syncedCount: 0,
          newCount: 0,
        };
      }

      logger.info({ groupId, participantCount: participants.length }, '获取到群成员列表');

      // 3. 同步每个成员
      let newCount = 0;
      let syncedCount = 0;

      for (const participant of participants) {
        try {
          // 检查成员是否已存在
          const existing = await prisma.groupMember.findFirst({
            where: {
              groupId: group.id,
              phoneE164: participant.phoneE164,
            },
          });

          if (existing) {
            // 更新现有成员
            await prisma.groupMember.update({
              where: { id: existing.id },
              data: {
                role: participant.isAdmin ? 'admin' : 'member',
                displayName: participant.name || existing.displayName,
                profilePicUrl: participant.profilePicUrl || existing.profilePicUrl,  // 🖼️ 更新头像
                isActive: true,
              },
            });
          } else {
            // 创建新成员
            await prisma.groupMember.create({
              data: {
                groupId: group.id,
                phoneE164: participant.phoneE164,
                displayName: participant.name || null,
                profilePicUrl: participant.profilePicUrl || null,  // 🖼️ 保存头像
                role: participant.isAdmin ? 'admin' : 'member',
                isActive: true,
                joinedAt: new Date(),
              },
            });
            newCount++;
          }
          syncedCount++;
        } catch (error) {
          logger.error({ participant, error }, '同步单个成员失败');
        }
      }

      // 4. 更新群组的成员数量
      await prisma.whatsAppGroup.update({
        where: { id: group.id },
        data: {
          memberCount: participants.length,
          updatedAt: new Date(),
        },
      });

      logger.info({ groupId, syncedCount, newCount }, '群成员同步完成');

      return {
        syncedCount,
        newCount,
      };
    } catch (error) {
      logger.error('同步群成员失败', { error, groupId } as any);
      throw error;
    }
  }

  // ==================== 统计方法 ====================

  /**
   * 获取概览统计
   */
  static async getOverviewStats() {
    try {
      const [
        totalGroups,
        activeGroups,
        monitoringGroups,
        totalMessages,
        totalJoinTasks,
        totalBroadcasts,
      ] = await Promise.all([
        prisma.whatsAppGroup.count(),
        prisma.whatsAppGroup.count({ where: { isActive: true } }),
        prisma.whatsAppGroup.count({ where: { isMonitoring: true } }),
        prisma.groupMessage.count(),
        prisma.joinGroupTask.count(),
        prisma.groupBroadcast.count(),
      ]);

      // 获取运行中的任务
      const runningJoinTasks = await prisma.joinGroupTask.count({
        where: { status: 'running' },
      });
      const runningBroadcasts = await prisma.groupBroadcast.count({
        where: { status: 'running' },
      });

      return {
        groups: {
          total: totalGroups,
          active: activeGroups,
          monitoring: monitoringGroups,
        },
        messages: {
          total: totalMessages,
        },
        joinTasks: {
          total: totalJoinTasks,
          running: runningJoinTasks,
        },
        broadcasts: {
          total: totalBroadcasts,
          running: runningBroadcasts,
        },
      };
    } catch (error) {
      logger.error('获取概览统计失败', { error } as any);
      throw error;
    }
  }

  /**
   * 获取进群任务统计
   */
  static async getJoinTasksStats(period: '7d' | '30d' | '90d' = '7d') {
    try {
      const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // 获取时间段内的任务
      const tasks = await prisma.joinGroupTask.findMany({
        where: {
          createdAt: {
            gte: startDate,
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      // 按状态统计
      const byStatus: Record<string, number> = {};
      tasks.forEach(task => {
        byStatus[task.status] = (byStatus[task.status] || 0) + 1;
      });

      // 计算成功率
      const completed = tasks.filter(t => t.status === 'completed');
      const totalSuccess = completed.reduce((sum, t) => sum + t.joinedCount, 0);
      const totalAttempts = completed.reduce((sum, t) => sum + t.totalLinks, 0);
      const successRate = totalAttempts > 0 ? Math.round((totalSuccess / totalAttempts) * 100) : 0;

      // 每日趋势
      const dailyTrend: Array<{ date: string; joined: number; failed: number }> = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        
        const dayTasks = tasks.filter(t => {
          const taskDate = new Date(t.createdAt);
          return taskDate >= date && taskDate < nextDate;
        });
        
        const joined = dayTasks.reduce((sum, t) => sum + t.joinedCount, 0);
        const failed = dayTasks.reduce((sum, t) => sum + t.failedCount, 0);
        
        dailyTrend.push({
          date: date.toISOString().split('T')[0],
          joined,
          failed,
        });
      }

      return {
        total: tasks.length,
        byStatus,
        successRate,
        totalJoined: totalSuccess,
        totalFailed: tasks.reduce((sum, t) => sum + t.failedCount, 0),
        dailyTrend,
      };
    } catch (error) {
      logger.error('获取进群任务统计失败', { error } as any);
      throw error;
    }
  }

  /**
   * 获取群发任务统计
   */
  static async getBroadcastsStats(period: '7d' | '30d' | '90d' = '7d') {
    try {
      const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // 获取时间段内的任务
      const broadcasts = await prisma.groupBroadcast.findMany({
        where: {
          createdAt: {
            gte: startDate,
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      // 按状态统计
      const byStatus: Record<string, number> = {};
      broadcasts.forEach(broadcast => {
        byStatus[broadcast.status] = (byStatus[broadcast.status] || 0) + 1;
      });

      // 计算成功率
      const completed = broadcasts.filter(b => b.status === 'completed');
      const totalSent = completed.reduce((sum, b) => sum + b.sentCount, 0);
      const totalGroups = completed.reduce((sum, b) => sum + b.totalGroups, 0);
      const successRate = totalGroups > 0 ? Math.round((totalSent / totalGroups) * 100) : 0;

      // 每日趋势
      const dailyTrend: Array<{ date: string; sent: number; failed: number }> = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        
        const dayBroadcasts = broadcasts.filter(b => {
          const broadcastDate = new Date(b.createdAt);
          return broadcastDate >= date && broadcastDate < nextDate;
        });
        
        const sent = dayBroadcasts.reduce((sum, b) => sum + b.sentCount, 0);
        const failed = dayBroadcasts.reduce((sum, b) => sum + b.failedCount, 0);
        
        dailyTrend.push({
          date: date.toISOString().split('T')[0],
          sent,
          failed,
        });
      }

      return {
        total: broadcasts.length,
        byStatus,
        successRate,
        totalSent,
        totalFailed: broadcasts.reduce((sum, b) => sum + b.failedCount, 0),
        dailyTrend,
      };
    } catch (error) {
      logger.error('获取群发任务统计失败', { error } as any);
      throw error;
    }
  }
}

