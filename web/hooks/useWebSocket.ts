import { useEffect, useRef, useState } from 'react';
import { wsClient, WebSocketCallbacks } from '@/lib/websocket';

interface UseWebSocketOptions extends WebSocketCallbacks {
  autoConnect?: boolean;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const callbacksRef = useRef<WebSocketCallbacks>({});

  useEffect(() => {
    // 更新回调函数引用
    callbacksRef.current = {
      ...options,
      onWhatsAppStatus: options.onWhatsAppStatus,
      onQRUpdate: options.onQRUpdate,
      onConnected: () => {
        setIsConnected(true);
        options.onConnected?.();
      },
      onDisconnected: () => {
        setIsConnected(false);
        options.onDisconnected?.();
      },
      onNewMessage: (message) => {
        setLastMessage(message);
        options.onNewMessage?.(message);
      },
      onMessageStatus: (update) => {
        options.onMessageStatus?.(update);
      },
      onError: (error) => {
        console.error('WebSocket错误:', error);
        options.onError?.(error);
      }
    };
  }, [options]);

  useEffect(() => {
    if (options.autoConnect !== false) {
      // 延迟连接，确保页面完全加载
      const timer = setTimeout(() => {
        console.log('🔄 开始WebSocket连接...');
        wsClient.connect(callbacksRef.current);
      }, 1000);

      return () => {
        clearTimeout(timer);
        wsClient.disconnect();
      };
    }

    return () => {
      if (options.autoConnect !== false) {
        wsClient.disconnect();
      }
    };
  }, [options.autoConnect]);

  const send = (type: string, data: any) => {
    wsClient.send({
      type,
      data,
      timestamp: Date.now()
    });
  };

  return {
    isConnected,
    lastMessage,
    send,
    connect: () => wsClient.connect(callbacksRef.current),
    disconnect: () => wsClient.disconnect()
  };
}
