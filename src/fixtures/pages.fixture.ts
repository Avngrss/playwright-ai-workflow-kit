import type { Page, Response } from "@playwright/test";
import { expect, test as base } from "./data.fixture";
import { expectAnswer, type AnswerPath } from "../assertions/shared/http";
import { maskSecrets } from "../reporting/readable-error";
import { recordAppMessages } from "../setup/app-messages";
import { installAppWideHandlers } from "../setup/app-wide";
import { authConfig, who } from "../setup/auth/auth-config";
import { signInHere } from "../setup/auth/auth";
import { loginFormShown } from "../setup/auth/form-login";
import { missingUrl } from "../setup/platforms";
import { answersOf, type AwaitedRequest } from "../setup/request-capture";

/** The words a failed check of an action's answer opens with — the report reads its cause from them. */
export const ANSWER_CHECK = "The server's answer to the action —";
/** The words a failed check of what the action sent opens with — a front-end cause, not the server's. */
export const SENT_CHECK = "The request the action sent —";

/** What the action must send and what its answer must be — every part optional. */
export interface AnswerExpected<T> {
  /** The answer's status; 200 unless named. */
  status?: number;
  /** Fields the request's body holds, as `toMatchObject` — what the screen sent (the key it must never send masked). */
  sent?: Record<string, unknown>;
  /** The request's query parameters, as `toMatchObject` — the period, the sort the page asked for. */
  query?: Record<string, string>;
  /** Fields the answer holds, as `toMatchObject` — the case's own data: what the test made, or values the case states (a total of 0); a list answer takes a list (`expect.arrayContaining([...])` for a part of it). */
  has?: Record<string, unknown> | unknown[];
  /** An app's named rule over the answer (src/assertions/<app>/) — for values only the stand knows; a rule needing arguments is built by a call: `check: paidAsInBilling(billing)`. */
  check?: (answer: T) => unknown;
}

/** A request the page sends: the client's `answerPath(…)`, or "POST api/…" / "api/…" (any method) written out. */
export type AnswerTarget<T> = AnswerPath<T> | string;
type AnswerOf<P> = P extends AnswerPath<infer T> ? T : unknown;

/**
 * Does the action, takes the server's answer to it and checks it — one line per gesture of a case:
 * `const invitation = await answerTo(inviteTo(team), () => members.invite(email), { has: { email } })`.
 * The action is handed over, so the answer is listened for before the click; the Page Object method
 * acts (and may wait for its screen), it never takes this answer itself. Returns the answer's body.
 */
export type AnswerTo = <T>(target: AnswerTarget<T>, action: () => Promise<unknown>, expected?: AnswerExpected<T>) => Promise<T>;

/**
 * The same for an action awaiting several answers (a dashboard opening on its sections' requests):
 * `const [sales, returns] = await answersTo([salesOf(shop), returnsOf(shop)], () => reports.open(shop), [{ check: totalsAddUp }, { check: refundsKept }])`.
 */
export type AnswersTo = <const P extends readonly AnswerTarget<unknown>[]>(
  targets: P,
  action: () => Promise<unknown>,
  expected?: { [K in keyof P]?: AnswerExpected<AnswerOf<P[K]>> },
) => Promise<{ -readonly [K in keyof P]: AnswerOf<P[K]> }>;

const awaited = (target: AnswerTarget<unknown>): AwaitedRequest => {
  if (typeof target !== "string") return { method: target.method, path: target.path };
  const [, method, path] = /^(?:([A-Z]+)\s+)?(.+)$/.exec(target.trim()) ?? [];
  return { method, path: path ?? target };
};

/** A failed check says first whose it is — the action's request or the server's answer — whoever's assertion threw it. */
async function labelled(words: string, check: () => unknown): Promise<void> {
  try {
    await check();
  } catch (error) {
    if (error instanceof Error) error.message = `${words}\n${error.message}`;
    throw error;
  }
}

/** What the action sent first (a wrong request explains a wrong answer), then the answer's status, fields and rule. */
async function checkedAnswer<T>(response: Response, expected: AnswerExpected<T> = {}): Promise<T> {
  const request = response.request();
  const label = `${request.method()} ${new URL(response.url()).pathname}`;
  // As unknown: a generic body gives the matchers no type to resolve against.
  if (expected.sent) expect(request.postDataJSON() as unknown, `${SENT_CHECK} ${label}`).toMatchObject(expected.sent);
  if (expected.query) expect(Object.fromEntries(new URL(request.url()).searchParams) as unknown, `${SENT_CHECK} ${label}`).toMatchObject(expected.query);
  const answer = await expectAnswer<T>(response, expected.status ?? 200);
  if (expected.has) expect(answer as unknown, `${ANSWER_CHECK} ${label}`).toMatchObject(expected.has);
  if (expected.check) await labelled(`${ANSWER_CHECK} ${label}`, () => expected.check?.(answer));
  return answer;
}

async function answersToActions(page: Page, targets: readonly AnswerTarget<unknown>[], action: () => Promise<unknown>, expected: readonly (AnswerExpected<unknown> | undefined)[] = []): Promise<unknown[]> {
  const responses = await answersOf(page, targets.map(awaited), action);
  const answers: unknown[] = [];
  for (const [index, response] of responses.entries()) answers.push(await checkedAnswer(response, expected[index]));
  return answers;
}

/**
 * The shared page layer — the `page` every app's test gets. Part of the template, never edited in a
 * test home: an app's Page Objects are wired in src/fixtures/<app>/pages.fixture.ts
 * (`npm run app:add -- <app>` creates it), and its specs take `test` from src/fixtures/<app>/test.
 */
export const test = base.extend<{ signIn: (role?: string) => Promise<void>; answerTo: AnswerTo; answersTo: AnswersTo }>({
  answerTo: async ({ page }, use) => {
    await use(async <T>(target: AnswerTarget<T>, action: () => Promise<unknown>, expected?: AnswerExpected<T>) => {
      const [answer] = await answersToActions(page, [target], action, [expected as AnswerExpected<unknown> | undefined]);
      return answer as T;
    });
  },
  answersTo: async ({ page }, use) => {
    await use((async (targets: readonly AnswerTarget<unknown>[], action: () => Promise<unknown>, expected?: readonly (AnswerExpected<unknown> | undefined)[]) =>
      answersToActions(page, targets, action, expected)) as AnswersTo);
  },
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
