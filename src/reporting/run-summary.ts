import fs from "node:fs";
import path from "node:path";
import type { TestCase } from "@playwright/test/reporter";
import { VERDICTS, type Explained, type Verdict } from "./failure-cause";

/** One test of the run as the summary reads it: how it ended and, when it failed, what that means. */
export interface RunEntry {
  test: TestCase;
  outcome: ReturnType<TestCase["outcome"]>;
  explained?: Explained;
  /** What to check by hand, as the report says it. */
  checkByHand?: string;
  step?: string;
  ticket?: string;
  /** The locator an "element not found" failure missed, as Playwright names it. */
  locator?: string;
  /** The feature plan the test implements (product-change.ts `planOf`). */
  plan?: string;
  /** Its registered undo failed — its data may be left on the stand. */
  leftover: boolean;
}

/** One test as reports/run-summary.json keeps it — what the agent and a second pass read back. */
export interface SummaryTest {
  /** Playwright's id of the test — the same in every run. */
  id: string;
  title: string;
  file: string;
  line: number;
  /** The project it ran in ("ui:shop", "firefox:shop") — the second pass runs it there, not in every browser. */
  project?: string;
  plan?: string;
  outcome: RunEntry["outcome"];
  verdict?: string;
  cause?: string;
  step?: string;
  ticket?: string;
  checkByHand?: string;
  note?: string;
  /** "element not found": the locator it missed. */
  locator?: string;
  /** A test failed for the stand's cause: "passed on its second pass", "failed again on its second pass" or "no second pass — <why>". */
  secondPass?: string;
}

/** Tests an "element not found" failure of one locator turned red — one locator to heal, not n bugs. */
export interface SameLocator {
  locator: string;
  /** Each as `<spec>:<line>` from the test home. */
  tests: string[];
}

/** The run as data — reports/run-summary.json. */
export interface SummaryData {
  startedAt: string;
  counts: { total: number; passed: number; needLook: number; knownBugs: number; unstable: number; skipped: number; slow: number };
  /** Every test that failed or passed only on a retry. */
  tests: SummaryTest[];
  /** Failed for the stand alone and passed alone on the second pass (scripts/run-tests.mjs): the stand was slow. */
  slow: SummaryTest[];
  /** The plans of the tests the product changed under — a refresh each: /plan <plan> — <what changed>. */
  stalePlans: string[];
  leftovers: string[];
  /** Locators two or more tests missed ("element not found"), each with its tests. */
  sameLocator: SameLocator[];
  /** The line to give the agent, by the tests that need a look: one or two → "heal the red tests: <spec>:<line> …", more → "triage the run <link>". */
  next?: string;
  /** The same choice as data: none needs a look → null. */
  nextPath: "heal" | "triage" | null;
  /** Written by scripts/run-tests.mjs into its copy of the first pass: the ids it runs again. */
  secondPass?: string[];
}

const PRODUCT_CHANGED: Verdict = "Not a bug — the product changed: refresh the plan";
const SLOW = "Stand was slow — passed alone on a second pass";

// The stand's second pass (scripts/run-tests.mjs, its SLOW_CAUSES — the same two causes): a test failed
// for one of these runs again at the end, alone — never the sign-in smoke. The stand's other causes get
// none, each for its reason.
const RERUN_CAUSES = new Set(["stand unavailable", "out of time"]);
const NOT_RERUN: Record<string, string> = {
  "setting missing": "a rerun has the same settings",
  "stand data": "a rerun finds the same data",
  "sign-in or access": "a sign-in tried again counts toward a lock",
  "server error": "a 5xx is the server's answer: a retest by hand decides",
  cleanup: "its checks ran, only its cleanup failed",
};
const PASSED_AGAIN = "passed on its second pass";

const fromHome = (home: string, file: string): string => path.relative(home, file).split(path.sep).join("/");

/** What the first pass can say of a test the stand failed: no second pass and why — or, run by the runner, none yet (its second pass rewrites it). */
function firstPassWord(test: SummaryTest, home: string, runner: boolean): string | undefined {
  if (test.outcome !== "unexpected" || !test.cause) return undefined;
  if (NOT_RERUN[test.cause]) return `no second pass — ${NOT_RERUN[test.cause]}`;
  if (!RERUN_CAUSES.has(test.cause)) return undefined;
  if (fromHome(home, test.file).startsWith("tests/smoke/")) return "no second pass — the sign-in smoke never runs again: a dead stand stops the run";
  return runner ? "no second pass — the run stopped before it" : "no second pass — run without npm run (scripts/run-tests.mjs gives one)";
}

/** Where this run can be found again: the CI job's page, or — on a machine — this test home's last run. */
function runLink(): string {
  const env = process.env;
  if (env.CI_JOB_URL) return env.CI_JOB_URL;
  if (env.GITHUB_RUN_ID && env.GITHUB_REPOSITORY) return `${env.GITHUB_SERVER_URL ?? "https://github.com"}/${env.GITHUB_REPOSITORY}/actions/runs/${env.GITHUB_RUN_ID}`;
  return "reports/run-summary.json";
}

/**
 * The one thing to do after a run that needs a look, by how many tests need it: one or two → heal them
 * by name (/heal <spec>:<line> …); three or more → triage the run, every failure by its verdict first.
 */
function nextStep(look: SummaryTest[], home: string): Pick<SummaryData, "next" | "nextPath"> {
  if (!look.length) return { next: undefined, nextPath: null };
  // A setting the run lacks comes first: no test needs fixing until it is set.
  if (look.some(({ cause }) => cause === "setting missing")) {
    return { next: "Next — set what the failures name as empty (.env on a machine, the CI's variables in CI), then run again: no test needs fixing", nextPath: null };
  }
  const tell = "Next — tell the agent in this test home:";
  if (look.length >= 3) return { next: `${tell} triage the run ${runLink()}`, nextPath: "triage" };
  return { next: `${tell} heal the red tests: ${look.map(({ file, line }) => `${fromHome(home, file)}:${line}`).join(" ")}`, nextPath: "heal" };
}

const cut = (title: string): string => (title.length > 90 ? `${title.slice(0, 89)}…` : title);

/** A line of a group: a test the summary lists, only its title (a leftover), or the tests that missed one locator (`members`). */
type Listed = Partial<SummaryTest> & { title: string; members?: SummaryTest[] };

const whatOf = ({ cause, step, ticket, secondPass, members }: Listed): string => {
  if (!cause) return "";
  if (cause === "known bug" || cause === "known bug looks fixed") return ticket ?? "";
  if (members) return cause;
  return [step ? `${cause} — step "${step}"` : cause, secondPass].filter(Boolean).join(" — ");
};

const NOT_FOUND = "element not found";

/** The "element not found" failures by the locator they missed, in the order first met. */
function byLocator(tests: SummaryTest[]): Map<string, SummaryTest[]> {
  const missed = new Map<string, SummaryTest[]>();
  for (const test of tests) if (test.cause === NOT_FOUND && test.locator) missed.set(test.locator, [...(missed.get(test.locator) ?? []), test]);
  return missed;
}

/** The locators two or more of these tests missed, each with its tests. */
function sameLocatorOf(tests: SummaryTest[], home: string): SameLocator[] {
  return [...byLocator(tests)]
    .filter(([, missed]) => missed.length > 1)
    .map(([locator, missed]) => ({ locator, tests: missed.map(({ file, line }) => `${fromHome(home, file)}:${line}`) }));
}

/** A verdict's tests as its lines: the tests that missed one locator as one line naming it, the others one each. */
function joinedByLocator(tests: SummaryTest[]): Listed[] {
  const missedBy = byLocator(tests);
  const listed: Listed[] = [];
  for (const test of tests) {
    const missed = test.locator ? (missedBy.get(test.locator) ?? []) : [];
    if (missed.length < 2) listed.push(test);
    else if (missed[0] === test) {
      listed.push({ title: `${missed.length} tests miss the same locator ${test.locator}`, cause: NOT_FOUND, verdict: test.verdict, checkByHand: test.checkByHand, members: missed });
    }
  }
  return listed;
}

const testOf = ({ test, outcome, explained, checkByHand, step, ticket, plan, locator }: RunEntry): SummaryTest => ({
  id: test.id,
  title: test.title,
  file: test.location.file,
  line: test.location.line,
  project: test.parent.project()?.name,
  plan,
  outcome,
  verdict: explained?.verdict,
  cause: explained?.cause,
  step,
  ticket,
  checkByHand,
  note: explained?.note,
  locator: explained?.cause === NOT_FOUND ? locator : undefined,
});

/** The counts, the plans to refresh, the locators several tests missed and the next line — from the tests the summary lists. */
function completed(data: Pick<SummaryData, "startedAt" | "tests" | "slow" | "leftovers">, total: number, skipped: number, home: string): SummaryData {
  const failed = data.tests.filter(({ outcome }) => outcome !== "flaky");
  const knownBugs = failed.filter(({ cause }) => cause === "known bug").length;
  const needLook = failed.length - knownBugs;
  const unstable = data.tests.length - failed.length;
  const passed = total - failed.length - unstable - skipped - data.slow.length;
  const stalePlans = [...new Set(failed.flatMap(({ verdict, plan }) => (verdict === PRODUCT_CHANGED && plan ? [plan] : [])))];
  const look = data.tests.filter(({ outcome, cause }) => outcome === "flaky" || cause !== "known bug");
  return {
    ...data,
    counts: { total, passed, needLook, knownBugs, unstable, skipped, slow: data.slow.length },
    stalePlans,
    sameLocator: sameLocatorOf(failed, home),
    ...nextStep(look, home),
  };
}

/**
 * The run in a few lines, the first thing to read: how many tests passed, then every one that needs a
 * look under its verdict — possible bugs first — then the known bugs, the unstable tests, those only the
 * stand's slowness failed and any data a test may have left behind; the plans a changed product made
 * stale; last, the one line to give the agent. The same in Markdown (with what to check by hand).
 */
function rendered(data: SummaryData, home: string) {
  const { counts } = data;
  const when = new Date(data.startedAt).toLocaleString("en-GB", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  const line = [
    `${counts.passed} passed`,
    counts.slow && `${counts.slow} passed alone — the stand was slow`,
    counts.needLook && `${counts.needLook} need a look`,
    counts.knownBugs && `${counts.knownBugs} known bug${counts.knownBugs > 1 ? "s" : ""}`,
    counts.unstable && `${counts.unstable} unstable`,
    counts.skipped && `${counts.skipped} skipped`,
  ]
    .filter(Boolean)
    .join(" · ");
  const text = [`Run ${when} — ${counts.total} tests: ${line}`];
  const markdown = [`# Run ${when}`, "", `${counts.total} tests: ${line}`];

  const group = (title: string, items: Listed[], what: (test: Listed) => string, details = true) => {
    if (!items.length) return;
    // A line for the tests that missed one locator counts each of them.
    const count = items.reduce((sum, item) => sum + (item.members?.length ?? 1), 0);
    text.push(`${title} (${count})`);
    markdown.push("", `## ${title} (${count})`);
    for (const test of items) {
      text.push(`  ${cut(test.title)}${what(test) ? ` — ${what(test)}` : ""}`);
      markdown.push(`- **${test.title}**${what(test) ? ` — ${what(test)}` : ""}`);
      for (const member of test.members ?? []) {
        const where = `${fromHome(home, member.file)}:${member.line}`;
        text.push(`    ${cut(member.title)}${member.step ? ` — step "${member.step}"` : ""} (${where})`);
        markdown.push(`  - ${member.title}${member.step ? ` — step "${member.step}"` : ""} (\`${where}\`)`);
      }
      if (details && test.checkByHand) markdown.push(`  - Check by hand: ${test.checkByHand}`);
      if (details && test.note) markdown.push(`  - ${test.note}`);
    }
  };
  const failed = data.tests.filter(({ outcome }) => outcome !== "flaky");
  for (const verdict of VERDICTS) group(verdict, joinedByLocator(failed.filter((test) => test.verdict === verdict)), whatOf);
  group("Unstable — passed on a retry", data.tests.filter(({ outcome }) => outcome === "flaky"), (test) => (test.cause ? `first try: ${whatOf(test)}` : ""));
  group(SLOW, data.slow, (test) => `first pass: ${whatOf(test)}`, false);
  group("Cleanup failed — data may be left on the stand (npm run data:sweep)", data.leftovers.map((title) => ({ title })), () => "");
  if (data.stalePlans.length) {
    text.push(`Plans to refresh: ${data.stalePlans.join(", ")}`);
    markdown.push("", `Plans to refresh: ${data.stalePlans.map((plan) => `\`${plan}\``).join(", ")}`);
  }
  if (counts.needLook || counts.knownBugs || counts.unstable) text.push("Details and what to check by hand: npm run allure:open · reports/run-summary.md");
  if (data.next) {
    text.push(data.next);
    markdown.push("", `**${data.next}**`);
  }
  return { text: ["", ...text].join("\n"), markdown: markdown.join("\n") + "\n" };
}

/**
 * The run's summary, from the reporter's entries: text for the terminal, Markdown and data for reports/.
 * `home` — the test home (paths in the next line); `runner` — run by scripts/run-tests.mjs, whose second
 * pass follows for the stand's failures.
 */
export function runSummary(entries: RunEntry[], startedAt: Date, { home, runner }: { home: string; runner: boolean }) {
  const data = completed(
    {
      startedAt: startedAt.toISOString(),
      tests: entries
        .filter(({ explained, outcome }) => explained || outcome === "flaky")
        .map(testOf)
        .map((test) => ({ ...test, secondPass: firstPassWord(test, home, runner) })),
      slow: [],
      leftovers: entries.filter(({ leftover }) => leftover).map(({ test }) => test.title),
    },
    entries.length,
    entries.filter(({ outcome }) => outcome === "skipped").length,
    home,
  );
  return { ...rendered(data, home), data };
}

/**
 * The run after its second pass (scripts/run-tests.mjs): the tests the first pass failed for the stand
 * alone, run again with one worker — passed now, they move to "the stand was slow" and the run is not
 * red for them; failed again, they keep the first pass's failure. Each says which (`secondPass`), with
 * the second pass's cause when it differs.
 */
export function afterSecondPass(first: SummaryData, again: RunEntry[], home: string) {
  const ranAgain = new Map(again.map((entry) => [entry.test.id, entry]));
  const rerun = new Set(first.secondPass ?? []);
  const word = (test: SummaryTest): SummaryTest => {
    if (test.outcome !== "unexpected" || !rerun.has(test.id)) return test;
    const entry = ranAgain.get(test.id);
    if (!entry || entry.outcome === "skipped") return { ...test, secondPass: "no second pass — the second pass did not run it (playwright-report/second-pass)" };
    if (entry.outcome === "expected" && !entry.explained) return { ...test, secondPass: PASSED_AGAIN };
    const cause = entry.explained?.cause;
    return { ...test, secondPass: `failed again on its second pass${cause && cause !== test.cause ? ` — ${cause}` : ""}` };
  };
  const tests = first.tests.map(word);
  const slow = tests.filter(({ secondPass }) => secondPass === PASSED_AGAIN);
  const data = completed(
    {
      startedAt: first.startedAt,
      tests: tests.filter((test) => !slow.includes(test)),
      slow: [...first.slow, ...slow],
      leftovers: [...new Set([...first.leftovers, ...again.filter(({ leftover }) => leftover).map(({ test }) => test.title)])],
    },
    first.counts.total,
    first.counts.skipped,
    home,
  );
  return { ...rendered(data, home), data };
}

/** A test's last result as reports/last-results.json keeps it. */
export interface LastResult {
  app?: string;
  /** From the test home, with forward slashes. */
  file: string;
  title: string;
  project?: string;
  /** As the report shows it: a known bug is grey (skipped). */
  status: "passed" | "failed" | "skipped";
  at: string;
}

export const LAST_RESULTS = path.join("reports", "last-results.json");

/** How the report shows a test of this run; undefined for one Playwright did not run (skipped, no reason given). */
function shownStatus({ test, outcome, explained }: RunEntry): LastResult["status"] | undefined {
  if (outcome === "skipped") {
    const reasons = [...test.annotations, ...(test.results.at(-1)?.annotations ?? [])].filter(({ type }) => type === "skip" || type === "fixme");
    return reasons.length ? "skipped" : undefined;
  }
  if (explained) return explained.cause === "known bug" ? "skipped" : "failed";
  return outcome === "unexpected" ? "failed" : "passed";
}

/**
 * reports/last-results.json — each test's last result, merged by every run: a test this run holds gets
 * its result now, the others keep theirs, so one app's run never blanks another's (suite:coverage reads
 * it). A test Playwright did not run keeps its earlier result; a test whose spec is gone leaves. A run
 * with a spoiled line (verify's can-fail, AQA_SPOILED_RUN) says nothing of the tests as written: none.
 */
export function keepLastResults(entries: RunEntry[], home: string, startedAt: Date): void {
  if (process.env.AQA_SPOILED_RUN) return;
  const file = path.join(home, LAST_RESULTS);
  let kept: LastResult[] = [];
  try {
    kept = (JSON.parse(fs.readFileSync(file, "utf8")) as { tests?: LastResult[] }).tests ?? [];
  } catch {
    // None yet, or unreadable: this run starts it.
  }
  const key = ({ file: spec, title, project }: LastResult) => `${spec}|${title}|${project ?? ""}`;
  const results = new Map(kept.map((result) => [key(result), result]));
  for (const entry of entries) {
    const status = shownStatus(entry);
    if (!status) continue;
    const platform = (entry.test.parent.project()?.metadata as { platform?: string } | undefined)?.platform;
    const result: LastResult = { app: platform, file: fromHome(home, entry.test.location.file), title: entry.test.title, project: entry.test.parent.project()?.name, status, at: startedAt.toISOString() };
    results.set(key(result), result);
  }
  const tests = [...results.values()].filter((result) => fs.existsSync(path.join(home, result.file))).sort((a, b) => key(a).localeCompare(key(b)));
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify({ tests }, null, 2));
}
