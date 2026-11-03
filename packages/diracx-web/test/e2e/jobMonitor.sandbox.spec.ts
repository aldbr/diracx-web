import { test, expect, contains, visitApp } from "./fixtures";
import {
  setupJobMonitorDashboard,
  addJobWithOutputSandbox,
} from "./jobMonitorUtils";

test.describe("Job Monitor - Sandbox Download", () => {
  test.beforeEach(async ({ page }) => {
    await setupJobMonitorDashboard(page);
    await visitApp(page);
    await contains(page, "Job Monitor").click();

    // Wait for the table to be ready
    await expect(page.getByTestId("loading-skeleton")).toHaveCount(0);
  });

  test("should download output sandbox", async ({ page }) => {
    const jobId = await addJobWithOutputSandbox(page);

    // Refresh to see the new job
    await page.getByTestId("refresh-search-button").click();
    await expect(page.getByTestId("loading-skeleton")).toHaveCount(0);

    // Find the job row by its ID and right-click to open context menu
    await page
      .locator("table tbody td", { hasText: new RegExp(`^${jobId}$`) })
      .first()
      .click({ button: "right" });

    // Click download output sandbox from context menu
    const downloadButton = page.getByTestId("download-output-sandbox-button");
    await expect(downloadButton).toBeVisible();
    await downloadButton.click();

    // Verify the success snackbar appears
    await expect(
      contains(page, `Downloading output sandbox of ${jobId}`),
    ).toBeVisible();
  });
});
