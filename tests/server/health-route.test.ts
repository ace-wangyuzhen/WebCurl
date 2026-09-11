import { buildApp } from "../../src/server/app";

it("returns a healthy service response", async () => {
  const app = await buildApp({ logger: false });
  const response = await app.inject({ method: "GET", url: "/api/health" });

  expect(response.statusCode).toBe(200);
  expect(response.json()).toEqual({ ok: true, service: "web-curl" });

  await app.close();
});
