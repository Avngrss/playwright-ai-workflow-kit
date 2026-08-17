# Agent notes

This repository is a Playwright + TypeScript workflow kit starter.

Source of truth: `.cursor/rules/00-project-map.mdc`

- Do not invent tests, auth mechanisms, env names, or tags.
- Plan first (`/plan-feature` or `/plan-e2e-journey`). Implement only coverage marked ready in `specs/`.
- The clean starter has no `src/test/**` and no tests. Skills create that layer on first implementation.
- Specs import only from `src/test/fixtures/test.ts` once that entry point exists.
- Do not use `waitForTimeout`, `test.fixme`, or weakened assertions to hide failures.
