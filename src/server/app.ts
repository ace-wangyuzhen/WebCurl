import fastify, {
  type FastifyInstance,
  type FastifyServerOptions,
} from "fastify";
import helmet from "@fastify/helmet";
import { DEFAULT_CONFIG } from "./config";
import { AppError, type ErrorCode } from "./errors";
import { registerHealthRoute } from "./health/health-route";

export interface BuildAppOptions extends FastifyServerOptions {
  maxRequestBodyBytes?: number;
  staticRoot?: string;
}

interface FastifyErrorLike extends Error {
  code?: string;
  statusCode?: number;
}

function getErrorResponse(error: unknown): {
  code: ErrorCode;
  message: string;
  statusCode: number;
} {
  if (error instanceof AppError) {
    return {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
    };
  }

  const fastifyError = error as FastifyErrorLike;
  if (
    typeof fastifyError.statusCode === "number" &&
    fastifyError.statusCode < 500
  ) {
    return {
      code: "INVALID_REQUEST",
      message: fastifyError.message,
      statusCode: fastifyError.statusCode,
    };
  }

  return {
    code: "INTERNAL_ERROR",
    message: "Internal server error",
    statusCode: 500,
  };
}

export async function buildApp(
  options: BuildAppOptions = {},
): Promise<FastifyInstance> {
  const { maxRequestBodyBytes, staticRoot, ...fastifyOptions } = options;
  const app = fastify({
    ...fastifyOptions,
    bodyLimit: maxRequestBodyBytes ?? DEFAULT_CONFIG.maxRequestBodyBytes,
  });

  // Reserved for Task 9 static hosting without changing the API boundary.
  void staticRoot;

  app.setErrorHandler((error, _request, reply) => {
    const normalizedError = getErrorResponse(error);
    reply.status(normalizedError.statusCode).send({
      ok: false,
      error: {
        code: normalizedError.code,
        message: normalizedError.message,
      },
    });
  });

  await app.register(helmet);
  registerHealthRoute(app);
  await app.ready();

  return app;
}
