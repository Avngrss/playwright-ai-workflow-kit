# Helper Recipes

Reusable helper patterns for **future projects** using this workflow kit.

The clean starter intentionally does **not** ship `src/test/**` helper implementations. Create helpers per real project only when a plan or repeated need justifies them.

For workflows and commands, see [Quick Reference](QUICK_REFERENCE.md) and [Start a New Project](START_NEW_PROJECT.md).

---

## General Helper Rules

- Create helpers only when there is **repeated project need**.
- Do not create helpers for one-off logic.
- Keep helpers **domain-aware** only inside the target project — not in framework starter core.
- Do not hide test intent inside helpers.
- Do not hide full E2E journeys in helpers.
- Do not add dependencies without an approved plan or task.

---

## API Response Time Sanity Recipe

**Purpose:** lightweight sanity check — not performance testing.

- Allowed when **planned** in feature coverage.
- Use for smoke/SLO-style thresholds only.
- Thresholds must come from plan or project expectation — not agent guesswork.
- Do not use API response time checks as a k6 replacement.
- Do not add broad timing assertions to every API test.

**Recommended shape:**

1. Measure duration around a **single** API request.
2. Assert status and contract **separately**.
3. Assert duration **only** when a threshold is planned.
4. On failure, report endpoint, method, duration, and threshold.

**Pseudocode:**

```text
start = now()
response = await apiClient.getProducts()
durationMs = elapsed(start)

expect(response.status()).toBe(200)
expectProductListResponse(await response.json())

if (plannedThresholdMs) {
  expect(durationMs).toBeLessThanOrEqual(plannedThresholdMs)
}
```

---

## Unique Data Generator Recipe

- Prefer **simple deterministic generators** before faker.
- Values must be unique enough for parallel runs.
- Use safe test domains for emails (for example `example.test` or project-approved non-routable domain).
- Do not use random/faker directly in specs.
- **Project location:** `src/test/data/generators/**`

**Pseudocode:**

```text
function uniqueEmail(prefix: string): string {
  return `${prefix}-${runId}-${workerIndex}@example.test`
}
```

---

## Builder Recipe

- Builders are for **reusable structured domain data**.
- Defaults must be **valid by default**.
- Invalid or negative data must be **explicit overrides**.
- **Project location:** `src/test/data/builders/**`

**Pseudocode:**

```text
class UserBuilder {
  build(overrides?: Partial<User>): User {
    return {
      email: uniqueEmail("user"),
      password: "ValidPass123!",
      ...overrides,
    }
  }
}

// Negative case — explicit override, not default
userBuilder.build({ email: "" })
```

---

## Config / Env Resolver Recipe

- Specs must **not** read `process.env` directly.
- Project-owned config layer resolves env values.
- Multi-target env names must be registered in the project map.
- Do not derive API host from UI host.

**Pseudocode:**

```text
// src/test/config/app-config.ts (project layer)
export function getApiBaseUrl(): string {
  return requiredEnv("API_BASE_URL")
}

// spec — uses fixture/config, not process.env
test("...", async ({ catalogApiClient }) => { ... })
```

---

## API Client / Request Wrapper Recipe

- Centralize base URL, headers, auth, and error logging when reuse justifies it.
- API client must **not** hide assertions.
- API client must **not** replace UI actions in E2E.
- In multi-service projects, **service ownership** must be explicit.

**Pseudocode:**

```text
class CatalogApiClient {
  async getProducts() {
    return this.transport.get("/products")
  }
}

// spec owns assertions
const response = await catalogApiClient.getProducts()
expect(response.status()).toBe(200)
```

---

## UI Stable Action Recipe

- **Action once** — no retry-click loops.
- Assert element visible/enabled before critical click.
- Wait for observable result after click.
- No `waitForTimeout`.

**Pseudocode:**

```text
await expect(submitButton).toBeEnabled()
await submitButton.click()
await expect(successMessage).toBeVisible()
```

---

## E2E Setup / Cleanup Helper Recipe

- Setup helpers may create preconditions (user, product, cart state).
- Cleanup helpers may remove disposable data.
- Helpers must **not** hide the main user journey.
- Destructive flows require cleanup or safe isolation.

**Pseudocode:**

```text
// setup — allowed before journey steps in spec
await createDisposableUserViaApi(user)

// journey steps remain visible in spec
await loginPage.open()
await loginPage.login(user.email, user.password)

// cleanup — fixture teardown or explicit step
await deleteUserViaApi(user.id)
```

---

## Allure Metadata / Attachment Recipe

- Allure metadata helpers may be added per project when reporting needs repeat.
- Use metadata for **reporting** — not as replacement for Playwright tags.
- Failure screenshots, traces, and videos are already configured through Playwright.
- Step-level screenshots are project-specific and should **not** be default.

**Pseudocode:**

```text
applyAllureMetadata({
  feature: "Checkout",
  story: "Guest checkout",
  severity: "critical",
})
```

---

## Console / Network Diagnostic Recipe

- Useful for UI debugging when **planned**.
- Do not fail tests on every console warning by default.
- Avoid noisy global assertions.
- Use targeted checks for critical errors only.

**Pseudocode:**

```text
page.on("console", (msg) => {
  if (msg.type() === "error" && isCriticalAppError(msg.text())) {
    collectedErrors.push(msg.text())
  }
})

// assert only when scenario requires it
expect(collectedErrors).toEqual([])
```

---

## When to Create Helper vs Inline Code

| Situation | Prefer |
|-----------|--------|
| Used once and still clear | Inline in spec |
| Repeated, stable logic | Helper |
| Shared setup or wiring | Fixture |
| Page actions or state readers | Page Object |
| Reused structured data | Builder or generator |

---

## Do Not Do

- Do not create helpers before a plan needs them.
- Do not add faker by default.
- Do not put randomness in specs.
- Do not hide a full journey in a helper.
- Do not add timing assertions everywhere.
- Do not use `waitForTimeout`.
- Do not create one giant utility file.

---

## Links

- [Quick Reference](QUICK_REFERENCE.md)
- [Start a New Project](START_NEW_PROJECT.md)
- [README.md](../README.md)
- Project map: `.cursor/rules/00-project-map.mdc`
