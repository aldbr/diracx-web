import type { Locator, Page } from "@playwright/test";
import { test, expect, contains, presetDashboard, visitApp } from "./fixtures";

test.describe("DashboardDrawer", () => {
  test.describe.configure({ retries: 5 });

  test.beforeEach(async ({ page }) => {
    await presetDashboard(
      page,
      '[{"title":"My dashboard","extended":true,"items":[{"title":"My Jobs","type":"Job Monitor","id":"JobMonitor0"}]},{"title":"Others","extended":false,"items":[]}]',
    );
    await visitApp(page);
  });

  test("should render the drawer", async ({ page }) => {
    // Check if the drawer is rendered
    await expect(contains(page, "My Jobs")).toBeVisible();
  });

  test("should toggle the group on button click", async ({ page }) => {
    await contains(page, "My dashboard").click();
    // Check if the drawer is not visible after clicking the toggle button
    await expect(
      contains(page.locator(".MuiButtonBase-root"), "My Jobs"),
    ).toBeHidden();
  });

  test("should handle application addition", async ({ page }) => {
    await contains(page, "Add application").click();

    await contains(page.locator("button"), "Job Monitor").click();

    await contains(page, "Others").click();
    // Check if the application is added
    await expect(contains(page, "Job Monitor")).toBeVisible();
  });

  test("should handle application deletion", async ({ page }) => {
    await contains(page.locator(".MuiListItemButton-root"), "My Jobs").click({
      button: "right",
    });
    await contains(page, "Delete").click();

    // Check if the application is deleted
    await expect(
      page.locator(".MuiListItemButton-root").getByText(/My Jobs/),
    ).toHaveCount(0);
  });

  test("should handle application renaming", async ({ page }) => {
    await contains(page.locator(".MuiListItemButton-root"), "My Jobs").click({
      button: "right",
    });
    await contains(page, "Rename").click();
    await page.locator("input").first().pressSequentially("=^.^=");
    await page.locator("input").first().press("Enter");

    // Check if the application is renamed
    await expect(
      contains(page.locator(".MuiListItemButton-root"), "=^.^="),
    ).toBeVisible();
  });

  test("should handle group creation", async ({ page }) => {
    await page.getByTestId("drawer-permanent").dispatchEvent("contextmenu");
    await contains(page, "New Group").click();

    await expect(contains(page, "Group 3")).toBeVisible();
  });

  test("should handle group deletion", async ({ page }) => {
    await contains(page, "Others").click({ button: "right" });
    await contains(page, "Delete").click();

    // Check if the group is deleted
    await expect(page.getByText(/Others/)).toHaveCount(0);
  });

  test("should handle group renaming", async ({ page }) => {
    await contains(page, "Others").click({ button: "right" });
    await contains(page, "Rename").click();

    await page.locator("input").first().pressSequentially("Other 1");
    await page.locator("input").first().press("Enter");

    // Check if the group is renamed
    await expect(contains(page, "Other 1")).toBeVisible();
  });

  test("should create a new group if there is no group", async ({ page }) => {
    await contains(page, "My dashboard").click({ button: "right" });
    await contains(page, "Delete").click();
    await contains(page, "Others").click({ button: "right" });
    await contains(page, "Delete").click();

    await contains(page, "Add application").click();
    const jobMonitorButton = contains(page.locator("button"), "Job Monitor");
    await jobMonitorButton.click();
    await jobMonitorButton.click();

    await expect(contains(page, "Group 1")).toBeVisible();

    await contains(page, "Group 1").click();

    await expect(contains(page, "Job Monitor")).toBeVisible();
  });

  test("should persist the state of the drawer", async ({ page }) => {
    await contains(page, "My dashboard").click();

    // Check if the drawer is not visible before reloading
    const myJobs = contains(page.locator(".MuiButtonBase-root"), "My Jobs");
    await expect(myJobs).toBeHidden();
    await page.waitForTimeout(500);

    await page.reload();
    // Check if the drawer is still not visible after reloading
    await expect(myJobs).toBeHidden();
  });

  test("should load the state of the drawer from session storage", async ({
    page,
  }) => {
    // Check if the session storage is correctly loaded
    await expect(contains(page, "My Jobs")).toBeVisible();
    await expect(contains(page, "Others")).toBeVisible();
    await expect(contains(page, "My dashboard")).toBeVisible();
  });

  test("should navigate to the application on click", async ({ page }) => {
    await contains(page, "My Jobs").click();
    // Check if the application is navigated to
    await expect(contains(page, "Job Monitor")).toBeVisible();
  });

  test("should handle drag and drop for items", async ({ page }) => {
    await dragAndDrop(
      page,
      page.locator("[draggable=true]", { hasText: "My Jobs" }).first(),
      page
        .locator("[data-drop-target-for-element=true]", { hasText: "Others" })
        .first(),
      page.getByTestId("drag-handle").first(),
    );

    // Check if the application is dropped
    await expect(
      contains(page.locator(":nth-child(2) > .MuiPaper-root"), "My Jobs"),
    ).toBeVisible();

    await expect
      .poll(() => page.evaluate(() => sessionStorage.getItem("savedDashboard")))
      .toBe(
        '[{"title":"My dashboard","extended":true,"items":[]},{"title":"Others","extended":true,"items":[{"title":"My Jobs","type":"Job Monitor","id":"JobMonitor0"}]}]',
      );
  });
});

/**
 * Drag `source` (picked up by `handle` if given) and drop it onto `target`
 * with synthetic HTML5 drag events.
 */
async function dragAndDrop(
  page: Page,
  source: Locator,
  target: Locator,
  handle?: Locator,
) {
  const elements = await Promise.all([
    source.elementHandle(),
    target.elementHandle(),
    handle ? handle.elementHandle() : null,
  ]);

  await page.evaluate(([src, target, handle]) => {
    const center = (el: Element) => {
      const rect = el.getBoundingClientRect();
      return {
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2,
        pageX: rect.left + rect.width / 2,
        pageY: rect.top + rect.height / 2,
      };
    };
    const dataTransfer = new DataTransfer();
    const targetPos = center(target!);

    // pick up (at the handle if provided)
    src!.dispatchEvent(
      new DragEvent("dragstart", {
        dataTransfer,
        bubbles: true,
        ...center(handle ?? src!),
      }),
    );
    // drag
    target!.dispatchEvent(
      new DragEvent("dragover", { dataTransfer, bubbles: true, ...targetPos }),
    );
    // drop
    target!.dispatchEvent(
      new DragEvent("drop", { dataTransfer, bubbles: true, ...targetPos }),
    );
  }, elements);
}
