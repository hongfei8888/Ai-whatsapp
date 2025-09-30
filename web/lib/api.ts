import type { AiConfig, Contact, Message, StatusPayload, ThreadListItem, ThreadWithMessages } from '@/lib/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';
const API_TOKEN = process.env.NEXT_PUBLIC_API_TOKEN || 'test-token-123';

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

  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }

  if (API_TOKEN && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${API_TOKEN}`);
  }

  const response = await fetch(url, {
    ...init,
    headers,
    cache: 'no-store',
  });

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
  getSettings: () =>
    apiFetch<any>('/settings'),
  saveSettings: (settings: any) =>
    apiFetch<{ message: string; settings: any }>('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),
};