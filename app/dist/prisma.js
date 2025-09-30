"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
exports.shutdownPrisma = shutdownPrisma;
const client_1 = require("@prisma/client");
const logger_1 = require("./logger");
exports.prisma = new client_1.PrismaClient({
    log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'event' },
        { level: 'warn', emit: 'event' },
    ],
});
exports.prisma.$on('error', (event) => {
    logger_1.logger.error({ component: 'prisma', event }, 'Prisma error');
});
exports.prisma.$on('warn', (event) => {
    logger_1.logger.warn({ component: 'prisma', event }, 'Prisma warning');
});
exports.prisma.$on('query', (event) => {
    if (process.env.PRISMA_LOG_QUERIES === 'true') {
        logger_1.logger.debug({ component: 'prisma', query: event.query, params: event.params, duration: event.duration }, 'Prisma query');
    }
});
async function shutdownPrisma() {
    await exports.prisma.$disconnect();
}
//# sourceMappingURL=prisma.js.map