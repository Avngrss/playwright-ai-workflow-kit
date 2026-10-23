// The report's Categories tab (allurerc.mjs imports it): every failure under its verdict — the first
// line of its message (failure-cause.ts) — and inside it by its cause. A verdict is a hint for the first
// look; a retest by hand decides. Part of the template, so a change here reaches every test home with
// the template's other files. The verdicts are listed in failure-cause.ts's order: who acts first.

const VERDICTS = [
  "Known bug looks fixed — retest the ticket",
  "Possible bug — retest by hand",
  "Not a bug — the stand or its data",
  "Not a bug — the test needs fixing",
  "Known bug — waiting for the fix",
];

export const categories = {
  rules: [
    ...VERDICTS.map((verdict) => ({
      name: verdict,
      matchers: { message: new RegExp(`^${verdict}\\n`) },
      groupBy: [{ label: "cause" }],
      groupByMessage: false,
    })),
    { name: "Unstable — passed on a retry", matchers: { flaky: true } },
  ],
};
