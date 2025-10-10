import type { 
  AiConfig, 
  Contact, 
  Message, 
  StatusPayload, 
  ThreadListItem, 
  ThreadWithMessages,
  MessageTemplate,
  TemplateCategory,
  TemplateCreatePayload,
  TemplateUpdatePayload,
  TemplateFilters,
  TemplateStats,
  BatchOperation,
  BatchImportConfig,
  BatchSendConfig,
  BatchTagConfig,
  KnowledgeItem,
  FAQCategory,
  KnowledgeCreatePayload,
  SearchResult
} from '@/lib/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
const API_TOKEN = process.env.NEXT_PUBLIC_API_TOKEN || null;

interface ApiSuccess<T> {
  ok: true;
  data: T;
}

interface ApiError {
  ok: false;
  code: string;
  message: string;
  details?: unknown;
}

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const headers = new Headers(init.headers ?? {});

  if (!headers.has('Content-Type') && init.body && init.method !== 'DELETE' && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (API_TOKEN && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${API_TOKEN}`);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers,
      cache: 'no-store',
    });
  } catch (error) {
    console.error('Fetch error:', error);
    throw new Error(`Failed to fetch: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  let payload: ApiSuccess<T> | ApiError | undefined;
  try {
    payload = (await response.json()) as ApiSuccess<T> | ApiError;
  } catch (error) {
    payload = undefined;
  }

  if (!response.ok) {
    const message = payload && 'ok' in payload && !payload.ok
      ? payload.message
      : `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  if (!payload || !('ok' in payload)) {
    throw new Error('Invalid response payload');
  }

  if (!payload.ok) {
    throw new Error(payload.message || 'Request failed');
  }

  return payload.data;
}

export const api = {
  getStatus: () => apiFetch<StatusPayload>('/status'),
  getContacts: () => apiFetch<any>('/contacts'),
  getContact: (id: string) => apiFetch<Contact>(`/contacts/${id}`),
  createContact: (payload: { phoneE164: string; name?: string }) =>
    apiFetch<Contact>('/contacts', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateContact: (id: string, payload: { name?: string; tags?: string[] }) =>
    apiFetch<Contact>(`/contacts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  getContactStats: (id: string) =>
    apiFetch<{ messageCount: number; lastContactAt: string | null; threadCount: number }>(`/contacts/${id}/stats`),
  sendOutreach: (id: string, payload: { content: string }) =>
    apiFetch<{ threadId: string; message: Message }>(`/contacts/${id}/outreach`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  uploadFile: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiFetch<{ threadId: string; message: Message }>(`/contacts/${id}/upload`, {
      method: 'POST',
      body: formData,
    });
  },
  getOrCreateThread: (contactId: string) =>
    apiFetch<{ thread: ThreadListItem }>(`/contacts/${contactId}/thread`, {
      method: 'POST',
    }),
  getAiConfig: () => apiFetch<AiConfig>('/ai/config'),
  updateAiConfig: (payload: { systemPrompt: string; maxTokens: number; temperature: number; minChars: number; stylePreset: 'concise-cn' | 'sales-cn' | 'support-cn' }) =>
    apiFetch<AiConfig>('/ai/config', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  testAi: (payload: { user: string; context?: string }) =>
    apiFetch<{ reply: string }>('/ai/test', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getThreads: () => apiFetch<{ threads: ThreadListItem[] }>('/threads'),
  getThreadMessages: (id: string, limit = 50) =>
    apiFetch<ThreadWithMessages>(`/threads/${id}/messages?limit=${limit}`),
  getThreadMessagesMore: (id: string, options: { limit?: number; before?: string; after?: string }) => {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.before) params.append('before', options.before);
    if (options.after) params.append('after', options.after);
    return apiFetch<{ messages: any[]; hasMore: boolean }>(`/threads/${id}/messages/more?${params.toString()}`);
  },
  sendMessage: (phoneE164: string, content: string) =>
    apiFetch<{ message: Message }>('/messages/send', {
      method: 'POST',
      body: JSON.stringify({ phoneE164, content }),
    }),
  sendMediaMessage: (phoneE164: string, mediaFileName: string, mediaType: string, caption?: string, originalFileName?: string) =>
    apiFetch<{ message: Message; threadId: string }>('/messages/send-media', {
      method: 'POST',
      body: JSON.stringify({ phoneE164, mediaFileName, mediaType, caption, originalFileName }),
    }),
  takeoverThread: (id: string) =>
    apiFetch<{ thread: ThreadListItem }>(`/threads/${id}/takeover`, { method: 'POST' }),
  releaseThread: (id: string) =>
    apiFetch<{ thread: ThreadListItem }>(`/threads/${id}/release`, { method: 'POST' }),
  logout: () =>
    apiFetch<{ message: string; statusBefore: any; statusAfter: any }>('/auth/logout', { method: 'GET' }),
  deleteThread: (id: string) =>
    apiFetch<{ message: string }>(`/threads/${id}`, { method: 'DELETE' }),
  
  // 模版管理 API
  // 注意：apiFetch 已经返回 response.data，不需要再访问 .data 属性
  getTemplates: (params?: { category?: string; search?: string; isActive?: boolean }) =>
    apiFetch<any[]>(`/templates${params ? '?' + new URLSearchParams(Object.entries(params).filter(([_, v]) => v !== undefined).map(([k, v]) => [k, String(v)])).toString() : ''}`),
  getTemplate: (id: string) =>
    apiFetch<any>(`/templates/${id}`),
  createTemplate: (data: { name: string; content: string; category?: string; description?: string; tags?: string[]; variables?: string[] }) =>
    apiFetch<any>('/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateTemplate: (id: string, data: { name?: string; content?: string; category?: string; description?: string; tags?: string[]; variables?: string[]; isActive?: boolean }) =>
    apiFetch<any>(`/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteTemplate: (id: string) =>
    apiFetch<{ message: string }>(`/templates/${id}`, { method: 'DELETE' }),
  useTemplate: (id: string) =>
    apiFetch<any>(`/templates/${id}/use`, { method: 'POST' }),
  duplicateTemplate: (id: string, name?: string) =>
    apiFetch<any>(`/templates/${id}/duplicate`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
  renderTemplate: (id: string, variables: Record<string, string>) =>
    apiFetch<{ original: string; rendered: string; variables: string[] }>(`/templates/${id}/render`, {
      method: 'POST',
      body: JSON.stringify({ variables }),
    }),
  getTemplateStats: () =>
    apiFetch<any>('/templates/stats'),
  getPopularTemplates: (limit?: number) =>
    apiFetch<any[]>(`/templates/popular${limit ? '?limit=' + limit : ''}`),
  searchTemplates: (query: string, category?: string, limit?: number) =>
    apiFetch<any[]>('/templates/search', {
      method: 'POST',
      body: JSON.stringify({ query, category, limit }),
    }),
  
  // 分类管理 API
  getTemplateCategories: () =>
    apiFetch<any[]>('/templates/categories'),
  createTemplateCategory: (data: { name: string; description?: string; icon?: string; color?: string }) =>
    apiFetch<any>('/templates/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateTemplateCategory: (id: string, data: { name?: string; description?: string; icon?: string; color?: string }) =>
    apiFetch<any>(`/templates/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteTemplateCategory: (id: string) =>
    apiFetch<{ message: string }>(`/templates/categories/${id}`, { method: 'DELETE' }),
  startLogin: () =>
    apiFetch<{ message: string }>('/auth/login/start', { method: 'POST' }),
  getQRCode: () =>
    apiFetch<{ qr: string | null; state: string; status: string }>('/auth/qr'),
  addContact: (contact: { phoneE164: string; name?: string }) =>
    apiFetch<{ message: string }>('/contacts', {
      method: 'POST',
      body: JSON.stringify(contact),
    }),
  deleteContact: (id: string) =>
    apiFetch<{ message: string }>(`/contacts/${id}`, { method: 'DELETE' }),
  
  // WhatsApp联系人功能
  getWhatsAppContacts: () =>
    apiFetch<{ contacts: any[]; count: number }>('/contacts/whatsapp'),
  
  syncWhatsAppContacts: () =>
    apiFetch<{ message: string; result: { added: number; updated: number; total: number } }>('/contacts/sync-whatsapp', {
      method: 'POST',
      body: JSON.stringify({}), // 添加空的JSON体
    }),
  getSettings: () =>
    apiFetch<any>('/settings'),
  saveSettings: (settings: any) =>
    apiFetch<{ message: string; settings: any }>('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),
  // 线程AI控制
  setThreadAiEnabled: (threadId: string, enabled: boolean) =>
    apiFetch<{ thread: any }>(`/threads/${threadId}/ai`, {
      method: 'PUT',
      body: JSON.stringify({ aiEnabled: enabled }),
    }),

  // 模板管理API
  templates: {
    // 创建模板
    create: (data: TemplateCreatePayload) =>
      apiFetch<MessageTemplate>('/templates', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    // 获取模板列表
    list: (filters?: TemplateFilters) => {
      const params = new URLSearchParams();
      if (filters?.category) params.append('category', filters.category);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.tags) params.append('tags', JSON.stringify(filters.tags));
      if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.offset) params.append('offset', filters.offset.toString());
      
      return apiFetch<MessageTemplate[]>(`/templates?${params.toString()}`);
    },
    
    // 获取单个模板
    get: (id: string) =>
      apiFetch<MessageTemplate>(`/templates/${id}`),
    
    // 更新模板
    update: (id: string, data: TemplateUpdatePayload) =>
      apiFetch<MessageTemplate>(`/templates/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    
    // 删除模板
    delete: (id: string) =>
      apiFetch<{ message: string }>(`/templates/${id}`, { method: 'DELETE' }),
    
    // 使用模板
    use: (id: string) =>
      apiFetch<MessageTemplate>(`/templates/${id}/use`, { method: 'POST' }),
    
    // 复制模板
    duplicate: (id: string, name?: string) =>
      apiFetch<MessageTemplate>(`/templates/${id}/duplicate`, {
        method: 'POST',
        body: JSON.stringify({ name }),
      }),
    
    // 搜索模板
    search: (query: string, options?: { category?: string; limit?: number }) =>
      apiFetch<MessageTemplate[]>('/templates/search', {
        method: 'POST',
        body: JSON.stringify({ query, ...options }),
      }),
    
    // 获取热门模板
    popular: (limit?: number) => {
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit.toString());
      return apiFetch<MessageTemplate[]>(`/templates/popular?${params.toString()}`);
    },
    
    // 获取模板统计
    stats: () =>
      apiFetch<TemplateStats>('/templates/stats'),
    
    // 渲染模板
    render: (id: string, variables?: Record<string, string>) =>
      apiFetch<{
        original: string;
        rendered: string;
        variables: string[];
      }>(`/templates/${id}/render`, {
        method: 'POST',
        body: JSON.stringify({ variables }),
      }),
  },

  // 模板分类API
  categories: {
    // 获取分类列表
    list: () =>
      apiFetch<TemplateCategory[]>('/templates/categories'),
    
    // 创建分类
    create: (data: { name: string; description?: string; icon?: string; color?: string }) =>
      apiFetch<TemplateCategory>('/templates/categories', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    // 更新分类
    update: (id: string, data: Partial<{ name: string; description?: string; icon?: string; color?: string }>) =>
      apiFetch<TemplateCategory>(`/templates/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    
    // 删除分类
    delete: (id: string) =>
      apiFetch<{ message: string }>(`/templates/categories/${id}`, { method: 'DELETE' }),
  },

  // 批量操作API
  batch: {
    // 批量导入联系人
    importContacts: (config: BatchImportConfig) =>
      apiFetch<BatchOperation>('/batch/import', {
        method: 'POST',
        body: JSON.stringify(config),
      }),
    
    // 批量发送消息
    sendMessages: (config: BatchSendConfig) =>
      apiFetch<BatchOperation>('/batch/send', {
        method: 'POST',
        body: JSON.stringify(config),
      }),
    
    // 批量标签管理
    manageTags: (config: BatchTagConfig) =>
      apiFetch<BatchOperation>('/batch/tags', {
        method: 'POST',
        body: JSON.stringify(config),
      }),
    
    // 批量删除联系人
    deleteContacts: (contactIds: string[]) =>
      apiFetch<BatchOperation>('/batch/delete', {
        method: 'POST',
        body: JSON.stringify({ contactIds }),
      }),
    
    // 获取批量操作状态
    getStatus: (batchId: string) =>
      apiFetch<BatchOperation>(`/batch/${batchId}/status`),
    
    // 获取批量操作详情
    getOperation: (batchId: string) =>
      apiFetch<BatchOperation>(`/batch/${batchId}`),
    
    // 取消批量操作
    cancel: (batchId: string) =>
      apiFetch<{ message: string }>(`/batch/${batchId}/cancel`, { method: 'POST' }),
    
    // 获取批量操作列表
    list: (filters?: { type?: string; status?: string; limit?: number; offset?: number }) => {
      const params = new URLSearchParams();
      if (filters?.type) params.append('type', filters.type);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.offset) params.append('offset', filters.offset.toString());
      
      return apiFetch<BatchOperation[]>(`/batch?${params.toString()}`);
    },
    
    // 获取批量操作统计
    getStats: (filters?: { type?: string; status?: string; createdAfter?: string }) => {
      const params = new URLSearchParams();
      if (filters?.type) params.append('type', filters.type);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.createdAfter) params.append('createdAfter', filters.createdAfter);
      
      return apiFetch<any>(`/batch/stats?${params.toString()}`);
    },
  },

  // 知识库API
  knowledge: {
    // 创建知识库条目
    create: (data: KnowledgeCreatePayload) =>
      apiFetch<KnowledgeItem>('/knowledge', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    // 获取知识库列表
    list: (filters?: { category?: string; search?: string; limit?: number }) => {
      const params = new URLSearchParams();
      if (filters?.category) params.append('category', filters.category);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.limit) params.append('limit', filters.limit.toString());
      
      return apiFetch<KnowledgeItem[]>(`/knowledge?${params.toString()}`);
    },
    
    // 获取单个知识库条目
    get: (id: string) =>
      apiFetch<KnowledgeItem>(`/knowledge/${id}`),
    
    // 更新知识库条目
    update: (id: string, data: Partial<KnowledgeCreatePayload>) =>
      apiFetch<KnowledgeItem>(`/knowledge/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    
    // 删除知识库条目
    delete: (id: string) =>
      apiFetch<{ message: string }>(`/knowledge/${id}`, { method: 'DELETE' }),
    
    // 搜索知识库
    search: (query: string, options?: { category?: string; limit?: number }) =>
      apiFetch<SearchResult[]>('/knowledge/search', {
        method: 'POST',
        body: JSON.stringify({ query, ...options }),
      }),
    
    // 获取最佳答案
    findBestAnswer: (question: string) =>
      apiFetch<KnowledgeItem | null>('/knowledge/best-answer', {
        method: 'POST',
        body: JSON.stringify({ question }),
      }),
    
    // 获取热门条目
    popular: (limit?: number) => {
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit.toString());
      return apiFetch<KnowledgeItem[]>(`/knowledge/popular?${params.toString()}`);
    },

    // 使用知识库条目（记录使用次数）
    use: (id: string) =>
      apiFetch<{ message: string }>(`/knowledge/${id}/use`, { method: 'POST' }),
    
    // 获取知识库统计
    getStats: () =>
      apiFetch<any>('/knowledge/stats'),
    
    // 分类管理
    categories: {
      // 获取分类列表
      list: () =>
        apiFetch<FAQCategory[]>('/knowledge/categories'),
      
      // 创建分类
      create: (data: { name: string; description?: string; icon?: string; color?: string }) =>
        apiFetch<FAQCategory>('/knowledge/categories', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      
      // 更新分类
      update: (id: string, data: Partial<{ name: string; description?: string; icon?: string; color?: string }>) =>
        apiFetch<FAQCategory>(`/knowledge/categories/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        }),
      
      // 删除分类
      delete: (id: string) =>
        apiFetch<{ message: string }>(`/knowledge/categories/${id}`, { method: 'DELETE' }),
    },
  },

  // FAQ分类API（保留以向后兼容）
  faqCategories: {
    // 获取分类列表
    list: () =>
      apiFetch<FAQCategory[]>('/knowledge/categories'),
    
    // 创建分类
    create: (data: { name: string; description?: string; icon?: string; color?: string }) =>
      apiFetch<FAQCategory>('/knowledge/categories', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    // 更新分类
    update: (id: string, data: Partial<{ name: string; description?: string; icon?: string; color?: string }>) =>
      apiFetch<FAQCategory>(`/knowledge/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    
    // 删除分类
    delete: (id: string) =>
      apiFetch<{ message: string }>(`/knowledge/categories/${id}`, { method: 'DELETE' }),
  },

  // 翻译 API
  translation: {
    // 翻译文本
    translate: (text: string, targetLang: string = 'zh') =>
      apiFetch<{ translatedText: string; sourceLang: string; fromCache: boolean }>('/translate', {
        method: 'POST',
        body: JSON.stringify({ text, targetLang }),
      }),

    // 批量翻译消息
    translateMessages: (messageIds: string[]) =>
      apiFetch<any[]>('/translate/messages', {
        method: 'POST',
        body: JSON.stringify({ messageIds }),
      }),

    // 切换自动翻译
    toggleAutoTranslate: (threadId: string, enabled: boolean) =>
      apiFetch<any>('/translate/toggle', {
        method: 'POST',
        body: JSON.stringify({ threadId, enabled }),
      }),

    // 获取统计
    getStats: () =>
      apiFetch<any>('/translate/stats'),

    // 清理旧缓存
    cleanup: (daysOld: number = 90) =>
      apiFetch<{ deletedCount: number; message: string }>('/translate/cleanup', {
        method: 'POST',
        body: JSON.stringify({ daysOld }),
      }),
  },

  // 认证相关API
  auth: {
    // 启动登录流程
    startLogin: () =>
      apiFetch<{ message: string }>('/auth/login/start', {
        method: 'POST',
      }),
    
    // 获取QR码
    getQRCode: () =>
      apiFetch<{
        qr: string | null;
        status: string;
        state: string;
      }>('/auth/qr'),
    
    // 退出登录
    logout: () =>
      apiFetch<{ message: string }>('/auth/logout', {
        method: 'GET',
      }),
  },

  // 系统设置 API
  settings: {
    get: () => apiFetch<any>('/settings'),
    update: (settings: any) =>
      apiFetch<any>('/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      }),
  },

  // 统计 API
  stats: {
    overview: () => apiFetch<any>('/stats/overview'),
    messages: () => apiFetch<any>('/stats/messages'),
    activity: () => apiFetch<any>('/stats/activity'),
  },

  // 数据管理 API
  data: {
    export: (config: {
      types: string[];
      format?: 'json' | 'csv';
      dateFrom?: string;
      dateTo?: string;
    }) =>
      apiFetch<any>('/data/export', {
        method: 'POST',
        body: JSON.stringify(config),
      }),
    cleanup: (config: { types: string[]; daysOld: number }) =>
      apiFetch<any>('/data/cleanup', {
        method: 'POST',
        body: JSON.stringify(config),
      }),
    storageInfo: () => apiFetch<any>('/data/storage-info'),
  },

  // 媒体文件 API
  media: {
    upload: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${API_BASE_URL}/media/upload`, {
        method: 'POST',
        body: formData,
        headers: API_TOKEN ? { Authorization: `Bearer ${API_TOKEN}` } : {},
      });
      
      if (!response.ok) {
        throw new Error(`上传失败: ${response.statusText}`);
      }
      
      const result = await response.json();
      return result.data;
    },
    getUrl: (fileName: string) => `${API_BASE_URL}/media/files/${fileName}`,
    getThumbnailUrl: (fileName: string) => `${API_BASE_URL}/media/thumbnails/${fileName}`,
    delete: (fileName: string) =>
      apiFetch<any>(`/media/${fileName}`, {
        method: 'DELETE',
      }),
    getInfo: (fileName: string) => apiFetch<any>(`/media/info/${fileName}`),
  },

  // 消息操作 API
  messages: {
    reply: (data: {
      threadId: string;
      replyToId: string;
      text: string;
      direction?: string;
      externalId?: string;
    }) =>
      apiFetch<any>('/messages/reply', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    edit: (id: string, text: string) =>
      apiFetch<any>(`/messages/${id}/edit`, {
        method: 'PUT',
        body: JSON.stringify({ text }),
      }),
    delete: (id: string, deletedBy?: string) =>
      apiFetch<any>(`/messages/${id}`, {
        method: 'DELETE',
        body: JSON.stringify({ deletedBy: deletedBy || 'user' }),
      }),
    forward: (id: string, targetThreadIds: string[], direction?: string) =>
      apiFetch<any>(`/messages/${id}/forward`, {
        method: 'POST',
        body: JSON.stringify({ targetThreadIds, direction: direction || 'OUT' }),
      }),
    star: (id: string, starred: boolean) =>
      apiFetch<any>(`/messages/${id}/star`, {
        method: 'POST',
        body: JSON.stringify({ starred }),
      }),
    search: (query: string, threadId?: string, limit?: number, offset?: number) => {
      const params = new URLSearchParams();
      params.append('query', query);
      if (threadId) params.append('threadId', threadId);
      if (limit) params.append('limit', limit.toString());
      if (offset) params.append('offset', offset.toString());
      
      return apiFetch<any>(`/messages/search?${params.toString()}`);
    },
    getStarred: (threadId?: string) => {
      const params = new URLSearchParams();
      if (threadId) params.append('threadId', threadId);
      
      return apiFetch<any>(`/messages/starred?${params.toString()}`);
    },
    getDetails: (id: string) => apiFetch<any>(`/messages/${id}/details`),
  },

  // 会话管理 API
  threads: {
    pin: (id: string, pinned: boolean) =>
      apiFetch<any>(`/threads/${id}/pin`, {
        method: 'POST',
        body: JSON.stringify({ pinned }),
      }),
    archive: (id: string, archived: boolean) =>
      apiFetch<any>(`/threads/${id}/archive`, {
        method: 'POST',
        body: JSON.stringify({ archived }),
      }),
    updateLabels: (id: string, labels: string[]) =>
      apiFetch<any>(`/threads/${id}/labels`, {
        method: 'PUT',
        body: JSON.stringify({ labels }),
      }),
    markAsRead: (id: string) =>
      apiFetch<any>(`/threads/${id}/read`, {
        method: 'POST',
      }),
    saveDraft: (id: string, draft: string) =>
      apiFetch<any>(`/threads/${id}/draft`, {
        method: 'PUT',
        body: JSON.stringify({ draft }),
      }),
    getDraft: (id: string) => apiFetch<any>(`/threads/${id}/draft`),
    getFiltered: (filter: {
      isPinned?: boolean;
      isArchived?: boolean;
      labels?: string[];
      hasUnread?: boolean;
    }) => {
      const params = new URLSearchParams();
      if (filter.isPinned !== undefined) params.append('isPinned', filter.isPinned.toString());
      if (filter.isArchived !== undefined) params.append('isArchived', filter.isArchived.toString());
      if (filter.labels) filter.labels.forEach(label => params.append('labels', label));
      if (filter.hasUnread !== undefined) params.append('hasUnread', filter.hasUnread.toString());
      
      return apiFetch<any>(`/threads/filtered?${params.toString()}`);
    },
    getMessages: (id: string, limit?: number, before?: string, after?: string) => {
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit.toString());
      if (before) params.append('before', before);
      if (after) params.append('after', after);
      
      return apiFetch<any>(`/threads/${id}/messages?${params.toString()}`);
    },
  },

};