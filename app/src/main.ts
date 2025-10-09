import { logger } from './logger';
import { shutdownPrisma } from './prisma';
import { buildServer } from './server';
import { whatsappService } from './whatsapp-service';
import { handleIncomingMessage, handleOutgoingMessage } from './workflows/message-workflow';

async function bootstrap(): Promise<void> {
  const app = await buildServer();

  whatsappService.onIncomingMessage(handleIncomingMessage);
  whatsappService.onOutgoingMessage(handleOutgoingMessage);

  // 🔥 关键修改：先启动 Fastify，再异步启动 WhatsApp 服务
  const port = Number.parseInt(process.env.PORT ?? '3000', 10);
  const host = process.env.HOST ?? '0.0.0.0';

  await app.listen({ port, host });
  logger.info({ port, host }, 'Fastify server started');

  // WhatsApp 服务在后台异步启动，不阻塞 Fastify
  whatsappService.start().catch((error) => {
    logger.error({ err: error }, 'Failed to start WhatsApp service, but Fastify is still running');
  });

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
