export type WhatsAppStatus = 'INITIALIZING' | 'QR' | 'AUTHENTICATING' | 'READY' | 'DISCONNECTED' | 'FAILED';

export interface StatusPayload {
  online: boolean;
  sessionReady: boolean;
  qr: string | null;
  status: WhatsAppStatus;
  state?: string; // 新增状态机状态
  phoneE164?: string | null; // 新增手机号
  lastOnline?: string | null; // 新增最后在线时间
  cooldownHours: number;
  perContactReplyCooldown: number;
  perContactReplyCooldownMinutes: number;
  contactCount: number;
  latestMessageAt: string | null;
}

export interface Contact {
  id: string;
  phoneE164: string;
  name: string | null;
  cooldownUntil: string | null;
  cooldownRemainingSeconds: number | null;
  createdAt: string;
  updatedAt: string;
}

export type MessageDirection = 'IN' | 'OUT';
export type MessageStatus = 'SENT' | 'FAILED' | 'QUEUED';

export interface Message {
  id: string;
  threadId: string;
  externalId: string | null;
  direction: MessageDirection;
  text: string | null;
  status: MessageStatus;
  createdAt: string;
}

export interface ContactSummary {
  id: string;
  phoneE164: string;
  name: string | null;
  avatarUrl?: string | null;
  cooldownUntil?: string | null;
  cooldownRemainingSeconds?: number | null;
}

export interface ThreadBase {
  id: string;
  contactId: string;
  aiEnabled: boolean;
  lastHumanAt: string | null;
  lastBotAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ThreadListItem extends ThreadBase {
  contact: ContactSummary;
  messagesCount: number;
  latestMessageAt: string | null;
  lastMessage?: {
    id: string;
    body: string | null;
    fromMe: boolean;
    createdAt: string;
  } | null;
}

export interface ThreadWithMessages extends ThreadBase {
  contact: ContactSummary;
  messages: Message[];
}
export interface AiConfig {
  id: string;
  systemPrompt: string;
  maxTokens: number;
  temperature: number;
  minChars: number;
  stylePreset: 'concise-cn' | 'sales-cn' | 'support-cn';
  createdAt: string;
  updatedAt: string;
}

// 模板相关类型定义
export interface TemplateCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MessageTemplate {
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

export interface TemplateCreatePayload {
  name: string;
  content: string;
  description?: string;
  category?: string;
  tags?: string[];
  variables?: string[];
  sortOrder?: number;
}

export interface TemplateUpdatePayload extends Partial<TemplateCreatePayload> {}

export interface TemplateFilters {
  category?: string;
  search?: string;
  tags?: string[];
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

export interface TemplateStats {
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
}

// 批量操作相关类型定义
export interface BatchOperation {
  id: string;
  type: 'import' | 'send' | 'tag' | 'delete' | 'archive';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  title: string;
  description?: string;
  totalCount: number;
  processedCount: number;
  successCount: number;
  failedCount: number;
  config?: any;
  result?: any;
  errorMessage?: string;
  progress: number;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  createdBy: string;
}

export interface BatchImportConfig {
  contacts: Array<{
    phoneE164: string;
    name?: string;
    tags?: string[];
    notes?: string;
  }>;
  tags?: string[];
  source?: string;
  skipDuplicates?: boolean;
}

export interface BatchSendConfig {
  templateId?: string;
  content?: string;
  contactIds?: string[];
  contactFilters?: {
    tags?: string[];
    source?: string;
    createdAfter?: string;
  };
  scheduleAt?: string;
  ratePerMinute?: number;
  jitterMs?: number;
}

export interface BatchTagConfig {
  contactIds: string[];
  tags: string[];
  operation: 'add' | 'remove' | 'replace';
}

// 知识库相关类型定义
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

export interface KnowledgeCreatePayload {
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  keywords?: string[];
  priority?: number;
}

export interface SearchResult extends KnowledgeItem {
  score: number;
  matchType: 'title' | 'content' | 'tag' | 'keyword';
}

