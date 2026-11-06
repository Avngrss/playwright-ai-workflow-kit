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

/** A request a test waits for: its method (any when unsaid) and the end of its path, whatever its letter case. */
export interface AwaitedRequest {
  readonly method?: string;
  readonly path: string;
}

const answering = ({ method, path }: AwaitedRequest) => {
  const tail = `/${path.replace(/^\/+/, "").toLowerCase()}`;
  return (response: Response) =>
    (!method || response.request().method() === method.toUpperCase()) && new URL(response.url()).pathname.toLowerCase().endsWith(tail);
};

/**
 * The answer with its body read the moment it arrives: a large body (megabytes) may be dropped by the
 * browser before the test reads it after the action. The rest of the answer is the page's own.
 */
async function held(response: Response): Promise<Response> {
  const body = await response.body().catch(() => undefined);
  if (body === undefined) return response;
  return Object.assign(Object.create(response) as Response, {
    body: async () => body,
    text: async () => body.toString("utf8"),
    json: async () => JSON.parse(body.toString("utf8")) as unknown,
  });
}

/**
 * Runs `action`, then resolves with the page's answers to `requests`, in their order — each matched by
 * its method and the end of its path (a GET and a PUT to one address are told apart); one request
 * named twice takes its first and its second answer. The `answerTo` fixture's listener: the answers
 * it checks as the case's truth.
 */
export async function answersOf(page: Page, requests: readonly AwaitedRequest[], action: () => Promise<unknown>): Promise<Response[]> {
  const key = ({ method, path }: AwaitedRequest) => `${method?.toUpperCase() ?? ""} ${path.replace(/^\/+/, "").toLowerCase()}`;
  const same = (a: AwaitedRequest, b: AwaitedRequest) => key(a) === key(b);
  const answers = Promise.all(
    requests.map((request, index) => {
      const nth = requests.slice(0, index).filter((earlier) => same(earlier, request)).length;
      const matches = answering(request);
      let seen = 0;
      return page.waitForResponse((response) => matches(response) && seen++ === nth).then(held);
    }),
  );
  // The action may fail first; the answers' own failure then has nobody waiting for it.
  answers.catch(() => {});
  await action();
  return answers;
}

/**
 * Runs `action`, then resolves once the page has the server's answers to the requests whose path
 * ends with each of `paths` — the answers, in the order of `paths`. A Page Object's one network wait:
 * its screen gives no sign that new data arrived (figures change in place). It only waits — what the
 * case takes as truth from an answer the spec takes through the `answerTo` fixture (`answersOf`),
 * checked against the case's data and never fetched again by a second request.
 */
export async function whenAnswered(page: Page, paths: readonly string[], action: () => Promise<unknown>): Promise<Response[]> {
  const answers = Promise.all(paths.map((path) => page.waitForResponse((response) => new URL(response.url()).pathname.endsWith(path))));
  // The action may fail first; the answers' own failure then has nobody waiting for it.
  answers.catch(() => {});
  await action();
  return answers;
}
