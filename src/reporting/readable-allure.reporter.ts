import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import AllureReporter from "allure-playwright";
import type { FullConfig, Suite, TestCase, TestError, TestResult, TestStep } from "@playwright/test/reporter";
import { safeLogger } from "../logging/safe-logger.helper";
import type { KnownBug } from "../setup/known-bugs";
import { explainFailure, type Explained } from "./failure-cause";
import { headline, maskSecrets, readableMessage, readableTrace } from "./readable-error";
import { reportLabels } from "./report-tree";
import { runSummary, type RunEntry } from "./run-summary";

/** What the test's run left about its failure (pages.fixture.ts) and what the test says about itself. */
interface Context {
  pageAtFailure?: string;
  background?: string;
  newTab?: string;
  sessionEnded?: string;
  appMessages?: string;
  step?: string;
  caseId?: string;
  knownBug?: KnownBug;
  passed: boolean;
  unproven: boolean;
}

const fileKey = (file: string): string => (process.platform === "win32" ? path.resolve(file).toLowerCase() : path.resolve(file));
let uncommitted: Set<string> | undefined;

/**
 * Files not committed yet — new or changed. A spec among them has not been green on the stand as it is
 * now (failure-cause.ts reads its failure that way). Read from git once, at the first failure; no git or
 * no commit yet → none, and every failure reads as usual.
 */
function uncommittedFiles(): Set<string> {
  if (uncommitted) return uncommitted;
  uncommitted = new Set();
  try {
    const git = (...args: string[]) => execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).split("\n").filter(Boolean);
    const [root] = git("rev-parse", "--show-toplevel");
    for (const file of [...git("diff", "--name-only", "HEAD"), ...git("ls-files", "--others", "--exclude-standard", "--full-name")]) {
      uncommitted.add(fileKey(path.join(root, file)));
    }
  } catch {
    // Not a git checkout (an archive, an image without git): nothing is marked new.
  }
  return uncommitted;
}

const listed = (title: string, lines: string): string => `${title}:\n${lines.split("\n").slice(0, 5).map((line) => `- ${line}`).join("\n")}`;

/**
 * The failure as a reader needs it: its verdict first (is it a bug, who acts) and its cause, then what
 * failed — the cleaned message, the page, what went wrong in the background — and what to check by
 * hand last (failure-cause.ts).
 */
function readable(error: TestError, context: Context): { error: TestError; explained: Explained; checkByHand: string } {
  const stack = readableTrace(error.stack, error.snippet);
  // A stand-data failure (expectStandData) says itself what to check by hand.
  const [details, ownCheck] = readableMessage(error.message ?? error.value ?? "").split(/\nCheck by hand:\s*/);
  const bug = context.knownBug;
  const explained = explainFailure({
    message: details,
    passed: context.passed,
    knownBug: bug && { ticket: bug.ticket, step: bug.step },
    step: context.step,
    caseId: context.caseId,
    page: context.pageAtFailure,
    ownFrame: stack?.split("\n").find((line) => line.startsWith("at ")),
    background: context.background,
    sessionEnded: !!context.sessionEnded,
    unproven: context.unproven,
  });
  const checkByHand = explained.cause === "stand data" && ownCheck ? ownCheck : explained.checkByHand;
  const cause = explained.cause.startsWith("known bug") && bug ? `${explained.cause} ${bug.ticket}` : explained.cause;

  const parts = [`${explained.verdict}\nCause: ${cause}`];
  if (explained.note) parts.push(explained.note);
  parts.push(details);
  if (context.pageAtFailure) parts.push(`Page: ${maskSecrets(context.pageAtFailure)}`);
  if (context.appMessages) parts.push(listed("Messages the app showed during the test", context.appMessages));
  if (context.newTab) parts.push(context.newTab);
  if (context.sessionEnded) parts.push(context.sessionEnded);
  if (context.background) parts.push(listed("Background errors during the test", context.background));
  parts.push(`Check by hand: ${checkByHand}`);
  return { error: { ...error, message: parts.join("\n\n"), stack }, explained, checkByHand };
}

/** The innermost test step that failed, as titled. */
function failedStep(steps: TestStep[]): string | undefined {
  const failed = [...steps].reverse().find((step) => step.error);
  if (!failed) return undefined;
  return failedStep(failed.steps) ?? (failed.category === "test.step" ? failed.title : undefined);
}

// Annotations this suite turns into report data itself (severity → a label, see report-tree.ts;
// page-at-failure, app-messages, new-tab and background-errors → the error text, the last three also
// attachments; known-bug and fail → the verdict and a link). allure-playwright would show each as a
// "type: value" step.
const OWN_ANNOTATIONS = new Set(["severity", "page-at-failure", "app-messages", "new-tab", "session-ended", "background-errors", "known-bug", "fail"]);
// Labels allure-playwright adds to every test; they describe the tooling and the machine, not the product.
const TOOLING_LABELS = new Set(["language", "framework", "package", "titlePath", "host", "thread"]);

type AllureStep = { name: string; status?: string; steps?: AllureStep[]; attachments?: unknown[] };

// allure-playwright puts what runs in fixtures and hooks under a "Before Hooks" / "After Hooks" step —
// tooling words around the test's own steps. The reader gets those steps in their place instead: the
// fixtures' `Setup: …` first, `Cleanup: …` last; the wrapper's attachments go to the test. A wrapper
// that failed with no step of its own showing it stays, named in the suite's words.
const HOOK_WRAPPERS: Record<string, string> = { "Before Hooks": "Setup", "After Hooks": "Cleanup" };

function withoutHookWrappers(steps: AllureStep[], attachments: unknown[]): AllureStep[] {
  return steps.flatMap((step) => {
    const plain = HOOK_WRAPPERS[step.name];
    if (!plain) return [step];
    const inner = step.steps ?? [];
    const shownInside = inner.some((child) => child.status && child.status !== "passed");
    if (step.status && step.status !== "passed" && !shownInside) return [{ ...step, name: plain }];
    attachments.push(...(step.attachments ?? []));
    return inner;
  });
}

type AllureResult = {
  status?: string;
  labels: Array<{ name: string; value: string }>;
  links?: Array<{ url: string; name?: string; type?: string }>;
  steps?: AllureStep[];
  attachments?: unknown[];
  statusDetails?: Record<string, unknown>;
};
// allure-playwright keeps its runtime private and adds the last labels right before writing a
// result, so the filter wraps the write. A missing field (another version) just leaves them in.
type AllureRuntime = { updateTest(uuid: string, update: (result: AllureResult) => void): void; writeTest(uuid: string): void };
type AllureInternals = { allureRuntime?: AllureRuntime; allureResultsUuids?: Map<string, string> };

/** How a result shows in the report: three colours — passed, failed, known bug (grey) — and its cause. */
interface Shown {
  status?: "failed" | "skipped";
  cause?: string;
  flaky?: boolean;
  link?: { url: string; name: string };
}

/**
 * allure-playwright with a readable report: a failure opens with its verdict and cause and ends with
 * what to check by hand; only three colours (a failure is red whatever broke, a known bug still failing
 * on its step is grey); the failed step shows only its first line; neither the suite's own annotations,
 * tooling labels nor "Before/After Hooks" wrappers appear; every test gets its place in the tree and its
 * severity (report-tree.ts) — also one that failed before its body ran. The run ends with its summary
 * (run-summary.ts) in the terminal and in reports/run-summary.md|json. Other reporters (list,
 * Playwright HTML, trace) keep the full raw data for debugging.
 */
export default class ReadableAllureReporter extends AllureReporter {
  private readonly startedAt = new Date();
  private readonly treeLabels = new Map<string, Array<{ name: string; value: string }>>();
  private readonly shown = new Map<string, Shown>();
  private readonly tests = new Map<string, TestCase>();
  /** Each test's last failure, explained — a passing retry keeps the first try's. */
  private readonly failures = new Map<string, Omit<RunEntry, "test" | "outcome" | "leftover">>();
  /** Tests whose registered undo failed (the cleanup fixture) — their data may be left on the stand. */
  private readonly leftovers = new Set<string>();
  /** The test home — where its config lives, whatever folder the run was started from. */
  private home = process.cwd();

  onConfigure(config: FullConfig): void {
    super.onConfigure(config);
    if (config.configFile) this.home = path.dirname(config.configFile);
  }

  onBegin(suite: Suite): void {
    super.onBegin(suite);
    const runtime = (this as unknown as AllureInternals).allureRuntime;
    if (!runtime?.writeTest) return;
    const write = runtime.writeTest.bind(runtime);
    runtime.writeTest = (uuid) => {
      const own = this.treeLabels.get(uuid) ?? [];
      const shown = this.shown.get(uuid) ?? {};
      this.treeLabels.delete(uuid);
      this.shown.delete(uuid);
      runtime.updateTest(uuid, (result) => {
        // Own labels replace allure-playwright's of the same name; tags are added to the test's own.
        const replaced = new Set(own.map((label) => label.name).filter((name) => name !== "tag"));
        result.labels = [...result.labels.filter((label) => !TOOLING_LABELS.has(label.name) && !replaced.has(label.name)), ...own];
        if (shown.cause) result.labels.push({ name: "cause", value: shown.cause });
        if (shown.status) result.status = shown.status;
        if (shown.flaky) result.statusDetails = { ...result.statusDetails, flaky: true };
        if (shown.link) result.links = [...(result.links ?? []), { ...shown.link, type: "issue" }];
        if (result.steps) {
          result.attachments ??= [];
          result.steps = withoutHookWrappers(result.steps, result.attachments);
        }
      });
      write(uuid);
    };
  }

  onTestBegin(test: TestCase): void {
    const all = [...test.annotations];
    test.annotations.splice(0, all.length, ...all.filter((annotation) => !OWN_ANNOTATIONS.has(annotation.type)));
    try {
      super.onTestBegin(test);
    } finally {
      test.annotations.splice(0, test.annotations.length, ...all);
    }
  }

  onStepEnd(test: TestCase, result: TestResult, step: TestStep): void {
    const raw = step.error;
    // The step object is the reporter's map key, so it is patched for this call only, not copied.
    if (raw) step.error = { ...raw, message: headline(raw.message ?? ""), stack: undefined };
    try {
      super.onStepEnd(test, result, step);
    } finally {
      step.error = raw;
    }
  }

  async onTestEnd(test: TestCase, result: TestResult): Promise<void> {
    this.tests.set(test.id, test);
    const note = (type: string) => result.annotations.find((annotation) => annotation.type === type)?.description;
    const knownBug: KnownBug | undefined = note("known-bug") ? JSON.parse(note("known-bug") as string) : undefined;
    const passed = result.status === "passed";
    // A test timeout comes as two errors — "ran out of time" and the action it was stuck on; Allure
    // shows only the first, so the second is folded into it. A known bug that passes brings no error.
    const [first, ...rest] = result.errors;
    const error: TestError | undefined =
      knownBug && passed
        ? { message: `The test passed, though ${knownBug.ticket} made it fail at step "${knownBug.step}".` }
        : first && rest.length
          ? { ...first, message: [first, ...rest].map((each) => readableMessage(each.message ?? "")).join("\n\n") }
          : first;
    const context: Context = {
      pageAtFailure: note("page-at-failure"),
      background: note("background-errors"),
      newTab: note("new-tab"),
      sessionEnded: note("session-ended"),
      appMessages: note("app-messages"),
      step: failedStep(result.steps),
      caseId: /^([A-Z][A-Z0-9]*-\d+) · /.exec(test.title)?.[1],
      knownBug,
      passed,
      unproven: Boolean(error && !passed) && uncommittedFiles().has(fileKey(test.location.file)),
    };
    const failure = error && (!passed || knownBug) ? readable(error, context) : undefined;
    if (failure) {
      const { explained, checkByHand } = failure;
      this.failures.set(test.id, { explained, checkByHand, step: context.step, ticket: knownBug?.ticket });
    }
    if (note("cleanup-failed")) this.leftovers.add(test.id);

    const uuid = (this as unknown as AllureInternals).allureResultsUuids?.get(test.id);
    const platform = (test.parent.project()?.metadata as { platform?: string } | undefined)?.platform;
    if (uuid) {
      this.treeLabels.set(uuid, reportLabels(test.location.file, test.annotations, test.tags, platform));
      this.shown.set(uuid, {
        status: failure ? (failure.explained.cause === "known bug" ? "skipped" : "failed") : undefined,
        cause: failure?.explained.cause,
        flaky: passed && result.retry > 0 && !knownBug,
        link: knownBug?.url ? { url: knownBug.url, name: knownBug.ticket } : undefined,
      });
    }
    const errors = failure ? [failure.error] : [];
    await super.onTestEnd(test, { ...result, errors, error: errors[0] });
  }

  async onEnd(): Promise<void> {
    await super.onEnd();
    const entries: RunEntry[] = [...this.tests.values()].map((test) => ({
      test,
      outcome: test.outcome(),
      leftover: this.leftovers.has(test.id),
      ...(this.failures.get(test.id) ?? {}),
    }));
    const summary = runSummary(entries, this.startedAt);
    const reports = path.join(this.home, "reports");
    fs.mkdirSync(reports, { recursive: true });
    fs.writeFileSync(path.join(reports, "run-summary.md"), maskSecrets(summary.markdown));
    fs.writeFileSync(path.join(reports, "run-summary.json"), maskSecrets(JSON.stringify(summary.data, null, 2)));
    if (entries.some((entry) => entry.explained || entry.leftover || entry.outcome === "flaky")) safeLogger.info(summary.text);

    // A test marked with a known bug counts its failure as expected — when something else failed it,
    // the run still fails: Playwright lets a reporter's onEnd set the run's status.
    const failedOtherwise = entries.some(({ outcome, explained }) => outcome === "expected" && explained && explained.cause !== "known bug");
    if (failedOtherwise) return { status: "failed" } as unknown as void;
  }
}
