import { logger } from './logger';
import { shutdownPrisma } from './prisma';
import { buildServer } from './server';
import { whatsappService } from './whatsapp-service';
import { handleIncomingMessage, handleOutgoingMessage } from './workflows/message-workflow';

async function bootstrap(): Promise<void> {
  const app = await buildServer();

  // 注册消息处理器，但不自动启动WhatsApp服务
  whatsappService.onIncomingMessage(handleIncomingMessage);
  whatsappService.onOutgoingMessage(handleOutgoingMessage);
  // 注意：WhatsApp服务将在用户点击"添加账号"时手动启动

  const port = Number.parseInt(process.env.PORT ?? '3000', 10);
  const host = process.env.HOST ?? '0.0.0.0';

  await app.listen({ port, host });
  logger.info({ port, host }, 'Fastify server started');

  const shutdown = async () => {
    logger.info('Shutting down');
    await Promise.allSettled([
      app.close(),
      shutdownPrisma(),
    ]);
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown());
  process.on('SIGTERM', () => void shutdown());
}

bootstrap().catch((error) => {
  logger.error({ err: error }, 'Fatal error during bootstrap');
  void shutdownPrisma().finally(() => process.exit(1));
});
