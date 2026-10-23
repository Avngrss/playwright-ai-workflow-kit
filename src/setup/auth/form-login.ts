import type { Browser, BrowserContextOptions, Page } from "@playwright/test";
import { authConfig, resolve, resolveAll, who, type Account, type FormStep } from "./auth-config";

// One login step waits this long for its field or button — a wrong label fails fast with what the page shows.
const STEP_TIMEOUT = 15_000;

export type StorageState = Exclude<NonNullable<BrowserContextOptions["storageState"]>, string>;

/** A field by what a person reads next to it: its label, placeholder or accessible name. */
function field(page: Page, target: string) {
  if (target === "password") return page.locator("input[type=password]:visible").first();
  return page
    .getByLabel(target, { exact: true })
    .or(page.getByPlaceholder(target, { exact: true }))
    .or(page.getByRole("textbox", { name: target, exact: true }))
    .first();
}

async function runStep(page: Page, step: FormStep, credentials: { login: string; password: string }): Promise<void> {
  if (step.action === "click") return page.getByRole("button", { name: step.target, exact: true }).click({ timeout: STEP_TIMEOUT });
  if (step.action === "wait") return page.getByText(step.target, { exact: true }).first().waitFor({ timeout: STEP_TIMEOUT });
  await field(page, step.target).fill(credentials[step.value], { timeout: STEP_TIMEOUT });
}

/**
 * The sign-in form is on the page: every field and button of its first screen (the map's steps up to
 * the first click) is visible — so a profile page with an "Email" field never counts as one.
 * Without form steps (a custom login), a visible password field is the sign.
 */
export async function loginFormShown(page: Page, platform: string): Promise<boolean> {
  const steps = authConfig(platform).ui.steps;
  const firstClick = steps.findIndex((step) => step.action === "click");
  const firstScreen = steps.slice(0, firstClick === -1 ? steps.length : firstClick + 1).filter((step) => step.action !== "wait");
  if (firstScreen.length === 0) return page.locator("input[type=password]:visible").first().isVisible();
  for (const step of firstScreen) {
    const target = step.action === "click" ? page.getByRole("button", { name: step.target, exact: true }).first() : field(page, step.target);
    if (!(await target.isVisible())) return false;
  }
  return true;
}

/**
 * What the page shows after a refused login — headings, field labels, alerts; never a field's value —
 * so "wrong password" and "now asks for a code" read differently.
 */
async function whatThePageAsks(page: Page): Promise<string> {
  const textsOf = (selector: string) =>
    page
      .locator(selector)
      .evaluateAll((nodes) => nodes.map((node) => (node as HTMLElement).innerText.trim()).filter(Boolean))
      .catch(() => [] as string[]);
  // What went wrong first ("Wrong password", "You have no access to this application"), then where the page is.
  const texts = [...(await textsOf("[role=alert], [aria-live], [class*=error i], [class*=alert i], [class*=invalid i]")), ...(await textsOf("h1, h2, h3, label"))];
  const shown = [...new Set(texts)].slice(0, 5).map((text) => text.replace(/\s+/g, " ").slice(0, 80));
  // The buttons tell which step label to fix in the map ("click "Sign in"", not "Log in").
  const buttons = await page.getByRole("button").evaluateAll((nodes) => nodes.map((node) => (node as HTMLElement).innerText.trim()).filter(Boolean).slice(0, 6)).catch(() => [] as string[]);
  return (shown.length ? ` showing "${shown.join('" · "')}"` : "") + (buttons.length ? `, buttons "${[...new Set(buttons)].join('" · "')}"` : "");
}

/**
 * Logs the account in through its app's own login form — the steps a person takes, read from the
 * map — and returns the browser session. Nothing product-specific: any app with a form fits.
 */
export async function formLogin(browser: Browser, account: Account): Promise<StorageState> {
  // Signed out on purpose: inside a test Playwright gives every new context the test's own session otherwise.
  const context = await browser.newContext({ ignoreHTTPSErrors: true, storageState: { cookies: [], origins: [] } });
  const page = await context.newPage();
  try {
    await signInOnPage(page, account);
    return await context.storageState();
  } finally {
    await context.close().catch(() => undefined);
  }
}

/**
 * The map's sign-in steps on a given page — the same steps every session is made with: opens the
 * app's start, fills and clicks as the map says, and waits until the app (not its sign-in page)
 * shows. A sign-in or sign-out test runs it on its own page (the `signIn` fixture).
 */
export async function signInOnPage(page: Page, account: Account): Promise<void> {
  const { ui } = authConfig(account.platform);
  const [login, password] = resolveAll([ui.login, ui.password], account);
  await page.goto(resolve(ui.start));
  for (const step of ui.steps) {
    // A step the page does not offer is a map to fix, not a refused login — it never pauses the account.
    await runStep(page, step, { login, password }).catch(async () => {
      throw new Error(
        `Login step ${step.action} "${step.target}" found nothing to ${step.action} on ${new URL(page.url()).pathname}${await whatThePageAsks(page)} — fix that step in specs/project-map.md §Auth`,
      );
    });
  }

  const signedIn = ui.signedIn.url
    ? page.waitForURL((url) => url.href.startsWith(resolve(ui.signedIn.url as string)), { timeout: 20_000 })
    : page.getByText(ui.signedIn.text ?? "", { exact: true }).first().waitFor({ timeout: 20_000 });
  // A login page on the app's own host also "starts with" its URL — signed in only once the password field is gone.
  const formGone = page.locator("input[type=password]:visible").first().waitFor({ state: "hidden", timeout: 20_000 });
  const [landed, left] = await Promise.allSettled([signedIn, formGone]);
  if (landed.status === "rejected" || left.status === "rejected") {
    const at = new URL(page.url());
    // Only a form still asking is a refused login (it pauses the account); a form gone but the
    // `signed in when:` sign never shown is a map to fix — it never pauses the account.
    if (left.status === "fulfilled") {
      throw new Error(
        `${who(account)} left the sign-in form, but the page ${at.origin}${at.pathname} does not match "signed in when: ${ui.signedIn.url ? `url starts with ${ui.signedIn.url}` : `text "${ui.signedIn.text}"`}"` +
          `${await whatThePageAsks(page)} — fix that line in specs/project-map.md §Auth; a page asking for a one-time code, a captcha or SSO needs a decision from the team`,
      );
    }
    throw new Error(
      `${who(account)} did not get signed in — after the login steps the page is ${at.origin}${at.pathname}` +
        `${await whatThePageAsks(page)}. Check its login and password in .env; if the app now asks for a one-time code, a captcha or SSO, the login needs a decision from the team`,
    );
  }
  // The app stores its session as its requests settle; one with a live stream or polling never goes quiet — at most 5 s.
  await page.waitForLoadState("networkidle", { timeout: 5_000 }).catch(() => undefined);
}
