import pino from 'pino';

type Logger = pino.Logger;

const level = process.env.LOG_LEVEL ?? 'info';

export const logger: Logger = pino({
  level,
});
