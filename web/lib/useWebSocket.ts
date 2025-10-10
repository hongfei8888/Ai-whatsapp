import { useEffect, useRef, useCallback } from 'react';
import { wsManager } from './websocketManager';

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
}

interface WebSocketHookOptions {
  onMessage?: (message: WebSocketMessage) => void;
  onNewMessage?: (message: any) => void;
  onStatusUpdate?: (status: any) => void;
  onQRUpdate?: (qr: string) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  autoReconnect?: boolean;
  reconnectInterval?: number;
}

export function useWebSocket(options: WebSocketHookOptions = {}) {
  const {
    onMessage,
    onNewMessage,
    onStatusUpdate,
    onQRUpdate,
    onConnect,
    onDisconnect,
    autoReconnect = true,
    reconnectInterval = 3000,
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectedRef = useRef(false);
  const isMountedRef = useRef(true);

  const connect = useCallback(() => {
    // 如果组件已卸载，不连接
    if (!isMountedRef.current) {
      console.log('⏭️ 组件已卸载，跳过连接');
      return;
    }

    // 如果已连接或正在连接，不重复连接
    if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) {
      console.log('⏭️ WebSocket 已连接或正在连接，跳过');
      return;
    }

    const wsUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace('http', 'ws') || 'ws://localhost:4000';
    console.log('🔌 尝试连接 WebSocket:', `${wsUrl}/ws`);
    const ws = new WebSocket(`${wsUrl}/ws`);

    ws.onopen = () => {
      console.log('✅ WebSocket 已连接成功！');
      isConnectedRef.current = true;
      onConnect?.();
    };

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        console.log('收到 WebSocket 消息:', message);

        // 调用通用消息处理器
        onMessage?.(message);

        // 根据消息类型调用特定处理器
        switch (message.type) {
          case 'new_message':
            onNewMessage?.(message.data);
            break;
          case 'whatsapp_status':
            onStatusUpdate?.(message.data);
            break;
          case 'qr_update':
            onQRUpdate?.(message.data.qr);
            break;
          default:
            break;
        }
      } catch (error) {
        console.error('解析 WebSocket 消息失败:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket 错误:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket 已断开');
      isConnectedRef.current = false;
      onDisconnect?.();

      // 只有在组件仍然挂载时才自动重连
      if (autoReconnect && isMountedRef.current) {
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('尝试重新连接 WebSocket...');
          connect();
        }, reconnectInterval);
      }
    };

    wsRef.current = ws;
  }, [onMessage, onNewMessage, onStatusUpdate, onQRUpdate, onConnect, onDisconnect, autoReconnect, reconnectInterval]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const send = useCallback((data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket 未连接，无法发送消息');
    }
  }, []);

  useEffect(() => {
    console.log('🔧 [Hook] 使用单例 WebSocket 管理器');
    
    // 订阅消息
    const unsubscribe = wsManager.subscribe((message: WebSocketMessage) => {
      // 调用通用消息处理器
      onMessage?.(message);

      // 根据消息类型调用特定处理器
      switch (message.type) {
        case 'connected':
          onConnect?.();
          break;
        case 'new_message':
          onNewMessage?.(message.data);
          break;
        case 'whatsapp_status':
          onStatusUpdate?.(message.data);
          break;
        case 'qr_update':
          onQRUpdate?.(message.data.qr);
          break;
        default:
          break;
      }
    });

    return () => {
      console.log('🔧 [Hook] 取消订阅');
      unsubscribe();
    };
  }, [onMessage, onNewMessage, onStatusUpdate, onQRUpdate, onConnect, onDisconnect]);

  return {
    isConnected: isConnectedRef.current,
    send,
    connect,
    disconnect,
  };
}

