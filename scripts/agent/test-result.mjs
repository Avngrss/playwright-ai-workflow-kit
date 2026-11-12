/**
 * The test result the verify skill shows the user (§7), written by `npm run verify` to reports/test-result.md from
 * what the run left: the verify block, the plans of its specs, the suite coverage and git. Every number, verdict,
 * coverage row, TMS line and the next command come from those; `<…>` marks the parts only the agent can write (the
 * report's address, the reviews, blockers) — filled before it is shown, nothing else changed.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { CASE_PREFIX, readPlans } from "../gate/plans.mjs";

export const RESULT_FILE = path.join("reports", "test-result.md");
const LAYER = { api: "API", ui: "UI", e2e: "E2E" };
const BROWSER = { firefox: "Firefox", webkit: "WebKit", mobile: "phone" };
const GREEN = new Set(["passed", "slow"]);
const FULL_TABLE = 10;

/** The plan a spec belongs to: tests/<layer>/<app>/<area>/<feature>/… → its feature plan; an E2E spec → its journey plan. */
export function planOf(spec) {
  const [, layer, app, area, feature] = spec.split("/");
  return layer === "e2e" ? `specs/e2e/${app}/${area}/${feature.replace(/\.e2e\.spec\.ts$/, "")}.md` : `specs/${app}/${area}/${feature}/${feature}.md`;
}

/** "TC-408 · S2 · what it proves" / "TC-408 · Title" → the case's own words. */
const caseTitle = (title) => title.replace(new RegExp(`^(?:${CASE_PREFIX})?\\d+\\s*·\\s*`), "").replace(/^S\d+\s*·\s*/, "");
const first = (decision) => decision?.split(/\s+[—–]\s+/)[0];

/** How a case's tests did in this run: ✅ all ran and passed · ❌ one failed · — not every one ran. */
function thisRun(tests, ran) {
  const results = tests.map(({ file, title }) => ran.filter((test) => test.file === file && test.title === title));
  if (results.some((each) => each.some(({ outcome }) => !GREEN.has(outcome) && outcome !== "skipped" && outcome !== "not run"))) return "❌";
  return results.length && results.every((each) => each.length && each.every(({ outcome }) => GREEN.has(outcome))) ? "✅" : "—";
}

/** A plan's cases as table rows — TMS cases by id, a plan without TMS ids by its blocks. */
function rowsOf(plan, coverage, ran) {
  const reasonOf = (ids, title) => plan.notNow.find((line) => (ids.length ? line.ids.some((id) => ids.includes(id)) : line.title === title));
  const status = (word, extra) => (extra ? `${word} — ${extra}` : word);
  const keys = [...new Set([...plan.cases.flatMap(({ ids }) => ids), ...plan.notNow.flatMap(({ ids }) => ids)])];
  if (keys.length) {
    // The id as the plan spells it (TC-401); one it spells nowhere takes the plan's prefix.
    const prefix = new RegExp(`\\b(${CASE_PREFIX})\\d+\\b`).exec(plan.text)?.[1] ?? "";
    return keys.map((key) => {
      const known = coverage.cases?.[key] ?? { tests: [], coverage: "not automated", layers: [] };
      const blocks = plan.cases.filter(({ ids }) => ids.includes(key));
      const shown = new RegExp(`\\b(${CASE_PREFIX})${key}\\b`).exec(plan.text)?.[0] ?? `${prefix}${key}`;
      const notNow = reasonOf([key]);
      const extra = known.coverage === "not automated" ? notNow?.reason : known.coverage === "inconsistent" ? known.missing?.length && `missing ${known.missing.join(", ")}` : known.coverage === "to rework" ? known.rework?.join(", ") : undefined;
      return {
        id: shown,
        title: caseTitle(blocks[0]?.title ?? notNow?.title ?? ""),
        scenarios: blocks.length || 1,
        owners: known.layers?.length ? known.layers.join(" + ") : [...new Set(blocks.map(({ level }) => level).filter(Boolean))].join(" + ") || "—",
        run: thisRun(known.tests, ran),
        coverage: known.coverage,
        status: status(known.coverage, extra),
        touched: known.tests.some(({ file, title }) => ran.some((test) => test.file === file && test.title === title)),
        ready: blocks.some(({ status: block }) => /^ready/i.test(block ?? "")),
        reason: notNow?.reason,
      };
    });
  }
  return (coverage.withoutTms ?? [])
    .filter((entry) => entry.plan === plan.plan)
    .map((entry) => ({
      id: ((number) => (number ? `#${number}` : "—"))(plan.cases.find(({ title }) => title === entry.title)?.number),
      title: entry.title,
      scenarios: 1,
      owners: entry.owner ?? "—",
      run: thisRun(entry.tests, ran),
      coverage: entry.coverage,
      status: status(entry.coverage, entry.coverage === "not automated" ? entry.reason : entry.rework?.join(", ")),
      touched: entry.tests.some(({ file, title }) => ran.some((test) => test.file === file && test.title === title)),
      ready: /^ready/i.test(entry.status ?? ""),
    }));
}

const countsOf = (rows) =>
  ["automated", "to rework", "not automated", "inconsistent"]
    .map((word) => [word, rows.filter(({ coverage }) => coverage === word).length])
    .filter(([word, count]) => count || word === "automated" || word === "not automated")
    .map(([word, count]) => `${word} ${count}`)
    .join(" · ");

/** The next command, by what the run left. */
function nextOf(input, plans, rowsByPlan) {
  const red = input.red ?? [];
  if (input.healOwed) return `the automatic heal, now (the verify skill §5): ${red.join(" ")} — then verify again`;
  if (red.length && input.fresh && input.attempt > 1) return "none — still red after the automatic heal: say so plainly; heal again only from a genuinely different angle";
  if (red.length) return red.length <= 2 ? `/heal ${red.join(" ")}` : "/triage reports/run-summary.json";
  if (input.newTests.length) {
    const reviews = plans.map((plan) => {
      const numbers = plan.cases.filter(({ title }) => input.newTests.some((test) => test.title === title)).map(({ number }) => `#${number}`);
      const specs = input.specs.filter((spec) => planOf(spec) === plan.plan);
      return `/review ${plan.plan}${numbers.length ? ` ${numbers.join(" ")}` : ""} — ${specs.join(" ")}`;
    });
    return `${reviews.join(" · ")} — in a new chat`;
  }
  const left = plans.filter((plan) => rowsByPlan.get(plan.plan).some((row) => row.ready && row.coverage === "not automated"));
  return left.length ? left.map((plan) => `/implement ${plan.plan}`).join(" · ") : "none";
}

/** The test result as Markdown — a pure function of what the run left (kit tests feed it directly). */
export function renderTestResult(input) {
  const ran = input.tests;
  const plans = input.plans;
  const owners = [...new Set(input.specs.map((spec) => LAYER[spec.split("/")[1]]).filter(Boolean))].join(" + ");
  const out = [`## Test result — ${plans.map(({ name }) => name).join(", ") || input.specs.join(", ")} · ${owners}`, "", input.verdict];
  for (const test of ran.filter(({ outcome }) => !GREEN.has(outcome) && outcome !== "skipped")) {
    const where = BROWSER[test.project?.split(":")[0]] ? `[${BROWSER[test.project.split(":")[0]]}] ` : "";
    out.push(`- ${where}${test.title} — ${test.verdict}${test.cause ? ` · ${test.cause}` : ""}${test.step ? ` — step "${test.step}"` : ""}${test.also ? " (another feature's test)" : ""}`);
  }
  for (const spec of input.notRun ?? []) out.push(`- ${spec} — not run — none of its tests ran (test-results/verify.log says why)`);

  const rowsByPlan = new Map(plans.map((plan) => [plan.plan, input.coverage ? rowsOf(plan, input.coverage, ran) : []]));
  const tms = { mark: [], reasons: [], corrections: [] };
  for (const plan of plans) {
    const rows = rowsByPlan.get(plan.plan);
    if (!input.coverage) {
      out.push("", `${input.coverageLine ?? "Coverage: not read — suite:coverage gave no data"}`);
      break;
    }
    if (!rows.length) continue;
    out.push("", `Plan "${plan.feature}" — ${rows.length} case${rows.length === 1 ? "" : "s"} · ${countsOf(rows)}`, "", "| Case | Title | Scenarios | Owners | This run | Status |", "|------|-------|:---------:|--------|:--------:|--------|");
    const shown = rows.length <= FULL_TABLE ? rows : rows.filter(({ touched }) => touched);
    for (const row of shown) out.push(`| ${row.id} | ${row.title.replace(/\|/g, "\\|")} | ${row.scenarios} | ${row.owners} | ${row.run} | ${row.status.replace(/\|/g, "\\|")} |`);
    const rest = rows.filter((row) => !shown.includes(row));
    if (rest.length) out.push("", `Other cases of the plan: ${countsOf(rest)} — the full table: /coverage`);
    if (rows.some(({ id }) => !id.startsWith("#") && id !== "—")) {
      tms.mark.push(...rows.filter(({ coverage, run }) => coverage === "automated" && run === "✅").map(({ id }) => id));
      tms.reasons.push(...rows.filter(({ coverage, reason }) => coverage === "not automated" && reason).map(({ id, reason }) => `${id}: ${reason}`));
      const section = /^## Manual case corrections\s*$([\s\S]*?)(?=^## |(?![\s\S]))/m.exec(plan.text)?.[1] ?? "";
      tms.corrections.push(...section.split("\n").filter((line) => line.startsWith("- ") && !line.includes("<case id>")).map((line) => line.slice(2)));
    }
  }
  const tmsParts = [
    tms.mark.length && `mark Automated — ${tms.mark.join(", ")} (those it does not show as Automated yet)`,
    tms.reasons.length && `not automated, add the reason — ${tms.reasons.join(" · ")}`,
    tms.corrections.length && `fix by hand — ${tms.corrections.join(" · ")}`,
  ].filter(Boolean);
  if (tmsParts.length) out.push("", `**In the TMS:** ${tmsParts.join(" · ")}`);

  const decisions = plans.flatMap(({ otherChecks }) => (otherChecks ? [`browsers ${first(otherChecks.browsers) ?? "—"} · phone ${first(otherChecks.phone) ?? "—"} · screenshots ${first(otherChecks.screenshots) ?? "—"}`] : []));
  const elsewhere = Object.entries(BROWSER).flatMap(([key, label]) => {
    const tests = ran.filter(({ project }) => project?.split(":")[0] === key);
    return tests.length ? [`${label} ${tests.every(({ outcome }) => GREEN.has(outcome)) ? "✅" : "❌"}`] : [];
  });
  const changedTests = input.newTests.length || input.changedSpecs.length;
  out.push(
    "",
    `- Report: ${ran.length ? "<the http://localhost:<port> address npm run allure:open serves — §4>" : "not generated (no test ran)"}`,
    `- Browsers, phone, screenshots: ${decisions.join("; ") || "no decisions in the plan"} · ran: ${elsewhere.join(" ") || "Chromium only"}`,
    "- Blockers: <none | what stopped the work, one line each>",
    "- Review: <none | the §6.1 findings, one line each>",
  );
  if (input.canFail.length) {
    const red = input.canFail.filter(({ result }) => result === "red at its line").length;
    const others = input.canFail.filter(({ result }) => result !== "red at its line").map(({ test, result, why }) => `${test}: ${result}${why ? ` — ${why}` : ""}`);
    out.push(`- Can fail: ${red} of ${input.canFail.length} red on purpose${others.length ? ` · ${others.join(" · ")}` : ""}`);
  }
  if (input.newTests.length) out.push("- Independent review: full — waiting for /review (the Next line, in a new chat) <then: none | <n> findings — <k> fixed, <a> answered · open: one line each>");
  else if (changedTests) out.push("- Independent review: light — <the five kinds, one line each: `<1–5>: none — <the check holding it, file:line>` or the finding (§6.2)>");
  out.push(`- Files changed: ${input.changed.length ? input.changed.join(", ") : "none"}`);
  if (input.removed.length) out.push(`- Tests removed: ${input.removed.map(({ title }) => `${title} — <renamed to <title> | folded into <title> | gone with its scenario>`).join(" · ")}`);
  if (input.timeLine) out.push(input.timeLine);

  out.push("", "### Next", `- ${nextOf(input, plans, rowsByPlan)}`);
  if (input.newTests.length) out.push("- Look over each case beside its test (the table above, else the plan) and its steps in the report — a new feature's first tests, every one");
  return `${out.join("\n")}\n`;
}

// ── What the run left, read from the tree ────────────────────────────────────────────────────────

const git = (root, ...args) => {
  try {
    return execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    return undefined;
  }
};
export const titlesIn = (text) => [...(text ?? "").matchAll(/\btest(?:\.(?:only|fixme|slow))?\(\s*(["'`])((?:(?!\1)[^\\]|\\.)*)\1/g)].map((match) => match[2]);

/** The tests these specs gained and lost against the last commit, and the specs changed at all. */
function gitChanges(root, specs) {
  const changed = (git(root, "status", "--porcelain", "--untracked-files=all") ?? "").split("\n").filter(Boolean).map((line) => line.slice(3).replace(/^.* -> /, "").replace(/^"|"$/g, ""));
  const newTests = [];
  const removed = [];
  const changedSpecs = [];
  for (const spec of specs) {
    const now = fs.existsSync(path.join(root, spec)) ? fs.readFileSync(path.join(root, spec), "utf8") : "";
    const before = git(root, "show", `HEAD:${spec}`);
    if (before !== undefined && before.replace(/\r\n/g, "\n") === now.replace(/\r\n/g, "\n")) continue;
    changedSpecs.push(spec);
    const [was, is] = [titlesIn(before), titlesIn(now)];
    newTests.push(...is.filter((title) => !was.includes(title)).map((title) => ({ file: spec, title })));
    removed.push(...was.filter((title) => !is.includes(title)).map((title) => ({ file: spec, title })));
  }
  return { changed, newTests, removed, changedSpecs };
}

/**
 * Writes reports/test-result.md for a verify that ran tests (`report`: verify's own, `block`: its lines) — or
 * removes an older one when nothing ran, so a stale result is never shown. The file's path, or undefined.
 */
export function writeTestResult({ root, report, block, reason, mask = (text) => text }) {
  const file = path.join(root, RESULT_FILE);
  if (!report.run) {
    fs.rmSync(file, { force: true });
    return undefined;
  }
  const wanted = new Set(report.files.map(planOf));
  const plans = readPlans(root)
    .filter(({ plan }) => wanted.has(plan))
    .map((plan) => {
      const text = fs.readFileSync(path.join(root, plan.plan), "utf8").replace(/\r\n/g, "\n");
      const heading = /^# (.+)$/m.exec(text)?.[1] ?? "";
      const [area, feature] = heading.includes(" — ") ? heading.split(" — ") : [plan.plan.split("/").at(-2), heading || path.basename(plan.plan, ".md")];
      return { ...plan, text, feature, name: `${feature} (${plan.app} › ${area})` };
    });
  const text = renderTestResult({
    verdict: block.find((line) => line.startsWith("**")) ?? `**Not run** — ${reason}`,
    timeLine: block.find((line) => line.startsWith("- Time:")),
    coverageLine: block.find((line) => line.startsWith("- Coverage")),
    tests: report.run.listed,
    notRun: report.run.notRun,
    canFail: report.canFail,
    specs: report.files,
    plans,
    coverage: report.coverageData,
    red: report.red,
    fresh: report.fresh,
    attempt: report.state?.attempt,
    healOwed: report.state?.healOwed,
    ...gitChanges(root, report.files),
  });
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, mask(text));
  return file;
}
