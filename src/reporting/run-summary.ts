import type { TestCase } from "@playwright/test/reporter";
import { VERDICTS, type Explained } from "./failure-cause";

/** One test of the run as the summary reads it: how it ended and, when it failed, what that means. */
export interface RunEntry {
  test: TestCase;
  outcome: ReturnType<TestCase["outcome"]>;
  explained?: Explained;
  /** What to check by hand, as the report says it. */
  checkByHand?: string;
  step?: string;
  ticket?: string;
  /** Its registered undo failed — its data may be left on the stand. */
  leftover: boolean;
}

const titleOf = (test: TestCase): string => (test.title.length > 90 ? `${test.title.slice(0, 89)}…` : test.title);

const whatOf = ({ explained, step, ticket }: RunEntry): string => {
  if (!explained) return "";
  if (explained.cause === "known bug" || explained.cause === "known bug looks fixed") return ticket ?? "";
  return step ? `${explained.cause} — step "${step}"` : explained.cause;
};

/**
 * The run in a few lines, the first thing to read: how many tests passed, then every one that needs a
 * look under its verdict — possible bugs first — then the known bugs, the unstable tests and any data a
 * test may have left behind. The same in Markdown (with what to check by hand) and as data for the agent.
 */
export function runSummary(entries: RunEntry[], startedAt: Date) {
  const unstable = entries.filter(({ outcome }) => outcome === "flaky");
  const explained = entries.filter(({ explained, outcome }) => explained && outcome !== "flaky");
  const knownBugs = explained.filter(({ explained }) => explained?.cause === "known bug");
  const needLook = explained.filter(({ explained }) => explained?.cause !== "known bug");
  const skipped = entries.filter(({ outcome }) => outcome === "skipped");
  const passed = entries.length - explained.length - unstable.length - skipped.length;
  const leftovers = entries.filter(({ leftover }) => leftover);

  const when = startedAt.toLocaleString("en-GB", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  const counts = [
    `${passed} passed`,
    needLook.length && `${needLook.length} need a look`,
    knownBugs.length && `${knownBugs.length} known bug${knownBugs.length > 1 ? "s" : ""}`,
    unstable.length && `${unstable.length} unstable`,
    skipped.length && `${skipped.length} skipped`,
  ].filter(Boolean);
  const text = [`Run ${when} — ${entries.length} tests: ${counts.join(" · ")}`];
  const markdown = [`# Run ${when}`, "", `${entries.length} tests: ${counts.join(" · ")}`];

  const group = (title: string, items: RunEntry[], what: (entry: RunEntry) => string) => {
    if (!items.length) return;
    text.push(`${title} (${items.length})`, ...items.map((entry) => `  ${titleOf(entry.test)}${what(entry) ? ` — ${what(entry)}` : ""}`));
    markdown.push("", `## ${title} (${items.length})`);
    for (const entry of items) {
      markdown.push(`- **${entry.test.title}**${what(entry) ? ` — ${what(entry)}` : ""}`);
      if (entry.checkByHand) markdown.push(`  - Check by hand: ${entry.checkByHand}`);
      if (entry.explained?.note) markdown.push(`  - ${entry.explained.note}`);
    }
  };
  for (const verdict of VERDICTS) group(verdict, explained.filter(({ explained }) => explained?.verdict === verdict), whatOf);
  group("Unstable — passed on a retry", unstable, (entry) => (entry.explained ? `first try: ${whatOf(entry)}` : ""));
  group("Cleanup failed — data may be left on the stand (npm run data:sweep)", leftovers, () => "");
  if (needLook.length || knownBugs.length || unstable.length) text.push("Details and what to check by hand: npm run allure:open · reports/run-summary.md");

  const data = {
    startedAt: startedAt.toISOString(),
    counts: { total: entries.length, passed, needLook: needLook.length, knownBugs: knownBugs.length, unstable: unstable.length, skipped: skipped.length },
    tests: [...explained, ...unstable].map(({ test, outcome, explained, checkByHand, step, ticket }) => ({
      title: test.title,
      file: test.location.file,
      outcome,
      verdict: explained?.verdict,
      cause: explained?.cause,
      step,
      ticket,
      checkByHand,
      note: explained?.note,
    })),
    leftovers: leftovers.map(({ test }) => test.title),
  };
  return { text: ["", ...text].join("\n"), markdown: markdown.join("\n") + "\n", data };
}
