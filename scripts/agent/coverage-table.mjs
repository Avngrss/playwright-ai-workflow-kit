/**
 * The coverage table /coverage shows (the verify skill §9), from suite-coverage's data: a TMS suite case by case, or
 * — no suite given and no TMS ids — each plan's own scenarios. Pure: suite-coverage.mjs prints it with --table.
 *
 * The suite file (the agent saves it from the TMS, read-only there): { "title": "<folder title>", "cases": [{ "id":
 * "TC-408", "title": "<the case's title>" }, …] } — its cases are the rows; one our side does not know is not
 * automated, "not planned yet".
 */
const ORDER = ["automated", "to rework", "inconsistent", "not automated"];
const MANY = 30;
const cell = (text) => String(text ?? "").replace(/\|/g, "\\|").trim();
const capital = (text) => text.charAt(0).toUpperCase() + text.slice(1);
const mark = (lastRun) => (lastRun === "passed" ? "✅" : lastRun === "failed" || lastRun === "broken" ? "❌" : "—");
const caseKey = (value) => /(\d+)\D*$/.exec(value)?.[1] ?? value.trim();

/** Why a case is not automated, to rework or inconsistent — in the words a QA engineer acts on. */
function whyNot(known) {
  if (!known) return "not planned yet";
  if (known.coverage === "to rework") return known.rework.join(", ");
  if (known.coverage === "inconsistent") {
    return [known.keptOut && "tests link it while its plan keeps it in Not now", known.missing?.length && `no test for ${known.missing.join(", ")}`, known.wrongOwner?.length && `outside its owner: ${known.wrongOwner.join(", ")}`].filter(Boolean).join(" · ");
  }
  if (known.coverage !== "not automated") return "";
  const line = known.notNow.find(({ status }) => !status.startsWith("covered by"));
  if (line) return `${capital(line.status)} — ${line.reason}${line.since ? ` (since ${line.since})` : ""}`;
  const status = known.plan?.status ?? "";
  if (/^ready/i.test(status)) return "planned — not written yet";
  if (/^needs /i.test(status)) return `${capital(status)} — planned, not in a run yet`;
  return known.plan ? `planned — ${status || "no status"}` : "not planned yet";
}

const ownersOf = (tests) => {
  const counts = new Map();
  for (const { layer } of tests) counts.set(layer, (counts.get(layer) ?? 0) + 1);
  return [...counts].map(([layer, count]) => `${layer} ${count}`).join(" + ") || "—";
};

function countsLine(rows, lastRunAt) {
  const by = (word) => rows.filter(({ coverage }) => coverage === word).length;
  const automated = by("automated");
  return [
    `${rows.length} case${rows.length === 1 ? "" : "s"}`,
    `automated ${automated} (${rows.length ? Math.round((automated / rows.length) * 100) : 0}%)`,
    by("to rework") && `to rework ${by("to rework")}`,
    `not automated ${by("not automated")}`,
    by("inconsistent") && `inconsistent ${by("inconsistent")}`,
    `last run ${lastRunAt ? lastRunAt.slice(0, 10) : "none"}`,
  ]
    .filter(Boolean)
    .join(" · ");
}

/** The suite's rows: its cases (or every case the app's tests and plans know), sorted as §9 orders them. */
function suiteRows(data, suite, plan) {
  const known = Object.fromEntries(Object.entries(data.cases ?? {}).filter(([, entry]) => !plan || entry.plan?.plan === plan));
  const listed = suite?.cases?.length ? suite.cases.map(({ id, title }) => ({ id, key: caseKey(String(id)), title })) : Object.entries(known).map(([key, entry]) => ({ id: entry.tests[0]?.title.match(/^([A-Z][A-Z0-9]*-[A-Z]*\d+)/)?.[1] ?? key, key, title: entry.plan?.title }));
  return listed
    .map(({ id, key, title }) => {
      const entry = known[key];
      const coverage = entry?.coverage ?? "not automated";
      const url = entry?.tests.find(({ url: link }) => link)?.url;
      return {
        id: url ? `[${id}](${url})` : id,
        plainId: id,
        title: title ?? entry?.plan?.title?.replace(/^[A-Z][A-Z0-9]*-[A-Z]*\d+\s*·\s*/, "") ?? "",
        scenarios: entry?.scenarios?.length || (entry?.plan ? 1 : "—"),
        owners: entry ? ownersOf(entry.tests) : "—",
        lastRun: entry?.tests.length ? mark(entry.lastRun) : "—",
        failed: entry?.lastRun === "failed" || entry?.lastRun === "broken",
        coverage,
        why: whyNot(entry),
        plan: entry?.plan?.plan,
      };
    })
    .sort((a, b) => ORDER.indexOf(a.coverage) - ORDER.indexOf(b.coverage) || (a.coverage === "not automated" ? a.why.localeCompare(b.why) : 0));
}

/** The lines under a table and its one next command. */
function notes(rows, unreadable) {
  const ids = (list) => list.map(({ plainId }) => plainId).join(", ");
  const rework = rows.filter(({ coverage }) => coverage === "to rework");
  const inconsistent = rows.filter(({ coverage }) => coverage === "inconsistent");
  const failed = rows.filter(({ failed: red }) => red);
  const unplanned = rows.filter(({ why }) => why === "not planned yet");
  const lines = [
    rework.length && `- To rework (${ids(rework)}): tested twice or not routed — refresh their features to merge each pair into one test: ${[...new Set(rework.map(({ plan }) => plan).filter(Boolean))].join(", ")}`,
    inconsistent.length && `- Inconsistent (${ids(inconsistent)}): a part of these cases is written — fix the plan or the tests; qa:gate names them`,
    failed.length && `- Failed when last run: ${ids(failed)}`,
    unreadable.length && `- Fix these plan lines (off the plan's shape): ${unreadable.map(({ plan, line }) => `${plan}: ${line}`).join(" · ")}`,
  ].filter(Boolean);
  const next = failed.length ? (failed.length <= 2 ? "/heal <their specs>:<line> (reports/run-summary.md names them)" : "/triage reports/run-summary.json") : inconsistent.length ? "npm run qa:gate — it names what to fix" : rework.length ? `/plan ${rework.find(({ plan }) => plan)?.plan ?? "<plan>"} — refresh: merge the tests written twice` : unplanned.length ? "/plan with this folder's link — the cases not planned yet" : "none";
  return [...lines, "", `Next: ${next}`];
}

/** Over ~30 rows: automated as counts per owner plus the failed ones, the rest grouped by reason. */
function shortTable(rows) {
  const automated = rows.filter(({ coverage }) => coverage === "automated");
  const perOwner = new Map();
  for (const { owners } of automated) perOwner.set(owners, (perOwner.get(owners) ?? 0) + 1);
  const out = [`Automated ${automated.length}: ${[...perOwner].map(([owners, count]) => `${owners} — ${count}`).join(" · ")}`];
  const failed = automated.filter(({ failed: red }) => red);
  if (failed.length) out.push(`Failed when last run: ${failed.map(({ plainId }) => plainId).join(", ")}`);
  const groups = new Map();
  for (const row of rows.filter(({ coverage }) => coverage !== "automated")) {
    const key = `${row.coverage} — ${row.why.replace(/ \(since [^)]+\)$/, "")}`;
    groups.set(key, [...(groups.get(key) ?? []), row.plainId]);
  }
  out.push("", "| Status — why | Cases |", "|--------------|-------|", ...[...groups].map(([why, list]) => `| ${cell(why)} (${list.length}) | ${list.join(", ")} |`));
  return out;
}

/**
 * /coverage as Markdown. `suite`: the saved TMS folder, or undefined; `tms`: the map's TMS name; `plan`: only that
 * plan's cases (a later pass's Already automated).
 */
export function renderCoverage(data, { suite, tms, plan } = {}) {
  const out = [];
  const tmsRows = suite?.cases?.length || Object.keys(data.cases ?? {}).length ? suiteRows(data, suite, plan) : [];
  if (tmsRows.length) {
    const name = suite?.title ? `Suite "${suite.title}"${tms ? ` (${tms})` : ""}` : plan ? `Plan \`${plan}\`` : `Every case of ${data.app ?? "the app"}${tms ? ` (${tms})` : ""}`;
    out.push(`${name} — ${countsLine(tmsRows, data.lastRunAt)}`, "");
    if (tmsRows.length > MANY) out.push(...shortTable(tmsRows));
    else {
      out.push("| Case | Title | Scenarios | Owners | Last run | Status | Why not |", "|------|-------|:---------:|--------|:--------:|--------|---------|");
      for (const row of tmsRows) out.push(`| ${row.id} | ${cell(row.title)} | ${row.scenarios} | ${row.owners} | ${row.lastRun} | ${row.coverage} | ${cell(row.why)} |`);
    }
    out.push("", ...notes(tmsRows, data.unreadableNotNowLines ?? []));
    return `${out.join("\n")}\n`;
  }
  // No TMS: each plan's own scenarios, matched to their tests by title.
  const plans = [...new Set((data.withoutTms ?? []).map((entry) => entry.plan))].filter((each) => !plan || each === plan);
  if (!plans.length) return "No case to show — no TMS case linked by a test or named by a plan, and no plan with ready scenarios.\n";
  for (const plan of plans) {
    const entries = data.withoutTms.filter((entry) => entry.plan === plan);
    const rows = entries.map((entry) => ({ plainId: entry.title, coverage: entry.coverage, failed: entry.lastRun === "failed" || entry.lastRun === "broken", why: entry.coverage === "not automated" ? (entry.reason ? `${capital(entry.status)} — ${entry.reason}` : "planned — not written yet") : (entry.rework ?? []).join(", "), plan }));
    out.push(`Plan \`${plan}\` — ${countsLine(rows, data.lastRunAt)}`, "", "| Scenario | Owner | Last run | Status |", "|----------|-------|:--------:|--------|");
    for (const [index, entry] of entries.entries()) out.push(`| ${cell(entry.title)} | ${entry.owner ?? "—"} | ${entry.tests.length ? mark(entry.lastRun) : "—"} | ${entry.coverage}${rows[index].why ? ` — ${cell(rows[index].why)}` : ""} |`);
    out.push("");
  }
  const all = data.withoutTms.filter((entry) => plans.includes(entry.plan)).map((entry) => ({ plainId: entry.title, coverage: entry.coverage, failed: entry.lastRun === "failed" || entry.lastRun === "broken", why: "", plan: entry.plan }));
  out.push(...notes(all, data.unreadableNotNowLines ?? []).filter((line) => line !== ""));
  return `${out.join("\n")}\n`;
}
