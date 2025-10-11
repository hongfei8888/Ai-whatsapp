import { FastifyInstance } from 'fastify';
import { logger } from './logger';
import type { AccountManager } from './services/account-manager';
import { EventEmitter } from 'events';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
}

export class WebSocketService extends EventEmitter {
  private connections: Set<any> = new Set();
  private fastify: FastifyInstance | null = null;
  private accountManager: AccountManager | null = null;

  constructor() {
    super();
  }

  public initialize(fastify: FastifyInstance, accountManager: AccountManager): void {
    this.fastify = fastify;
    this.accountManager = accountManager;
    this.setupWebSocketRoutes();
    this.setupAccountManagerEventListeners();
  }

  private setupWebSocketRoutes(): void {
    if (!this.fastify) return;

    const self = this; // Capture 'this' reference
    
    // 直接注册WebSocket路由
    this.fastify.get('/ws', { websocket: true } as any, (connection, req) => {
      logger.info('新的WebSocket连接建立');
      
      const socket = connection.socket || connection;
      
      // 添加连接到集合
      self.addConnection(connection);
      
      // 发送欢迎消息
      self.sendToConnection(connection, {
        type: 'connected',
        data: { message: 'WebSocket连接已建立' },
        timestamp: Date.now()
      });

      // 连接关闭时清理
      if (socket.on) {
        socket.on('close', () => {
          logger.info('WebSocket连接已关闭');
          self.removeConnection(connection);
        });

        // 处理客户端消息
        socket.on('message', (message: Buffer) => {
          try {
            const data = JSON.parse(message.toString());
            self.handleClientMessage(connection, data);
          } catch (error) {
            logger.error({ error }, '解析WebSocket消息失败');
          }
        });
      } else {
        logger.error('WebSocket socket object is not available');
        self.removeConnection(connection);
      }
    });
  }

  private setupAccountManagerEventListeners(): void {
    if (!this.accountManager) return;

    // 账号状态变化事件
    this.accountManager.on('accountStatusChanged', (data: any) => {
      this.broadcast({
        type: 'whatsapp_status',
        data,
        timestamp: Date.now()
      });
    });

    // 账号二维码更新事件
    this.accountManager.on('accountQRUpdated', (data: any) => {
      this.broadcast({
        type: 'qr_update',
        data,
        timestamp: Date.now()
      });
    });

    // 账号新消息事件
    this.accountManager.on('accountNewMessage', (data: any) => {
      logger.info({ data }, '📤 [WebSocket] 收到 accountNewMessage 事件，准备广播');
      this.broadcast({
        type: 'new_message',
        data,
        timestamp: Date.now()
      });
      logger.info({ connections: this.connections.size }, '📤 [WebSocket] 已广播到所有连接');
    });

    // 消息状态更新事件 (可选，需要 AccountManager 转发)
    // this.accountManager.on('messageStatusUpdate', (data: any) => {
    //   this.broadcast({
    //     type: 'message_status',
    //     data,
    //     timestamp: Date.now()
    //   });
    // });
  }

  private addConnection(connection: any): void {
    this.connections.add(connection);
    logger.info(`WebSocket连接数: ${this.connections.size}`);
  }

  private removeConnection(connection: any): void {
    this.connections.delete(connection);
    logger.info(`WebSocket连接数: ${this.connections.size}`);
  }

  private handleClientMessage(connection: any, message: any): void {
    logger.info({ message }, '收到WebSocket客户端消息');
    
    switch (message.type) {
      case 'ping':
        this.sendToConnection(connection, {
          type: 'pong',
          data: { timestamp: Date.now() },
          timestamp: Date.now()
        });
        break;
      
      case 'subscribe':
        // 处理订阅特定事件
        this.handleSubscription(connection, message.data);
        break;
      
      default:
        logger.warn({ message }, '未知的WebSocket消息类型');
    }
  }

  private handleSubscription(connection: any, data: any): void {
    // 可以根据需要实现订阅逻辑
    logger.info({ data }, '处理WebSocket订阅');
  }

  public broadcast(message: WebSocketMessage): void {
    if (this.connections.size === 0) return;

    const messageStr = JSON.stringify(message);
    
    this.connections.forEach((connection) => {
      try {
        const socket = connection.socket || connection;
        if (socket.readyState === 1) { // WebSocket.OPEN
          socket.send(messageStr);
        } else {
          this.removeConnection(connection);
        }
      } catch (error) {
        logger.error({ error }, '发送WebSocket消息失败');
        this.removeConnection(connection);
      }
    });
  }

  public sendToConnection(connection: any, message: WebSocketMessage): void {
    try {
      const socket = connection.socket || connection;
      if (socket.readyState === 1) {
        socket.send(JSON.stringify(message));
      }
    } catch (error) {
      logger.error({ error }, '发送WebSocket消息到特定连接失败');
    }
  }

  public getConnectionCount(): number {
    return this.connections.size;
  }
}

export const webSocketService = new WebSocketService();
