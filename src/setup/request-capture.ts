import type { Page, Response } from "@playwright/test";

/**
 * Collects the URLs of matching requests the page sends from now on — for a test that checks what
 * the page sent ("no create request on invalid input", "the data was asked for the chosen period").
 * The spec, or the app's helper in src/setup/<app>/, calls it; a Page Object never listens to
 * the network. The spec asserts on the returned array.
 */
export function captureRequests(page: Page, method: string, pathPattern: RegExp): string[] {
  const urls: string[] = [];
  page.on("request", (request) => {
    if (request.method() === method && pathPattern.test(new URL(request.url()).pathname)) {
      urls.push(request.url());
    }
  });
  return urls;
}

/**
 * Runs `action`, then resolves once the page has the server's answers to the requests whose path
 * ends with each of `paths` — the answers, in the order of `paths`. A Page Object's one network
 * wait: its screen gives no sign that new data arrived (figures change in place). A spec uses the
 * answers when the page must be compared with what it received, not with a later read.
 */
export async function whenAnswered(page: Page, paths: readonly string[], action: () => Promise<unknown>): Promise<Response[]> {
  const answers = Promise.all(paths.map((path) => page.waitForResponse((response) => new URL(response.url()).pathname.endsWith(path))));
  // The action may fail first; the answers' own failure then has nobody waiting for it.
  answers.catch(() => {});
  await action();
  return answers;
}
