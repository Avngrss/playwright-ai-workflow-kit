import { expect, type Page, type Response } from "@playwright/test";
import { appReady } from "../../setup/app-wide";
import { authConfig, resolve } from "../../setup/auth/auth-config";
import { loginFormShown } from "../../setup/auth/form-login";

/**
 * A public app (its ```auth block signs in nowhere) opened: its address answered, the page finished
 * loading by the app's own sign (the map's ```app-wide `ready when:`) and shows something — a blank
 * page means a dead stand too.
 */
export async function expectAppOpened(page: Page, response: Response | null): Promise<void> {
  expect(response?.ok() ?? true, `The app's address answers (status ${response?.status()})`).toBe(true);
  await appReady(page);
  await expect(page.locator("body :visible").first(), "The app shows its page, not a blank one").toBeVisible();
}

/**
 * Signed in = the page settled on the app's own address and the sign-in form (the map's first
 * login screen, specs/project-map.md §Auth) is not shown. Apps send a visitor away only once their
 * script has run, so the page settles first. `platform` names the app whose sign-in is checked.
 */
async function signedInNow(page: Page, platform: string): Promise<boolean> {
  const onApp = new URL(page.url()).origin === new URL(resolve(authConfig(platform).ui.start)).origin;
  return onApp && !(await loginFormShown(page, platform));
}

/** The page settles: its requests go quiet — an app with a live stream or polling never does, so at most 5 s. */
async function settled(page: Page): Promise<void> {
  await page.waitForLoadState("networkidle", { timeout: 5_000 }).catch(() => undefined);
}

export async function expectSignedIn(page: Page, platform: string): Promise<void> {
  await settled(page);
  await expect.poll(() => signedInNow(page, platform), { message: "The user stays in the app, not on a sign-in page" }).toBe(true);
}

/** A signed-out visitor ends up on the sign-in form — on the app's host or the identity provider's. */
export async function expectSentToSignIn(page: Page, platform: string): Promise<void> {
  await settled(page);
  await expect.poll(() => loginFormShown(page, platform), { message: "A signed-out visitor sees the sign-in form" }).toBe(true);
}

/** The app's "session check" — a cheap "who am I" request its API answers 200 to a signed-in user. */
export function sessionCheckUrl(platform: string): string {
  const { sessionCheck } = authConfig(platform);
  if (!sessionCheck) throw new Error('specs/project-map.md §Auth has no "session check:" line — the auth setup step adds the API\'s "who am I" request there');
  return resolve(sessionCheck);
}
