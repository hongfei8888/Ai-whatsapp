'use client';

import { toast } from 'sonner';

export interface AccountNotification {
  accountId: string;
  accountName: string;
  type: 'status-change' | 'error' | 'new-message' | 'qr-needed';
  message: string;
  timestamp: Date;
}

/**
 * 账号通知管理器
 */
class AccountNotificationManager {
  private notifications: AccountNotification[] = [];
  private maxNotifications = 50;

  /**
   * 发送账号状态变化通知
   */
  notifyStatusChange(accountId: string, accountName: string, oldStatus: string, newStatus: string) {
    const message = `账号 ${accountName} 状态变更: ${oldStatus} → ${newStatus}`;
    
    this.addNotification({
      accountId,
      accountName,
      type: 'status-change',
      message,
      timestamp: new Date(),
    });

    // 根据状态显示不同类型的通知
    if (newStatus === 'online') {
      toast.success(message, {
        description: `账号已成功上线`,
        action: {
          label: '查看',
          onClick: () => window.location.href = '/accounts'
        },
      });
    } else if (newStatus === 'offline') {
      toast.warning(message, {
        description: '账号已离线',
        action: {
          label: '查看',
          onClick: () => window.location.href = '/accounts'
        },
      });
    } else if (newStatus === 'connecting') {
      toast.info(message, {
        description: '正在连接中...',
      });
    }
  }

  /**
   * 发送账号错误通知
   */
  notifyError(accountId: string, accountName: string, error: string) {
    const message = `账号 ${accountName} 发生错误`;
    
    this.addNotification({
      accountId,
      accountName,
      type: 'error',
      message: `${message}: ${error}`,
      timestamp: new Date(),
    });

    toast.error(message, {
      description: error,
      duration: 5000,
      action: {
        label: '查看详情',
        onClick: () => window.location.href = `/accounts`
      },
    });
  }

  /**
   * 发送需要扫码通知
   */
  notifyQRNeeded(accountId: string, accountName: string) {
    const message = `账号 ${accountName} 需要扫码登录`;
    
    this.addNotification({
      accountId,
      accountName,
      type: 'qr-needed',
      message,
      timestamp: new Date(),
    });

    toast.warning(message, {
      description: '请前往账号管理页面扫码',
      duration: 10000,
      action: {
        label: '立即扫码',
        onClick: () => window.location.href = '/accounts'
      },
    });
  }

  /**
   * 发送新消息通知（非当前账号）
   */
  notifyNewMessage(accountId: string, accountName: string, from: string, preview: string) {
    const message = `账号 ${accountName} 收到新消息`;
    
    this.addNotification({
      accountId,
      accountName,
      type: 'new-message',
      message: `来自 ${from}: ${preview}`,
      timestamp: new Date(),
    });

    toast.info(message, {
      description: `来自 ${from}: ${preview.substring(0, 50)}${preview.length > 50 ? '...' : ''}`,
      action: {
        label: '查看',
        onClick: () => window.location.href = '/chat'
      },
    });
  }

  /**
   * 添加通知到历史记录
   */
  private addNotification(notification: AccountNotification) {
    this.notifications.unshift(notification);
    
    // 保持最大通知数量
    if (this.notifications.length > this.maxNotifications) {
      this.notifications = this.notifications.slice(0, this.maxNotifications);
    }
  }

  /**
   * 获取所有通知
   */
  getNotifications(): AccountNotification[] {
    return [...this.notifications];
  }

  /**
   * 获取特定账号的通知
   */
  getAccountNotifications(accountId: string): AccountNotification[] {
    return this.notifications.filter(n => n.accountId === accountId);
  }

  /**
   * 清除所有通知
   */
  clearNotifications() {
    this.notifications = [];
  }

  /**
   * 清除特定账号的通知
   */
  clearAccountNotifications(accountId: string) {
    this.notifications = this.notifications.filter(n => n.accountId !== accountId);
  }
}

// 导出单例
export const accountNotifications = new AccountNotificationManager();

