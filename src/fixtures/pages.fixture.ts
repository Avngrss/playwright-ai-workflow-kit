import type { Page } from "@playwright/test";
import { expect, test as base } from "./data.fixture";
import { maskSecrets } from "../reporting/readable-error";
import { recordAppMessages } from "../setup/app-messages";
import { installAppWideHandlers } from "../setup/app-wide";
import { authConfig, who } from "../setup/auth/auth-config";
import { signInHere } from "../setup/auth/auth";
import { loginFormShown } from "../setup/auth/form-login";
import { missingUrl } from "../setup/platforms";

/**
 * The shared page layer — the `page` every app's test gets. Part of the template, never edited in a
 * test home: an app's Page Objects are wired in src/fixtures/<app>/pages.fixture.ts
 * (`npm run app:add -- <app>` creates it), and its specs take `test` from src/fixtures/<app>/test.
 */
export const test = base.extend<{ signIn: (role?: string) => Promise<void> }>({
  // Signing in as a step of the test itself — a sign-in or sign-out case, with `session: "signed-out"`:
  // the map's form steps on this test's page, as the role (default: the test's own) from .env. The
  // values typed are taken out of the trace and every attachment (src/reporting/secret-scrub).
  signIn: async ({ page, role, platform }, use) => {
    await use(async (as?: string) => {
      const account = { platform, role: as ?? (role && role !== "none" ? role : authConfig(platform).defaultRole) };
      await base.step(`Sign in as ${who(account).toLowerCase()} through the sign-in form`, () => signInHere(page, account), { box: true });
    });
  },
  // What a failure needs and a green run may hide: the page a failed UI test was on, and what went
  // wrong in the background while it ran — server errors (5xx), page errors, console errors. They
  // are attached to the test in the report (also a passing one) and quoted in a failure's message.
  page: async ({ page, baseURL, platform, session, role }, use, testInfo) => {
    if (!baseURL) throw new Error(missingUrl(platform, "ui"));
    // Overlays the app shows on its own (specs/project-map.md, app-wide) are closed whenever they appear.
    await installAppWideHandlers(page, platform);
    // Toasts and alerts the app shows, recorded as they appear — a failure quotes them (they close themselves).
    const messages = await recordAppMessages(page.context());
    const background: string[] = [];
    page.on("response", (response) => {
      if (response.status() >= 500) background.push(`Server ${response.status()}: ${response.request().method()} ${new URL(response.url()).pathname}`);
    });
    page.on("pageerror", (error) => background.push(`Page error: ${error.message.split("\n")[0]}`));
    page.on("console", (message) => {
      // A failed resource load is already a response (5xx above) or noise (a missing favicon).
      if (message.type() === "error" && !message.text().startsWith("Failed to load resource")) background.push(`Console error: ${message.text().split("\n")[0]}`);
    });
    // A link with target="_blank" opens a tab of its own: it gets the app's overlay handling too, and
    // when the test fails while looking at the first tab, the error names the new one (else it reads
    // only as a timeout).
    const tabs: Page[] = [];
    page.context().on("page", (tab) => {
      tabs.push(tab);
      void installAppWideHandlers(tab, platform).catch(() => undefined);
    });
    await use(page);
    const found = maskSecrets([...new Set(background)].slice(0, 20).join("\n"));
    if (found) {
      await testInfo.attach("Background errors", { body: found, contentType: "text/plain" });
      testInfo.annotations.push({ type: "background-errors", description: found });
    }
    if (testInfo.status !== testInfo.expectedStatus) {
      // A page still blank (the test failed before opening one) names nothing a person could open.
      if (page.url() !== "about:blank") testInfo.annotations.push({ type: "page-at-failure", description: page.url() });
      const said = maskSecrets(messages.slice(-5).map((text) => `"${text}"`).join("\n"));
      if (said) {
        await testInfo.attach("Messages the app showed", { body: said, contentType: "text/plain" });
        testInfo.annotations.push({ type: "app-messages", description: said });
      }
      const opened = maskSecrets(tabs.map((tab) => tab.url()).join("\n"));
      if (opened) {
        const body = `A new tab opened during the test: ${opened.split("\n").join(", ")} — the test kept working on its first tab. A link with target="_blank" is followed with page.waitForEvent("popup") (or its address is opened when the move itself is not what the test checks).`;
        await testInfo.attach("New tab", { body, contentType: "text/plain" });
        testInfo.annotations.push({ type: "new-tab", description: body });
      }
      // Sent to the sign-in page with the shared session: another test ended it (signed out of it,
      // changed the password) — the failure says so instead of reading as a missing element.
      if (session === "shared" && role !== "none" && (await loginFormShown(page, platform).catch(() => false))) {
        const body = 'The shared session ended during the run — this test was sent to the sign-in page. A test that signs out, changes the password or ends sessions needs a session of its own: test.use({ session: "own" }).';
        await testInfo.attach("Session ended", { body, contentType: "text/plain" });
        testInfo.annotations.push({ type: "session-ended", description: body });
      }
    }
  },
});

export { expect };
