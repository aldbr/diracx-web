import { test, expect } from "@playwright/test";
import { contains, loginThroughDex } from "./fixtures";

// Make sure the user can login and logout
test.describe("Login and Logout", () => {
  test("login", async ({ page }) => {
    // The user is redirected to the OIDC provider login page, logs in, and is
    // redirected back to the /auth page
    await loginThroughDex(page);

    // From now on the user is logged in
    // The login button should not be present anymore
    await expect(page.getByTestId("login-form-button")).toHaveCount(0);
    await expect(contains(page, "Owners")).toBeAttached({ timeout: 10_000 });

    // Click on the user avatar
    await page.locator(".MuiAvatar-root").click();
    // Check the user details
    await expect(contains(page, "admin")).toBeAttached();
    await expect(contains(page, "diracAdmin")).toBeAttached();
    // Check the Properties accordion
    await contains(page, "Properties").click();
    await expect(contains(page, "NormalUser")).toBeAttached();

    // Logout
    await contains(page, "Logout").click();

    // The user is logged out and redirected back to the /auth page
    // Wait for the login button to reappear as the definitive signal.
    // Uses a longer timeout because the logout → OIDC session clear →
    // redirect → render chain can take longer than the default 5s in CI.
    await expect(page.getByTestId("login-form-button")).toBeAttached({
      timeout: 10_000,
    });
  });
});
