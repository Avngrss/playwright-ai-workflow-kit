import fs from "node:fs";
import path from "node:path";
import { SPECS_OWN_FILES } from "./context.mjs";

/**
 * What the plans say about manual cases (the plan skill): each case block — one scenario: its TMS ids,
 * status, owner (`Level:`) and routes (`Route:`; the layers it needs in a plan written before routing) —
 * and each Not now line — its ids, reason, since when and where the tests looked.
 * One reading for the suite's coverage (scripts/agent/suite-coverage.mjs) and the gate (cases.mjs).
 */

const read = (file) => fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");

/**
 * A case id's part before its number: "TC-" of TC-123, "PROJ-T" of PROJ-T123 — a RegExp source, one
 * pattern for the plans, the tests' links and verify. The case's key is its number.
 */
export const CASE_PREFIX = "[A-Z][A-Z0-9]*-[A-Z]*";

/**
 * The case numbers a plan's `TMS:` field names: ids like TC-123 or PROJ-T123 (bare numbers only when
 * the field has no such id). Notes in brackets — "TC-103 (screen)" — name no case.
 */
export function caseIds(field) {
  const text = field.replace(/\([^)]*\)/g, " ");
  const prefixed = [...text.matchAll(new RegExp(`\\b${CASE_PREFIX}(\\d+)\\b`, "g"))].map((match) => match[1]);
  return prefixed.length ? prefixed : [...text.matchAll(/\b(\d+)\b/g)].map((match) => match[1]);
}

/** The layers a `Needs:` value names, before its reason: "API+UI — the server filters" → ["API", "UI"]. A plan written before routing has it. */
export function layersOf(needs) {
  const named = needs.split(/\s+[—–]\s+/)[0].toUpperCase();
  return ["API", "UI", "E2E"].filter((layer) => new RegExp(`\\b${layer}\\b`).test(named));
}

const SCREEN_KINDS = new Set(["value", "text", "state", "visible"]);
const listOf = (text) => text.split(",").map((item) => item.trim()).filter(Boolean);

/**
 * A scenario's `Route:` line (docs/Layer Routing Algorithm.md §7) — how its one test
 * proves it: { kind: api | intercept | no-request | screen-only, method, path, status, query, fields,
 * check, empty, read, until, screen: [{ token, kind }], problems }. `problems` lists what does not
 * hold the formula; an empty list is a route the gate and the coverage can trust.
 */
export function parseRoute(line) {
  const route = { kind: null, method: null, path: null, status: null, query: [], sent: [], fields: [], check: null, empty: false, input: false, read: null, until: null, screen: [], problems: [] };
  const segments = line.split(/\s+·\s+/).map((segment) => segment.trim()).filter(Boolean);
  const head = segments.shift() ?? "";
  const tail = [];
  if (/^(no-request|screen-only)$/.test(head)) {
    route.kind = head;
  } else {
    const parsed = /^(api|intercept)\s+([A-Z]+)\s+(\S+)\s*→\s*(.*)$/.exec(head);
    if (!parsed) {
      route.problems.push('it starts with "api <METHOD> <path> →", "intercept <METHOD> <path> →", "no-request" or "screen-only"');
      return route;
    }
    [, route.kind, route.method, route.path] = parsed;
    if (parsed[4]) tail.push(parsed[4].trim());
  }
  tail.push(...segments);
  for (const [index, part] of tail.entries()) {
    let match;
    if (index === 0 && /^\d{3}$/.test(part)) route.status = Number(part);
    else if (part === "empty") route.empty = true;
    else if (part === "input") route.input = true;
    else if ((match = /^query:\s*(.+)$/.exec(part))) route.query = listOf(match[1]);
    else if ((match = /^check:\s*([\w$]+(?:\(.*\))?)$/.exec(part))) route.check = match[1];
    else if ((match = /^sent:\s*(.+)$/.exec(part))) route.sent = listOf(match[1]);
    else if ((match = /^read\s+([A-Z]+)\s+(\S+)\s*→\s*(.+)$/.exec(part))) route.read = { method: match[1], path: match[2], fields: listOf(match[3]) };
    else if ((match = /^until\s+([\w$]+)\s*→\s*(.+)$/.exec(part))) route.until = { helper: match[1], fields: listOf(match[2]) };
    else if ((match = /^screen\s+(.+)$/.exec(part))) {
      route.screen = listOf(match[1]).map((token) => {
        const [name, kind] = token.split("=").map((value) => value?.trim());
        return { token: name, kind: kind ?? null };
      });
    } else route.fields.push(...listOf(part));
  }
  const bodyFields = [...route.fields, ...(route.read?.fields ?? []), ...(route.until?.fields ?? [])];
  const listens = route.kind === "api" || route.kind === "intercept";
  if (listens && route.empty && !route.read && !route.until) route.problems.push('"→ empty" proves nothing — add one "read <METHOD> <path> → <fields>" or one "until <helper> → <fields>"');
  if (listens && !route.empty && !route.input && !route.check && route.fields.length === 0 && route.status === null && route.sent.length === 0 && route.query.length === 0) route.problems.push("it names no field of the answer — list the fields of the expected result, a check: <rule> for stand data, → empty with a read, or → input when the answer only feeds a later browser step");
  if (route.input && route.kind !== "intercept" && route.kind !== "api") route.problems.push("→ input is an answer a later step works on — an intercept route (what the page received) or an api route (what the client read)");
  if (!listens && (bodyFields.length || route.check || route.status !== null || route.sent.length || route.query.length)) route.problems.push(`a ${route.kind} scenario listens to nothing — it names no request or answer fields`);
  if (route.kind === "api" && route.sent.length) route.problems.push("an API test builds what it sends — sent: belongs to an intercept route (what the page sent)");
  if (route.kind === "api" && route.screen.length) route.problems.push("an API route has no screen");
  if (!listens && route.screen.length === 0) route.problems.push(`a ${route.kind} scenario names what the screen shows — "screen <token>=<kind>"`);
  for (const { token, kind } of route.screen) {
    if (!SCREEN_KINDS.has(kind)) route.problems.push(`screen token "${token}" needs a kind: =value, =text, =state or =visible`);
    else if (kind === "visible" && bodyFields.length) route.problems.push(`screen token "${token}=visible" in a route with answer fields — the screen shows them: =value`);
  }
  return route;
}

/** The owner a route's kind belongs to: an `api` route to API, every other to UI or E2E. */
export const ownersOfRoute = (route) => (route.kind === "api" ? ["API"] : ["UI", "E2E"]);

/** "TC-101 · S2 · A member cannot invite" → "S2"; a case of one scenario has none (""). */
export const scenarioOf = (title) => /^[^·]+·\s*(S\d+)\s*·/.exec(title)?.[1] ?? "";

// "Not now" line: - <Title> · TMS: <ids | —> · <reason> [since <YYYY-MM-DD>] — <why>
const NOT_NOW = /^- (.+?) · TMS:\s*([^·]+?)\s*· (Blocked|Postponed|Cannot be automated|Covered by [^·—]+?|Needs (?:API|UI|E2E)(?:\s*\+\s*(?:API|UI|E2E))*|Gap)(?: since (\d{4}-\d{2}-\d{2}))?\s*—\s*(.*)$/;

/**
 * A Not now `<why>` and the search it ends with (the plan skill, "Searched before
 * blocked"): "… · searched: docs/orders.md; GET /api/shops" or "… · searched: none (<why>)" → the why
 * without the tail, and the tail's places as written; `searched` is null when the tail is missing or
 * names nothing ("none" without its why).
 */
function searchedIn(why) {
  const tail = /^(.*)\s+·\s+searched:\s*(.*)$/.exec(why);
  if (!tail) return { reason: why, searched: null };
  const places = tail[2].trim();
  const named = /^none\s*\(\s*\S[^)]*\)$/.test(places) || (places !== "" && !/^none\b/.test(places));
  return { reason: tail[1].trim(), searched: named ? places : null };
}

/** A plan's `## Browsers, phone, screenshots` decisions: { browsers, phone, screenshots } — undefined when the section is missing. */
function otherChecksOf(text) {
  const section = /^## Browsers, phone, screenshots[^\n]*$([\s\S]*?)(?=^## |(?![\s\S]))/m.exec(text)?.[1];
  if (section === undefined) return undefined;
  const line = (name) => new RegExp(`^- ${name}:\\s*(.+)$`, "m").exec(section)?.[1]?.trim();
  return { browsers: line("browsers"), phone: line("phone"), screenshots: line("screenshots") };
}

/**
 * Every plan under specs/ (the map left out), of one app when given:
 * { plan, app, journey, cases: [{ number, ids, title, scenario, status, needs, level, tags, routes, route }],
 *   notNow: [{ title, ids, status, since, reason, searched }], otherChecks, unreadable: [line] }.
 * A case block is one scenario: `routes` are its parsed `Route:` lines — one, or one per step
 * (`- Route (step 2): …`), several for a step awaiting several answers; `route` is the first. None in
 * a plan written before routing, which has `needs` instead. A journey plan (specs/e2e/<app>/<area>/<journey>.md)
 * has no `## Owners`: E2E owns each of its blocks, named on the block's `Level:`.
 */
export function readPlans(root, onlyApp) {
  const list = (dir) =>
    fs.existsSync(dir)
      ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((item) => (item.isDirectory() ? list(path.join(dir, item.name)) : item.name.endsWith(".md") && !SPECS_OWN_FILES.has(item.name) ? [path.join(dir, item.name)] : []))
      : [];
  return list(path.join(root, "specs")).flatMap((file) => {
    const plan = path.relative(root, file).split(path.sep).join("/");
    // specs/<app>/… and specs/e2e/<app>/…
    const app = plan.split("/")[1] === "e2e" ? plan.split("/")[2] : plan.split("/")[1];
    if (onlyApp && app !== onlyApp) return [];
    const text = read(file);
    const cases = text.split(/^### /m).slice(1).flatMap((block) => {
      const ids = /TMS:\s*([^\n·]+)/.exec(block)?.[1];
      const status = /^- Status:\s*(.+)$/m.exec(block)?.[1]?.trim();
      if (!ids || !status) return [];
      const needs = /^- Needs:\s*(.+)$/m.exec(block)?.[1];
      const number = /^(\d+)\./.exec(block)?.[1] ?? null;
      const level = /^- Level:\s*(API|UI|E2E)\b/m.exec(block)?.[1] ?? null;
      const tags = (/Tag:\s*([^·\n]+)/.exec(block)?.[1] ?? "").match(/@[a-z-]+/g) ?? [];
      const routes = [...block.matchAll(/^- Route(?:\s*\(step\s*(\d+)\))?:\s*(.+)$/gm)].map(([, step, line]) => ({ step: step ? Number(step) : null, line: line.trim(), ...parseRoute(line.trim()) }));
      const title = block.split("\n")[0].replace(/^\d+\.\s*/, "").trim();
      return [{ number, ids: caseIds(ids), title, scenario: scenarioOf(title), status, needs: needs ? layersOf(needs) : null, level, tags, routes, route: routes[0] ?? null }];
    });
    const section = /^## Not now\s*$([\s\S]*?)(?=^## |(?![\s\S]))/m.exec(text)?.[1] ?? "";
    const notNow = [];
    const unreadable = [];
    for (const line of section.split("\n").filter((row) => row.startsWith("- "))) {
      const parsed = NOT_NOW.exec(line);
      if (!parsed) {
        unreadable.push(line);
        continue;
      }
      const [, title, ids, status, since, why] = parsed;
      notNow.push({ title, ids: caseIds(ids), status: status.toLowerCase(), since: since ?? null, ...searchedIn(why) });
    }
    return [{ plan, app, journey: plan.split("/")[1] === "e2e", cases, notNow, otherChecks: otherChecksOf(text), unreadable }];
  });
}

/** A Not now line that keeps its case unwritten — all but "Covered by …" (another case or feature covers it). */
export const keepsOut = (line) => !line.status.startsWith("covered by");

/** The case numbers a test links in its own options: tms(101), tms("TC-101"), tms("PROJ-T101"), or a case URL spelled out. */
export function caseLinksIn(options) {
  const viaHelper = [...options.matchAll(new RegExp(`\\btms\\(\\s*["'\`]?(?:${CASE_PREFIX})?(\\d+)`, "g"))].map((match) => match[1]);
  const spelled = [...options.matchAll(/type:\s*["'`]tms["'`]\s*,\s*description:\s*["'`]([^"'`$]+)["'`]/g)].map((match) => /(\d+)\D*$/.exec(match[1])?.[1]);
  return [...new Set([...viaHelper, ...spelled].filter(Boolean))];
}
