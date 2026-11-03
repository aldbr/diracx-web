import {
  test as base,
  expect,
  type Locator,
  type Page,
} from "@playwright/test";

export { expect };

/**
 * Log in through the Dex login page of the demo.
 * Leaves the page on the authenticated /auth page.
 */
export async function loginThroughDex(page: Page) {
  await page.goto("/auth");
  await page.getByTestId("login-form-button").click();

  // The OIDC provider runs on another origin: http://<demo host>:32002
  const { hostname } = new URL(page.url());
  await page.waitForURL(`http://${hostname}:32002/**`);
  await page.locator("#login").fill("admin@example.com");
  await page.locator("#password").fill("password");
  await page.locator("button").click();
  // Grant access
  await page.locator(":nth-child(1) > form > .dex-btn").click();

  await page.waitForURL(
    (url) => url.hostname === hostname && url.pathname.startsWith("/auth"),
  );
}

/** Session storage entries written by react-oidc and the login form. */
type OidcSession = Record<string, string>;

/**
 * `test` with a logged-in browser context.
 *
 * Logging in once per worker replaces Cypress' cy.session(). The OIDC tokens
 * live in sessionStorage, which Playwright's storageState does not save: copy
 * them into every new page before the app starts instead.
 */
export const test = base.extend<object, { oidcSession: OidcSession }>({
  oidcSession: [
    async ({ browser }, use, workerInfo) => {
      const { baseURL, ignoreHTTPSErrors, viewport } = workerInfo.project.use;
      const context = await browser.newContext({
        baseURL,
        ignoreHTTPSErrors,
        viewport,
      });
      const page = await context.newPage();
      await loginThroughDex(page);

      // Wait for react-oidc to store the tokens
      let session: OidcSession = {};
      await expect
        .poll(async () => {
          session = await page.evaluate(() =>
            Object.fromEntries(
              Object.entries(sessionStorage).filter(([key]) =>
                key.startsWith("oidc"),
              ),
            ),
          );
          return Object.values(session).some((value) =>
            value.includes("accessToken"),
          );
        })
        .toBe(true);

      await context.close();
      await use(session);
    },
    { scope: "worker", timeout: 60_000 },
  ],

  context: async ({ context, oidcSession, baseURL }, use) => {
    await context.addInitScript(
      ({ origin, entries }) => {
        if (window.location.origin !== origin) {
          return;
        }
        // Only on first load: keep what the app stored since (refreshed
        // tokens, logout)
        for (const [key, value] of Object.entries(entries)) {
          if (sessionStorage.getItem(key) === null) {
            sessionStorage.setItem(key, value);
          }
        }
      },
      { origin: new URL(baseURL!).origin, entries: oidcSession },
    );
    await use(context);
  },
});

/**
 * Store a dashboard layout for the app to load on its first page load.
 * Call before visitApp().
 */
export async function presetDashboard(page: Page, savedDashboard: string) {
  await page.addInitScript((value) => {
    if (sessionStorage.getItem("savedDashboard") === null) {
      sessionStorage.setItem("savedDashboard", value);
    }
  }, savedDashboard);
}

/** Visit the app and wait for the authenticated dashboard to be rendered. */
export async function visitApp(page: Page) {
  await page.goto("/");
  // The permanent drawer is always present once OIDC initialization,
  // session validation, and React rendering are all complete.
  await expect(page.getByTestId("drawer-permanent")).toBeAttached();
}

/**
 * The first element containing `text`, matched case-sensitively like
 * Cypress' cy.contains().
 */
export function contains(scope: Page | Locator, text: string) {
  return scope.getByText(new RegExp(escapeRegExp(text))).first();
}

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const SPECIAL_KEYS: Record<string, string> = {
  "{enter}": "Enter",
  "{leftArrow}": "ArrowLeft",
};

/**
 * Click `locator`, then type `text`, where {enter} and {leftArrow} press the
 * corresponding keys (Cypress' cy.type() syntax).
 */
export async function typeKeys(locator: Locator, text: string) {
  await locator.click();
  for (const part of text.split(/(\{[a-zA-Z]+\})/)) {
    if (part in SPECIAL_KEYS) {
      await locator.page().keyboard.press(SPECIAL_KEYS[part]);
    } else if (part) {
      await locator.page().keyboard.type(part);
    }
  }
}
