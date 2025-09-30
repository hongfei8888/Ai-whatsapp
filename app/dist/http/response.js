"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendError = sendError;
exports.sendOk = sendOk;
function sendError(reply, statusCode, payload) {
    return reply.status(statusCode).send({
        ok: false,
        code: payload.code,
        message: payload.message,
        details: payload.details,
    });
}
function sendOk(reply, statusCode, data) {
    return reply.status(statusCode).send({ ok: true, data });
}
//# sourceMappingURL=response.js.map