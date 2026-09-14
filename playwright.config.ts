import { defineConfig, devices } from "@playwright/test";

const PORT = 8081;

export default defineConfig({
  testDir: "./tests/e2e",
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: "on-first-retry",
    ...devices["Desktop Chrome"],
  },
  webServer: [
    {
      command: "node tests/e2e/upstream-server.mjs",
      url: "http://127.0.0.1:9090/health",
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `npm run build && PORT=${PORT} npm start`,
      url: `http://127.0.0.1:${PORT}/api/health`,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
