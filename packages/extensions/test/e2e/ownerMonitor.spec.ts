import { test, expect, contains, presetDashboard, visitApp } from "./fixtures";

test.describe("Owner Monitor", () => {
  test.beforeEach(async ({ page }) => {
    // Open the page where the Owner Monitor is rendered
    await presetDashboard(
      page,
      '[{"title":"Group 2","extended":true,"items":[{"title":"Owner Monitor","id":"JOwner Monitor0","type":"Owner Monitor"},{"title":"Owner Monitor 2","id":"Owner Monitor 21","type":"Owner Monitor"}]}]',
    );
    await visitApp(page);
  });

  test("should render the drawer", async ({ page }) => {
    await expect(
      contains(page.locator("header"), "Owner Monitor"),
    ).toBeVisible();
  });

  /** Input field interactions */

  test("adds a new owner and verifies it in the table", async ({ page }) => {
    // Type the new owner name
    await page.getByTestId("owner-name-input").pressSequentially("Josephine");

    // Click the Add Owner button
    await page.locator("button", { hasText: "Add Owner" }).click();

    await page
      .getByTestId("table-scroller")
      .evaluate((el) => el.scrollTo(0, el.scrollHeight));

    // Assert the table contains the new owner
    await expect(
      page.locator("table tbody tr:last-child td:last-child"),
    ).toContainText("Josephine");
  });

  /** Column interactions */
  test("should hide/show columns", async ({ page }) => {
    // Click on the visibility icon
    await page.getByTestId("column-visibility-button").click();
    const popover = page.getByTestId("column-visibility-popover");
    await expect(popover).toBeVisible();

    // Hide the "Owner Name" column
    await contains(popover, "Owner Name")
      .locator("..")
      .locator('input[type="checkbox"]')
      .click();

    // Close the popover by clicking outside
    await page.mouse.click(0, 0);
    await expect(popover).toHaveCount(0);

    // The "Owner Name" column is hidden
    await expect(page.locator("table thead tr").first()).not.toContainText(
      "Owner Name",
    );
  });
});
