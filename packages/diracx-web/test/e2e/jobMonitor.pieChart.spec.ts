import type { Page } from "@playwright/test";
import { test, expect, contains, visitApp } from "./fixtures";
import { setupJobMonitorDashboard, ensureMinimumJobs } from "./jobMonitorUtils";

async function totalJobs(page: Page) {
  const text = await page
    .locator(".MuiTablePagination-displayedRows")
    .textContent();
  return parseInt(text!.split("of")[1].trim(), 10);
}

test.describe("Job Monitor - Pie Chart", () => {
  test.beforeEach(async ({ page }) => {
    await setupJobMonitorDashboard(page);
    await visitApp(page);

    await contains(page, "Job Monitor").click();

    await ensureMinimumJobs(page, 55);
  });

  test("should render the pie chart alongside the table", async ({ page }) => {
    // Both table and pie chart should be visible (no toggle needed)
    await expect(page.locator("table")).toBeVisible();
    await expect(page.getByTestId("job-pie-chart")).toBeVisible();
    await expect(page.getByTestId("group-selector")).toBeVisible();
  });

  test("should add a filter when clicking a pie chart slice", async ({
    page,
  }) => {
    const pieChart = page.getByTestId("job-pie-chart");
    // Ensure pie chart is rendered with slices
    await expect
      .poll(() => pieChart.locator(".MuiPieArc-root").count())
      .toBeGreaterThan(0);

    // Record the number of rows before clicking
    const totalBefore = await totalJobs(page);

    // Click the first pie slice (dispatched on the slice itself: the center
    // of its bounding box may belong to another slice)
    await pieChart
      .locator(".MuiPieArc-root.MuiPieArc-data-index-0")
      .dispatchEvent("click");

    // A filter chip should appear in the search bar
    await expect(
      page.getByTestId("search-bar").locator(".MuiChip-root"),
    ).toHaveCount(3);

    // The total number of jobs should be less than or equal to before
    expect(await totalJobs(page)).toBeLessThanOrEqual(totalBefore);
  });

  test("should update the pie chart when changing the group-by column", async ({
    page,
  }) => {
    const pieChart = page.getByTestId("job-pie-chart");
    // The default group is "Status", switch to "Site"
    await contains(page.getByTestId("group-selector"), "Site").click();

    // The pie chart should still render with slices
    await expect
      .poll(() => pieChart.locator(".MuiPieArc-root").count())
      .toBeGreaterThan(0);

    // Click a slice to verify the filter uses the new group column
    await pieChart
      .locator(".MuiPieArc-root.MuiPieArc-data-index-0")
      .dispatchEvent("click");

    // A filter chip should appear with the Site column
    const chips = page.getByTestId("search-bar").locator(".MuiChip-root");
    await expect(chips).toHaveCount(3);
    await expect(chips.first()).toContainText("Site");
  });
});
