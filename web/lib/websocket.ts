interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
}

interface WebSocketCallbacks {
  onWhatsAppStatus?: (status: any) => void;
  onQRUpdate?: (qr: string) => void;
  onNewMessage?: (message: any) => void;
  onMessageStatus?: (update: any) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: any) => void;
}

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private callbacks: WebSocketCallbacks = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;
  private pingInterval: NodeJS.Timeout | null = null;
  private isConnecting = false;

  constructor(private url: string) {}

  public connect(callbacks: WebSocketCallbacks): void {
    if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) {
      console.log('WebSocket已在连接中或已连接，跳过重复连接');
      return;
    }

    // 如果之前的连接还存在，先关闭它
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.isConnecting = true;
    this.callbacks = callbacks;

    try {
      console.log(`🔌 正在连接到WebSocket服务器: ${this.url}`);
      
      // 检查URL是否有效
      if (!this.url || !this.url.startsWith('ws://') && !this.url.startsWith('wss://')) {
        throw new Error(`无效的WebSocket URL: ${this.url}`);
      }
      
      this.ws = new WebSocket(this.url);
      this.setupEventListeners();
    } catch (error) {
      this.isConnecting = false;
      console.error('WebSocket连接失败:', error);
      this.callbacks.onError?.(error);
    }
  }

  private setupEventListeners(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('🔌 WebSocket连接已建立');
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.startPing();
      this.callbacks.onConnected?.();
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('解析WebSocket消息失败:', error);
      }
    };

    this.ws.onclose = (event) => {
      console.log('🔌 WebSocket连接已关闭', { code: event.code, reason: event.reason, wasClean: event.wasClean });
      this.isConnecting = false;
      this.stopPing();
      this.callbacks.onDisconnected?.();
      
      // 只有在非正常关闭时才尝试重连
      if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.attemptReconnect();
      } else if (event.wasClean) {
        console.log('WebSocket正常关闭，不尝试重连');
      }
    };

    this.ws.onerror = (error) => {
      // 创建一个安全的错误信息对象
      const errorInfo = {
        message: 'WebSocket连接错误',
        type: 'websocket_error',
        readyState: this.ws?.readyState,
        url: this.url,
        timestamp: Date.now(),
        hasError: !!error,
        errorKeys: error ? Object.keys(error) : []
      };
      
      // 安全地记录错误信息
      console.error('WebSocket错误详情:', errorInfo);
      
      // 如果错误对象有可读属性，尝试记录它们
      if (error && typeof error === 'object') {
        try {
          const safeError = {
            type: error.type || 'unknown',
            code: error.code || 'unknown',
            message: error.message || 'No message'
          };
          console.error('WebSocket原始错误:', safeError);
        } catch (e) {
          console.error('无法序列化WebSocket错误对象');
        }
      }
      
      this.isConnecting = false;
      this.callbacks.onError?.(new Error(errorInfo.message));
    };
  }

  private handleMessage(message: WebSocketMessage): void {
    console.log('📨 收到WebSocket消息:', message);

    switch (message.type) {
      case 'connected':
        console.log('✅ WebSocket服务已连接');
        break;
      
      case 'whatsapp_status':
        this.callbacks.onWhatsAppStatus?.(message.data);
        break;
      
      case 'qr_update':
        this.callbacks.onQRUpdate?.(message.data.qr);
        break;
      
      case 'new_message':
        this.callbacks.onNewMessage?.(message.data);
        break;
      
      case 'message_status':
        this.callbacks.onMessageStatus?.(message.data);
        break;
      
      case 'whatsapp_connected':
        console.log('✅ WhatsApp已连接');
        this.callbacks.onConnected?.();
        break;
      
      case 'whatsapp_disconnected':
        console.log('❌ WhatsApp已断开');
        this.callbacks.onDisconnected?.();
        break;
      
      case 'pong':
        // 心跳响应
        break;
      
      default:
        console.warn('未知的WebSocket消息类型:', message.type);
    }
  }

  private startPing(): void {
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({
          type: 'ping',
          data: {},
          timestamp: Date.now()
        });
      }
    }, 30000); // 每30秒发送一次ping
  }

  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('WebSocket重连失败，已达到最大重试次数');
      this.callbacks.onError?.(new Error('WebSocket重连失败，已达到最大重试次数'));
      return;
    }

    this.reconnectAttempts++;
    console.log(`🔄 WebSocket重连尝试 ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

    // 增加重连延迟，避免过于频繁的重连
    const delay = Math.min(this.reconnectInterval * Math.pow(1.5, this.reconnectAttempts - 1), 30000);
    
    setTimeout(() => {
      if (this.ws?.readyState === WebSocket.CLOSED || this.ws?.readyState === WebSocket.CONNECTING) {
        console.log(`⏰ 延迟 ${delay}ms 后尝试重连...`);
        this.connect(this.callbacks);
      }
    }, delay);
  }

  public send(message: WebSocketMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket未连接，无法发送消息');
    }
  }

  public disconnect(): void {
    console.log('🔌 主动断开WebSocket连接');
    this.stopPing();
    
    // 设置为最大重试次数，防止自动重连
    this.reconnectAttempts = this.maxReconnectAttempts;
    
    if (this.ws) {
      this.ws.close(1000, '主动断开连接');
      this.ws = null;
    }
    this.isConnecting = false;
  }

  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// 创建全局WebSocket客户端实例
const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 
  (typeof window !== 'undefined' ? 
    `ws://${window.location.hostname}:4000/ws` : 
    'ws://localhost:4000/ws'
  );

console.log('🔧 WebSocket URL配置:', {
  env: process.env.NEXT_PUBLIC_WS_URL,
  computed: wsUrl,
  hostname: typeof window !== 'undefined' ? window.location.hostname : 'server-side'
});

export const wsClient = new WebSocketClient(wsUrl);
