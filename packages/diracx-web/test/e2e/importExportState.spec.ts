import type { Page } from "@playwright/test";
import { test, expect, contains, visitApp } from "./fixtures";

async function openExportMenu(page: Page) {
  const exportButton = page.locator('[aria-label="Export application state"]');
  await expect(exportButton).toBeVisible();
  await exportButton.click();
  await expect(page.getByTestId("export-menu")).toBeVisible();
}

async function openImportMenu(page: Page) {
  const importButton = page.locator('[aria-label="Import application state"]');
  await expect(importButton).toBeVisible();
  await importButton.click();
  await expect(page.getByTestId("import-menu")).toBeVisible();
}

function importField(page: Page) {
  return page.locator('[datatype="import-menu-field"]').getByRole("textbox");
}

async function clickVisible(page: Page, text: string) {
  const element = contains(page, text);
  await expect(element).toBeVisible();
  await element.click();
}

test.describe("Export and import app state", () => {
  test.beforeEach(async ({ page }) => {
    await visitApp(page);

    // Open 2 Job Monitor apps
    for (let i = 0; i < 2; i++) {
      await page.getByTestId("add-application-button").click();
      await contains(
        page.getByTestId("create-application-button"),
        "Job Monitor",
      ).click();
    }
  });

  test("export button should be visible", async ({ page }) => {
    await openExportMenu(page);

    // Select 2 items to share
    await page.getByTestId("checkbox-JobMonitor0").click();
    await page.getByTestId("checkbox-Job Monitor 0").click();

    // Share and cancel the export
    await clickVisible(page, "Export 2 selected");
    await clickVisible(page, "Cancel");

    // Select 1 item and share it
    await openExportMenu(page);
    await page.getByTestId("checkbox-JobMonitor0").click();
    await clickVisible(page, "Export 1 selected");
  });

  // Test case to check the copy of the non-empty state
  test("should copy a non-empty state", async ({ page }) => {
    // Select the Job Monitor app
    await openExportMenu(page);
    await page.getByTestId("checkbox-Job Monitor 0").click();
    await clickVisible(page, "Export 1 selected");

    // Record what is copied to the clipboard
    await page.evaluate(() => {
      const writes: string[] = [];
      (window as unknown as { clipboardWrites: string[] }).clipboardWrites =
        writes;
      navigator.clipboard.writeText = async (text: string) => {
        writes.push(text);
      };
    });

    await contains(page, "Copy").click();

    // Note: the exported state deliberately excludes `rowSelection`
    // (transient UI state) since the persistence-format change; older
    // exports that still contain it remain importable (see the fixture
    // in "should import the non-empty state" below).
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (window as unknown as { clipboardWrites: string[] })
              .clipboardWrites,
        ),
      )
      .toEqual([
        '[{\"appType\":\"Job Monitor\",\"appName\":\"Job Monitor \",\"state\":\"{\\"filters\\":[],\\"columnVisibility\\":{\\"JobGroup\\":false,\\"JobType\\":false,\\"Owner\\":false,\\"OwnerGroup\\":false,\\"VO\\":false,\\"StartExecTime\\":false,\\"EndExecTime\\":false,\\"UserPriority\\":false},\\"columnPinning\\":{\\"left\\":[\\"JobID\\"]},\\"pagination\\":{\\"pageIndex\\":0,\\"pageSize\\":25}}\"}]',
      ]);
  });

  test("should copy multiple states", async ({ page }) => {
    // Open My Jobs:
    await contains(page, "My Jobs").click();

    await openExportMenu(page);
    await page.getByTestId("checkbox-JobMonitor0").click();
    await page.getByTestId("checkbox-Job Monitor 0").click();
    await page.getByTestId("checkbox-Job Monitor 1").click();
    await clickVisible(page, "Export 3 selected");

    await expect(contains(page, '"appType":"Job Monitor"')).toBeAttached();
  });

  test("should the import button be visible", async ({ page }) => {
    await openImportMenu(page);
    await clickVisible(page, "Cancel");
    await expect(
      page.getByText("Paste your application state here..."),
    ).toHaveCount(0);
  });

  test("should not import what's not a valid JSON", async ({ page }) => {
    await openImportMenu(page);
    await importField(page).fill(
      "Houston, we have a problem: this isn't JSON.",
    );
    await contains(page.locator("button"), "Import").click();
    await expect(contains(page, "Invalid JSON format")).toBeVisible();
  });

  test("should import the empty state", async ({ page }) => {
    await openImportMenu(page);
    await importField(page).fill(
      '[\n  {\n    "appType": "Job Monitor",\n    "appName": "Empty App",\n    "state": "null"\n  }\n]',
    );
    await contains(page.locator("button"), "Import").click();
    await expect(page.getByText("Imported Applications")).toHaveCount(0);
  });

  // Test case to check the import of the non-empty state
  test("should import the non-empty state", async ({ page }) => {
    await openImportMenu(page);
    await importField(page).fill(
      `[
      {
    "appType": "Job Monitor",
    "appName": "Job Monitor 2",
    "state": "{\\"filters\\":[],\\"columnVisibility\\":{\\"JobGroup\\":false,\\"JobType\\":false,\\"Owner\\":false,\\"OwnerGroup\\":false,\\"VO\\":false,\\"StartExecTime\\":false,\\"EndExecTime\\":false,\\"UserPriority\\":false},\\"columnPinning\\":{\\"left\\":[\\"JobID\\"],\\"right\\":[]},\\"rowSelection\\":{},\\"pagination\\":{\\"pageIndex\\":0,\\"pageSize\\":25}}"
  }
]`,
    );
    await contains(page.locator("button"), "Import").click();
    await expect(contains(page, "Imported Applications")).toBeVisible();

    await contains(page, "Job Monitor 2").click();
    await expect(
      contains(page.locator(".MuiTypography-h4"), "Job Monitor 2"),
    ).toBeAttached();
  });
});
