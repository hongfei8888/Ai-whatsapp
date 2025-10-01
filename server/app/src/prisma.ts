import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

export const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'event' },
    { level: 'warn', emit: 'event' },
  ],
});

prisma.$on('error', (event) => {
  logger.error({ component: 'prisma', event }, 'Prisma error');
});

prisma.$on('warn', (event) => {
  logger.warn({ component: 'prisma', event }, 'Prisma warning');
});

prisma.$on('query', (event) => {
  if (process.env.PRISMA_LOG_QUERIES === 'true') {
    logger.debug({ component: 'prisma', query: event.query, params: event.params, duration: event.duration }, 'Prisma query');
  }
});

export async function shutdownPrisma(): Promise<void> {
  await prisma.$disconnect();
}
