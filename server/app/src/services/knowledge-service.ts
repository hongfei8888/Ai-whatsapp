import { prisma } from '../prisma';
import { z } from 'zod';
import { logger } from '../logger';

// 类型定义
export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  category: string;
  categoryInfo?: {
    name: string;
    icon: string;
    color: string;
  };
  tags: string[];
  keywords: string[];
  priority: number;
  usageCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SearchResult extends KnowledgeItem {
  score: number;
  matchType: 'title' | 'content' | 'tag' | 'keyword';
}

export interface KnowledgeCreatePayload {
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  keywords?: string[];
  priority?: number;
}

export interface FAQCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

// 数据验证Schema
export const knowledgeCreateSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(5000),
  category: z.string().max(50).optional(),
  tags: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),
  priority: z.number().int().min(0).max(100).optional(),
});

export const knowledgeUpdateSchema = knowledgeCreateSchema.partial();

export const categoryCreateSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().max(200).optional(),
  icon: z.string().max(20).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  sortOrder: z.number().int().min(0).optional(),
});

// 知识库服务类
export class KnowledgeService {
  // 创建知识库条目
  static async createKnowledge(data: KnowledgeCreatePayload): Promise<KnowledgeItem> {
    const validatedData = knowledgeCreateSchema.parse(data);
    
    // 处理标签和关键词
    const tags = sanitizeArray(validatedData.tags);
    const keywords = sanitizeArray(validatedData.keywords);
    
    // 自动提取关键词（如果没有提供）
    let finalKeywords = keywords;
    if (finalKeywords.length === 0) {
      finalKeywords = extractKeywords(validatedData.title, validatedData.content);
    }
    
    const knowledge = await prisma.knowledgeBase.create({
      data: {
        title: validatedData.title,
        content: validatedData.content,
        category: validatedData.category || 'general',
        tags: tags,
        keywords: finalKeywords,
        priority: validatedData.priority || 0,
        isActive: true,
        usageCount: 0,
      },
    });
    
    return this.serializeKnowledge(knowledge);
  }

  // 更新知识库条目
  static async updateKnowledge(id: string, data: Partial<KnowledgeCreatePayload>): Promise<KnowledgeItem> {
    const existing = await prisma.knowledgeBase.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Knowledge item not found');
    }

    const validatedData = knowledgeUpdateSchema.parse(data);
    
    // 处理标签和关键词
    const tags = validatedData.tags ? sanitizeArray(validatedData.tags) : (existing.tags as string[] || []);
    const keywords = validatedData.keywords ? sanitizeArray(validatedData.keywords) : (existing.keywords as string[] || []);
    
    const knowledge = await prisma.knowledgeBase.update({
      where: { id },
      data: {
        title: validatedData.title ?? existing.title,
        content: validatedData.content ?? existing.content,
        category: validatedData.category ?? existing.category,
        tags,
        keywords,
        priority: validatedData.priority ?? existing.priority,
      },
    });
    
    return this.serializeKnowledge(knowledge);
  }

  // 删除知识库条目
  static async deleteKnowledge(id: string): Promise<boolean> {
    const existing = await prisma.knowledgeBase.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Knowledge item not found');
    }

    // 软删除：设置为非激活状态
    await prisma.knowledgeBase.update({
      where: { id },
      data: { isActive: false },
    });
    
    return true;
  }

  // 获取知识库条目
  static async getKnowledgeById(id: string): Promise<KnowledgeItem | null> {
    const knowledge = await prisma.knowledgeBase.findUnique({ where: { id } });
    return knowledge ? this.serializeKnowledge(knowledge) : null;
  }

  // 获取知识库列表
  static async getKnowledgeList(filters?: {
    category?: string;
    search?: string;
    tags?: string[];
    isActive?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<KnowledgeItem[]> {
    const where: any = {};
    
    if (filters?.category) {
      where.category = filters.category;
    }
    
    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search } },
        { content: { contains: filters.search } },
        { tags: { hasSome: [filters.search] } },
        { keywords: { hasSome: [filters.search] } },
      ];
    }
    
    if (filters?.tags?.length) {
      where.tags = { hasSome: filters.tags };
    }
    
    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    } else {
      where.isActive = true;
    }

    const queryOptions: any = {
      where,
      orderBy: [
        { priority: 'desc' },
        { usageCount: 'desc' },
        { createdAt: 'desc' },
      ],
    };

    if (filters?.limit) {
      queryOptions.take = filters.limit;
    }
    if (filters?.offset) {
      queryOptions.skip = filters.offset;
    }

    const knowledgeItems = await prisma.knowledgeBase.findMany(queryOptions);
    return Promise.all(knowledgeItems.map(item => this.serializeKnowledge(item)));
  }

  // 智能搜索知识库
  static async searchKnowledge(query: string, options?: {
    category?: string;
    limit?: number;
    minScore?: number;
  }): Promise<SearchResult[]> {
    const limit = options?.limit || 10;
    const minScore = options?.minScore || 0.1;
    
    try {
      // 使用FTS5全文搜索
      const ftsResults = await prisma.$queryRaw<any[]>`
        SELECT 
          kb.*,
          bm25(knowledge_fts) as score,
          'fts' as match_type
        FROM knowledge_fts
        JOIN KnowledgeBase kb ON knowledge_fts.rowid = kb.id
        WHERE knowledge_fts MATCH ${query}
          AND kb.isActive = 1
          ${options?.category ? prisma.$queryRaw`AND kb.category = ${options.category}` : prisma.$queryRaw``}
        ORDER BY bm25(knowledge_fts), kb.priority DESC, kb.usageCount DESC
        LIMIT ${limit * 2}
      `;

      // 如果FTS搜索没有结果，使用传统搜索
      if (ftsResults.length === 0) {
        const traditionalResults = await this.traditionalSearch(query, options);
        return traditionalResults;
      }

      // 过滤和格式化FTS结果
      const results: SearchResult[] = [];
      for (const item of ftsResults) {
        if (item.score >= minScore) {
          const knowledge = this.serializeKnowledge(item);
          results.push({
            ...knowledge,
            score: item.score,
            matchType: 'content' as const,
          } as any);
        }
      }

      return results.slice(0, limit);
    } catch (error) {
      logger.warn('FTS search failed, falling back to traditional search', { error, query } as any);
      return this.traditionalSearch(query, options);
    }
  }

  // 传统搜索方法（FTS失败时的备用方案）
  private static async traditionalSearch(query: string, options?: {
    category?: string;
    limit?: number;
  }): Promise<SearchResult[]> {
    const where: any = {
      isActive: true,
      OR: [
        { title: { contains: query } },
        { content: { contains: query } },
        { tags: { hasSome: [query] } },
        { keywords: { hasSome: [query] } },
      ],
    };

    if (options?.category) {
      where.category = options.category;
    }

    const knowledgeItems = await prisma.knowledgeBase.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { usageCount: 'desc' },
        { createdAt: 'desc' },
      ],
      take: options?.limit || 10,
    });

    // 计算简单的匹配分数
    return knowledgeItems.map(item => {
      const knowledge = this.serializeKnowledge(item);
      let score = 0;
      let matchType: 'title' | 'content' | 'tag' | 'keyword' = 'content';

      // 标题匹配得分最高
      if (item.title.toLowerCase().includes(query.toLowerCase())) {
        score += 0.8;
        matchType = 'title';
      }

      // 内容匹配
      if (item.content.toLowerCase().includes(query.toLowerCase())) {
        score += 0.6;
      }

      // 标签匹配
      const tags = item.tags as string[] || [];
      if (tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))) {
        score += 0.7;
        matchType = 'tag';
      }

      // 关键词匹配
      const keywords = item.keywords as string[] || [];
      if (keywords.some(keyword => keyword.toLowerCase().includes(query.toLowerCase()))) {
        score += 0.9;
        matchType = 'keyword';
      }

      return {
        ...knowledge,
        score: Math.min(score, 1.0),
        matchType,
      } as any;
    }).filter(result => result.score > 0.1);
  }

  // 根据问题匹配最佳答案
  static async findBestAnswer(question: string): Promise<KnowledgeItem | null> {
    const results = await this.searchKnowledge(question, { limit: 1, minScore: 0.3 });
    return results.length > 0 ? results[0] : null;
  }

  // 增加使用计数
  static async incrementUsage(id: string): Promise<void> {
    await prisma.knowledgeBase.update({
      where: { id },
      data: {
        usageCount: { increment: 1 },
      },
    });
  }

  // 获取热门知识库条目
  static async getPopularItems(limit = 10): Promise<KnowledgeItem[]> {
    const knowledgeItems = await prisma.knowledgeBase.findMany({
      where: { isActive: true },
      orderBy: [
        { usageCount: 'desc' },
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
    });

    return Promise.all(knowledgeItems.map(item => this.serializeKnowledge(item)));
  }

  // 获取知识库统计
  static async getKnowledgeStats(): Promise<{
    total: number;
    active: number;
    categories: Array<{
      category: string;
      count: number;
    }>;
    popular: Array<{
      id: string;
      title: string;
      usageCount: number;
    }>;
  }> {
    const total = await prisma.knowledgeBase.count();
    const active = await prisma.knowledgeBase.count({ where: { isActive: true } });
    
    // 按分类统计
    const categoryStats = await prisma.knowledgeBase.groupBy({
      by: ['category'],
      where: { isActive: true },
      _count: { category: true },
    });
    
    // 热门条目
    const popular = await prisma.knowledgeBase.findMany({
      where: { isActive: true },
      orderBy: { usageCount: 'desc' },
      take: 5,
      select: { id: true, title: true, usageCount: true },
    });
    
    return {
      total,
      active,
      categories: categoryStats.map(item => ({
        category: item.category,
        count: item._count.category,
      })),
      popular: popular.map(item => ({
        id: item.id,
        title: item.title,
        usageCount: item.usageCount,
      })),
    };
  }

  // 分类管理
  static async getCategories(): Promise<FAQCategory[]> {
    return prisma.fAQCategory.findMany({
      orderBy: { sortOrder: 'asc' },
    }) as any;
  }

  static async createCategory(data: {
    name: string;
    description?: string;
    icon?: string;
    color?: string;
    sortOrder?: number;
  }): Promise<FAQCategory> {
    const validatedData = categoryCreateSchema.parse(data);
    
    return prisma.fAQCategory.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        icon: validatedData.icon,
        color: validatedData.color,
        sortOrder: validatedData.sortOrder || 0,
        isActive: true,
      },
    }) as any;
  }

  static async updateCategory(id: string, data: Partial<{
    name: string;
    description?: string;
    icon?: string;
    color?: string;
    sortOrder?: number;
  }>): Promise<FAQCategory> {
    const validatedData = categoryCreateSchema.partial().parse(data);
    
    return prisma.fAQCategory.update({
      where: { id },
      data: validatedData,
    }) as any;
  }

  static async deleteCategory(id: string): Promise<boolean> {
    // 检查是否有知识库条目使用此分类
    const knowledgeCount = await prisma.knowledgeBase.count({
      where: { category: id },
    });
    
    if (knowledgeCount > 0) {
      throw new Error('Cannot delete category with existing knowledge items');
    }
    
    await prisma.fAQCategory.update({
      where: { id },
      data: { isActive: false },
    });
    
    return true;
  }

  // 序列化知识库条目
  private static async serializeKnowledge(knowledge: any): Promise<KnowledgeItem> {
    // 获取分类信息
    const categoryInfo = await prisma.fAQCategory.findUnique({
      where: { name: knowledge.category },
    });
    
    return {
      id: knowledge.id,
      title: knowledge.title,
      content: knowledge.content,
      category: knowledge.category,
      categoryInfo: categoryInfo ? {
        name: categoryInfo.name,
        icon: categoryInfo.icon || '📝',
        color: categoryInfo.color || '#6B7280',
      } : undefined,
      tags: (knowledge.tags as string[]) || [],
      keywords: (knowledge.keywords as string[]) || [],
      priority: knowledge.priority || 0,
      usageCount: knowledge.usageCount || 0,
      isActive: knowledge.isActive,
      createdAt: knowledge.createdAt.toISOString(),
      updatedAt: knowledge.updatedAt.toISOString(),
    };
  }
}

// 工具函数
function sanitizeArray(arr?: string[]): string[] {
  if (!arr) return [];
  return Array.from(new Set(arr.filter(item => item.trim().length > 0).map(item => item.trim())));
}

function extractKeywords(title: string, content: string): string[] {
  const text = `${title} ${content}`.toLowerCase();
  const keywords = new Set<string>();
  
  // 简单的关键词提取逻辑
  const commonWords = ['的', '了', '在', '是', '我', '你', '他', '她', '它', '们', '这', '那', '有', '和', '与', '或', '但', '因为', '所以', '如果', '当', '如何', '什么', '为什么', '怎么', '哪里', '哪个', '什么时候'];
  
  // 提取中文词汇（简单实现）
  const chineseWords = text.match(/[\u4e00-\u9fff]+/g) || [];
  chineseWords.forEach(word => {
    if (word.length >= 2 && word.length <= 6 && !commonWords.includes(word)) {
      keywords.add(word);
    }
  });
  
  // 提取英文单词
  const englishWords = text.match(/[a-zA-Z]+/g) || [];
  englishWords.forEach(word => {
    if (word.length >= 3 && word.length <= 20) {
      keywords.add(word.toLowerCase());
    }
  });
  
  return Array.from(keywords).slice(0, 10); // 最多返回10个关键词
}
