import fastify, {
  type FastifyInstance,
  type FastifyServerOptions,
} from "fastify";
import helmet from "@fastify/helmet";
import {
  DEFAULT_CONFIG,
  type ServerConfig,
} from "./config";
import { AppError, type ErrorCode } from "./errors";
import { registerHealthRoute } from "./health/health-route";

declare module "fastify" {
  interface FastifyInstance {
    config: ServerConfig;
    staticRoot?: string;
  }
}

export interface BuildAppOptions extends FastifyServerOptions {
  config?: ServerConfig;
  staticRoot?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
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

  const fastifyError = isRecord(error) ? error : undefined;
  const statusCode = fastifyError?.statusCode;
  const message =
    typeof fastifyError?.message === "string"
      ? fastifyError.message
      : undefined;

  if (
    typeof statusCode === "number" &&
    statusCode >= 400 &&
    statusCode < 500
  ) {
    return {
      code: "INVALID_REQUEST",
      message: message ?? "Invalid request",
      statusCode,
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
  const {
    config = DEFAULT_CONFIG,
    staticRoot,
    ...fastifyOptions
  } = options;
  const app = fastify({
    ...fastifyOptions,
    bodyLimit: config.maxRequestBodyBytes,
  });

  app.decorate("config", config);
  if (staticRoot !== undefined) {
    app.decorate("staticRoot", staticRoot);
  }

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

  app.setNotFoundHandler((_request, reply) => {
    reply.status(404).send({
      ok: false,
      error: {
        code: "INVALID_REQUEST",
        message: "Route not found",
      },
    });
  });

  app.register(helmet);
  registerHealthRoute(app);

  return app;
}
