import type { Page } from "@playwright/test";
import { test, expect, contains, visitApp } from "./fixtures";
import {
  setupJobMonitorDashboard,
  ensureMinimumJobs,
  jobIdOfRow,
  scrollTableToBottom,
} from "./jobMonitorUtils";

/** The numbers shown by the pagination, e.g. [26, 50, 55] for "26-50 of 55". */
async function displayedRows(page: Page) {
  const pagination = page.locator(".MuiTablePagination-displayedRows");
  await expect(pagination).toHaveText(/\d+[–-]\d+ of \d+/);
  return (await pagination.textContent())!.match(/\d+/g)!.map(Number);
}

test.describe("Job Monitor - Pagination", () => {
  test.beforeEach(async ({ page }) => {
    await setupJobMonitorDashboard(page);
    await visitApp(page);

    await contains(page, "Job Monitor").click();

    await ensureMinimumJobs(page, 55);
  });

  test("should render the drawer", async ({ page }) => {
    await expect(contains(page.locator("header"), "Job Monitor")).toBeVisible();
  });

  test("should make sure the initial pagination is correct", async ({
    page,
  }) => {
    await expect(page.getByLabel("Go to previous page")).toBeDisabled();
    await expect(page.getByLabel("Go to first page")).toBeDisabled();
    await expect(page.getByLabel("Go to next page")).toBeEnabled();
    await expect(page.getByLabel("Go to last page")).toBeEnabled();

    await displayedRows(page);

    // Get the first visible row value (e.g. 55)
    const firstValue = await jobIdOfRow(page, "first");

    // Scroll and get the last visible row value (e.g. 31)
    await scrollTableToBottom(page);
    await expect.poll(() => jobIdOfRow(page, "last")).toBeLessThan(firstValue);
  });

  test("should go to the next page", async ({ page }) => {
    // Get the first visible row value (e.g. 55)
    const firstValue = await jobIdOfRow(page, "first");

    // Go to the next page
    await page.getByLabel("Go to next page").click();

    await expect(page.locator(".MuiTablePagination-displayedRows")).toHaveText(
      /^26[–-]50 of \d+/,
    );
    const [, , totalItems] = await displayedRows(page);
    expect(totalItems).toBeGreaterThan(50);

    await expect.poll(() => jobIdOfRow(page, "last")).toBeLessThan(firstValue);
  });

  test("should change the page size", async ({ page }) => {
    await page.locator(".MuiTablePagination-input .MuiSelect-select").click();

    // MUI renders this when the dropdown opens
    const listbox = page.locator('ul[role="listbox"]');
    await expect(listbox).toBeVisible();
    await listbox.locator("li", { hasText: "50" }).click();

    await expect(page.locator(".MuiTablePagination-displayedRows")).toHaveText(
      /^1[–-]50 of \d+/,
    );
    const [, , totalItems] = await displayedRows(page);
    expect(totalItems).toBeGreaterThan(50);

    // Get the first visible row value (e.g. 55)
    const firstValue = await jobIdOfRow(page, "first");

    // Scroll and get the last visible row value
    await scrollTableToBottom(page);
    await expect.poll(() => jobIdOfRow(page, "last")).toBeLessThan(firstValue);
  });
});
