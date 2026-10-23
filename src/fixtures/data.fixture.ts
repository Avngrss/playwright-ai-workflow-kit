import { expect, test as base } from "./auth.fixture";

/** Undo steps a test registers for what it created (.cursor/rules/data-and-fixtures.mdc). */
export interface Cleanup {
  add(step: () => Promise<unknown>): void;
}

/**
 * The shared data layer — `cleanup`, the same for every app. Part of the template, never edited in a
 * test home: an app's own data fixtures (bound clients of the signed-in role, disposable data) go to
 * src/fixtures/<app>/data.fixture.ts (`npm run app:add -- <app>` creates it), which sits on top
 * of this chain and so has `authHeaders` and `cleanup`.
 */
export const test = base.extend<{ cleanup: Cleanup }>({
  // Runs after the test, newest first, also when it failed; a failing undo is reported, not thrown.
  cleanup: async ({}, use, testInfo) => {
    const steps: Array<() => Promise<unknown>> = [];
    await use({ add: (step) => steps.push(step) });
    for (const step of steps.reverse()) {
      try {
        await step();
      } catch (error) {
        testInfo.annotations.push({ type: "cleanup-failed", description: String(error) });
      }
    }
  },
});

export { expect };
