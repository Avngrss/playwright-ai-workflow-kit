import { expect, type Locator, type Page } from "@playwright/test";
import { readMapBlock } from "./map-block";
import { defaultPlatform } from "./platforms";

/**
 * What an app does on its own, whatever the test: overlays that pop up over any page (a
 * promotion pop-up, a cookie banner, "what's new", "session expired"), the sign that a page has
 * finished loading, and the attribute it marks its elements for tests with. Written once in
 * specs/project-map.md (the ```app-wide block, one per app with `platform: <app>`) by the kit's
 * skills when they meet them; installed for every page by pages.fixture.ts — specs and Page Objects
 * never handle them.
 *
 *   dismiss: dialog "<text in the dialog>" by "<button>"   a modal dialog (matched inside role=dialog)
 *   dismiss: "<text the overlay shows>" by "<button>"      a banner or panel that is not a dialog
 *   ready when: hidden "<text>"                            e.g. hidden "Loading…"
 *   ready when: hidden role <role>                         e.g. hidden role progressbar
 *   test id: <attribute>                                   e.g. test id: data-test (none: data-testid)
 */

interface Dismiss {
  dialog: boolean;
  text: string;
  button: string;
}
type Ready = { text: string } | { role: string };
interface AppWide {
  dismiss: Dismiss[];
  ready: Ready[];
}

const LINES = 'use: dismiss: [dialog] "<text>" by "<button>" · ready when: hidden "<text>" · ready when: hidden role <role>';

function read(platform: string): AppWide {
  const block = readMapBlock("app-wide", platform);
  const dismiss = (block?.get("dismiss") ?? []).map((line) => {
    const match = /^(dialog )?"([^"]+)" by "([^"]+)"$/.exec(line);
    if (!match) throw new Error(`Unknown line "dismiss: ${line}" in specs/project-map.md (app-wide) — ${LINES}`);
    return { dialog: Boolean(match[1]), text: match[2], button: match[3] };
  });
  const ready = (block?.get("ready when") ?? []).map((line): Ready => {
    const text = /^hidden "([^"]+)"$/.exec(line);
    if (text) return { text: text[1] };
    const role = /^hidden role (\S+)$/.exec(line);
    if (role) return { role: role[1] };
    throw new Error(`Unknown line "ready when: ${line}" in specs/project-map.md (app-wide) — ${LINES}`);
  });
  return { dismiss, ready };
}

/**
 * The attribute `getByTestId` reads for this app — given to its projects by playwright.config.ts.
 * The block's `test id:` line; without one, Playwright's own `data-testid`.
 */
export function testIdOf(platform: string): string {
  const attribute = readMapBlock("app-wide", platform)?.get("test id")?.[0];
  if (attribute === undefined) return "data-testid";
  if (!/^[a-z][a-z0-9-]*$/.test(attribute)) throw new Error(`Unknown line "test id: ${attribute}" in specs/project-map.md (app-wide) — use: test id: <attribute>, e.g. test id: data-test`);
  return attribute;
}

const cache = new Map<string, AppWide>();
const appWide = (platform: string): AppWide => cache.get(platform) ?? cache.set(platform, read(platform)).get(platform)!;
// Which app a page belongs to, so a Page Object's appReady(page) needs nothing but the page.
const pageApp = new WeakMap<Page, string>();

/**
 * Closes each known overlay of the page's app whenever it shows up while an action or a web-first
 * assertion waits — Playwright's locator handlers, installed once per page — then the action is retried.
 */
export async function installAppWideHandlers(page: Page, platform: string): Promise<void> {
  pageApp.set(page, platform);
  for (const { dialog, text, button } of appWide(platform).dismiss) {
    const overlay = dialog ? page.getByRole("dialog").filter({ hasText: text }) : page.getByText(text).first();
    const close = dialog ? overlay.getByRole("button", { name: button, exact: true }) : page.getByRole("button", { name: button, exact: true }).first();
    await page.addLocatorHandler(overlay, async () => {
      await close.click();
    });
  }
}

/** The page has finished loading by its app's own sign (its spinner gone) — called by Page Objects after navigating. */
export async function appReady(page: Page): Promise<void> {
  for (const rule of appWide(pageApp.get(page) ?? defaultPlatform()).ready) {
    const loading: Locator =
      "role" in rule ? page.getByRole(rule.role as Parameters<Page["getByRole"]>[0]) : page.getByText(rule.text, { exact: true });
    const name = "role" in rule ? `role ${rule.role}` : `"${rule.text}"`;
    await expect(loading.filter({ visible: true }), `The page finished loading (${name} gone)`).toHaveCount(0, { timeout: 15_000 });
  }
}
