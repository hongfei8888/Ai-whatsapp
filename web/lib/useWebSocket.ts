import { useEffect, useRef, useCallback, useState } from 'react';
import { wsManager } from './websocketManager';
import { useAccount } from './account-context';

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
  accountId?: string; // 🔥 添加账号 ID 字段
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
  // 社群营销相关事件
  onJoinTaskProgress?: (data: any) => void;
  onJoinTaskCompleted?: (data: any) => void;
  onJoinTaskFailed?: (data: any) => void;
  onBroadcastProgress?: (data: any) => void;
  onGroupMessage?: (data: any) => void;
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
    // 社群营销相关回调
    onJoinTaskProgress,
    onJoinTaskCompleted,
    onJoinTaskFailed,
    onBroadcastProgress,
    onGroupMessage,
  } = options;

  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
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
          // 社群营销相关事件
          case 'join_task_progress':
            onJoinTaskProgress?.(message.data);
            break;
          case 'join_task_completed':
            onJoinTaskCompleted?.(message.data);
            break;
          case 'join_task_failed':
            onJoinTaskFailed?.(message.data);
            break;
          case 'broadcast_progress':
            onBroadcastProgress?.(message.data);
            break;
          case 'group_message':
            onGroupMessage?.(message.data);
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
      // 🔥 多账号消息过滤：只处理属于当前账号的消息
      // 注意：有些消息类型（如 connected）不需要账号过滤
      const needsAccountFilter = [
        'new_message',
        'whatsapp_status', 
        'qr_update',
        'join_task_progress',
        'join_task_completed',
        'join_task_failed',
        'broadcast_progress',
        'group_message',
      ].includes(message.type);
      
      // 如果需要过滤但 accountId 不匹配，则忽略此消息
      // 注意：某些旧消息可能没有 accountId，这些消息仍然会被处理（向后兼容）
      if (needsAccountFilter && message.accountId) {
        // 我们不能在这里直接使用 useAccount，因为这是在 callback 中
        // 所以改为在外层获取 currentAccountId
        // 暂时注释掉过滤，让调用者自己决定是否过滤
        // TODO: 如果需要严格过滤，可以将 currentAccountId 作为依赖传入
      }
      
      // 更新最后一条消息
      setLastMessage(message);
      
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
        // 社群营销相关事件
        case 'join_task_progress':
          onJoinTaskProgress?.(message.data);
          break;
        case 'join_task_completed':
          onJoinTaskCompleted?.(message.data);
          break;
        case 'join_task_failed':
          onJoinTaskFailed?.(message.data);
          break;
        case 'broadcast_progress':
          onBroadcastProgress?.(message.data);
          break;
        case 'group_message':
          console.log('📨 [Hook] 收到群组消息事件:', message.data);
          onGroupMessage?.(message.data);
          break;
        default:
          break;
      }
    });

    return () => {
      console.log('🔧 [Hook] 取消订阅');
      unsubscribe();
    };
  }, [onMessage, onNewMessage, onStatusUpdate, onQRUpdate, onConnect, onDisconnect, onJoinTaskProgress, onJoinTaskCompleted, onJoinTaskFailed, onBroadcastProgress, onGroupMessage]);

  return {
    isConnected: isConnectedRef.current,
    lastMessage,
    send,
    connect,
    disconnect,
  };
}

/**
 * 🔥 增强版 WebSocket Hook - 自动过滤当前账号的消息
 * 
 * 与 useWebSocket 相同，但会自动过滤只属于当前账号的消息
 * 使用场景：在需要监听 WebSocket 消息的组件中，自动过滤属于当前账号的消息
 */
export function useAccountWebSocket(options: WebSocketHookOptions = {}) {
  const { currentAccountId } = useAccount();
  
  // 包装回调函数，添加账号过滤
  const wrappedOptions: WebSocketHookOptions = {
    ...options,
    onMessage: options.onMessage ? (message: WebSocketMessage) => {
      // 如果消息包含 accountId，只处理属于当前账号的消息
      if (message.accountId && message.accountId !== currentAccountId) {
        console.debug(`[AccountWebSocket] 忽略其他账号的消息: ${message.type} from ${message.accountId}`);
        return;
      }
      options.onMessage?.(message);
    } : undefined,
    
    onNewMessage: options.onNewMessage ? (data: any) => {
      // 新消息通常包含 accountId
      if (data.accountId && data.accountId !== currentAccountId) {
        return;
      }
      options.onNewMessage?.(data);
    } : undefined,
    
    onStatusUpdate: options.onStatusUpdate ? (data: any) => {
      // 状态更新包含 accountId
      if (data.accountId && data.accountId !== currentAccountId) {
        return;
      }
      options.onStatusUpdate?.(data);
    } : undefined,
    
    onQRUpdate: options.onQRUpdate,
    onConnect: options.onConnect,
    onDisconnect: options.onDisconnect,
    onJoinTaskProgress: options.onJoinTaskProgress,
    onJoinTaskCompleted: options.onJoinTaskCompleted,
    onJoinTaskFailed: options.onJoinTaskFailed,
    onBroadcastProgress: options.onBroadcastProgress,
    onGroupMessage: options.onGroupMessage,
  };
  
  return useWebSocket(wrappedOptions);
}

