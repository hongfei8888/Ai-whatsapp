import crypto from 'crypto';
import axios from 'axios';
import { prisma } from '../prisma';
import { logger } from '../logger';

// 百度翻译配置
interface BaiduTranslateConfig {
  appId: string;
  secretKey: string;
  apiUrl: string;
}

// 翻译结果接口
interface TranslationResult {
  translatedText: string;
  sourceLang: string;
  fromCache: boolean;
}

export class TranslationService {
  private static config: BaiduTranslateConfig = {
    appId: process.env.BAIDU_TRANSLATE_APP_ID || '',
    secretKey: process.env.BAIDU_TRANSLATE_SECRET_KEY || '',
    apiUrl: 'https://fanyi-api.baidu.com/api/trans/vip/translate',
  };

  // 生成文本哈希（用于缓存）
  static generateHash(text: string, targetLang: string = 'zh'): string {
    return crypto.createHash('md5').update(text + targetLang).digest('hex');
  }

  // 生成百度翻译签名
  static generateSign(query: string, salt: string): string {
    const { appId, secretKey } = this.config;
    const str = appId + query + salt + secretKey;
    return crypto.createHash('md5').update(str).digest('hex');
  }

  // 检测语言（简单实现）
  static detectLanguage(text: string): string {
    // 检测是否包含中文
    if (/[\u4e00-\u9fa5]/.test(text)) return 'zh';
    // 检测是否包含日文
    if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) return 'jp';
    // 检测是否包含韩文
    if (/[\uAC00-\uD7AF]/.test(text)) return 'kor';
    // 默认英文
    return 'en';
  }

  // 调用百度翻译 API
  static async callBaiduTranslate(
    text: string,
    from: string = 'auto',
    to: string = 'zh'
  ): Promise<{ translatedText: string; sourceLang: string }> {
    const { appId, secretKey, apiUrl } = this.config;

    // 检查配置
    if (!appId || !secretKey) {
      throw new Error('百度翻译 API 未配置，请在 .env 文件中设置 BAIDU_TRANSLATE_APP_ID 和 BAIDU_TRANSLATE_SECRET_KEY');
    }

    const salt = Date.now().toString();
    const sign = this.generateSign(text, salt);

    try {
      logger.info('Calling Baidu Translate API', {
        textLength: text.length,
        from,
        to,
      } as any);

      const response = await axios.get(apiUrl, {
        params: {
          q: text,
          from,
          to,
          appid: appId,
          salt,
          sign,
        },
        timeout: 5000, // 5秒超时
      });

      if (response.data.error_code) {
        throw new Error(`Baidu API Error: ${response.data.error_msg}`);
      }

      const result = response.data.trans_result[0];
      return {
        translatedText: result.dst,
        sourceLang: response.data.from || from,
      };
    } catch (error: any) {
      if (error.response) {
        logger.error('Baidu API response error', {
          status: error.response.status,
          data: error.response.data,
        } as any);
      } else {
        logger.error('Baidu API request error', { error: error.message } as any);
      }
      throw new Error(`翻译失败: ${error.message}`);
    }
  }

  // 翻译文本（带缓存）
  static async translateText(
    accountId: string,
    text: string,
    targetLang: string = 'zh'
  ): Promise<TranslationResult> {
    // 空文本检查
    if (!text || !text.trim()) {
      throw new Error('翻译文本不能为空');
    }

    // 文本长度检查（百度API限制2000字符）
    if (text.length > 2000) {
      throw new Error('文本长度超过2000字符，请分段翻译');
    }

    // 生成哈希用于缓存查询
    const textHash = this.generateHash(text, targetLang);

    // 查询缓存
    const cached = await prisma.translation.findUnique({
      where: { 
        accountId_textHash: {
          accountId,
          textHash
        }
      },
    });

    if (cached) {
      logger.info('Translation cache hit', { textHash } as any);
      
      // 更新使用次数
      await prisma.translation.update({
        where: { id: cached.id },
        data: { usageCount: { increment: 1 } },
      });

      return {
        translatedText: cached.translatedText,
        sourceLang: cached.sourceLang,
        fromCache: true,
      };
    }

    // 调用百度翻译 API
    logger.info('Translation cache miss, calling API', { textHash } as any);
    const { translatedText, sourceLang } = await this.callBaiduTranslate(text, 'auto', targetLang);

    // 保存到数据库
    await prisma.translation.create({
      data: {
        accountId,
        originalText: text,
        translatedText,
        sourceLang,
        targetLang,
        textHash,
        provider: 'baidu',
      },
    });

    logger.info('Translation cached', {
      textHash,
      sourceLang,
      targetLang,
    } as any);

    return {
      translatedText,
      sourceLang,
      fromCache: false,
    };
  }

  // 批量翻译消息
  static async translateMessages(messageIds: string[]): Promise<any[]> {
    const messages = await prisma.message.findMany({
      where: { id: { in: messageIds } },
    });

    logger.info('Batch translating messages', {
      count: messages.length,
    } as any);

    const results = [];
    for (const message of messages) {
      // 跳过空消息或已翻译的消息
      if (!message.text || message.translatedText) {
        results.push(message);
        continue;
      }

      try {
        const { translatedText } = await this.translateText(message.accountId, message.text);
        
        const updated = await prisma.message.update({
          where: { id: message.id },
          data: { translatedText },
        });

        results.push(updated);
        logger.info('Message translated', {
          messageId: message.id,
          fromCache: false,
        } as any);
      } catch (error: any) {
        logger.error('Failed to translate message', {
          messageId: message.id,
          error: error.message,
        } as any);
        results.push(message);
      }
    }

    return results;
  }

  // 启用/禁用会话自动翻译
  static async toggleThreadAutoTranslate(threadId: string, enabled: boolean): Promise<any> {
    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      throw new Error('会话不存在');
    }

    const updated = await prisma.thread.update({
      where: { id: threadId },
      data: { autoTranslate: enabled },
    });

    logger.info('Thread auto-translate toggled', {
      threadId,
      enabled,
    } as any);

    return updated;
  }

  // 获取翻译统计
  static async getTranslationStats(): Promise<any> {
    const [total, totalUsage, topTranslations] = await Promise.all([
      prisma.translation.count(),
      prisma.translation.aggregate({
        _sum: { usageCount: true },
      }),
      prisma.translation.findMany({
        orderBy: { usageCount: 'desc' },
        take: 10,
        select: {
          originalText: true,
          translatedText: true,
          usageCount: true,
          sourceLang: true,
        },
      }),
    ]);

    return {
      totalTranslations: total,
      totalUsage: totalUsage._sum.usageCount || 0,
      topTranslations,
    };
  }

  // 清理旧的翻译缓存（可选）
  static async cleanupOldTranslations(daysOld: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await prisma.translation.deleteMany({
      where: {
        updatedAt: {
          lt: cutoffDate,
        },
        usageCount: {
          lte: 1, // 只清理使用次数少的
        },
      },
    });

    logger.info('Cleaned up old translations', {
      deleted: result.count,
      daysOld,
    } as any);

    return result.count;
  }
}

