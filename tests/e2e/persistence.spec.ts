import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("web-curl-language", "en");
  });
});

test("restores a created request after a reload", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /new request/i }).click();
  await expect(page.getByText("New Request")).toBeVisible();

  await page.reload();
  await expect(page.getByText("New Request")).toBeVisible();
});

for (const width of [320, 768, 1024, 1440]) {
  test(`layout fits ${width}px without horizontal overflow`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");

    const overflows = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    );
    expect(overflows).toBe(false);
  });
}
