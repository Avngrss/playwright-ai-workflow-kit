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

Optional after first UI/API batch (readable Allure failures):

```text
base.fixture.ts → reporting.fixture.ts → api.fixture.ts → …
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

## Multi-role auth (when registered in project map)

The map owns **role slugs** and how each slug gets a session. Plans pick **one slug per scenario**. Fixtures wire the map — they do not define new personas.

Typical wiring (choose per map UI mode):

| Map UI mode | Spec / fixture pattern |
|-------------|-------------------------|
| `cookie-storage-state` / `localStorage-storage-state` | `test.use({ storageState: "<path from map for role slug>" })` on describe |
| `api-token-then-inject` | `auth.fixture.ts` + `src/test/setup/auth/**` helper; inject before first navigation |
| `manual-captured` | Load gitignored file from map path; refresh via setup project or human |
| Disposable user per test | Fixture creates user via API builder; teardown in fixture when needed |

API tests use the **same role slug** from the plan but different wiring — no `storageState`:

| Map API mode | Spec / fixture pattern |
|--------------|-------------------------|
| `password-login` | `authProvider.getAuthHeaders({ role: "<slug>" })` or setup helper |
| `token-from-env` / `api-key` / `custom-header` | Header from registered env/secret per map |
| `client-credentials` | OAuth helper when map registers it |
| Disposable user | API register/login in fixture or visible spec setup |

Rules:

- do not set one global `storageState` on the whole UI Playwright project if login or public specs exist;
- do not use `globalSetup` for role sessions — prefer setup project or fixture;
- `auth.fixture.ts` may expose thin helpers (for example session applier keyed by role slug), not `loggedInAdminPage`-style hidden flows;
- unauthenticated and login-as-action describes must not inherit role `storageState`.

Human guide: `docs/auth-strategy.md` (Multi-role applications).

Rule: `.cursor/rules/authentication-strategy.rules.mdc`
