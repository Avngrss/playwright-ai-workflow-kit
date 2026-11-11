import type { ContractFinding, ScreenFinding } from "./product-change";

/**
 * Every failure gets a verdict (is it a bug, and who acts), its likely cause and what to check by hand,
 * read from where and how it failed. The verdict is a hint for the first look, never the answer:
 * whether it is a bug is decided by a retest by hand — and whether a change of the product was
 * intended, by the agent's triage of the run. The same words reach the report (its first line and its
 * Categories tab, report-categories.mjs) and the run's summary.
 */

export type Cause =
  | "setting missing"
  | "API changed"
  | "screen changed"
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
  | "request did not match"
  | "answer did not match"
  | "check did not match";

/** The verdicts, in the order the report and the summary list them — who acts first. */
export const VERDICTS = [
  "Known bug looks fixed — retest the ticket",
  "Possible bug — retest by hand",
  "Not a bug — the product changed: refresh the plan",
  "Not a bug — the stand or its data",
  "Not a bug — the test needs fixing",
  "Known bug — waiting for the fix",
] as const;
export type Verdict = (typeof VERDICTS)[number];

const VERDICT_OF: Record<Cause, Verdict> = {
  "setting missing": "Not a bug — the stand or its data",
  "API changed": "Not a bug — the product changed: refresh the plan",
  "screen changed": "Not a bug — the product changed: refresh the plan",
  "known bug looks fixed": "Known bug looks fixed — retest the ticket",
  "request did not match": "Possible bug — retest by hand",
  "answer did not match": "Possible bug — retest by hand",
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
  /** A request answered 404/405, read against the app's contract (product-change.ts). */
  contract?: ContractFinding;
  /** The page showed, reworded, the text the test looked for (product-change.ts). */
  screen?: ScreenFinding;
}

export interface Explained {
  verdict: Verdict;
  cause: Cause;
  checkByHand: string;
  /** A line a reader needs besides the cause — a known bug that is not what failed this time, what the API's contract or the page says. */
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

const REFRESH = "Not a retest: the feature's plan needs a refresh — the run summary's last line says what to tell the agent.";

const UNSET = /\b([A-Z][A-Z0-9_]*) is not set in \.env\b/;

const RULES: Rule[] = [
  // Before anything: a setting the run lacks (an app's address) — nothing ran against the app, nothing to retest.
  {
    cause: "setting missing",
    matches: ({ message }) => UNSET.test(message),
    checkByHand: ({ message }) =>
      `Nothing ran against the app: ${UNSET.exec(message)?.[1] ?? "its address"} is empty. On a machine — set it in .env (npm run env:prepare lists what is empty); in CI — a variable of that name (GitHub: Settings → Secrets and variables → Actions, and the workflow's env: block; GitLab: CI/CD variables).`,
  },
  // Then: a fact from the product's own contract or page outweighs how the failure reads — under a test
  // that has been green only: a new or changed one (unproven) cannot see the product change under it.
  {
    cause: "API changed",
    matches: ({ contract, unproven }) => !!contract && !contract.listed && !unproven,
    checkByHand: ({ contract }) =>
      `The API's contract (${contract?.docs}) no longer lists ${contract?.path}${contract?.similar ? ` — likely moved to ${contract.similar}` : " and nothing like it — removed? Ask the team"}. ${REFRESH}`,
  },
  {
    cause: "screen changed",
    matches: ({ screen, unproven }) => !!screen && !unproven,
    checkByHand: ({ screen }) => `The page shows "${screen?.shown}" where the test looks for "${screen?.expected}". ${REFRESH}`,
  },
  {
    cause: "API changed",
    matches: ({ message, unproven }) => /a field the tests read is missing or retyped/.test(message) && !unproven,
    checkByHand: () =>
      `The answer lost a field the tests read, or holds it as another type (the message names it): npm run api:types, then npm run typecheck names every place. ${REFRESH}`,
  },
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
      /did not get signed in|was not signed in by|got no token from the token endpoint|not tried again — repeated wrong passwords|left the sign-in form|"signed in when:" does not match|did not accept the session|Login step .* found nothing|has no rights for it|answered 40[13] /.test(message),
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
      "The screenshot has no approved baseline yet (on this OS). Look at the actual image in the report: right → approve it (/implement <plan> Layer: visual · Approve baseline: yes; in CI, which runs Linux — GitHub: Actions → the workflow → Run workflow, baselines: missing; GitLab: the manual test:visual-baselines job); wrong → the screen or its masks.",
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
  // The page sent other data than the case expects (the form's request, a period's query) — the front
  // end's part, told apart from the server's answer.
  {
    cause: "request did not match",
    matches: ({ message }) => /^The request the action sent —/m.test(message),
    checkByHand: (facts) => {
      const request = /The request the action sent — (\S+ \S+)/.exec(facts.message)?.[1] ?? "the request the action sends";
      return `Repeat ${stepOf(facts)} by hand with the browser's developer tools open (Network) and look at what the page sent in ${request}. It holds what the case expects → the test's expectation or data is wrong; it does not → the screen sends the wrong data: a front-end bug — give the developers the request and the time of the run.`;
    },
  },
  // After the sign-in, unavailable and 5xx rules: those answers keep their own causes. What is left is
  // the server answering the action with another status or other data than the case expects.
  {
    cause: "answer did not match",
    matches: ({ message }) => /^The server's answer to the action —|The page's request \S+ answered/m.test(message),
    checkByHand: (facts) => {
      const endpoint = /(?:The server's answer to the action — (?:[A-Z]+ )?|The page's request )(\S+)/.exec(facts.message)?.[1] ?? "the request the action sends";
      return `Repeat ${stepOf(facts)} by hand with the browser's developer tools open (Network) and look at the answer of ${endpoint}. It holds what the case expects → the test's expectation or data is wrong; it does not → the server answered the action wrongly: a bug — give the developers the request and the time of the run.`;
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
  const note = [bugElsewhere(facts), stillListed(facts), notGreenYet(facts)].filter(Boolean).join(" ") || undefined;
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

const bugElsewhere = ({ knownBug }: FailureFacts): string | undefined =>
  knownBug && `Known bug ${knownBug.ticket} is at step "${knownBug.step}" — this failure is not it.`;

/** A 404/405 on a path the contract still lists: the server breaks its own contract — or, through an id in the path, the item is gone. */
function stillListed({ contract }: FailureFacts): string | undefined {
  if (!contract?.listed) return undefined;
  const throughId = contract.listed.includes("{");
  return `The API's contract (${contract.docs}) still lists ${contract.listed}${throughId ? " — the item asked for may be gone (stand data); if not," : " —"} the server breaks its own contract.`;
}

/** What the contract or the page says under a test never green as it is now — a lead for its heal, not a product change. */
function notGreenYet({ unproven, contract, screen }: FailureFacts): string | undefined {
  if (!unproven) return undefined;
  const lead = screen
    ? `the page shows "${screen.shown}" where the test looks for "${screen.expected}"`
    : contract && !contract.listed
      ? `the API's contract (${contract.docs}) does not list ${contract.path}${contract.similar ? ` — it lists ${contract.similar}` : ""}`
      : undefined;
  return lead && `A new or changed test, not green on the stand yet — so not read as a product change: ${lead}.`;
}
