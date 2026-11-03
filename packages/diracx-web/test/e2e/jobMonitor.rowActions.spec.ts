import type { Page } from "@playwright/test";
import { test, expect, contains, visitApp } from "./fixtures";
import { setupJobMonitorDashboard, ensureMinimumJobs } from "./jobMonitorUtils";

function row(page: Page, index: number) {
  return page.locator(`table tbody [data-index="${index}"]`);
}

/** Select the first three rows of the job table. */
async function selectFirstRows(page: Page) {
  for (const index of [0, 1, 2]) {
    await row(page, index).dispatchEvent("click");
  }
}

test.describe("Job Monitor - Row Actions", () => {
  test.beforeEach(async ({ page }) => {
    await setupJobMonitorDashboard(page);
    await visitApp(page);

    await contains(page, "Job Monitor").click();

    await ensureMinimumJobs(page, 55);
  });

  test("should display job history dialog", async ({ page }) => {
    await page
      .locator("table tbody tr")
      .first()
      .locator("td")
      .nth(3)
      .click({ button: "right" });

    // A context menu should appear
    await expect(contains(page, "Get history")).toBeVisible();
    await contains(page, "Get history").click();

    // A dialog should appear
    await expect(contains(page, "Job History:")).toBeVisible();
  });

  test("should kill jobs", async ({ page }) => {
    await selectFirstRows(page);

    await page.getByTestId("kill-jobs-button").first().click();

    // Make sure the job status is "Killed"
    for (const index of [0, 1, 2]) {
      await expect(row(page, index).locator("td").nth(2)).toContainText(
        "Killed",
      );
    }
  });

  test("should delete jobs", async ({ page }) => {
    await selectFirstRows(page);

    await page.getByTestId("delete-jobs-button").first().click();

    // Make sure the jobs are marked as deleted
    await expect(page.locator("table")).toBeVisible();
    for (const index of [0, 1, 2]) {
      await expect(row(page, index).locator("td").nth(2)).toContainText(
        "Deleted",
      );
    }
  });
});
