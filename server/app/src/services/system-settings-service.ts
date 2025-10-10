import { prisma } from '../prisma';
import { logger } from '../logger';

// 系统设置接口
export interface SystemSettings {
  // 自动回复设置
  aiEnabled: boolean;
  autoReply: boolean;
  
  // 冷却时间设置
  cooldownHours: number;
  perContactReplyCooldownMinutes: number;
  
  // 消息限制
  maxMessagesPerDay: number;
  maxMessagesPerHour: number;
  
  // 通知设置
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  
  // 翻译设置
  translationEnabled: boolean;
  defaultTargetLanguage: string;
  
  // 其他设置
  autoSyncContacts: boolean;
  debugMode: boolean;
}

// 默认设置
const DEFAULT_SETTINGS: SystemSettings = {
  aiEnabled: true,
  autoReply: true,
  cooldownHours: 24,
  perContactReplyCooldownMinutes: 10,
  maxMessagesPerDay: 100,
  maxMessagesPerHour: 20,
  notificationsEnabled: true,
  emailNotifications: false,
  translationEnabled: false,
  defaultTargetLanguage: 'zh',
  autoSyncContacts: false,
  debugMode: false,
};

// 设置存储在内存中，使用简单的键值存储
let cachedSettings: SystemSettings | null = null;

/**
 * 获取系统设置
 */
export async function getSystemSettings(): Promise<SystemSettings> {
  try {
    // 如果有缓存，直接返回
    if (cachedSettings) {
      return cachedSettings;
    }

    // 尝试从环境变量或配置文件加载
    // 目前使用默认设置
    cachedSettings = { ...DEFAULT_SETTINGS };
    
    logger.info('System settings loaded', { settings: cachedSettings } as any);
    return cachedSettings;
  } catch (error) {
    logger.error('Failed to load system settings', { error } as any);
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 * 更新系统设置
 */
export async function updateSystemSettings(
  updates: Partial<SystemSettings>
): Promise<SystemSettings> {
  try {
    // 获取当前设置
    const current = await getSystemSettings();
    
    // 合并更新
    const updated: SystemSettings = {
      ...current,
      ...updates,
    };
    
    // 验证设置值
    validateSettings(updated);
    
    // 更新缓存
    cachedSettings = updated;
    
    // 这里可以添加持久化逻辑（保存到文件或数据库）
    // 目前只保存在内存中
    
    logger.info('System settings updated', { 
      updates,
      newSettings: updated 
    } as any);
    
    return updated;
  } catch (error) {
    logger.error('Failed to update system settings', { error, updates } as any);
    throw error;
  }
}

/**
 * 验证设置值
 */
function validateSettings(settings: SystemSettings): void {
  // 验证数值范围
  if (settings.cooldownHours < 0 || settings.cooldownHours > 168) {
    throw new Error('冷却时间必须在 0-168 小时之间');
  }
  
  if (settings.perContactReplyCooldownMinutes < 0 || settings.perContactReplyCooldownMinutes > 1440) {
    throw new Error('联系人回复间隔必须在 0-1440 分钟之间');
  }
  
  if (settings.maxMessagesPerDay < 0 || settings.maxMessagesPerDay > 10000) {
    throw new Error('每日消息限制必须在 0-10000 之间');
  }
  
  if (settings.maxMessagesPerHour < 0 || settings.maxMessagesPerHour > 1000) {
    throw new Error('每小时消息限制必须在 0-1000 之间');
  }
}

/**
 * 重置设置为默认值
 */
export async function resetSystemSettings(): Promise<SystemSettings> {
  cachedSettings = { ...DEFAULT_SETTINGS };
  logger.info('System settings reset to defaults');
  return cachedSettings;
}

/**
 * 获取特定设置项
 */
export async function getSetting<K extends keyof SystemSettings>(
  key: K
): Promise<SystemSettings[K]> {
  const settings = await getSystemSettings();
  return settings[key];
}

/**
 * 设置特定设置项
 */
export async function setSetting<K extends keyof SystemSettings>(
  key: K,
  value: SystemSettings[K]
): Promise<SystemSettings> {
  return updateSystemSettings({ [key]: value } as Partial<SystemSettings>);
}

