import { expect, test as base } from "./api.fixture";
import { authConfig, requireRole } from "../setup/auth/auth-config";
import { apiHeaders, browserSession, ownSession } from "../setup/auth/auth";

/**
 * How a test's browser is signed in:
 *   "shared"     (default) the account's session, signed in once and shared by every test of the run
 *   "own"        a fresh sign-in of its own, never shared — for a test that signs out, changes the
 *                password or ends sessions: doing that to the shared session would sign every test
 *                running alongside out
 *   "signed-out" no session; the test signs in itself with `signIn()` (a sign-in or sign-out case)
 */
export type Session = "shared" | "own" | "signed-out";

/** The role a test runs as: its own, else the app's default — "none" for a public app; before login is set up, none to fall back on. */
const askedRole = (role: string, platform: string): string => role || (authConfig(platform).configured ? authConfig(platform).defaultRole : "");

/**
 * Who a test is signed in as. `role` is an option: every test runs as its app's default role
 * (specs/project-map.md §Auth) unless it says `test.use({ role: "<role>" })`; `"none"` = signed out.
 * UI tests start signed in (`storageState`, as `session` says), API tests send `authHeaders`. Nothing
 * here knows how an app logs in — that is src/setup/auth/, configured by the app's ```auth block.
 */
export const test = base.extend<{ role: string; session: Session; authHeaders: Record<string, string> }>({
  // "" = the app's default role, known only once the project has said which app the test belongs to.
  role: ["", { option: true }],
  session: ["shared", { option: true }],
  // A login has its own time budget, so a failing one reports why instead of the test timing out.
  storageState: [
    async ({ role, session, platform, browser }, use, testInfo) => {
      // Playwright resolves this for every test, even one that never opens a page — an API spec gets
      // no browser sign-in, so API tests never depend on the login page (their headers: authHeaders).
      // It is resolved before the test's trace starts, so the password typed here is never in a trace.
      const asked = askedRole(role, platform);
      if (asked === "none" || session === "signed-out" || /[\\/]tests[\\/]api[\\/]/.test(testInfo.file)) return use(undefined);
      // a role asked for before login is set up, or not listed, fails here — never signed out silently
      const account = requireRole({ platform, role: asked });
      // No UI login (an API-only app, ui: none) → the browser simply has no session.
      if (authConfig(platform).ui.mode === "none") return use(undefined);
      await use(session === "own" ? await ownSession(browser, account) : await browserSession(browser, account));
    },
    { scope: "test", timeout: 90_000 },
  ],
  authHeaders: [
    async ({ role, platform, browser }, use) => {
      const asked = askedRole(role, platform);
      if (asked === "none") return use({});
      await use(await apiHeaders(async () => browser, requireRole({ platform, role: asked })));
    },
    { scope: "test", timeout: 90_000 },
  ],
});

export { expect };
