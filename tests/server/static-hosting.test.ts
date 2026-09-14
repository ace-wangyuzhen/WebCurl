import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildApp } from "../../src/server/app";

it("serves the frontend and keeps api routes available", async () => {
  const root = await mkdtemp(join(tmpdir(), "web-curl-static-"));
  await writeFile(
    join(root, "index.html"),
    '<!doctype html><div id="root"></div>',
  );

  const app = await buildApp({ logger: false, staticRoot: root });

  const page = await app.inject({ method: "GET", url: "/" });
  const health = await app.inject({ method: "GET", url: "/api/health" });

  expect(page.statusCode).toBe(200);
  expect(page.body).toContain('<div id="root"></div>');
  expect(health.json()).toEqual({ ok: true, service: "web-curl" });

  await app.close();
});

it("falls back to index.html for non-api browser routes only", async () => {
  const root = await mkdtemp(join(tmpdir(), "web-curl-static-"));
  await writeFile(
    join(root, "index.html"),
    '<!doctype html><div id="root"></div>',
  );

  const app = await buildApp({ logger: false, staticRoot: root });

  const spaRoute = await app.inject({ method: "GET", url: "/collections" });
  const apiRoute = await app.inject({
    method: "GET",
    url: "/api/does-not-exist",
  });

  expect(spaRoute.statusCode).toBe(200);
  expect(spaRoute.body).toContain('<div id="root"></div>');
  expect(apiRoute.statusCode).toBe(404);
  expect(apiRoute.json()).toEqual({
    ok: false,
    error: { code: "INVALID_REQUEST", message: "Route not found" },
  });

  await app.close();
});
