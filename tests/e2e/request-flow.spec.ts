import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("web-curl-language", "en");
  });
});

test("creates a request, sends it, and renders the response", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /new request/i }).click();
  await page.getByLabel("Request URL").fill("http://127.0.0.1:9090/echo");
  await page.getByRole("button", { name: /send/i }).click();

  await expect(page.getByRole("region", { name: /response/i })).toContainText(
    "200",
  );
});
