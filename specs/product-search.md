# Product Search Feature Coverage Plan

## Plan ownership

- role: **TMS traceability and automation status** for product search (Qase suite **Search field**, suite id 6)
- owns: TMS Source, TMS Mapping, case-to-coverage status, ready/blocked/postponed for TMS intent
- companion: [`specs/search.md`](search.md) — contract and coverage reference (OpenAPI-first API/UI implementation briefs)
- for `/plan-from-tms` or `/align-plan-with-tms` on this feature, update this file only

## Feature / Area

- name: Product search (catalog UI search control + `GET /products/search` API)
- scope: TMS suite **Search field** (Products); planning only; canonical TMS-aligned plan path
- source of truth: Qase TMS cases (UI/manual intent) + OpenAPI for `GET /products/search` (contract detail in `specs/search.md`)
- UI target: [https://practicesoftwaretesting.com/](https://practicesoftwaretesting.com/)
- API contract source: [https://api.practicesoftwaretesting.com/api/documentation#/Product](https://api.practicesoftwaretesting.com/api/documentation#/Product)
- API contract JSON: [https://api.practicesoftwaretesting.com/docs?api-docs.json](https://api.practicesoftwaretesting.com/docs?api-docs.json)
- requirements/specs: Qase suite **Search field** (suite id 6); contract/coverage reference at `specs/search.md`
- in scope:
  - UI search input/control in the filters area on catalog page (`/`)
  - entering a query and triggering search (TMS: Search button; automation may use Enter if equivalent)
  - visible filtered product list when matches exist (name-based match per API contract)
  - visible empty / no-results state when no matches exist
  - `GET /products/search?q=...` success path and name-match predicate
  - paginated search response envelope (`page` query param)
  - documented 404 (Item Not Found) for no-match when live behavior matches contract
- out of scope:
  - other search endpoints (`/brands/search`, `/categories/search`, etc.)
  - combining search with sort/brand/category/price-range on main list (`GET /products` filters)
  - search on fields other than `name` (contract limits to name column)
  - auth variants (public endpoint)
  - exact TMS query strings as mandatory automation values unless traceability requires them

## TMS Source

- provider: Qase (read-only)
- project code: `TOOLSSHOP`
- MCP server: `qase` (user/global Cursor MCP settings; requires `QASE_API_TOKEN`; not in project `.cursor/mcp.json`)
- access mode: read-only
- parent suite: **Products** (suite id 20)
- suite: **Search field** (suite id 6)
- suite title/path: Products / Search field
- cases reviewed: all cases in suite (2)
- filter/QQL: `suite_id=6`
- source type: UI / manual, risk-based

## TMS Planning Summary

- cases reviewed: 2 (TOOLSSHOP-15, TOOLSSHOP-16)
- ready to implement now: none — core TMS intent is already covered by existing automation (behavioral equivalence)
- blocked/postponed: API 404 no-match (OpenAPI vs live contract gap); exact empty-state message text from TMS
- not automated: search + other filter combinations; missing/empty `q` without documented error contract
- out of scope: cross-filter combinations on main catalog endpoint
- already covered by existing automation:
  - `tests/ui/products/product-search.ui.spec.ts` (3 scenarios)
  - `tests/api/products/product-search.api.spec.ts` (2 active + 1 skipped blocked scenario)
  - helpers: `product-search-response.assertion.ts`, `product-search-ui.assertion.ts`
  - Page Object: `ProductsPage.searchInput`, `searchFor()`, `getVisibleProductNames()`

## TMS Mapping

| Qase case | Intent | Automation level | Playwright mapping | Status |
|---|---|---|---|---|
| **TOOLSSHOP-16** | Positive search: enter query, trigger search, only matching items shown (example: **Sheet Sander**) | UI (+ API predicate) | UI: `filters visible product names to those matching the search query` uses `hammer` — invariant match, not exact TMS value. API: `returns products matching the search query` with `hammer`. | **Covered** (behavioral) |
| **TOOLSSHOP-15** | No results: enter query (example: **Laptop**), no items, message **"There are no products found."** | UI (+ API negative) | UI: `shows empty results state` uses non-matching literal; asserts zero visible cards, not exact message text. API: `returns 404 for non-matching query` is `test.skip` — live returned 200/empty vs documented 404. | **Partial** (UI behavioral; API blocked) |

### TMS consolidation notes

- Do not assume 1 Qase case = 1 Playwright test.
- Both cases share the same interaction flow (locate input → enter query → trigger search → verify results); automation splits positive match vs empty state as distinct scenarios.
- TMS steps click a **Search** button; `ProductsPage.searchFor()` submits via **Enter** on the input. Treat as behavioral equivalence if both trigger the same search request.
- Exact empty-state message (*"There are no products found."*) is not asserted; zero visible product cards only (aligned with product price-range empty-state pattern).
- Positive TMS example **Sheet Sander** vs automation **hammer**: same risk (visible name predicate); no duplicate test added for exact TMS string unless traceability requires it.

### TMS blocked / postponed

| Case / behavior | Reason |
|---|---|
| **TOOLSSHOP-15** API 404 no-match | OpenAPI documents 404 (`ItemNotFoundResponse`) for `/products/search`; live API returned 200 with empty `data[]`. Negative API scenario skipped until contract gap clarified. |
| **TOOLSSHOP-15** exact empty message text | TMS expects specific string; automation asserts structural empty state (no cards). Message wording may be flaky or environment-dependent. |
| `GET /products/search` without `q` or empty `q` | `q` required in OpenAPI; no documented 422/error body for this endpoint (unlike other search endpoints). |
| Search + sort/brand/category/price-range combined | Different endpoint (`GET /products`); out of search-field scope. |
| Visual search control / results checkpoints | Baseline approval not requested. |

## Coverage Matrix

- behavior: search control is visible and enabled inside filters panel on catalog page
  - risk: frontend interaction / discoverability regression
  - recommended level: UI
  - priority: smoke
  - reason: TMS step 1 in both cases; users must find and use search
  - duplicate coverage risk: low
  - TMS: TOOLSSHOP-15, TOOLSSHOP-16
  - notes: covered by `shows search control inside filters and it is enabled`

- behavior: submitting a matching query updates visible product list to only name-matching items
  - risk: user-facing search correctness and UI wiring
  - recommended level: UI
  - priority: smoke
  - reason: TMS TOOLSSHOP-16; browser-visible filtered cards
  - duplicate coverage risk: medium (API owns predicate; UI owns visible outcome)
  - TMS: TOOLSSHOP-16
  - notes: covered with `hammer`; behavioral equivalent to Sheet Sander

- behavior: submitting a non-matching query shows visible empty / no-results state
  - risk: empty-state UX
  - recommended level: UI
  - priority: regression
  - reason: TMS TOOLSSHOP-15; user-visible feedback when search finds nothing
  - duplicate coverage risk: low
  - TMS: TOOLSSHOP-15
  - notes: covered; message text not asserted

- behavior: `GET /products/search?q=<value>` returns 200 with products whose `name` matches query
  - risk: backend contract and name-match predicate drift
  - recommended level: API
  - priority: smoke
  - reason: lowest reliable level for search contract
  - duplicate coverage risk: low
  - notes: covered via `expectProductsMatchSearchQuery`

- behavior: `GET /products/search` with non-matching `q` returns 404 per documented responses
  - risk: documented negative contract for no-match
  - recommended level: API
  - priority: regression
  - reason: OpenAPI lists 404 for this endpoint
  - duplicate coverage risk: low
  - TMS: TOOLSSHOP-15 (API side)
  - notes: **blocked** — live behavior differs; test skipped

- behavior: `GET /products/search?q=...&page=N` returns requested page of search results
  - risk: pagination contract for search
  - recommended level: API
  - priority: regression
  - reason: `page` param documented; not in TMS but contract-critical
  - duplicate coverage risk: low
  - notes: covered; envelope-only if multi-page depth limited

- behavior: search response keeps standard paginated product envelope and item shape
  - risk: schema/contract drift
  - recommended level: schema-contract
  - priority: smoke
  - reason: reused listing shape across product endpoints
  - duplicate coverage risk: low
  - notes: via `expectPaginatedProductSearchResponse`

- behavior: search control and results layout (visual)
  - risk: visual layout regression
  - recommended level: visual checkpoint
  - priority: regression
  - reason: label, placeholder, alignment regressions
  - duplicate coverage risk: low
  - notes: postponed until baseline approval

## Smoke / Regression Split

- smoke:
  - UI: search control visible and enabled (TOOLSSHOP-15/16 step 1)
  - UI: matching query filters visible product names (TOOLSSHOP-16 behavioral)
  - API: `GET /products/search?q=hammer` — 200 + name predicate
  - schema-contract: paginated envelope via search response helper

- regression:
  - UI: non-matching query — zero visible cards (TOOLSSHOP-15 behavioral)
  - API: `page=1` pagination envelope
  - API: 404 no-match — **blocked** (contract gap)
  - visual checkpoints — postponed
  - not automated: missing/empty `q`; search + other filters

## API Coverage

### Ready to implement now

- scenarios: none — success match, pagination, and schema paths are **already implemented**
- reason: existing `product-search.api.spec.ts` covers documented success paths
- dependencies: API base URL; `expectPaginatedProductSearchResponse`; `expectProductsMatchSearchQuery`
- blockers: none for implemented success paths
- implementation decisions:
  - direct `request.get` in spec
  - reuse `paginatedProductSortingResponseSchema` for search envelope
  - invariant name predicate; no fixed product ids

### Blocked or postponed

- scenarios:
  - `GET /products/search?q=zzzznonexistentsearchterm98765` — expected 404 per OpenAPI
  - `GET /products/search` without `q` or with empty `q`
- reason:
  - 404: OpenAPI documents `ItemNotFoundResponse`; live returned 200 with empty `data[]` (see skipped test in spec)
  - missing `q`: no documented error status/body for this endpoint
- blocker or clarification needed:
  - confirm whether no-match should be 404 or 200 empty `data[]`
  - confirm status and body when `q` is omitted or empty

## API Implementation Brief

- scenario A: successful search with matches — **implemented**
  - endpoint: `/products/search`
  - method: `GET`
  - tags: `@api`, `@smoke`, `@search`, `@catalog`
  - payload/query source: inline `?q=hammer`
  - scenario data strategy: deterministic query; invariant on returned names
  - expected status: `200`
  - response assertions: non-empty `data`; all names contain query (normalized)
  - schema validation decision: `expectPaginatedProductSearchResponse`
  - negative coverage decision: n/a
  - boundary coverage decision: n/a
  - builder decision: none
  - API client decision: direct request
  - assertion helper decision: `product-search-response.assertion.ts`
  - contract gaps/blockers: none for success path

- scenario B: no-match returns 404 — **blocked (skipped)**
  - endpoint: `/products/search`
  - method: `GET`
  - tags: `@api`, `@regression`, `@search`, `@catalog`
  - payload/query source: `?q=zzzznonexistentsearchterm98765`
  - scenario data strategy: fixed non-matching literal
  - expected status: `404` (documented) vs live `200` empty
  - response assertions: blocked until contract clarified
  - schema validation decision: optional ItemNotFound schema when unblocked
  - negative coverage decision: documented but live mismatch
  - boundary coverage decision: n/a
  - builder decision: none
  - API client decision: direct request
  - assertion helper decision: add only if 404 body shape is standardized
  - contract gaps/blockers: OpenAPI vs live behavior for no-match
  - TMS: TOOLSSHOP-15

- scenario C: pagination on search — **implemented**
  - endpoint: `/products/search`
  - method: `GET`
  - tags: `@api`, `@regression`, `@search`, `@catalog`
  - payload/query source: `?q=hammer&page=1`
  - scenario data strategy: verify `current_page` when present
  - expected status: `200`
  - response assertions: pagination envelope; `current_page === 1` when field present
  - schema validation decision: reuse paginated schema helper
  - negative coverage decision: n/a
  - boundary coverage decision: optional `page` integer
  - builder decision: none
  - API client decision: direct request
  - assertion helper decision: reuse `expectPaginatedProductSearchResponse`
  - contract gaps/blockers: multi-page depth may be limited by live data

## UI Coverage

### Ready to implement now

- scenarios: none — three UI scenarios **already implemented** in `product-search.ui.spec.ts`
- reason: TMS TOOLSSHOP-15/16 intent covered with behavioral equivalence
- dependencies: `ProductsPage`; `expectVisibleNamesMatchQuery`; `applyAllureMetadata`
- blockers: none for current UI scope
- implementation decisions:
  - `test.step` for open → search → verify
  - wait for `/products/search` response matching query param
  - assertions in spec/helpers; Page Object exposes actions/readers only

### Blocked or postponed

- scenarios:
  - assert exact message *"There are no products found."* (TOOLSSHOP-15)
  - search using dedicated Search button click (if Enter is not equivalent in all browsers)
  - search combined with sort/brand/category/price-range filters
- reason: message text assertion deferred for stability; button vs Enter only if product requires button-specific behavior; combinations out of scope
- blocker or clarification needed: product owner confirmation if exact TMS message or button-only trigger must be asserted

## UI Implementation Brief

- scenario 1: search control ready — **implemented**
  - route/page: `/`
  - tags: `@ui`, `@smoke`, `@search`, `@catalog`
  - preconditions: none
  - test data: none
  - scenario data strategy: n/a
  - user steps: open catalog → wait ready → verify search input visible and enabled in filters
  - expected visible outcome: search control interactable
  - unique UI risk: discoverability and operability
  - why API/schema is not sufficient: API cannot prove browser control exists
  - recommended Page Object: `ProductsPage`
  - Page Object actions/readers: `open()`, `waitForReady()`, `searchInput`, `filtersPanel`
  - Component Object decision: keep in Page Object; extract SearchComponent only if reuse justifies
  - locator discovery notes: search inside `filtersPanel`; placeholder/role/textbox fallback chain
  - assertions in spec: visible + enabled
  - not covered in UI: backend contract
  - TMS: TOOLSSHOP-15, TOOLSSHOP-16 (step 1)

- scenario 2: successful search filters visible results — **implemented**
  - route/page: `/`
  - tags: `@ui`, `@smoke`, `@search`, `@catalog`
  - preconditions: catalog with searchable products
  - test data: `hammer` (stable live catalog term)
  - scenario data strategy: invariant — all visible names contain query (case-insensitive)
  - user steps: open → `searchFor("hammer")` → wait search response → read visible names
  - expected visible outcome: at least one card; all names match query
  - unique UI risk: control-to-results wiring in browser
  - why API/schema is not sufficient: only UI proves visible filtered cards after user action
  - recommended Page Object: `ProductsPage`
  - Page Object actions/readers: `searchFor()`, `getVisibleProductNames()`
  - Component Object decision: none
  - locator discovery notes: reuse product card name readers
  - assertions in spec: `expectVisibleNamesMatchQuery`
  - not covered in UI: 404 status, full response shape
  - TMS: TOOLSSHOP-16 (behavioral; TMS example Sheet Sander)

- scenario 3: no-match shows empty state — **implemented**
  - route/page: `/`
  - tags: `@ui`, `@regression`, `@search`, `@catalog`
  - preconditions: catalog ready
  - test data: `zzzznonexistentsearchterm98765`
  - scenario data strategy: fixed non-match literal
  - user steps: open → search non-matching term → wait response → verify no visible cards
  - expected visible outcome: zero visible product names (TMS also expects message text — not asserted)
  - unique UI risk: user sees empty catalog after failed search
  - why API/schema is not sufficient: empty visible state is browser-specific
  - recommended Page Object: `ProductsPage`
  - Page Object actions/readers: `searchFor()`, `getVisibleProductNames()`
  - Component Object decision: extract empty-state locator only if message assertion added later
  - locator discovery notes: absence of cards; optional future `no results` text locator
  - assertions in spec: `names` equals `[]`
  - not covered in UI: API 404 contract
  - TMS: TOOLSSHOP-15 (behavioral; TMS example Laptop)

## Visual Checkpoints

### Planned now

- none (baseline approval not requested)

### Postponed

- target UI state: filters panel with search input visible (default catalog)
  - screenshot scope: filters search section only
  - reason: label, placeholder, alignment regressions
  - dynamic content risks: surrounding filter controls
  - recommended tags: `@ui`, `@visual`, `@regression`, `@search`

- target UI state: catalog after successful search with results
  - screenshot scope: search control + limited product card region
  - reason: layout after search action
  - dynamic content risks: live product names, prices, images
  - recommended tags: `@ui`, `@visual`, `@regression`, `@search`

- target UI state: empty results after no-match search (TOOLSSHOP-15)
  - screenshot scope: search control + empty results area
  - reason: empty-state layout including message if stable
  - dynamic content risks: message text vs empty grid only
  - recommended tags: `@ui`, `@visual`, `@regression`, `@search`

## Schema / Contract Checks

### Planned now

- checks: paginated product envelope + item fields via `expectPaginatedProductSearchResponse` on success paths
- reason: search reuses standard product list shape
- dependencies: `paginatedProductSortingResponseSchema` (shared with sorting)

### Postponed

- checks: `ItemNotFoundResponse` body for 404 no-match
- reason postponed: live 404 behavior not confirmed; skipped API test

## Not Automated / Blockers

- API 404 for no-match query — OpenAPI vs live contract gap (TOOLSSHOP-15 API path)
- Missing or empty `q` on `/products/search` — no documented error contract
- Exact TMS empty message *"There are no products found."* — stability/traceability tradeoff
- Search + other catalog filters combined — out of scope; different API surface
- Visual checkpoints — baseline approval not requested
- Fuzzy/full-text search beyond name column — not in API contract

## Recommended Next Commands

- `/review-generated` — review existing `product-search` specs against this plan (no new implementation required for core TMS intent)
- `/align-plan-with-tms` — to refresh TMS mapping in this file after Qase changes; do not move TMS sections to `specs/search.md`
- `/heal-api-test` — when API owner clarifies 404 vs 200-empty for no-match
- `/implement-visual-checkpoint` — only after explicit baseline approval request
- Do not run `/implement-api-batch` or `/implement-ui-batch` for core TMS scenarios unless traceability requires exact TMS values or message assertions
