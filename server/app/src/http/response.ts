import { FastifyReply } from 'fastify';

export interface ErrorPayload {
  code: string;
  message: string;
  details?: unknown;
}

export interface SuccessResponse<T> {
  ok: true;
  data: T;
}

export interface ErrorResponse {
  ok: false;
  code: string;
  message: string;
  details?: unknown;
}

export function sendError(reply: FastifyReply, statusCode: number, payload: ErrorPayload): FastifyReply {
  return reply.status(statusCode).send({
    ok: false,
    code: payload.code,
    message: payload.message,
    details: payload.details,
  });
}

export function sendOk<T>(reply: FastifyReply, statusCode: number, data: T): FastifyReply {
  return reply.status(statusCode).send({ ok: true, data });
}