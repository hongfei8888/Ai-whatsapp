// WebSocket 单例管理器 - 确保整个应用只有一个 WebSocket 连接

type MessageHandler = (message: any) => void;

class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private messageHandlers: Set<MessageHandler> = new Set();
  private isConnecting = false;
  private shouldReconnect = true;

  connect() {
    // 如果已连接或正在连接，不重复
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      console.log('⏭️ WebSocket 已连接或正在连接，跳过');
      return;
    }

    this.isConnecting = true;
    const wsUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace('http', 'ws') || 'ws://localhost:4000';
    console.log('🔌 [单例] 连接 WebSocket:', `${wsUrl}/ws`);

    this.ws = new WebSocket(`${wsUrl}/ws`);

    this.ws.onopen = () => {
      console.log('✅ [单例] WebSocket 已连接');
      this.isConnecting = false;
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('📨 [单例] 收到消息:', message);
        
        // 广播给所有订阅者
        this.messageHandlers.forEach(handler => {
          try {
            handler(message);
          } catch (error) {
            console.error('消息处理器错误:', error);
          }
        });
      } catch (error) {
        console.error('解析消息失败:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('❌ [单例] WebSocket 错误:', error);
      this.isConnecting = false;
    };

    this.ws.onclose = () => {
      console.log('🔌 [单例] WebSocket 已断开');
      this.isConnecting = false;
      this.ws = null;

      // 自动重连
      if (this.shouldReconnect) {
        this.reconnectTimeout = setTimeout(() => {
          console.log('🔄 [单例] 尝试重新连接...');
          this.connect();
        }, 3000);
      }
    };
  }

  disconnect() {
    this.shouldReconnect = false;
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    console.log('🛑 [单例] WebSocket 已断开连接');
  }

  subscribe(handler: MessageHandler) {
    this.messageHandlers.add(handler);
    console.log(`📝 [单例] 订阅者数量: ${this.messageHandlers.size}`);
    
    // 确保连接
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.connect();
    }

    // 返回取消订阅函数
    return () => {
      this.messageHandlers.delete(handler);
      console.log(`📝 [单例] 取消订阅，剩余: ${this.messageHandlers.size}`);
    };
  }

  send(data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('⚠️ [单例] WebSocket 未连接，无法发送');
    }
  }

  getConnectionState() {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }
}

// 导出单例实例
export const wsManager = new WebSocketManager();

