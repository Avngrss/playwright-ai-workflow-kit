import fs from "node:fs";
import path from "node:path";
import { SPECS_OWN_FILES } from "./context.mjs";

/**
 * What the plans say about manual cases (the plan skill): each case block — its
 * TMS ids, status and the layers it needs — and each Not now line — its ids, reason and since when.
 * One reading for the suite's coverage (scripts/agent/suite-coverage.mjs) and the gate (cases.mjs).
 */

const read = (file) => fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");

/**
 * The case numbers a plan's `TMS:` field names: ids like TC-123 (bare numbers only when the field has
 * no such id). Notes in brackets — "TC-103 (screen)" — name no case.
 */
export function caseIds(field) {
  const text = field.replace(/\([^)]*\)/g, " ");
  const prefixed = [...text.matchAll(/\b[A-Z][A-Z0-9]*-(\d+)\b/g)].map((match) => match[1]);
  return prefixed.length ? prefixed : [...text.matchAll(/\b(\d+)\b/g)].map((match) => match[1]);
}

/** The layers a `Needs:` value names, before its reason: "API+UI — the server filters" → ["API", "UI"]. */
export function layersOf(needs) {
  const named = needs.split(/\s+[—–]\s+/)[0].toUpperCase();
  return ["API", "UI", "E2E"].filter((layer) => new RegExp(`\\b${layer}\\b`).test(named));
}

// "Not now" line: - <Title> · TMS: <ids | —> · <reason> [since <YYYY-MM-DD>] — <why>
const NOT_NOW = /^- (.+?) · TMS:\s*([^·]+?)\s*· (Blocked|Postponed|Cannot be automated|Covered by [^·—]+?|Needs (?:API|UI|E2E)(?:\s*\+\s*(?:API|UI|E2E))*|Gap)(?: since (\d{4}-\d{2}-\d{2}))?\s*—\s*(.*)$/;

/** A plan's `## Browsers, phone, screenshots` decisions: { browsers, phone, screenshots } — undefined when the section is missing. */
function otherChecksOf(text) {
  const section = /^## Browsers, phone, screenshots[^\n]*$([\s\S]*?)(?=^## |(?![\s\S]))/m.exec(text)?.[1];
  if (section === undefined) return undefined;
  const line = (name) => new RegExp(`^- ${name}:\\s*(.+)$`, "m").exec(section)?.[1]?.trim();
  return { browsers: line("browsers"), phone: line("phone"), screenshots: line("screenshots") };
}

/**
 * Every plan under specs/ (the map left out), of one app when given:
 * { plan, app, journey, cases: [{ number, ids, title, status, needs, level, tags }], notNow: [{ title, ids, status, since, reason }],
 *   otherChecks, unreadable: [line] }.
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
      return [{ number, ids: caseIds(ids), title: block.split("\n")[0].replace(/^\d+\.\s*/, "").trim(), status, needs: needs ? layersOf(needs) : null, level, tags }];
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
      const [, title, ids, status, since, reason] = parsed;
      notNow.push({ title, ids: caseIds(ids), status: status.toLowerCase(), since: since ?? null, reason });
    }
    return [{ plan, app, journey: plan.split("/")[1] === "e2e", cases, notNow, otherChecks: otherChecksOf(text), unreadable }];
  });
}

/** A Not now line that keeps its case unwritten — all but "Covered by …" (another layer or feature covers it). */
export const keepsOut = (line) => !line.status.startsWith("covered by");

/** The case numbers a test links in its own options: tms(101), tms("TC-101"), or a case URL spelled out. */
export function caseLinksIn(options) {
  const viaHelper = [...options.matchAll(/\btms\(\s*["'`]?(?:[A-Z][A-Z0-9]*-)?(\d+)/g)].map((match) => match[1]);
  const spelled = [...options.matchAll(/type:\s*["'`]tms["'`]\s*,\s*description:\s*["'`]([^"'`$]+)["'`]/g)].map((match) => /(\d+)\D*$/.exec(match[1])?.[1]);
  return [...new Set([...viaHelper, ...spelled].filter(Boolean))];
}
