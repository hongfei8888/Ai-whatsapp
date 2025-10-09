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
  getContacts: () => apiFetch<{ contacts: Contact[] }>('/contacts'),
  createContact: (payload: { phoneE164: string; name?: string }) =>
    apiFetch<Contact>('/contacts', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
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
  takeoverThread: (id: string) =>
    apiFetch<{ thread: ThreadListItem }>(`/threads/${id}/takeover`, { method: 'POST' }),
  releaseThread: (id: string) =>
    apiFetch<{ thread: ThreadListItem }>(`/threads/${id}/release`, { method: 'POST' }),
  logout: () =>
    apiFetch<{ message: string; statusBefore: any; statusAfter: any }>('/auth/logout', { method: 'GET' }),
  deleteThread: (id: string) =>
    apiFetch<{ message: string }>(`/threads/${id}`, { method: 'DELETE' }),
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
    
    // 获取批量操作状态
    getStatus: (batchId: string) =>
      apiFetch<BatchOperation>(`/batch/${batchId}/status`),
    
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
  },

  // FAQ分类API
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

};