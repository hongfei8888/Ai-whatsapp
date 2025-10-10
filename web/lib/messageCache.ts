/**
 * 消息缓存工具类
 * 使用 localStorage 缓存消息列表，提升加载速度
 */

interface CacheData {
  threadId: string;
  messages: any[];
  timestamp: number;
}

class MessageCache {
  private static CACHE_KEY = 'whatsapp_messages_cache';
  private static CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24小时
  private static MAX_CACHE_SIZE = 50; // 最多缓存50个会话
  
  /**
   * 保存消息到缓存
   */
  static save(threadId: string, messages: any[]): void {
    try {
      const cache: CacheData = {
        threadId,
        messages,
        timestamp: Date.now(),
      };
      
      const key = `${this.CACHE_KEY}_${threadId}`;
      localStorage.setItem(key, JSON.stringify(cache));
      
      // 清理旧缓存
      this.cleanupOldCaches();
      
      console.log(`💾 [缓存] 已保存 ${messages.length} 条消息 (会话: ${threadId.substring(0, 8)}...)`);
    } catch (error) {
      console.error('❌ [缓存] 保存失败:', error);
      // localStorage 可能已满，尝试清理
      this.clearAll();
    }
  }
  
  /**
   * 从缓存加载消息
   */
  static load(threadId: string): any[] | null {
    try {
      const key = `${this.CACHE_KEY}_${threadId}`;
      const cached = localStorage.getItem(key);
      
      if (!cached) {
        console.log(`ℹ️ [缓存] 未找到缓存 (会话: ${threadId.substring(0, 8)}...)`);
        return null;
      }
      
      const cache: CacheData = JSON.parse(cached);
      
      // 检查是否过期
      if (Date.now() - cache.timestamp > this.CACHE_EXPIRY) {
        console.log(`⏰ [缓存] 缓存已过期 (会话: ${threadId.substring(0, 8)}...)`);
        this.clear(threadId);
        return null;
      }
      
      console.log(`✅ [缓存] 已加载 ${cache.messages.length} 条消息 (会话: ${threadId.substring(0, 8)}...)`);
      return cache.messages;
    } catch (error) {
      console.error('❌ [缓存] 加载失败:', error);
      return null;
    }
  }
  
  /**
   * 清除指定会话的缓存
   */
  static clear(threadId: string): void {
    try {
      const key = `${this.CACHE_KEY}_${threadId}`;
      localStorage.removeItem(key);
      console.log(`🗑️ [缓存] 已清除缓存 (会话: ${threadId.substring(0, 8)}...)`);
    } catch (error) {
      console.error('❌ [缓存] 清除失败:', error);
    }
  }
  
  /**
   * 清除所有缓存
   */
  static clearAll(): void {
    try {
      const keys = Object.keys(localStorage);
      let count = 0;
      
      keys.forEach((key) => {
        if (key.startsWith(this.CACHE_KEY)) {
          localStorage.removeItem(key);
          count++;
        }
      });
      
      console.log(`🗑️ [缓存] 已清除所有缓存 (${count} 个会话)`);
    } catch (error) {
      console.error('❌ [缓存] 清除所有缓存失败:', error);
    }
  }
  
  /**
   * 清理旧缓存（保留最新的N个）
   */
  private static cleanupOldCaches(): void {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_KEY));
      
      if (cacheKeys.length <= this.MAX_CACHE_SIZE) {
        return; // 未超出限制
      }
      
      // 获取所有缓存及其时间戳
      const caches: Array<{ key: string; timestamp: number }> = [];
      
      cacheKeys.forEach(key => {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          caches.push({ key, timestamp: data.timestamp || 0 });
        } catch (e) {
          // 无效的缓存，直接删除
          localStorage.removeItem(key);
        }
      });
      
      // 按时间戳排序
      caches.sort((a, b) => b.timestamp - a.timestamp);
      
      // 删除最旧的缓存
      const toDelete = caches.slice(this.MAX_CACHE_SIZE);
      toDelete.forEach(cache => {
        localStorage.removeItem(cache.key);
      });
      
      if (toDelete.length > 0) {
        console.log(`🧹 [缓存] 已清理 ${toDelete.length} 个旧缓存`);
      }
    } catch (error) {
      console.error('❌ [缓存] 清理失败:', error);
    }
  }
  
  /**
   * 获取缓存统计信息
   */
  static getStats(): { count: number; totalSize: string } {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_KEY));
      
      let totalSize = 0;
      cacheKeys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += new Blob([value]).size;
        }
      });
      
      return {
        count: cacheKeys.length,
        totalSize: `${(totalSize / 1024).toFixed(2)} KB`,
      };
    } catch (error) {
      console.error('❌ [缓存] 获取统计信息失败:', error);
      return { count: 0, totalSize: '0 KB' };
    }
  }
}

export default MessageCache;

