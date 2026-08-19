# Fixture chain

Specs import **only** from `test.ts`.

## Starter chain

```text
base.fixture.ts    → Playwright test + expect (no project wiring)
  api.fixture.ts   → API transport / setup (empty extend until needed)
    data.fixture.ts  → builders / generators as fixtures (empty extend until needed)
      pages.fixture.ts → Page Object layer (empty extend until needed)
        test.ts      → public entry point (re-export only)
```

## Extension rules

1. Add fixtures in the **lowest layer that owns the dependency**.
2. Each layer extends the previous layer with `base.extend({ ... })`.
3. `test.ts` re-exports from the **last** layer (`pages.fixture` or `auth.fixture`).
4. Do not import `@playwright/test` in specs.
5. Do not put Page Objects or business flows in `base.fixture.ts`.

## Adding auth later

When auth-as-precondition is registered in the project map:

```text
pages.fixture.ts → auth.fixture.ts → test.ts
```

Create `auth.fixture.ts` extending `pages.fixture.ts`.

Update `test.ts` to re-export from `auth.fixture.ts` instead of `pages.fixture.ts`.
