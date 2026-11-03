import type { Page } from "@playwright/test";
import { test, expect, contains, typeKeys, visitApp } from "./fixtures";
import { setupJobMonitorDashboard, ensureMinimumJobs } from "./jobMonitorUtils";

function filterChips(page: Page) {
  return page.getByTestId("search-bar").locator(".MuiChip-root");
}

async function firstJobId(page: Page) {
  const text = await page
    .locator("table tbody tr")
    .first()
    .locator("td")
    .nth(1)
    .textContent();
  return text!.trim();
}

test.describe("Job Monitor - Filters", () => {
  test.beforeEach(async ({ page }) => {
    await setupJobMonitorDashboard(page);
    await visitApp(page);

    await contains(page, "Job Monitor").click();

    await ensureMinimumJobs(page, 55);
    await expect(page.locator("table")).toBeVisible();
  });

  test("should handle filter addition", async ({ page }) => {
    await typeKeys(
      page.getByTestId("search-field"),
      "ID{enter}={enter}1{enter}",
    );

    await expect(filterChips(page)).toHaveCount(3);
  });

  test("should handle filter editing", async ({ page }) => {
    await typeKeys(
      page.getByTestId("search-field"),
      "ID{enter}={enter}1{enter}",
    );

    await typeKeys(page.getByTestId("search-field"), "{leftArrow}2{enter}");
    await expect(contains(filterChips(page), "12")).toBeAttached();
  });

  test("should handle filter clear", async ({ page }) => {
    await typeKeys(
      page.getByTestId("search-field"),
      "ID{enter}={enter}1{enter}",
    );

    await expect(filterChips(page)).toHaveCount(3);

    await page.getByTestId("clear-filters-button").click();

    await expect(filterChips(page)).toHaveCount(0);
  });

  test("should handle filter apply and persist", async ({ page }) => {
    const jobID = await firstJobId(page);
    await typeKeys(
      page.getByTestId("search-field"),
      `ID{enter}={enter}${jobID}{enter}`,
    );

    await expect(filterChips(page)).toHaveCount(3);
    await expect(contains(filterChips(page), "ID")).toBeAttached();

    await expect(page.locator("table tbody tr")).toHaveCount(1);
  });

  test("should handle filter apply and save filters in dashboard", async ({
    page,
  }) => {
    const jobID = await firstJobId(page);
    await typeKeys(
      page.getByTestId("search-field"),
      `ID{enter}={enter}${jobID}{enter}`,
    );

    // Wait for the filter to apply and state to be saved
    await page.waitForTimeout(1000);

    await expect(filterChips(page)).toHaveCount(3);

    await contains(
      page.locator(".MuiButtonBase-root"),
      "Job Monitor 2",
    ).click();

    await expect(filterChips(page)).toHaveCount(0);

    await contains(page.locator(".MuiButtonBase-root"), "Job Monitor").click();

    await expect(filterChips(page)).toHaveCount(3);
  });

  test("should control the in the last operator utilization", async ({
    page,
  }) => {
    await typeKeys(
      page.getByTestId("search-field"),
      "Submission Time{enter}in the last{enter}4206942 years{enter}",
    );

    await expect(filterChips(page)).toHaveCount(3);

    await expect(page.locator("table")).toBeVisible();
  });
});
