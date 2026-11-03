import { test, expect, contains, visitApp } from "./fixtures";
import {
  setupJobMonitorDashboard,
  ensureMinimumJobs,
  jobIdOfRow,
} from "./jobMonitorUtils";

test.describe("Job Monitor - Columns", () => {
  test.beforeEach(async ({ page }) => {
    await setupJobMonitorDashboard(page);
    await visitApp(page);

    await contains(page, "Job Monitor").click();

    await ensureMinimumJobs(page, 55);
  });

  test("should hide/show columns", async ({ page }) => {
    const header = page.locator("table thead tr").first();
    // Make sure "VO" is not in the header and "Status" is
    await expect(header).not.toContainText("VO");
    await expect(header).toContainText("Status");

    // Click on the visibility icon
    await page.getByTestId("column-visibility-button").click();
    const popover = page.getByTestId("column-visibility-popover");
    await expect(popover).toBeVisible();

    // Hide the "Site" column and Show the "VO" column
    for (const column of ["Site", "VO"]) {
      await contains(popover, column)
        .locator("..")
        .locator('input[type="checkbox"]')
        .click();
    }

    // Close the popover by clicking outside
    await page.mouse.click(0, 0);
    await expect(popover).toHaveCount(0);

    // Verify "VO" is now present and "Site" is gone
    await expect(header).toContainText("VO");
    await expect(header).not.toContainText("Site");
  });

  test("should resize a column", async ({ page }) => {
    const column = page.locator("table thead tr th").nth(2);
    const initialWidth = (await column.boundingBox())!.width;

    // Drag the resize handle of the column to the left
    const handle = page.locator(
      ".MuiTableHead-root > .MuiTableRow-root > :nth-child(3) > .MuiBox-root",
    );
    const box = (await handle.boundingBox())!;
    const y = box.y + box.height / 2;
    await page.mouse.move(box.x + box.width / 2, y);
    await page.mouse.down();
    await page.mouse.move(200, y);
    await page.mouse.up();

    // The column should be narrower than before
    await expect
      .poll(async () => (await column.boundingBox())!.width)
      .toBeLessThan(initialWidth);
  });

  test("should sort column", async ({ page }) => {
    // Get the first visible row value (e.g. 55)
    const firstValue = await jobIdOfRow(page, "first");

    await page.getByTestId("sort-JobID").click();

    // The table keeps the previous (descending) rows on screen while the
    // re-sorted page revalidates (SWR keepPreviousData): retry until the
    // ascending top row (smaller than the descending top) has loaded.
    await expect.poll(() => jobIdOfRow(page, "first")).toBeLessThan(firstValue);
    const firstValueSorted = await jobIdOfRow(page, "first");

    await page.getByTestId("sort-JobID").click();

    // Toggle back to descending: retry until the original top row returns.
    await expect
      .poll(() => jobIdOfRow(page, "first"))
      .toBeGreaterThan(firstValueSorted);
    expect(await jobIdOfRow(page, "first")).toBe(firstValue);
  });
});
