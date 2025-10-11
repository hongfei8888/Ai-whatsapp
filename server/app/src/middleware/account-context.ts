import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../logger';

// 扩展 FastifyRequest 类型以包含 accountId
declare module 'fastify' {
  interface FastifyRequest {
    accountId?: string;
  }
}

/**
 * 账号上下文中间件
 * 从请求头或查询参数中提取 accountId 并验证
 */
export async function accountContextMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  // 跳过账号管理路由（这些路由不需要账号上下文）
  if (request.url.startsWith('/accounts')) {
    return;
  }

  // 跳过状态检查路由
  if (request.url === '/status' || request.url === '/health') {
    return;
  }

  // 跳过 WebSocket 路由（不需要账号上下文，会广播所有账号的事件）
  if (request.url === '/ws' || request.url.startsWith('/ws?')) {
    return;
  }

  // 🖼️ 跳过媒体文件路由（浏览器 <img> 标签无法携带自定义头部）
  // 媒体文件通过唯一文件名访问，无需账号验证
  if (request.url.startsWith('/media/files/') || request.url.startsWith('/media/thumbnails/')) {
    return;
  }

  // 从请求头获取 accountId
  let accountId = request.headers['x-account-id'] as string;

  // 如果头部没有，尝试从查询参数获取
  if (!accountId && request.query && typeof request.query === 'object') {
    accountId = (request.query as any).accountId;
  }

  // 如果没有提供 accountId，返回错误
  if (!accountId) {
    logger.warn({ url: request.url, method: request.method }, 'Request missing accountId');
    return reply.status(400).send({
      success: false,
      error: 'Missing account ID. Please provide X-Account-Id header or accountId query parameter.'
    });
  }

  // 验证账号是否存在且激活
  try {
    const { prisma } = request.server;
    const account = await prisma.account.findUnique({
      where: { id: accountId }
    });

    if (!account) {
      logger.warn({ accountId }, 'Account not found');
      return reply.status(404).send({
        success: false,
        error: 'Account not found'
      });
    }

    if (!account.isActive) {
      logger.warn({ accountId }, 'Account is not active');
      return reply.status(403).send({
        success: false,
        error: 'Account is not active'
      });
    }

    // 将 accountId 添加到请求对象
    request.accountId = accountId;

    logger.debug({ accountId, url: request.url }, 'Account context set');
  } catch (error) {
    logger.error({ accountId, error }, 'Failed to validate account');
    return reply.status(500).send({
      success: false,
      error: 'Failed to validate account'
    });
  }
}

