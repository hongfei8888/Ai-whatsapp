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
  cooldownUntil: string | null;
  cooldownRemainingSeconds: number | null;
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

