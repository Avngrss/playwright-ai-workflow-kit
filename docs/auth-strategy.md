# Auth strategy

How tests get a session.

Do **not** paste tokens, passwords, or session JSON into chat, plans, or git.

---

## Order

```text
1. Tell the agent how this app authenticates (+ roles if multi-role)
2. Agent updates the project map (Auth Strategy + role matrix)
3. Optional: auth bootstrap — helpers, fixtures, setup project (before or with first authenticated batch)
4. /plan-feature — each feature picks role slug(s) and auth as
5. /implement-* — uses map + plan; does not invent login or roles
```

The map remembers **how**.  
The feature plan remembers **who** in this test (which role).

**You do not re-register all roles on every feature.** Register once in the map; each feature plan only picks `role: <slug>` for its scenarios.

**API and UI use the same role slug from the plan**, but different wiring:

| Layer | Multi-role wiring |
|-------|-------------------|
| **API** | Token, header, creds, or login endpoint per role — via auth provider, fixture, or explicit request headers |
| **UI** | Browser session per role — via `test.use({ storageState })`, inject, setup project, or auth fixture |

API tests do **not** use `storageState`. UI tests do **not** duplicate API login in every spec when `auth as: precondition`.

### Two phases (registry vs bootstrap vs feature)

| Phase | When | You say | Agent does |
|-------|------|---------|------------|
| **A — Registry** | Once (or when auth changes) | Roles, API/UI modes, paths, env names | Updates project map only |
| **B — Bootstrap** | Before first authenticated tests (recommended) | "Create auth setup for registered roles" | `setup/auth/**`, `auth.fixture.ts`, setup project — **no feature specs** |
| **C — Feature** | Per feature | `/plan-feature` + `role: <slug>` in plan | Implement uses map + plan |

Map update (phase A) **does not** auto-create fixtures unless you ask. Request phase B explicitly when you want infrastructure ready before `/implement-*`.

Example bootstrap prompt:

```text
Auth bootstrap for roles registered in project map. Infrastructure only — no feature specs.

Create: src/test/setup/auth/**, auth.fixture.ts (if UI preconditions reused), setup project for state/<role-slug>.json when needed.
UI mode api-token-then-inject: inject before first goto per map token placement.
Stop after wiring; do not implement feature tests.
```

---

## How you use this (short walkthrough)

Copy these steps in order. Replace `<...>` with your product facts. Do **not** paste real tokens or passwords.

### Step 1 — Register roles once (project map)

Tell the agent **before the first authenticated feature**:

```text
Update project map Auth Strategy for multi-role.

Roles:
- <role-slug-a>: <what this persona can do>
- <role-slug-b>: <what this persona can do>

API: password-login (helper under src/test/setup/auth/ when created)
UI:  api-token-then-inject   # or cookie-storage-state if you use state/*.json

Per role:
- <role-slug-a>: API <CREDS_ENV_A> · UI token in localStorage key <key-from-discovery>
- <role-slug-b>: API <CREDS_ENV_B> · UI state/<role-slug-b>.json OR same inject pattern

No global storageState on ui-chromium.
Stop after project map update.
```

You do **not** repeat this on every feature — only when auth or roles change.

### Step 2 — Bootstrap infra (optional, once)

When you want helpers/fixtures **before** feature tests:

```text
Auth bootstrap for roles already in project map. Infrastructure only.

Create: src/test/setup/auth/**, auth.provider (or api-login helper), auth.fixture.ts, setup project if state/*.json refresh is needed.
Wire test.ts to auth.fixture when created.
Do not create feature specs.
```

Skip this step if the first `/implement-*` batch may create auth wiring — but explicit bootstrap reduces surprises.

### Step 3 — Plan a feature (pick role per scenario)

```text
/plan-feature

Feature: catalog-edit

Note: scenarios need auth as precondition with role <role-slug-b>.
Public catalog-read scenarios use role <role-slug-a> or auth as none — follow the app.
```

The plan must contain:

```md
## Auth Strategy
- required: yes
- auth as: precondition
- role: <role-slug-b>
- API mode: <from map>
- UI mode: <from map>
```

Different features → different `role:` lines; same map matrix.

### Step 4 — Implement the feature

```text
/implement-api-batch specs/catalog-edit/catalog-edit.md
/implement-ui-batch specs/catalog-edit/catalog-edit.md
```

Optional reminder (does **not** replace the map):

```text
Use role <role-slug-b> from the plan for precondition scenarios.
```

Agent reads **plan + map** — no new role names in specs.

### Step 5 — When the product changes

```text
/update-feature-plan
Feature: catalog-edit
What changed: <delta or unknown>
```

Refresh Auth Strategy / Setup & Cleanup in the plan if roles or session behavior changed. Update project map if a **new** role slug appeared.

---

For a full fictional walkthrough (map → plan → API spec → UI spec), see **End-to-end example (illustrative)** below.

---

## 1. Before features — fill the map

Say this to the agent once (or when auth changes):

```text
Update project map Auth Strategy.

Do not store tokens or passwords.

API: <path to our token helper, or "create users via this API">
UI:  <path to session files, or "same token then inject", or "create user then open app">
Roles we have: <names from this product>
Default: signed-in | not signed-in
```

Two valid inputs — pick what you actually have:

| You give | Agent does |
|----------|------------|
| Ready helper + role names | Registers that helper. Tests call it. |
| Data/API to create a user | Writes setup that creates a disposable user per role. |
| Session files per role (`state/<role>.json`, gitignored) | Tests load the file. You refresh the files. |

If the whole app sits behind login, set the map default to **signed-in**. Public pages and the login feature itself are the exceptions.

Fallback: you can say it during `/implement-*` for one suite. Then tell the agent to copy it into the map so the next feature does not ask again.

---

## 2. Feature plans — pick the case

`/plan-feature` copies the mechanism from the map and sets **this** scenario:

| Case | `auth as` | Meaning |
|------|-----------|---------|
| Public page / public API | `none` | No session |
| The test *is* login | `action` | Spec logs in itself |
| Already signed in | `precondition` | Spec uses the map helper/file + a **role** |

Example for a signed-in feature:

```md
## Auth Strategy

- required: yes
- auth as: precondition
- role: <one role from the project map>
- API mode: <from map>
- UI mode: <from map>
```

Different tests may use different roles. Do not lock the map to one person.

One E2E journey is usually one role. Two roles in one journey only if the story needs both.

If the map has no mechanism and the feature needs a session → **blocked**.

---

## Multi-role applications

Modern apps often have **multiple authenticated personas** (different permissions, apps, or tenant contexts).

The kit does not ship role names or session paths. **You declare them once; the agent registers them in the project map; plans and specs consume the registry.**

### Who decides what

| Layer | Owns | You provide | Agent does |
|-------|------|-------------|------------|
| **Project map** | Mechanisms + **role registry** | Role slugs, how each role gets API/UI session, paths, env names | Updates `00-project-map.mdc` Auth Strategy |
| **Feature / E2E plan** | **Which role this scenario needs** | Optional hint per feature | Writes `role: <slug from map>` when `auth as: precondition` |
| **Spec / fixture** | Wiring only | Nothing new if map is complete | **API:** headers/token/creds from map · **UI:** `test.use({ storageState })`, setup project, or auth fixture — **no invented roles** |

```text
You describe roles + mechanisms
  → agent fixes project map (source of truth)
    → /plan-feature picks role per scenario
      → /implement-* uses map + plan only
```

Same workflow as single-role auth — multi-role only adds a **role matrix** to the map.

### What to tell the agent (once per project or when auth changes)

Use product role names from **your** app, not kit examples:

```text
Update project map Auth Strategy for multi-role.

Roles (slugs must match how we refer to them in plans):
- <role-slug-a>: <what this persona can access>
- <role-slug-b>: <what this persona can access>

API: <one mechanism or per-role note — e.g. password-login via helper>
UI:  <cookie-storage-state | localStorage-storage-state | api-token-then-inject | manual-captured>

Per role (when API/UI artifacts differ):
- <role-slug-a>:
  - API: <password-login | token-from-env | api-key | client-credentials | helper path>
  - UI:  storageState state/<role-slug-a>.json (or inject helper)
- <role-slug-b>:
  - API: <...>
  - UI:  storageState state/<role-slug-b>.json (or inject helper)

Optional role matrix in project map (placeholders — replace with product slugs):

| Role slug | Scope / intent | API mode | UI mode | Session artifact | Credentials ref |
|-----------|----------------|----------|---------|------------------|-----------------|
| <role-slug-a> | <from product> | <from map> | <from map> | state/<role-slug-a>.json | <env name from map> |
| <role-slug-b> | <from product> | <from map> | <from map> | state/<role-slug-b>.json | <env name from map> |

Session refresh: <setup project | manual capture | disposable user per test>
Default UI project: <no global storageState | document exception>
Public/unauthenticated suites: <which features stay auth as: none>
Login-as-action suites: must NOT inherit any role storageState
API: do not use one global token for all roles — scope by role slug from map
```

The agent must register slugs, mechanisms, and paths in the map **before** implementing authenticated tests.

If you only know one role today, register one row. Add rows when new roles appear — do not invent placeholders.

### How the agent chooses a mechanism (decision tree)

```text
Need a session in this test?
├─ no  → auth as: none; no storageState; no auth headers; no login hook
├─ yes, login/token IS the test → auth as: action; visible login in spec; no inherited session
└─ yes, precondition
   ├─ role named in plan? → must exist in map role matrix
   ├─ API mode from map (API specs):
   │   ├─ password-login → auth provider / setup helper → Authorization header or project header contract
   │   ├─ token-from-env → header from registered env secret for that role
   │   ├─ api-key / custom-header → static header from map
   │   ├─ client-credentials → OAuth helper when map registers it
   │   └─ disposable user → API register/login in spec or fixture; prefer when parallel-safe
   ├─ UI mode from map (UI specs):
   │   ├─ cookie/localStorage storageState → test.use({ storageState: map path for role })
   │   ├─ api-token-then-inject → fixture or setup helper; inject before first goto
   │   ├─ sessionStorage → addInitScript before goto (not global storageState)
   │   └─ manual-captured → load gitignored file from map path; blocked if CI cannot refresh
   ├─ disposable user per test? → fixture/API setup; prefer over shared files when parallel-safe
   └─ several roles per run, stable accounts? → setup project writes state/<slug>.json (UI) and/or refreshes token cache (API)
```

**Do not use `globalSetup` for role sessions.** Prefer **setup project** (Playwright `dependencies`) or **fixture/API inject** for flexibility.

**Do not set one `storageState` on the entire UI Playwright project** — login and public specs would break.

**Do not use one global API token for all roles** — scope credentials by role slug from the map.

### API wiring (multi-role)

API multi-role is **not a separate kit feature**. It is the normal auth strategy: plan names `role: <slug>`; spec uses creds/token/headers for that slug.

**E — Auth provider by role slug (preferred when login/token is reused)**

```ts
const headers = await authProvider.getAuthHeaders({ role: "<role-slug-from-plan>" });

const response = await request.get("/resource", { headers });
```

Token cache must be scoped by **role + environment + worker** when parallel execution needs isolation.

**F — Explicit creds / login endpoint in spec (auth-as-action or one-off)**

```ts
const loginResponse = await request.post("/auth/login", {
  data: {
    username: "<from registered creds ref — not hardcoded in spec>",
    password: "<from registered creds ref>",
  },
});

const token = (await loginResponse.json()).access_token;

const response = await request.get("/resource", {
  headers: { Authorization: `Bearer ${token}` },
});
```

Login/token specs may keep this visible. Other specs must use auth provider or fixture — do not copy login in every test.

**G — Auth fixture on `api.fixture.ts` / `auth.fixture.ts`**

```ts
// maps plan role slug → map-backed helper; created when reused
requestWithRole: async ({ request, authProvider }, use) => {
  const headers = await authProvider.getAuthHeaders({ role: "<role-slug-from-plan>" });
  await use({ request, headers });
},
```

**H — Builder payload role field (entity role ≠ auth role)**

When the API body has a `role` or permission field, that is test data — still use auth headers for **who calls the API**:

```ts
const payload = entityBuilder.build({ role: "<business-role-field-if-contract-requires>" });
const headers = await authProvider.getAuthHeaders({ role: "<auth-role-slug-from-plan>" });
```

### UI wiring (multi-role)

**A — Per-role describe (storageState files from map)**

```ts
test.describe("Feature area", () => {
  test.use({ storageState: "state/<role-slug>.json" }); // path from project map only

  test("scenario", async ({ somePage }) => {
    // precondition session already applied; scenario stays visible
  });
});
```

**B — Setup project refreshes all registered roles once per run**

```text
playwright.config.ts:
  project: setup-<role-slug>  → writes state/<role-slug>.json
  project: ui-chromium        → dependencies: ['setup-…'] only when refresh is required
```

Use when CI needs fresh sessions; paths and role slugs still come from the map.

**C — Fixture inject (disposable or per-worker user)**

```ts
// auth.fixture.ts — created when reused; maps role slug → helper from src/test/setup/auth/**
authenticatedPage: async ({ page, authSessionForRole }, use) => {
  await authSessionForRole.apply(page, "<role-slug-from-plan>");
  await use(page);
},
```

Spec or plan names the role; fixture reads the map-backed helper — no hardcoded persona names in core.

### API token for UI authentication (`api-token-then-inject`)

**Yes — this is a supported and registered UI mode.** Use it when the app stores the session in `localStorage` or a header contract after API login, and UI login is not the behavior under test.

Register in project map per role:

```md
UI mode: api-token-then-inject
persistence: localStorage | cookies | mixed
token placement: <storage key or header name from discovery — e.g. access_token in localStorage>
API mode: password-login | token-from-env | ... (how the token is obtained)
```

Rules:

- obtain token via **API** (same helper as API tests) — then inject **before** first `goto`;
- use Playwright `addInitScript` for `localStorage` / `sessionStorage` — inject before navigation;
- `storageState` works when API login sets **cookies** — setup project may call API login in a browser context and save `state/<role-slug>.json`;
- **`sessionStorage` is not in `storageState`** — must use `addInitScript` before `goto`;
- do not `page.evaluate` to plant token after the app already booted unauthenticated;
- API mode and UI mode may differ for the same role (common: API `password-login` + UI `api-token-then-inject`).

**I — Setup project: API login → save UI storageState (cookies/localStorage)**

```text
setup project for <role-slug>:
  1. API login or browser login once
  2. write playwright storageState to state/<role-slug>.json
ui-chromium depends on setup when refresh is required
```

**J — Fixture inject (token in localStorage before goto)**

```ts
// src/test/setup/auth/inject-session.helper.ts — keys from project map only
export async function injectSessionForRole(page: Page, role: string): Promise<void> {
  const { token, storageKey } = await getTokenPayloadForRole(role); // API helper + map
  await page.addInitScript(
    ({ key, value }) => {
      localStorage.setItem(key, value);
    },
    { key: storageKey, value: token },
  );
}

// auth.fixture.ts or spec before first navigation
await injectSessionForRole(page, "<role-slug-from-plan>");
await catalogPage.open();
```

Blockers for this mode:

- token placement (key/header) unknown → discover first or **blocked**;
- SPA reads session only from `sessionStorage` and key is unknown → **blocked** until map registers `sessionStorage-init-script` details;
- CI cannot obtain token via registered API mode → **blocked**.

### Plan example (multi-role)

```md
## Auth Strategy

- required: yes
- auth as: precondition
- role: <role-slug-b>
- API mode: <from project map>
- UI mode: <from project map>
- persistence: <from project map>
- token placement: <from project map>
- isolation: <from project map>
```

Another feature may use `<role-slug-a>` with the same map mechanisms.

Optional when persisted state is created:

```md
## Setup & Cleanup Strategy

- persisted state: yes | no
- parallel safe: yes | no
- preferred isolation: disposable data | fixture teardown | spec step cleanup | none
- setup owner: none | fixture | API helper | beforeEach navigation | blocked
- cleanup owner: none | fixture teardown | spec step | afterEach | blocked
- entities created: <user, order, ... or none>
```

Rule reference: `.cursor/rules/test-isolation-state.rules.mdc`, `.cursor/rules/test-structure-and-tags.rules.mdc` (Hooks).

### End-to-end example (illustrative)

**Fictional product only** — copy the **pattern**, not the slugs `inventory-viewer` / `inventory-manager`.

Fictional product with two personas. Slugs are **examples only** — register your product's names in the map.

**Step 1 — You tell the agent once:**

```text
Update project map Auth Strategy for multi-role.

Roles:
- inventory-viewer: read catalog and prices
- inventory-manager: create/update catalog items

API: password-login via src/test/setup/auth/api-login.helper.ts
UI:  cookie-storage-state

Per role:
- inventory-viewer:  API creds env INVENTORY_VIEWER_CREDS · UI state/inventory-viewer.json
- inventory-manager: API creds env INVENTORY_MANAGER_CREDS · UI state/inventory-manager.json

Session refresh: setup project writes state/*.json before ui-chromium
No global storageState on ui-chromium
Login feature and public landing: auth as none / action — no inherited session
```

**Step 2 — Project map (`00-project-map.mdc`) gets a role matrix:**

```md
| Role slug          | Scope              | API mode        | UI mode               | Session artifact              | Credentials ref           |
|--------------------|--------------------|-----------------|-----------------------|-------------------------------|---------------------------|
| inventory-viewer   | read catalog       | password-login  | cookie-storage-state  | state/inventory-viewer.json   | INVENTORY_VIEWER_CREDS    |
| inventory-manager  | mutate catalog     | password-login  | cookie-storage-state  | state/inventory-manager.json  | INVENTORY_MANAGER_CREDS   |
```

**Step 3 — Feature plans pick one slug per scenario:**

`specs/catalog-read/catalog-read.md`:

```md
## Auth Strategy
- required: yes
- auth as: precondition
- role: inventory-viewer
- API mode: password-login
- UI mode: cookie-storage-state

## Setup & Cleanup Strategy
- persisted state: no
- parallel safe: yes
- preferred isolation: disposable data
- setup owner: none
- cleanup owner: none
```

`specs/catalog-edit/catalog-edit.md`:

```md
## Auth Strategy
- required: yes
- auth as: precondition
- role: inventory-manager
- API mode: password-login
- UI mode: cookie-storage-state

## Setup & Cleanup Strategy
- persisted state: yes
- parallel safe: yes
- preferred isolation: fixture teardown
- setup owner: API helper
- cleanup owner: fixture teardown
- entities created: catalog item
- idempotent cleanup: yes
```

**Step 4 — API spec (same slug, token/creds — not storageState):**

```ts
import { test, expect } from "../../../src/test/fixtures/test";
import { expectProductResponse } from "../../../src/test/assertions/api/product-response.assertion";

test.describe("Catalog item API", { tag: ["@api", "@regression", "@catalog"] }, () => {
  test("manager can create an item", { tag: ["@smoke"] }, async ({ request, authProvider, productBuilder }) => {
    const headers = await authProvider.getAuthHeaders({ role: "inventory-manager" }); // slug from plan + map

    const payload = productBuilder.build();
    const response = await request.post("/api/items", { headers, data: payload });

    expect(response.status()).toBe(201);
    expectProductResponse(await response.json());
  });

  test("viewer cannot create an item", async ({ request, authProvider, productBuilder }) => {
    const headers = await authProvider.getAuthHeaders({ role: "inventory-viewer" });

    const response = await request.post("/api/items", {
      headers,
      data: productBuilder.build(),
    });

    expect(response.status()).toBe(403);
  });
});
```

**Step 5 — UI spec (same slug, browser session):**

```ts
import { test, expect } from "../../../src/test/fixtures/test";

test.describe("Catalog edit UI", { tag: ["@ui", "@regression", "@catalog"] }, () => {
  test.use({ storageState: "state/inventory-manager.json" }); // path from map for this role

  test.beforeEach(async ({ catalogEditPage }) => {
    await catalogEditPage.open();
    await expect(catalogEditPage.heading).toBeVisible();
  });

  test("manager sees create item control", { tag: ["@smoke"] }, async ({ catalogEditPage }) => {
    await test.step("Verify create control is available", async () => {
      await expect(catalogEditPage.createItemButton).toBeVisible();
    });
  });
});

test.describe("Catalog read UI", { tag: ["@ui", "@regression", "@catalog"] }, () => {
  test.use({ storageState: "state/inventory-viewer.json" });

  test("viewer does not see create item control", async ({ catalogReadPage }) => {
    await test.step("Open catalog", async () => {
      await catalogReadPage.open();
      await expect(catalogReadPage.heading).toBeVisible();
    });

    await test.step("Verify create control is hidden", async () => {
      await expect(catalogReadPage.createItemButton).toBeHidden();
    });
  });
});

// Login feature — no storageState inherited:
test.describe("Login UI", { tag: ["@ui", "@smoke", "@login"] }, () => {
  test("shows invalid credentials error", async ({ loginPage }) => {
    await loginPage.open();
    await loginPage.submit("<from registered test creds ref>", "wrong-password");
    await expect(loginPage.errorMessage).toBeVisible();
  });
});
```

```text
Same role slug in plan  →  same row in map  →  different wiring in API vs UI
inventory-viewer        →  viewer row       →  API: 403 on POST · UI: no create button
inventory-manager       →  manager row      →  API: 201 on POST · UI: create button visible
```

### Blockers

Mark **blocked** when:

- feature needs a role not registered in the map;
- role needs SSO/MFA and only manual capture exists but CI cannot refresh;
- two roles in one journey but no safe isolation/cleanup strategy;
- agent would need to guess storage keys, paths, or env secret names.

---

## 3. Implement

`/implement-api-batch` and `/implement-ui-batch` read the plan + map.

They must not:

- invent login;
- hardcode a token;
- UI-login in `beforeEach` unless the test is login;
- put one session on every UI project (login tests would skip login).

You may still say at implement time: “this spec uses role X”. That chooses the user. It does not replace the map.

---

## Commands

```text
# first, if you already know how auth works:
"Update project map Auth Strategy: ..."

/plan-feature
/plan-e2e-journey
/implement-api-batch
/implement-ui-batch
/implement-e2e-flow
```
