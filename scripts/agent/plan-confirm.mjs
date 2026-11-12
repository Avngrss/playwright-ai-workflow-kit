/**
 * The confirm a plan ends with (agents/rules/plans.md §Confirm before any code), from the plan file itself: the
 * tables and lines the user decides from, then the question with the options that apply. Printed as Markdown for
 * the agent to show as it is, its `<…>` filled (the setups tried, a smoke left out). Read-only.
 *
 *   npm run plan:confirm -- <plan>
 *
 * Will be written: each ready case no test of the app holds yet (by its title); the ready ones with a test are
 * Already automated. A pass that edits or removes tests adds its own "Will be changed or removed" table.
 */
import fs from "node:fs";
import path from "node:path";
import { parseRoute, readPlans } from "../gate/plans.mjs";
import { titlesIn } from "./test-result.mjs";

const cell = (text) => String(text ?? "").replace(/\|/g, "\\|").trim();
const capital = (text) => text.charAt(0).toUpperCase() + text.slice(1);
const field = (block, name) => new RegExp(`^- ${name}:\\s*(.+)$`, "m").exec(block)?.[1]?.trim();

/** A route in plain words: what the answer must hold, then what the screen shows. */
export function checksOf(line) {
  const route = parseRoute(line);
  const parts = [];
  if (route.kind === "no-request") parts.push("no request");
  if (route.kind === "screen-only") parts.push("the screen only");
  if (route.kind === "api" || route.kind === "intercept") {
    const answer = [route.status && String(route.status), ...route.fields].filter(Boolean).join(", ");
    if (route.sent.length) parts.push(`sent: ${route.sent.join(", ")}`);
    if (route.query.length) parts.push(`query: ${route.query.join(", ")}`);
    if (route.check) parts.push(`answer: ${route.check} (stand data)`);
    else if (route.input) parts.push("answer: feeds the next step");
    else if (route.empty) parts.push("answer: empty");
    else if (answer) parts.push(`answer: ${answer}`);
    if (route.read) parts.push(`then read: ${route.read.fields.join(", ")}`);
    if (route.until) parts.push(`until settled: ${route.until.fields.join(", ")}`);
  }
  const KIND = { value: "", text: " (text)", state: " (state)", visible: " (shown)" };
  if (route.screen.length) parts.push(`screen: ${route.screen.map(({ token, kind }) => `${token}${KIND[kind] ?? ""}`).join(", ")}`);
  return parts.join(" · ");
}

/** The case blocks of a plan with the fields the confirm shows. */
function blocksOf(text) {
  return text
    .split(/^### /m)
    .slice(1)
    .map((block) => {
      const level = /^- Level:\s*(API|UI|E2E)\s*(?:[—–]\s*([^·\n]*?))?\s*(?:·|$)/m.exec(block);
      const value = field(block, "Value") ?? "";
      const routes = [...block.matchAll(/^- Route(?:\s*\(step\s*(\d+)\))?:\s*(.+)$/gm)].map(([, step, line]) => ({ step, line: line.trim() }));
      return {
        number: /^(\d+)\./.exec(block)?.[1],
        title: block.split("\n")[0].replace(/^\d+\.\s*/, "").trim(),
        owner: level?.[1] ?? "—",
        ownerWhy: level?.[2]?.trim() || "—",
        tags: (/Tag:\s*([^·\n]+)/.exec(block)?.[1] ?? "").match(/@[a-z-]+/g) ?? [],
        priority: [/Priority:\s*(P\d)/.exec(value)?.[1], /Severity:\s*(\w+)/.exec(value)?.[1]].filter(Boolean).join(" · ") || "—",
        why: field(block, "Why") ?? "—",
        status: field(block, "Status") ?? "",
        data: field(block, "Data") ?? "",
        checks: routes.length ? routes.map(({ step, line }) => `${step ? `step ${step}: ` : ""}${checksOf(line)}`).join("; ") : "<no route yet — the plan skill routes it first>",
      };
    });
}

const numbers = (blocks) => blocks.map(({ number }) => `#${number}`).join(", ");

/**
 * The confirm as Markdown. `existing`: the app's tests ({ file, title }); `lastResults`: reports/last-results.json's
 * tests, for Already automated.
 */
export function renderConfirm({ plan, text, existing, lastResults = [] }) {
  const blocks = blocksOf(text);
  const has = (block) => existing.find(({ title }) => title === block.title);
  const ready = blocks.filter(({ status }) => /^ready/i.test(status));
  const toWrite = ready.filter((block) => !has(block));
  const written = ready.filter((block) => has(block));
  const notNow = plan.notNow;
  const auth = /^- auth as:.*?role:\s*([^\n·]+)/m.exec(text)?.[1]?.trim() ?? "none";
  const basis = blocks.some(({ title }) => /^[A-Z][A-Z0-9]*-[A-Z]*\d+\b/.test(title)) || notNow.some(({ ids }) => ids.length) ? "test-cases" : /^- Ticket:\s*(?!none\b)\S/m.test(text) ? "requirements" : "value-and-risk";
  const out = [`Plan: \`${plan.plan}\` · basis: ${basis} · role: ${auth}`, ""];

  if (!toWrite.length) {
    out.push(`Nothing to write — ${ready.length ? `every ready case has its test (${numbers(written)})` : "the plan has no ready case"}.`);
    if (notNow.length) out.push("", ...notNowTable(notNow));
    return `${out.join("\n")}\n`;
  }

  out.push(`**Will be written (${toWrite.length})**`, "", "| # | Test | Owner | Why this owner | Checks | Suite | Priority | Why it is needed |", "|---|------|-------|----------------|--------|-------|----------|------------------|");
  for (const block of toWrite) {
    const suite = block.tags.includes("@smoke") ? "Regression + Smoke" : "Regression";
    out.push(`| ${block.number} | ${cell(block.title)} | ${block.owner} | ${cell(block.ownerWhy)} | ${cell(block.checks)} | ${suite} | ${block.priority} | ${cell(block.why)} |`);
  }
  out.push("");

  const kinds = new Map();
  for (const block of toWrite) {
    const kind = block.data.split(/\s+[—–]\s+/)[0] || "<not said>";
    kinds.set(kind, [...(kinds.get(kind) ?? []), block]);
  }
  out.push(`Test data: ${[...kinds].map(([kind, list]) => `${numbers(list)} ${kind}`).join(" · ")} — <in plain words: what the tests make and remove, the setups tried today; a faked answer, a setup proven in part, a kept object to approve, by number>.`);
  out.push("Priority: P1 is looked at first when it fails · Critical / Major / Minor — how bad a breakage is.");
  const smoke = blocks.find(({ tags }) => tags.includes("@smoke"));
  out.push(smoke ? `Smoke: #${smoke.number} — ${smoke.title}${has(smoke) ? " (written already)" : ""} — say "no smoke" to keep it regression only.` : 'Smoke: none — <why no case of this feature fits>.');
  if (blocks.some(({ owner }) => owner === "UI")) {
    const other = plan.otherChecks;
    const short = (decision) => decision?.split(/;\s/)[0] ?? "—";
    out.push(other ? `Browsers, phone, screenshots: browsers ${short(other.browsers)} · phone ${short(other.phone)} · screenshots ${short(other.screenshots)} — say "no" to any of them.` : "Browsers, phone, screenshots: <the plan's three decisions — its ## Browsers, phone, screenshots is missing>.");
  }
  if (written.length) {
    const last = (title) => lastResults.find((result) => result.title === title)?.status ?? "not run yet";
    out.push(`Already automated (${written.length}): ${written.map((block) => `#${block.number} — ${path.basename(has(block).file)} — last run ${last(block.title)}`).join(" · ")}.`);
  }

  if (notNow.length) out.push("", ...notNowTable(notNow));

  const owners = ["API", "UI", "E2E"].map((owner) => [owner, toWrite.filter((block) => block.owner === owner).length]).filter(([, count]) => count);
  const reasons = [...new Set(notNow.map(({ status }) => status))].map((status) => `${status} ${notNow.filter((line) => line.status === status).length}`);
  const limit = /^- this run:\s*(api|ui|e2e)\b/m.exec(text)?.[1];
  const needs = limit ? notNow.filter(({ status }) => status.startsWith("needs ")) : [];
  const elsewhere = [...new Set(notNow.map(({ status }) => /^covered by (specs\/\S+\.md)$/.exec(status)?.[1]).filter(Boolean))];
  const options = [
    `**Yes, write them** — ${toWrite.length} to write (${owners.map(([owner, count]) => `${owner} ${count}`).join(", ")})${notNow.length ? ` · ${notNow.length} not now: ${reasons.join(", ")}` : ""}`,
    needs.length && `**Drop the limit and write ${needs.length} more** — the ${needs.map(({ status }) => status.replace(/^needs /, "")).filter((owner, index, all) => all.indexOf(owner) === index).join(", ")} cases this run's ${limit.toUpperCase()} limit keeps out`,
    ...elsewhere.map((other) => `**Add them to ${path.basename(other, ".md")} instead** — the cases sit on ${other}'s screen or requests`),
    "**Let me adjust the plan first**",
  ].filter(Boolean);
  out.push("", `Write these ${toWrite.length} now?`, ...options.map((option, index) => `${index + 1}. ${option}`));
  return `${out.join("\n")}\n`;
}

/** Not now as its table — rows of one reason merged above ~15. */
function notNowTable(notNow) {
  const why = ({ status, reason }) => (status === "postponed" ? reason : `${capital(status)} — ${reason}`);
  let rows = notNow.map((line) => [line.title, why(line)]);
  if (rows.length > 15) {
    const merged = new Map();
    for (const [title, reason] of rows) merged.set(reason, [...(merged.get(reason) ?? []), title]);
    rows = [...merged].map(([reason, titles]) => [titles.length > 1 ? `${titles.join("; ")} (${titles.length})` : titles[0], reason]);
  }
  return [`**Not now (${notNow.length})**`, "", "| Test | Why not now |", "|------|-------------|", ...rows.map(([title, reason]) => `| ${cell(title)} | ${cell(reason)} |`)];
}

function main(argv) {
  const ROOT = process.cwd();
  const given = argv.find((arg) => !arg.startsWith("--"));
  const file = given && path.resolve(ROOT, given);
  if (!file || !fs.existsSync(file)) {
    console.log(`✗ ${given ? `no plan at ${given}` : "name the plan"} — npm run plan:confirm -- specs/<app>/<area>/<feature>/<feature>.md`);
    process.exit(1);
  }
  const relative = path.relative(ROOT, file).split(path.sep).join("/");
  const plan = readPlans(ROOT).find((each) => each.plan === relative);
  if (!plan) {
    console.log(`✗ ${relative} is not a plan of specs/ (specs/<app>/<area>/<feature>/<feature>.md or specs/e2e/<app>/<area>/<journey>.md)`);
    process.exit(1);
  }
  const specsOf = (dir) =>
    fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => (entry.isDirectory() ? specsOf(path.join(dir, entry.name)) : entry.name.endsWith(".spec.ts") ? [path.join(dir, entry.name)] : [])) : [];
  const existing = ["api", "ui", "e2e"].flatMap((layer) => specsOf(path.join(ROOT, "tests", layer, plan.app))).flatMap((spec) => titlesIn(fs.readFileSync(spec, "utf8")).map((title) => ({ file: path.relative(ROOT, spec).split(path.sep).join("/"), title })));
  let lastResults = [];
  try {
    lastResults = JSON.parse(fs.readFileSync(path.join(ROOT, "reports", "last-results.json"), "utf8")).tests ?? [];
  } catch {
    // No run yet.
  }
  const text = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
  console.log(renderConfirm({ plan, text, existing, lastResults }).trimEnd());
}

if (path.basename(process.argv[1] ?? "") === "plan-confirm.mjs") main(process.argv.slice(2));
