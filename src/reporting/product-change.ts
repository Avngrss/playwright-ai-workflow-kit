import fs from "node:fs";
import path from "node:path";
import { readMap } from "../setup/map-block";

/**
 * Whether a failure is the product changing rather than breaking — read from facts, never guessed: a
 * request answered 404/405 against the app's own contract (the Docs cell of its API row in
 * specs/project-map.md §Apps and services), a text the test looked for against the page at the failure
 * (Playwright's error context). What it finds becomes the failure's verdict (failure-cause.ts); whether
 * a change was intended is settled by the agent's triage of the run. Only under a test that has been
 * green: a new or changed spec (not committed yet) cannot see the product change under it, so its
 * failure keeps its usual verdict and names the finding in a note.
 */

export interface ContractFinding {
  /** The request's path as sent: "/api/orders/42/notes". */
  path: string;
  /** The contract's path that fits it, when it still lists one: "/api/orders/{id}/notes". */
  listed?: string;
  /** The contract's path most like it, when it lists none: "/api/orders/{id}/comments". */
  similar?: string;
  docs: string;
}

export interface ScreenFinding {
  /** What the test looked for: "Orders in Progress". */
  expected: string;
  /** What the page showed instead: "Orders in progress". */
  shown: string;
}

const isParam = (segment: string): boolean => /^\{.+\}$/.test(segment);
const segmentsOf = (address: string): string[] => address.split("?")[0].split("/").filter(Boolean);
const sameSegment = (template: string, sent: string): boolean => isParam(template) || template.toLowerCase() === sent.toLowerCase();

/** The Docs cell of an app's API row, `.env` names in braces: "{API_BASE_URL}/swagger.json". */
function docsCellOf(app: string): string | undefined {
  const section = /^## Apps and services\s*$([\s\S]*?)(?=^## |(?![\s\S]))/m.exec(readMap() ?? "")?.[1] ?? "";
  for (const row of section.split("\n").filter((line) => line.startsWith("|"))) {
    const [slug, , kind, , docs] = row.split("|").slice(1).map((cell) => cell.trim());
    if (slug === app && /^api\b/i.test(kind ?? "")) return /`([^`]+)`/.exec(docs ?? "")?.[1] ?? /(?:https?:\/\/|\{[A-Z0-9_]+\})\S+/.exec(docs ?? "")?.[0];
  }
  return undefined;
}

/** The address of an app's contract, its `.env` names filled in — none when the map gives none or a name is unset. */
function docsOf(app: string): string | undefined {
  const docs = docsCellOf(app)?.replace(/\{([A-Z0-9_]+)\}/g, (name, env: string) => process.env[env]?.trim().replace(/\/$/, "") ?? name);
  return docs && /^https?:\/\/[^{}\s]+$/.test(docs) ? docs : undefined;
}

const contracts = new Map<string, Promise<string[] | undefined>>();

/** The contract's paths, read once a run; unreadable (down, not JSON) → none, and the failure keeps its usual verdict. */
function pathsIn(docs: string): Promise<string[] | undefined> {
  let paths = contracts.get(docs);
  if (!paths) {
    paths = fetch(docs, { signal: AbortSignal.timeout(5000) })
      .then(async (response) => {
        if (!response.ok) return undefined;
        const contract = (await response.json()) as { paths?: Record<string, unknown>; basePath?: string };
        const base = (contract.basePath ?? "").replace(/\/$/, "");
        return Object.keys(contract.paths ?? {}).map((each) => `${base}${each}`);
      })
      .catch(() => undefined);
    contracts.set(docs, paths);
  }
  return paths;
}

/** The contract path fits the sent one — the API's address may add a prefix the contract leaves out. */
function fits(template: string, sent: string): boolean {
  const own = segmentsOf(template);
  const tail = segmentsOf(sent).slice(-own.length);
  return own.length === tail.length && own.every((segment, i) => sameSegment(segment, tail[i]));
}

/** The words of a path's segments, ids and plural endings left out: "itemsProfile" → item, profile; "items" → item. */
function wordsOf(segments: string[]): Set<string> {
  return new Set(
    segments
      .filter((segment) => !isParam(segment) && !/^(\d+|[\da-f-]{8,})$/i.test(segment))
      .flatMap((segment) => segment.replace(/([a-z\d])([A-Z])/g, "$1 $2").split(/[\s_.-]+/))
      .map((word) => word.toLowerCase().replace(/(?<=\w{3})s$/, ""))
      .filter(Boolean),
  );
}

/** The contract path most like the sent one: the same beginning, then most of the same words. */
function mostLike(sent: string, paths: string[]): string | undefined {
  const sentSegments = segmentsOf(sent);
  let best: { path: string; score: number } | undefined;
  for (const candidate of paths) {
    const own = segmentsOf(candidate);
    const offset = Math.max(0, sentSegments.length - own.length);
    let shared = 0;
    while (shared < own.length && offset + shared < sentSegments.length && sameSegment(own[shared], sentSegments[offset + shared])) shared++;
    if (!shared) continue;
    const sentRest = wordsOf(sentSegments.slice(offset + shared));
    const ownRest = wordsOf(own.slice(shared));
    const union = new Set([...sentRest, ...ownRest]).size;
    const overlap = union ? [...sentRest].filter((word) => ownRest.has(word)).length / union : 0;
    if (overlap < 0.5) continue;
    const score = shared + overlap;
    if (!best || score > best.score || (score === best.score && candidate.length < best.path.length)) best = { path: candidate, score };
  }
  return best?.path;
}

/**
 * A request answered 404 or 405 — a client's call (`/api/… answered 404`) or the page's
 * (`The page's request /api/… answered 404`) — checked against the app's contract; none for any other failure.
 */
export async function contractFinding(app: string, message: string): Promise<ContractFinding | undefined> {
  const sent = /(?:^|The page's request )(\/\S*) answered 40[45] /m.exec(message)?.[1];
  const docs = sent ? docsOf(app) : undefined;
  if (!sent || !docs) return undefined;
  const paths = await pathsIn(docs);
  if (!paths) return undefined;
  // A path spelled out wins over a template: /api/items/profile, not /api/items/{id}.
  const fitting = paths.filter((each) => fits(each, sent));
  const listed = fitting.find((each) => !each.includes("{")) ?? fitting[0];
  return { path: sent, listed, similar: listed ? undefined : mostLike(sent, paths), docs };
}

const ROLES = new Set(["alert", "button", "cell", "checkbox", "columnheader", "combobox", "dialog", "grid", "heading", "img", "link", "list", "listitem", "main", "menu", "menuitem", "navigation", "option", "radio", "region", "row", "rowheader", "tab", "table", "tabpanel", "textbox", "tooltip"]);
const plain = (text: string): string => text.replace(/\s+/g, " ").trim().toLowerCase();

/** At most `limit` single-character edits apart. */
function closeTo(a: string, b: string, limit: number): boolean {
  if (Math.abs(a.length - b.length) > limit) return false;
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    previous = current;
  }
  return previous[b.length] <= limit;
}

const digitsOf = (text: string): string => text.replace(/\D/g, "");

/**
 * The same words but not the same text: another case or spacing — or, with `slips`, a letter or two
 * apart in a longer text. Figures never: "25 min" against "17 min" is a value that differs, not a reworded label.
 */
const nearly = (expected: string, shown: string, slips = false): boolean =>
  expected !== shown &&
  digitsOf(expected) === digitsOf(shown) &&
  (plain(expected) === plain(shown) || (slips && expected.length >= 10 && closeTo(plain(expected), plain(shown), 2)));

/**
 * The texts the page held at the failure: names in quotes and the text after "text:", "paragraph:" and
 * the like — from the error context's page snapshots (its yaml blocks) only, never its error message or
 * the test's own source, which hold the expected text itself.
 */
function shownTexts(errorContext: string): string[] {
  const snapshot = [...errorContext.matchAll(/```yaml\r?\n([\s\S]*?)```/g)].map(([, yaml]) => yaml).join("\n");
  const quoted = [...snapshot.matchAll(/"((?:[^"\\]|\\.)+)"/g)].map(([, text]) => text);
  const after = [...snapshot.matchAll(/^\s*- [\w-]+(?: "[^"]*")?(?: \[[^\]]*\])*: (.+)$/gm)].map(([, text]) => text.replace(/^"|"$/g, ""));
  return [...quoted, ...after];
}

/**
 * The page shows, reworded only in case or spacing, the text the test looked for: an expected text
 * against the one received; or the name or text in the locator the test waited for, against the page
 * at the failure (a letter or two apart also counts there). Anything else — the element simply gone, a
 * figure that differs — stays the cause it was.
 */
export function screenFinding(message: string, errorContext?: string): ScreenFinding | undefined {
  const expected = /^Expected(?: string)?: "(.+)"$/m.exec(message)?.[1];
  const received = /^Received(?: string)?: "(.+)"$/m.exec(message)?.[1];
  if (expected && received && nearly(expected, received)) return { expected, shown: received };

  const element = /^Element: (.+)$/m.exec(message)?.[1];
  if (!element || !errorContext || !fs.existsSync(errorContext)) return undefined;
  const looked = [...element.matchAll(/'((?:[^'\\]|\\.)+)'|"((?:[^"\\]|\\.)+)"/g)]
    .map(([, single, double]) => single ?? double)
    .filter((text) => text.length >= 3 && !ROLES.has(text) && !/[[\]=#>*]/.test(text));
  const texts = shownTexts(fs.readFileSync(errorContext, "utf8"));
  for (const text of looked) {
    if (texts.includes(text)) continue;
    const shown = texts.find((each) => nearly(text, each, true));
    if (shown) return { expected: text, shown };
  }
  return undefined;
}

/**
 * The plan a spec implements, when it exists: tests/<api|ui>/<app>/<area>/<feature>/… →
 * specs/<app>/<area>/<feature>/<feature>.md; tests/e2e/<app>/<area>/<journey>.e2e.spec.ts →
 * specs/e2e/<app>/<area>/<journey>.md.
 */
export function planOf(specFile: string, home: string): string | undefined {
  const [root, layer, ...rest] = path.relative(home, specFile).split(path.sep);
  if (root !== "tests" || rest.length < 2) return undefined;
  const folders = rest.slice(0, -1);
  const plan =
    layer === "e2e"
      ? path.join("specs", "e2e", ...folders, `${rest[rest.length - 1].replace(/\.e2e\.spec\.ts$/, "")}.md`)
      : path.join("specs", ...folders, `${folders[folders.length - 1]}.md`);
  return fs.existsSync(path.join(home, plan)) ? plan.split(path.sep).join("/") : undefined;
}
