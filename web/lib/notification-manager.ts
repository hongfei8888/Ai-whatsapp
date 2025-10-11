export type NotificationPriority = 'low' | 'medium' | 'high';

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  priority?: NotificationPriority;
  data?: any;
}

class NotificationManager {
  private permission: NotificationPermission = 'default';
  private enabled: boolean = false;
  private queue: NotificationOptions[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.permission = Notification.permission;
      this.loadSettings();
    }
  }

  /**
   * 从localStorage加载设置
   */
  private loadSettings() {
    try {
      const settings = localStorage.getItem('notification-settings');
      if (settings) {
        const { enabled } = JSON.parse(settings);
        this.enabled = enabled;
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    }
  }

  /**
   * 保存设置到localStorage
   */
  private saveSettings() {
    try {
      localStorage.setItem('notification-settings', JSON.stringify({
        enabled: this.enabled,
      }));
    } catch (error) {
      console.error('Failed to save notification settings:', error);
    }
  }

  /**
   * 请求通知权限
   */
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (this.permission === 'granted') {
      this.enabled = true;
      this.saveSettings();
      return true;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      
      if (permission === 'granted') {
        this.enabled = true;
        this.saveSettings();
        // 处理队列中的通知
        this.processQueue();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }

  /**
   * 发送通知
   */
  async send(options: NotificationOptions) {
    if (!this.enabled || this.permission !== 'granted') {
      // 如果未启用或未授权，添加到队列
      this.queue.push(options);
      return;
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/favicon.ico',
        tag: options.tag,
        data: options.data,
        badge: '/favicon.ico',
      });

      // 点击通知时聚焦窗口
      notification.onclick = () => {
        window.focus();
        notification.close();
        
        // 如果有自定义数据，可以执行相应操作
        if (options.data?.url) {
          window.location.href = options.data.url;
        }
      };

      // 自动关闭
      setTimeout(() => {
        notification.close();
      }, 5000);

    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  /**
   * 处理队列中的通知
   */
  private processQueue() {
    while (this.queue.length > 0) {
      const options = this.queue.shift();
      if (options) {
        this.send(options);
      }
    }
  }

  /**
   * 启用通知
   */
  async enable(): Promise<boolean> {
    if (this.permission !== 'granted') {
      return await this.requestPermission();
    }
    this.enabled = true;
    this.saveSettings();
    return true;
  }

  /**
   * 禁用通知
   */
  disable() {
    this.enabled = false;
    this.saveSettings();
  }

  /**
   * 获取当前状态
   */
  getStatus() {
    return {
      permission: this.permission,
      enabled: this.enabled,
      supported: 'Notification' in window,
    };
  }

  /**
   * 清空队列
   */
  clearQueue() {
    this.queue = [];
  }
}

// 单例模式
export const notificationManager = new NotificationManager();

