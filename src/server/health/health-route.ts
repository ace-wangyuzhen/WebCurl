import type { FastifyInstance } from "fastify";
import type { HealthResponse } from "../../shared/contracts";

export function registerHealthRoute(app: FastifyInstance): void {
  app.get<{ Reply: HealthResponse }>("/api/health", async () => ({
    ok: true,
    service: "web-curl",
  }));
}
