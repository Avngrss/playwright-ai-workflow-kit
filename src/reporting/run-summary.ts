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
  /** A test failed for the stand's cause: "passed on its second pass", "failed again on its second pass" or "no second pass — <why>". */
  secondPass?: string;
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
  const tell = "Next — tell the agent in this test home:";
  if (look.length >= 3) return { next: `${tell} triage the run ${runLink()}`, nextPath: "triage" };
  return { next: `${tell} heal the red tests: ${look.map(({ file, line }) => `${fromHome(home, file)}:${line}`).join(" ")}`, nextPath: "heal" };
}

const cut = (title: string): string => (title.length > 90 ? `${title.slice(0, 89)}…` : title);

/** A line of a group: a test the summary lists, or only its title (a leftover). */
type Listed = Partial<SummaryTest> & { title: string };

const whatOf = ({ cause, step, ticket, secondPass }: Listed): string => {
  if (!cause) return "";
  if (cause === "known bug" || cause === "known bug looks fixed") return ticket ?? "";
  return [step ? `${cause} — step "${step}"` : cause, secondPass].filter(Boolean).join(" — ");
};

const testOf = ({ test, outcome, explained, checkByHand, step, ticket, plan }: RunEntry): SummaryTest => ({
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
});

/** The counts, the plans to refresh and the next line — from the tests the summary lists. */
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
    ...nextStep(look, home),
  };
}

/**
 * The run in a few lines, the first thing to read: how many tests passed, then every one that needs a
 * look under its verdict — possible bugs first — then the known bugs, the unstable tests, those only the
 * stand's slowness failed and any data a test may have left behind; the plans a changed product made
 * stale; last, the one line to give the agent. The same in Markdown (with what to check by hand).
 */
function rendered(data: SummaryData) {
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
    text.push(`${title} (${items.length})`, ...items.map((test) => `  ${cut(test.title)}${what(test) ? ` — ${what(test)}` : ""}`));
    markdown.push("", `## ${title} (${items.length})`);
    for (const test of items) {
      markdown.push(`- **${test.title}**${what(test) ? ` — ${what(test)}` : ""}`);
      if (details && test.checkByHand) markdown.push(`  - Check by hand: ${test.checkByHand}`);
      if (details && test.note) markdown.push(`  - ${test.note}`);
    }
  };
  const failed = data.tests.filter(({ outcome }) => outcome !== "flaky");
  for (const verdict of VERDICTS) group(verdict, failed.filter((test) => test.verdict === verdict), whatOf);
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
  return { ...rendered(data), data };
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
  return { ...rendered(data), data };
}
