import { MessageTemplate, TemplateCategory } from '@prisma/client';
import { prisma } from '../prisma';
import { z } from 'zod';
import { ensureNoForbiddenKeyword } from '../guards/keyword-guard';

const PLACEHOLDER_REGEX = /\{\{\s*([a-zA-Z0-9_\u4e00-\u9fa5]+)\s*\}\}/g;

// 类型定义
export interface TemplatePayload {
  name: string;
  content: string;
  description?: string;
  category?: string;
  tags?: string[];
  variables?: string[];
  sortOrder?: number;
}

export interface TemplateWithCategory {
  id: string;
  name: string;
  content: string;
  description?: string;
  category: string;
  categoryInfo?: {
    name: string;
    icon: string;
    color: string;
  };
  tags: string[];
  variables: string[];
  usageCount: number;
  lastUsedAt?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateFilters {
  category?: string;
  search?: string;
  tags?: string[];
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

export interface CategoryPayload {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  sortOrder?: number;
}

// 数据验证Schema
export const templateCreateSchema = z.object({
  name: z.string().min(1).max(100),
  content: z.string().min(1).max(2000),
  description: z.string().max(500).optional(),
  category: z.string().max(50).optional(),
  tags: z.array(z.string()).optional(),
  variables: z.array(z.string()).optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const templateUpdateSchema = templateCreateSchema.partial();

export const categoryCreateSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().max(200).optional(),
  icon: z.string().max(20).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  sortOrder: z.number().int().min(0).optional(),
});

// 工具函数
export function extractTemplateVariables(content: string): string[] {
  const variables = new Set<string>();
  let match: RegExpExecArray | null;
  
  // 重置正则表达式的lastIndex
  PLACEHOLDER_REGEX.lastIndex = 0;
  
  while ((match = PLACEHOLDER_REGEX.exec(content)) !== null) {
    const variable = match[1]?.trim();
    if (variable) {
      variables.add(variable);
    }
  }
  
  return Array.from(variables.values());
}

function sanitizeVariables(variables?: string[]): string[] {
  if (!variables) {
    return [];
  }
  return Array.from(new Set(variables.filter((item) => item.trim().length > 0))).map((item) => item.trim());
}

function sanitizeTags(tags?: string[]): string[] {
  if (!tags) {
    return [];
  }
  return Array.from(new Set(tags.filter((item) => item.trim().length > 0).map((item) => item.trim())));
}

// 增强的模板服务类
export class EnhancedTemplateService {
  // 创建模板
  static async createTemplate(accountId: string, data: TemplatePayload): Promise<TemplateWithCategory> {
    // 验证数据
    const validatedData = templateCreateSchema.parse(data);
    
    // 检查内容是否包含禁用关键词
    ensureNoForbiddenKeyword(validatedData.content);
    
    // 提取自动变量
    const autoVariables = extractTemplateVariables(validatedData.content);
    const explicitVariables = sanitizeVariables(validatedData.variables);
    const mergedVariables = Array.from(new Set([...autoVariables, ...explicitVariables]));
    
    // 处理标签
    const tags = sanitizeTags(validatedData.tags);
    
    // 创建模板
    const template = await prisma.messageTemplate.create({
      data: {
        accountId,
        name: validatedData.name,
        content: validatedData.content,
        description: validatedData.description,
        category: validatedData.category || 'general',
        tags: tags,
        variables: mergedVariables,
        sortOrder: validatedData.sortOrder || 0,
        isActive: true,
        usageCount: 0,
      },
    });
    
    return this.serializeTemplate(template);
  }

  // 更新模板
  static async updateTemplate(id: string, data: Partial<TemplatePayload>): Promise<TemplateWithCategory> {
    const existing = await prisma.messageTemplate.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Template not found');
    }

    // 验证数据
    const validatedData = templateUpdateSchema.parse(data);
    
    // 处理内容更新
    const content = validatedData.content ?? existing.content;
    ensureNoForbiddenKeyword(content);
    
    // 处理变量
    const explicitVariables = validatedData.variables ? 
      sanitizeVariables(validatedData.variables) : 
      (existing.variables as string[] | undefined) ?? [];
    const autoVariables = extractTemplateVariables(content);
    const mergedVariables = Array.from(new Set([...autoVariables, ...explicitVariables]));
    
    // 处理标签
    const tags = validatedData.tags ? 
      sanitizeTags(validatedData.tags) : 
      (existing.tags as string[] | undefined) ?? [];

    // 更新模板
    const template = await prisma.messageTemplate.update({
      where: { id },
      data: {
        name: validatedData.name ?? existing.name,
        content,
        description: validatedData.description ?? existing.description,
        category: validatedData.category ?? existing.category,
        tags,
        variables: mergedVariables,
        sortOrder: validatedData.sortOrder ?? existing.sortOrder,
      },
    });
    
    return this.serializeTemplate(template);
  }

  // 删除模板
  static async deleteTemplate(id: string): Promise<boolean> {
    const existing = await prisma.messageTemplate.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Template not found');
    }

    // 软删除：设置为非激活状态
    await prisma.messageTemplate.update({
      where: { id },
      data: { isActive: false },
    });
    
    return true;
  }

  // 获取模板列表
  static async getTemplates(filters?: TemplateFilters): Promise<TemplateWithCategory[]> {
    const where: any = {};
    
    // 构建查询条件
    if (filters?.category) {
      where.category = filters.category;
    }
    
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { content: { contains: filters.search } },
        { description: { contains: filters.search } },
      ];
    }
    
    if (filters?.tags?.length) {
      where.tags = { hasSome: filters.tags };
    }
    
    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    } else {
      where.isActive = true; // 默认只显示激活的模板
    }

    // 构建查询选项
    const queryOptions: any = {
      where,
      orderBy: [
        { sortOrder: 'asc' },
        { usageCount: 'desc' },
        { lastUsedAt: 'desc' },
        { createdAt: 'desc' },
      ],
    };

    // 添加分页
    if (filters?.limit) {
      queryOptions.take = filters.limit;
    }
    if (filters?.offset) {
      queryOptions.skip = filters.offset;
    }

    const templates = await prisma.messageTemplate.findMany(queryOptions);
    return Promise.all(templates.map(template => this.serializeTemplate(template)));
  }

  // 获取单个模板
  static async getTemplateById(id: string): Promise<TemplateWithCategory | null> {
    const template = await prisma.messageTemplate.findUnique({ where: { id } });
    return template ? this.serializeTemplate(template) : null;
  }

  // 使用模板（增加使用计数）
  static async useTemplate(id: string): Promise<TemplateWithCategory> {
    const template = await prisma.messageTemplate.update({
      where: { id },
      data: {
        usageCount: { increment: 1 },
        lastUsedAt: new Date(),
      },
    });
    
    return this.serializeTemplate(template);
  }

  // 复制模板
  static async duplicateTemplate(id: string, newName?: string): Promise<TemplateWithCategory> {
    const existing = await prisma.messageTemplate.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Template not found');
    }

    const template = await prisma.messageTemplate.create({
      data: {
        accountId: existing.accountId,
        name: newName || `${existing.name} (副本)`,
        content: existing.content,
        description: existing.description,
        category: existing.category,
        tags: existing.tags as any,
        variables: existing.variables as any,
        sortOrder: existing.sortOrder,
        isActive: true,
        usageCount: 0,
      },
    });
    
    return this.serializeTemplate(template);
  }

  // 渲染模板（变量替换）
  static renderTemplate(template: TemplateWithCategory, variables: Record<string, string>): string {
    let content = template.content;
    
    // 替换用户提供的变量
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      content = content.replace(regex, value);
    }
    
    // 添加默认变量
    const now = new Date();
    content = content.replace(/\{\{\s*时间\s*\}\}/g, now.toLocaleString('zh-CN'));
    content = content.replace(/\{\{\s*日期\s*\}\}/g, now.toLocaleDateString('zh-CN'));
    content = content.replace(/\{\{\s*时间戳\s*\}\}/g, now.getTime().toString());
    
    return content;
  }

  // 搜索模板
  static async searchTemplates(query: string, options?: {
    category?: string;
    limit?: number;
  }): Promise<TemplateWithCategory[]> {
    const filters: TemplateFilters = {
      search: query,
      category: options?.category,
      limit: options?.limit || 10,
      isActive: true,
    };
    
    return this.getTemplates(filters);
  }

  // 获取热门模板
  static async getPopularTemplates(limit = 10): Promise<TemplateWithCategory[]> {
    return this.getTemplates({
      isActive: true,
      limit,
    });
  }

  // 获取模板统计
  static async getTemplateStats(): Promise<{
    total: number;
    active: number;
    categories: Array<{
      category: string;
      count: number;
    }>;
    popular: Array<{
      id: string;
      name: string;
      usageCount: number;
    }>;
  }> {
    const total = await prisma.messageTemplate.count();
    const active = await prisma.messageTemplate.count({ where: { isActive: true } });
    
    // 按分类统计
    const categoryStats = await prisma.messageTemplate.groupBy({
      by: ['category'],
      where: { isActive: true },
      _count: { category: true },
    });
    
    // 热门模板
    const popular = await prisma.messageTemplate.findMany({
      where: { isActive: true },
      orderBy: { usageCount: 'desc' },
      take: 5,
      select: { id: true, name: true, usageCount: true },
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
        name: item.name,
        usageCount: item.usageCount,
      })),
    };
  }

  // 分类管理
  static async getCategories(): Promise<TemplateCategory[]> {
    return prisma.templateCategory.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  static async createCategory(data: CategoryPayload): Promise<TemplateCategory> {
    const validatedData = categoryCreateSchema.parse(data);
    
    return prisma.templateCategory.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        icon: validatedData.icon,
        color: validatedData.color,
        sortOrder: validatedData.sortOrder || 0,
        isActive: true,
      },
    });
  }

  static async updateCategory(id: string, data: Partial<CategoryPayload>): Promise<TemplateCategory> {
    const validatedData = categoryCreateSchema.partial().parse(data);
    
    return prisma.templateCategory.update({
      where: { id },
      data: validatedData,
    });
  }

  static async deleteCategory(id: string): Promise<boolean> {
    // 检查是否有模板使用此分类
    const templateCount = await prisma.messageTemplate.count({
      where: { category: id },
    });
    
    if (templateCount > 0) {
      throw new Error('Cannot delete category with existing templates');
    }
    
    await prisma.templateCategory.update({
      where: { id },
      data: { isActive: false },
    });
    
    return true;
  }

  // 序列化模板
  private static async serializeTemplate(template: MessageTemplate): Promise<TemplateWithCategory> {
    // 获取分类信息
    const categoryInfo = await prisma.templateCategory.findUnique({
      where: { name: template.category },
    });
    
    return {
      id: template.id,
      name: template.name,
      content: template.content,
      description: template.description || undefined,
      category: template.category,
      categoryInfo: categoryInfo ? {
        name: categoryInfo.name,
        icon: categoryInfo.icon || '📝',
        color: categoryInfo.color || '#6B7280',
      } : undefined,
      tags: (template.tags as string[]) || [],
      variables: (template.variables as string[]) || [],
      usageCount: template.usageCount || 0,
      lastUsedAt: template.lastUsedAt?.toISOString(),
      isActive: template.isActive,
      sortOrder: template.sortOrder || 0,
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString(),
    };
  }
}
