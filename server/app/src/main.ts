import { logger } from './logger';
import { shutdownPrisma } from './prisma';
import { buildServer } from './server';

async function bootstrap(): Promise<void> {
  const app = await buildServer();

  // 注意：消息处理器现在由 AccountManager 为每个账号实例单独注册
  // WhatsApp服务将在用户通过 API 启动账号时初始化

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
