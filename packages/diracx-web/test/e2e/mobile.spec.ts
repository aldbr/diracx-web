import type { Page } from "@playwright/test";
import { test, expect, contains } from "./fixtures";
import { setupJobMonitorDashboard, ensureMinimumJobs } from "./jobMonitorUtils";

/**
 * Asserts that the page has no horizontal overflow.
 * If document.scrollWidth exceeds the viewport width, content is
 * escaping its container — exactly the kind of regression this
 * test is meant to catch.
 */
async function expectNoHorizontalOverflow(page: Page) {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(
    scrollWidth,
    `Page content (${scrollWidth}px) should not exceed viewport width (${clientWidth}px)`,
  ).toBeLessThanOrEqual(clientWidth);
}

test.describe("Mobile Viewport — no horizontal overflow", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test.beforeEach(async ({ page }) => {
    await setupJobMonitorDashboard(page);
    await page.goto("/");
  });

  test("Job Monitor table and pie chart fit within the viewport", async ({
    page,
  }) => {
    await contains(page, "Job Monitor").click();
    await ensureMinimumJobs(page, 5);

    // Wait for both table and pie chart to render
    await expect(page.locator("table")).toBeVisible();
    await expect(page.getByTestId("job-pie-chart")).toBeVisible();

    await expectNoHorizontalOverflow(page);
  });

  test("Job Monitor with filters applied fits within the viewport", async ({
    page,
  }) => {
    await contains(page, "Job Monitor").click();
    await ensureMinimumJobs(page, 5);

    await expect(page.locator("table")).toBeVisible();

    // Add a filter via the pie chart (click the first slice)
    await page
      .getByTestId("job-pie-chart")
      .locator(".MuiPieArc-root")
      .first()
      .dispatchEvent("click");

    // Wait for filter chip to appear
    await expect
      .poll(() =>
        page.getByTestId("search-bar").locator(".MuiChip-root").count(),
      )
      .toBeGreaterThan(0);

    await expectNoHorizontalOverflow(page);
  });
});
