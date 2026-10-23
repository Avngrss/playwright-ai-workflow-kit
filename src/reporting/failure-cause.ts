/**
 * Every failure gets a verdict (is it a bug, and who acts), its likely cause and what to check by hand,
 * read from where and how it failed. The verdict is a hint for the first look, never the answer:
 * whether it is a bug is decided by a retest by hand. The same words reach the report (its first
 * line and its Categories tab, report-categories.mjs) and the run's summary.
 */

export type Cause =
  | "known bug looks fixed"
  | "known bug"
  | "stand data"
  | "sign-in or access"
  | "stand unavailable"
  | "server error"
  | "cleanup"
  | "test code"
  | "screenshot without a baseline"
  | "screenshot differs"
  | "out of time"
  | "element not found"
  | "check did not match";

/** The verdicts, in the order the report and the summary list them — who acts first. */
export const VERDICTS = [
  "Known bug looks fixed — retest the ticket",
  "Possible bug — retest by hand",
  "Not a bug — the stand or its data",
  "Not a bug — the test needs fixing",
  "Known bug — waiting for the fix",
] as const;
export type Verdict = (typeof VERDICTS)[number];

const VERDICT_OF: Record<Cause, Verdict> = {
  "known bug looks fixed": "Known bug looks fixed — retest the ticket",
  "check did not match": "Possible bug — retest by hand",
  "element not found": "Possible bug — retest by hand",
  "server error": "Possible bug — retest by hand",
  "stand data": "Not a bug — the stand or its data",
  "stand unavailable": "Not a bug — the stand or its data",
  "sign-in or access": "Not a bug — the stand or its data",
  "out of time": "Not a bug — the stand or its data",
  cleanup: "Not a bug — the stand or its data",
  "test code": "Not a bug — the test needs fixing",
  "screenshot without a baseline": "Not a bug — the test needs fixing",
  "screenshot differs": "Possible bug — retest by hand",
  "known bug": "Known bug — waiting for the fix",
};

/** A known bug a test is marked with (specs/known-bugs.md): its ticket and the step it fails at. */
export interface KnownBugMark {
  ticket: string;
  step: string;
}

/** What the reporter knows about one failure. */
export interface FailureFacts {
  /** The readable message (readable-error.ts). */
  message: string;
  /** The test passed — it can fail the run only as a known bug that no longer fails. */
  passed: boolean;
  knownBug?: KnownBugMark;
  /** The innermost step that failed, as titled. */
  step?: string;
  /** The manual case the test automates: "TC-101" from "TC-101 · …". */
  caseId?: string;
  page?: string;
  /** The first line of the test's own code in the stack. */
  ownFrame?: string;
  background?: string;
  sessionEnded: boolean;
  /** The test's spec is not committed yet (new or changed): it has not been green on the stand as it is now. */
  unproven?: boolean;
}

export interface Explained {
  verdict: Verdict;
  cause: Cause;
  checkByHand: string;
  /** A line a reader needs besides the cause — a known bug that is not what failed this time. */
  note?: string;
}

interface Rule {
  cause: Cause;
  matches: (facts: FailureFacts) => boolean;
  checkByHand: (facts: FailureFacts) => string;
}

const lineOf = (message: string, label: string): string | undefined =>
  message.split("\n").find((line) => line.startsWith(`${label}:`));

function stepOf({ step, caseId }: FailureFacts): string {
  if (!step) return "the test's last step";
  return caseId ? `step "${step}" of ${caseId}` : `step "${step}"`;
}

function whereTo({ page, message }: FailureFacts): string {
  const request = lineOf(message, "Request")?.replace(/^Request:\s*/, "");
  const opened = page && page !== "about:blank" ? page : undefined;
  return opened ?? request ?? "the app";
}

const RULES: Rule[] = [
  {
    cause: "stand data",
    // The helper's words, or the older "(stand data, see the plan)" — never a check that only names its data.
    matches: ({ message }) => /^Stand data:|stand data, see the plan/m.test(message),
    checkByHand: () =>
      "Find on the stand what the message names (the plan's Data line says where it comes from). Gone or changed → restore it or change the lookup; still there → the lookup is wrong.",
  },
  {
    cause: "sign-in or access",
    matches: ({ message, sessionEnded }) =>
      sessionEnded ||
      // The browser's sign-in, the API's own (a login request, a token endpoint), a paused account, a map line to fix.
      /did not get signed in|was not signed in by|got no token from the token endpoint|not tried again — repeated wrong passwords|left the sign-in form|did not accept the session|Login step .* found nothing|has no rights for it|answered 40[13] /.test(message),
    checkByHand: () =>
      "Sign in once by hand as this test's account in a fresh browser — never retry a failing password: each wrong one counts toward a lock. Signed in but refused (403) → compare the account's rights with the case's role.",
  },
  {
    cause: "stand unavailable",
    matches: ({ message }) =>
      /Could not reach|No answer within|The page did not open|net::ERR_|answered 50[234] |waiting for event "(response|request)"/.test(message),
    checkByHand: (facts) =>
      `Open ${whereTo(facts)} in a browser. It does not load → the stand is down or deploying: rerun later. It loads → rerun the test; failing again only here points at the test's wait.`,
  },
  {
    cause: "server error",
    matches: ({ message, background }) => /answered 5\d\d /.test(message) || /^Server 5\d\d/m.test(background ?? ""),
    checkByHand: (facts) =>
      `Repeat ${stepOf(facts)} by hand and watch for an error. A server error (5xx) on a valid request is a bug — give the developers the request and the time of the run for the server log.`,
  },
  {
    cause: "cleanup",
    matches: ({ step }) => /^Cleanup\b/.test(step ?? ""),
    checkByHand: () =>
      "The test's own data may be left on the stand: npm run data:sweep removes AQA leftovers, or remove it by hand. Then look at why the removal failed.",
  },
  {
    cause: "test code",
    matches: ({ message }) =>
      /^(TypeError|ReferenceError|RangeError|SyntaxError)\b|Cannot read propert(y|ies) of (undefined|null)|is not a function|is not defined/m.test(message),
    checkByHand: ({ ownFrame }) =>
      `Nothing in the app: the test's own code failed${ownFrame ? ` (${ownFrame})` : ""}. Often a lookup came back empty without saying so — make it a stand-data check (expectStandData), or fix the test.`,
  },
  // A screenshot checkpoint (@visual): no approved baseline yet, or the screen looks different from it.
  {
    cause: "screenshot without a baseline",
    matches: ({ message }) => /A snapshot doesn't exist at/.test(message),
    checkByHand: () =>
      "The screenshot has no approved baseline yet (on this OS). Look at the actual image in the report: right → approve it (/implement <plan> Layer: visual · Approve baseline: yes); wrong → the screen or its masks.",
  },
  {
    cause: "screenshot differs",
    matches: ({ message }) => /pixels \(ratio [\d.]+ of all image pixels\) are different|Expected an image \d+px by \d+px, received/.test(message),
    checkByHand: (facts) =>
      `Compare the expected, actual and diff images of ${stepOf(facts)} in the report. An intended change of the screen → approve the new baseline (Layer: visual · Approve baseline: yes); otherwise the screen broke — a bug.`,
  },
  // Before "element not found": a test out of time also reports what it was still waiting for.
  {
    cause: "out of time",
    matches: ({ message }) => /ran out of time/.test(message),
    checkByHand: (facts) =>
      `The test ran out of time in ${stepOf(facts)}. Open the page by hand: slow there too → the stand; fast → the test waits for a sign that never comes.`,
  },
  {
    cause: "element not found",
    matches: ({ message }) =>
      /Could not .* the element|The element did not appear|not found on the page|strict mode violation|resolved to \d+ elements/.test(message),
    checkByHand: (facts) => {
      const element = lineOf(facts.message, "Element")?.replace(/^Element:\s*/, "") ?? "the element the step looks for";
      return `Open ${whereTo(facts)}: is ${element} there? Under another name or in another place → the test's locator needs updating. Not there → the screen changed: a bug, or a changed requirement — check the ticket.`;
    },
  },
];

const CHECK_DID_NOT_MATCH: Rule = {
  cause: "check did not match",
  matches: () => true,
  checkByHand: (facts) =>
    `Do ${stepOf(facts)} by hand. The app shows what the run saw → a bug or a changed requirement (check the ticket); what the case expects → the test or its data.`,
};

const explained = (cause: Cause, checkByHand: string, note?: string): Explained => ({ verdict: VERDICT_OF[cause], cause, checkByHand, note });

/**
 * The first rule that matches names the cause; a failure no rule names is a check that did not match.
 * A known bug counts only at its own step: there it is grey and waits for the fix; a pass says it looks
 * fixed; a failure anywhere else is read like any other — the bug is not what failed it this time.
 */
export function explainFailure(facts: FailureFacts): Explained {
  const bug = facts.knownBug;
  if (bug && facts.passed) {
    return explained("known bug looks fixed", `Retest ${bug.ticket} by hand. Fixed → close it and remove its row from specs/known-bugs.md; not fixed → the test no longer catches the bug: fix the test.`);
  }
  if (bug && facts.step === bug.step) {
    return explained("known bug", `Nothing to do while ${bug.ticket} is open: it still fails at step "${bug.step}". When this test passes, retest the ticket.`);
  }
  const rule = RULES.find(({ matches }) => matches(facts)) ?? CHECK_DID_NOT_MATCH;
  const note = bug ? `Known bug ${bug.ticket} is at step "${bug.step}" — this failure is not it.` : undefined;
  // A test never green as it is now: an element it cannot find is first its own locator, not a bug.
  if (rule.cause === "element not found" && facts.unproven) {
    return {
      verdict: "Not a bug — the test needs fixing",
      cause: rule.cause,
      checkByHand: `A new or changed test — its locator is not proven on the stand yet: heal it (/heal). ${rule.checkByHand(facts)}`,
      note,
    };
  }
  return explained(rule.cause, rule.checkByHand(facts), note);
}
