import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "test/e2e",
  // The specs share one demo backend and change its jobs: run them one at a
  // time, in file order
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: process.env.DIRACX_URL,
    // The demo serves a self-signed certificate
    ignoreHTTPSErrors: true,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      // Same viewport as Cypress' default, which the specs were written for
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1000, height: 660 },
      },
    },
  ],
});
