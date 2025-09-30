"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("./logger");
const prisma_1 = require("./prisma");
const server_1 = require("./server");
const whatsapp_service_1 = require("./whatsapp-service");
const message_workflow_1 = require("./workflows/message-workflow");
async function bootstrap() {
    const app = await (0, server_1.buildServer)();
    whatsapp_service_1.whatsappService.onIncomingMessage(message_workflow_1.handleIncomingMessage);
    whatsapp_service_1.whatsappService.onOutgoingMessage(message_workflow_1.handleOutgoingMessage);
    await whatsapp_service_1.whatsappService.start();
    const port = Number.parseInt(process.env.PORT ?? '3000', 10);
    const host = process.env.HOST ?? '0.0.0.0';
    await app.listen({ port, host });
    logger_1.logger.info({ port, host }, 'Fastify server started');
    const shutdown = async () => {
        logger_1.logger.info('Shutting down');
        await Promise.allSettled([
            app.close(),
            (0, prisma_1.shutdownPrisma)(),
        ]);
        process.exit(0);
    };
    process.on('SIGINT', () => void shutdown());
    process.on('SIGTERM', () => void shutdown());
}
bootstrap().catch((error) => {
    logger_1.logger.error({ err: error }, 'Fatal error during bootstrap');
    void (0, prisma_1.shutdownPrisma)().finally(() => process.exit(1));
});
//# sourceMappingURL=main.js.map