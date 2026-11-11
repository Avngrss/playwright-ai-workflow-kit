/**
 * A plan's next case block — the plan template (agents/rules/plans.md §Plan body, its "### 1."
 * block) in its exact shape: every field line, what the call gives filled in, the rest the template's
 * own <…> and choices for the agent to fill from the live check. Appended at the end of the plan's
 * `## Test cases`, numbered after the last block; no other line of the plan changes. Any source (a TMS
 * case, a ticket, a doc, the engineer's words, a bug) ends as this block.
 *
 *   npm run plan:block -- <plan> --title "<title>" [--tms <id>[,<id>…]] [--owner API|UI|E2E] [--why "<≤ 8 words>"] [--role <slug>] [--tag <tag>…] [--rules "<source>"] [--steps "<step>" …]
 *
 *   --title  the outcome in one sentence; with --tms the case id goes first ("TC-101 · …", a scenario "S2 · …" → "TC-101 · S2 · …")
 *   --tms    the case(s) it proves, the first one naming it; then Why is "case <id>"
 *   --owner  its one owner; --why the reason on its Level line — where the result is
 *   --role   a role of specs/project-map.md
 *   --tag    a tag besides @regression on its Level line (@smoke, @cross-browser, @responsive); once per tag
 *   --rules  where the rule a route checks is written (a route with `check:`): the block's Rules line —
 *            without it the block has none (agents/rules/plans.md §Routes: stand data only)
 *   --steps  one argument per step, in the case's words; a scenario of several steps gets one "Route (step <n>)" line per step
 *
 * Drafted from a source the agent saved — a TMS case or a confirmed bug (scripts/agent/plan-draft.mjs,
 * loaded only for these calls):
 *
 *   npm run plan:block -- <plan> --case state/sources/<id>.json [--scenario S<k> --title "<what it proves>" [--take <n>[-<m>]]] [--owner …] [--why …] [--role …] [--tag …] [--rules …]
 *   npm run plan:block -- <plan> --bug state/sources/<id>.json [--title "<the outcome it expects>"] [--owner …] [--why …] [--role …] [--tag …] [--rules …]
 *
 * A plan that does not exist yet is written by the agent through the plan skill. Exit 0: added · 1:
 * nothing written, the last line says why.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** The template's own words for what the call does not give — spec:draft refuses a block still holding one. */
export const PLACEHOLDER = {
  owner: "API | UI | E2E",
  why: "<why this owner: where the result is, ≤ 8 words>",
  role: "<slug>",
  tms: "<case id | not yet documented | —>",
  route: "<one line, docs/Layer Routing Algorithm.md §7 — e.g. intercept POST /api/orders → 201 · id, total · screen list=value, toast=text>",
  routeOfStep: "<one line, docs/Layer Routing Algorithm.md §7>",
  value: "Core | Common | Rare | — · Severity: Critical | Major | Minor · Priority: P1 | P2 | P3",
  basis: "<the basis in ≤ 8 words>",
  data: 'none | stand | API setup | UI setup | mocked — <what; an illustration: case says "<value>" → <the criterion>>',
  rules: "<each check: rule of the routes — where it is written: the case, the PRD, a doc>",
  preconditions: "<what must exist | none>",
  step: "<what the person or the client does>",
  expect: "<the observable outcome that proves THIS scenario — the answer's fields and what the screen shows, as its route names them>",
  cleanup: "<what is removed and how | none>",
};

export const USAGE = [
  'npm run plan:block -- <plan> --title "<title>" [--tms <id>] [--owner API|UI|E2E] [--why "<≤ 8 words>"] [--role <slug>] [--tag <tag>…] [--rules "<source>"] [--steps "<step>" …]',
  'npm run plan:block -- <plan> --case state/sources/<id>.json [--scenario S<k> --title "<what it proves>" [--take <n>[-<m>]]] [--owner API|UI|E2E] [--why "<≤ 8 words>"] [--role <slug>] [--tag <tag>…] [--rules "<source>"]',
  'npm run plan:block -- <plan> --bug state/sources/<id>.json [--title "<the outcome it expects>"] [--owner API|UI|E2E] [--why "<≤ 8 words>"] [--role <slug>] [--tag <tag>…] [--rules "<source>"]',
].join("\n");
const OPTIONS = { "--title": "title", "--tms": "tms", "--owner": "owner", "--why": "why", "--role": "role", "--rules": "rules" };
const ROOT = process.cwd();
export const posix = (file) => file.replace(/\\/g, "/");
const isPrep = (step) => /^(Setup|Cleanup):/.test(step);

/** A `--tag` value added to the call's tags — or a stop naming what a block's Tag takes. */
export function addTag(call, value) {
  const tag = String(value ?? "").trim().toLowerCase();
  if (!/^@[a-z0-9]+(?:-[a-z0-9]+)*$/.test(tag)) stop(`--tag takes one tag, "@" and kebab-case (@smoke, @cross-browser, @responsive) — not "${value}"`);
  if (/^@(api|ui|e2e)$/.test(tag)) stop(`--tag ${tag}: the layer tag comes from --owner (spec:draft adds it), not the block's Tag`);
  if (tag !== "@regression" && !(call.tags ??= []).includes(tag)) call.tags.push(tag);
}

/** A plan command's stop: nothing written, the last line says why. */
export const stopper = (name) => (message) => {
  console.log(`${name}: nothing written — ${message}`);
  process.exit(1);
};
const stop = stopper("plan:block");

/**
 * A plan's place: a feature plan specs/<app>/<area>/<feature>/<file>.md or a journey plan
 * specs/e2e/<app>/<area>/<journey>.md → { kind, platform, area, name, file }; undefined otherwise.
 */
export function planPlace(given) {
  const file = posix(path.relative(ROOT, path.resolve(ROOT, given)));
  const parts = file.split("/");
  if (parts[0] !== "specs" || parts.length !== 5 || !file.endsWith(".md")) return undefined;
  if (parts[1] === "e2e") return { kind: "journey", platform: parts[2], area: parts[3], name: parts[4].replace(/\.md$/, ""), file };
  return { kind: "feature", platform: parts[1], area: parts[2], name: parts[3], file };
}

function parse(argv) {
  const [plan, ...rest] = argv;
  if (!plan || plan.startsWith("--")) stop(`name the plan first\n${USAGE}`);
  const call = { plan, steps: [] };
  for (let at = 0; at < rest.length; at += 1) {
    const arg = rest[at];
    if (arg === "--steps") {
      while (at + 1 < rest.length && !rest[at + 1].startsWith("--")) call.steps.push(rest[++at].replace(/\s+/g, " ").trim());
      continue;
    }
    if (arg === "--tag") {
      addTag(call, rest[++at]);
      continue;
    }
    const key = OPTIONS[arg];
    if (!key) stop(`unknown option "${arg}"\n${USAGE}`);
    const value = rest[at + 1];
    if (value === undefined || value.startsWith("--")) stop(`${arg} takes a value\n${USAGE}`);
    call[key] = value.replace(/\s+/g, " ").trim();
    at += 1;
  }
  if (!call.title) stop(`--title is the scenario's outcome in one sentence\n${USAGE}`);
  call.ids = (call.tms ?? "").split(",").map((id) => id.trim()).filter(Boolean);
  return call;
}

/**
 * The block, in the template's order of lines. What a drafted block copies from its source — `tmsWord`,
 * `value`, `basis`, `rules`, `preconditions`, `expects` (one per step), `after` (lines below Cleanup)
 * — replaces the template's words; without them it is the empty block. `tags` join @regression on
 * the Level line; a Rules line only with `rules` — a route naming a rule (`check:`) cites its source there.
 */
export function blockOf(number, call) {
  const [first] = call.ids;
  const title = first && !call.title.startsWith(`${first} · `) ? `${first} · ${call.title}` : call.title;
  const steps = call.steps.length ? call.steps : [PLACEHOLDER.step];
  const routed = steps.map((step, index) => ({ step, n: index + 1 })).filter(({ step }) => !isPrep(step));
  const routes =
    routed.length > 1 ? routed.map(({ n }, index) => `- Route (step ${n}): ${index === 0 ? PLACEHOLDER.route : PLACEHOLDER.routeOfStep}`) : [`- Route: ${PLACEHOLDER.route}`];
  return [
    `### ${number}. ${title}`,
    `- Level: ${call.owner ?? PLACEHOLDER.owner} — ${call.why ?? PLACEHOLDER.why} · Tag: ${["@regression", ...(call.tags ?? [])].join(" ")} · Role: ${call.role ?? PLACEHOLDER.role} · TMS: ${call.ids.join(", ") || call.tmsWord || PLACEHOLDER.tms}`,
    ...routes,
    `- Value: ${call.value ?? PLACEHOLDER.value}`,
    `- Why: ${call.basis ?? (call.ids.length ? `case ${call.ids.join(", ")}` : PLACEHOLDER.basis)}`,
    "- Status: ready to implement now",
    `- Data: ${PLACEHOLDER.data}`,
    ...(call.rules ? [`- Rules: ${call.rules}`] : []),
    `- Preconditions: ${call.preconditions ?? PLACEHOLDER.preconditions}`,
    "- Steps:",
    ...steps.flatMap((step, index) => [`  ${index + 1}. ${step}`, `     - expect: ${call.expects?.[index] || PLACEHOLDER.expect}`]),
    `- Cleanup: ${PLACEHOLDER.cleanup}`,
    ...(call.after ?? []),
  ].join("\n");
}

/**
 * Appends `call`'s block to the end of its plan's `## Test cases`, numbered after the last, no other
 * line of the plan changed, and prints it — or stops, nothing written. `call` = { plan, title, ids,
 * owner?, why?, role?, steps, …blockOf's }; `held(blocks)` a reason the plan holds this source already
 * (blocks: { n, title, text }), `notes` lines printed under the block.
 */
export function appendBlock(call, { held, notes = [] } = {}) {
  if (call.owner && !["API", "UI", "E2E"].includes(call.owner)) stop(`--owner is API, UI or E2E, not "${call.owner}"`);
  if (call.role && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(call.role)) stop(`--role is a role's slug as the map writes it, not "${call.role}"`);
  const place = planPlace(call.plan);
  const full = path.resolve(ROOT, call.plan);
  if (!fs.existsSync(full)) {
    stop(`no plan at ${posix(call.plan)}: a new plan is written by the agent through the plan skill (agents/rules/plans.md §Plan body), its cases then added here`);
  }
  if (!place) stop(`${posix(call.plan)} is not a plan — specs/<app>/<area>/<feature>/<feature>.md, or a journey's specs/e2e/<app>/<area>/<journey>.md`);
  if (place.kind === "feature" && call.owner === "E2E") {
    stop(`an E2E scenario has a journey plan of its own — specs/e2e/${place.platform}/${place.area}/<journey>.md (agents/rules/plans.md §E2E journeys); this plan keeps a Not now line "Covered by <its spec>"`);
  }
  if (place.kind === "journey" && call.owner && call.owner !== "E2E") stop(`a journey plan holds E2E scenarios — ${call.owner === "API" ? "an" : "a"} ${call.owner} scenario goes in its feature's plan`);

  const original = fs.readFileSync(full, "utf8");
  const eol = original.includes("\r\n") ? "\r\n" : "\n";
  const text = original.replace(/\r\n/g, "\n");
  const head = /^## Test cases[ \t]*$/m.exec(text);
  if (!head) stop(`${place.file} has no "## Test cases" section — the plan template's sections come first (agents/rules/plans.md §Plan body)`);
  const start = head.index + head[0].length;
  const next = /^## /m.exec(text.slice(start));
  const end = next ? start + next.index : text.length;
  const section = text.slice(start, end);
  const blocks = section.split(/^(?=### \d+\.)/m).flatMap((raw) => {
    const heading = /^### (\d+)\.\s*(.*)$/m.exec(raw);
    return heading?.index === 0 ? [{ n: Number(heading[1]), title: heading[2].trim(), text: raw }] : [];
  });
  const already = held?.(blocks);
  if (already) stop(already);
  const block = blockOf(Math.max(0, ...blocks.map(({ n }) => n)) + 1, call);
  const title = block.split("\n")[0].replace(/^### \d+\.\s*/, "");
  const same = blocks.find((each) => each.title === title);
  if (same) stop(`"${title}" is block #${same.n} already — a case given again is never written again`);

  const body = section.replace(/\s+$/, "");
  const written = `${text.slice(0, start)}${body}\n\n${block}\n${next ? `\n${text.slice(end)}` : ""}`;
  fs.writeFileSync(full, written.replace(/\n/g, eol));
  const number = block.split("\n")[0].replace(/^### (\d+)\..*$/, "$1");
  const wordy = call.why && call.why.split(/\s+/).length > 8 ? [`! --why has ${call.why.split(/\s+/).length} words — the owner's reason is ≤ 8`] : [];
  const below = [...wordy, ...notes].map((line) => `\n${line}`).join("");
  console.log(
    `plan:block — #${number} added to ${place.file} §Test cases:\n\n${block}\n${below}\nFill its <…> and choices from the live check (the plan skill §5); then \`npm run spec:draft -- ${place.file} ${number}\` once the plan is confirmed.`,
  );
}

async function main(argv) {
  // A block drafted from a saved source: plan-draft.mjs builds on this file's exports, so it is
  // loaded here, once this module has finished loading — a static import (or awaiting main at the top
  // level, which keeps this module loading) would be a cycle.
  if (argv.includes("--case") || argv.includes("--bug")) {
    const { main: draft } = await import("./plan-draft.mjs");
    return draft(argv);
  }
  appendBlock(parse(argv));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((error) => {
    console.log(`plan:block: nothing written — ${error?.stack ?? error}`);
    process.exit(1);
  });
}
