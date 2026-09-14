import type { FastifyInstance } from "fastify";
import type { IncomingMessage } from "node:http";
import type { ExecuteResponse } from "../../shared/contracts";
import { executeRequest } from "./execute-service";
import { validateExecuteRequest } from "./execute-schema";

function createRequestAbortSignal(request: IncomingMessage): AbortSignal {
  const controller = new AbortController();
  if (request.aborted) {
    controller.abort();
    return controller.signal;
  }
  request.once("aborted", () => controller.abort());
  return controller.signal;
}

export function registerExecuteRoute(app: FastifyInstance): void {
  app.post<{ Body: unknown; Reply: ExecuteResponse }>(
    "/api/execute",
    async (request) => {
      const input = validateExecuteRequest(request.body);
      return executeRequest(input, {
        config: app.config,
        signal: createRequestAbortSignal(request.raw),
      });
    },
  );
}
