# Product Search Feature Coverage Plan

## Plan ownership

- role: **contract and coverage reference** (API-first; OpenAPI + UI risk model)
- owns: coverage matrix from contract/UI risks, API/UI implementation briefs, schema/visual planning detail
- TMS traceability: [`specs/product-search.md`](product-search.md) — Qase mapping, case status, current automation alignment
- do not add TMS Source or TMS Mapping here
- for implementation **status**, TMS decisions, and `/plan-from-tms` / `/align-plan-with-tms`, use `specs/product-search.md`

## Feature / Area

- name: Product search functionality (catalog UI search control + `GET /products/search` API)
- scope: contract/coverage reference; planning detail for `GET /products/search` and catalog UI search control
- UI target: [https://practicesoftwaretesting.com/](https://practicesoftwaretesting.com/)
- API contract source: [https://api.practicesoftwaretesting.com/api/documentation#/Product](https://api.practicesoftwaretesting.com/api/documentation#/Product)
- API contract JSON used for planning: [https://api.practicesoftwaretesting.com/docs?api-docs.json](https://api.practicesoftwaretesting.com/docs?api-docs.json)
- requirements/specs: none provided
- in scope:
  - UI search input/control located in the filters area of the main catalog page (`/`)
  - dedicated product search endpoint `GET /products/search?q=...`
  - name-based matching behavior (per API description: "Search is performed on the `name` column")
  - paginated search results
  - visible filtered product list or empty/no-results state in UI
  - documented success (200) for match path; no-match API behavior (404 vs 200 empty `data[]`) pending contract confirmation
- out of scope:
  - other search endpoints (`/brands/search`, `/categories/search`, `/users/search`, `/invoices/search`)
  - combining search with sort/brand/category/price-range filters on the main list (different endpoint)
  - search on description or other fields (contract limits to name)
  - authentication/authorization variants for search (public endpoint)
  - advanced full-text or fuzzy search semantics beyond documented name match

## Coverage Matrix

- behavior: search control (input) is visible and interactable inside the filters panel on the catalog page
  - risk: frontend interaction / discoverability regression
  - recommended level: UI
  - priority: smoke
  - reason: users must be able to find and use the primary discovery control
  - duplicate coverage risk: low
  - notes: assert stable visibility and enabled state only

- behavior: submitting a query that matches one or more products updates the visible product list to only matching items (name contains query, case-insensitive partial match expected)
  - risk: user-facing search result correctness and UI wiring
  - recommended level: UI
  - priority: smoke
  - reason: browser-visible outcome of search action; confirms integration between control and result rendering
  - duplicate coverage risk: medium (API owns predicate; UI owns visible filtered cards)
  - notes: use deterministic query that yields known results in live catalog (e.g. "hammer")

- behavior: submitting a query with no matches results in a visible empty or "no results" state for the user
  - risk: error/empty state UX
  - recommended level: UI
  - priority: regression
  - reason: empty result feedback is user-facing and cannot be fully proven at API level alone
  - duplicate coverage risk: low
  - notes: assert visible empty list or message after search; do not assert specific wording unless stable

- behavior: `GET /products/search?q=<value>` returns 200 with paginated products whose `name` matches the query
  - risk: backend contract and name-match predicate drift
  - recommended level: API
  - priority: smoke
  - reason: lowest reliable level for search contract and filtering predicate
  - duplicate coverage risk: low
  - notes: assert all returned items satisfy name contains query (normalized); use invariant checks

- behavior: `GET /products/search` with a non-matching `q` — documented 404 vs live behavior unclear
  - risk: documented negative contract for no-match case
  - recommended level: API
  - priority: regression
  - reason: OpenAPI lists 404 (`ItemNotFoundResponse`); live API may return 200 with empty `data[]`
  - duplicate coverage risk: low
  - notes: **blocked/postponed** — confirm with API owner before automating; see [`specs/product-search.md`](product-search.md) (skipped test in `product-search.api.spec.ts`)

- behavior: `GET /products/search?q=...&page=N` returns the requested page of search results
  - risk: pagination contract for search results
  - recommended level: API
  - priority: regression
  - reason: page param is explicitly documented; protects pagination envelope for search flow
  - duplicate coverage risk: low
  - notes: verify `current_page` and data subset; small page size in live data may limit depth

- behavior: search response keeps the standard `PaginatedProductResponse` shape (current_page, data[], per_page, total, ...)
  - risk: schema/contract drift affecting consumers of search results
  - recommended level: schema/contract
  - priority: smoke
  - reason: search reuses the same envelope and item shape as other product listings
  - duplicate coverage risk: low
  - notes: reuse/extend existing paginated product schema; include core item fields used by assertions (name, price, id)

- behavior: required `q` parameter validation (missing or empty q)
  - risk: input contract / required field enforcement
  - recommended level: not automated
  - priority: regression
  - reason: OpenAPI marks q as required but `/products/search` response definitions do not explicitly document 422/400 body for missing q (unlike some other search endpoints)
  - duplicate coverage risk: none
  - notes: blocked until contract clarifies exact status code and error body for missing/empty q

- behavior: visual layout of search control in default and after-query states
  - risk: visual layout regression in filter/search area
  - recommended level: visual checkpoint
  - priority: regression
  - reason: control placement and result list area can regress without breaking functional assertions
  - duplicate coverage risk: low
  - notes: dynamic product content must be masked or scoped narrowly; postponed until baseline approval requested

## Smoke / Regression Split

- smoke:
  - UI: search control is visible and enabled in filters panel
  - UI: a representative query (e.g. "hammer") visibly filters the product list to matching names
  - API: `GET /products/search?q=hammer` returns 200 with only matching names in `data[]`
  - schema/contract: search response envelope matches documented paginated product shape

- regression:
  - UI: no-match query produces visible empty/no-results state for the user
  - API: non-matching query — **blocked** (404 vs 200 empty `data[]` needs contract confirmation)
  - API: pagination via `page` param on search endpoint
  - visual checkpoints for search control and results area (postponed)
  - not automated: missing/empty `q` validation contract until clarified

## API Coverage

**Implementation status:** see [`specs/product-search.md`](product-search.md) for TMS-aligned automation status. Success and pagination paths are implemented; documented 404 no-match is blocked (OpenAPI vs live contract gap).

### Ready to implement now

- scenarios:
  - `GET /products/search?q=hammer` (or similar stable term) — 200, all `data[].name` contain the query (case-insensitive)
  - parameterized representative matches that return results (e.g. common tool terms present in catalog)
  - `GET /products/search?q=hammer&page=1` — returns paginated envelope with correct `current_page`
- reason: documented success and pagination paths; high user value
- dependencies:
  - stable API base from config
  - reusable paginated product schema + name predicate helper
- blockers: none for documented success and pagination paths
- implementation decisions:
  - direct `request.get` acceptable for first coverage
  - assert name predicate via normalized includes check (no reliance on fixed product ids)
  - reuse or lightly extend existing paginated product schema (see product-sorting.schema.ts pattern)
  - no dedicated builder required (plain string query)

### Blocked or postponed

- scenarios:
  - `GET /products/search?q=zzzznonexistentsearchterm98765` — no-match API behavior (documented 404 vs live 200 empty `data[]`)
  - `GET /products/search` without `q` (or `q=` empty) — expected status + error body
- reason:
  - no-match: OpenAPI documents `ItemNotFoundResponse` (404) for `/products/search`; live returned 200 with empty `data[]`. API test skipped until contract owner confirms expected behavior.
  - missing `q`: endpoint OpenAPI declares q required, but responses section for `/products/search` does not list 422/Unprocessable or specific error shape for missing q (other search endpoints do include 422)
- blocker or clarification needed:
  - confirm whether no-match should be 404 or 200 with empty `data[]`
  - confirm actual status code and response body when q is omitted or empty on this endpoint

## API Implementation Brief

- scenario A: successful search with matches
  - endpoint: `/products/search`
  - method: `GET`
  - tags: `@api`, `@smoke`
  - payload/query source: inline `?q=hammer` (or stable term known to match live data)
  - scenario data strategy: deterministic query string; assert invariant on returned names only
  - expected status: `200`
  - response assertions:
    - `data` is non-empty array
    - every item `name` (normalized) contains the search term
  - schema validation decision: validate via `expectPaginatedProductSearchResponse` (reuse/extend paginated schema + item name field)
  - negative coverage decision: n/a for this scenario
  - boundary coverage decision: n/a
  - builder decision: none (literal query value)
  - API client decision: direct request in spec for initial batch
  - assertion helper decision: add thin `expectProductsSearchResponse` delegating to shared Zod helper + name predicate assertion helper if repeated
  - contract gaps/blockers: none for success path

- scenario B: no-match returns 404 — **blocked (skipped)**
  - endpoint: `/products/search`
  - method: `GET`
  - tags: `@api`, `@regression`
  - payload/query source: `?q=zzzznonexistentsearchterm98765` (guaranteed no match)
  - scenario data strategy: fixed non-matching literal
  - expected status: `404` (documented) vs live `200` with empty `data[]`
  - response assertions: blocked until contract clarified
  - schema validation decision: optional `ItemNotFoundResponse` schema when unblocked
  - negative coverage decision: documented in OpenAPI but live behavior unclear
  - boundary coverage decision: n/a
  - builder decision: none
  - API client decision: direct request
  - assertion helper decision: add 404 body helper only if shape is standardized after confirmation
  - contract gaps/blockers: OpenAPI vs live behavior for no-match; status/TMS in [`specs/product-search.md`](product-search.md)

- scenario C: pagination on search
  - endpoint: `/products/search`
  - method: `GET`
  - tags: `@api`, `@regression`
  - payload/query source: `?q=hammer&page=1`
  - scenario data strategy: use a query known to return multiple pages if possible; otherwise verify envelope only
  - expected status: `200`
  - response assertions:
    - `current_page` matches requested page
    - standard pagination fields present
  - schema validation decision: reuse paginated schema
  - negative coverage decision: n/a
  - boundary coverage decision: page param documented as optional integer
  - builder decision: none
  - API client decision: direct
  - assertion helper decision: reuse paginated assertion helper
  - contract gaps/blockers: live data result size may make multi-page verification fragile — fall back to envelope shape only

## UI Coverage

### Ready to implement now

- scenarios:
  - search control visible and enabled inside filters panel (`@ui`, `@smoke`)
  - representative query filters visible product cards to only matching names (`@ui`, `@smoke`)
  - no-match query results in visible empty results state (`@ui`, `@regression`)
- reason: core discoverability + visible outcome coverage with clear user value
- dependencies:
  - ProductsPage extended with search actions/readers (or SearchComponent if extracted)
  - stable way to read visible product names after search
  - request/response waiting or URL/state check if search updates location
- blockers: none
- implementation decisions:
  - use `test.step` for phases: open catalog, enter query, trigger search, verify results
  - assert visible filtered names satisfy predicate (normalized includes)
  - keep search locators/actions in Page Object; assertions in spec
  - use live catalog data; choose queries that are stable across runs (common tool names)

### Blocked or postponed

- scenarios:
  - search + other filter combinations from UI (price range, brand, category, sort) applied together with search
- reason: `/products/search` endpoint only accepts q + page; main list filters use different endpoint (`/products`). Combination behavior is out of declared scope for this plan
- blocker or clarification needed: explicit requirement if cross-filter search behavior on the main catalog should be covered later

## UI Implementation Brief

- scenario 1: search control ready
  - route/page: `/` (catalog / home)
  - tags: `@ui`, `@smoke`, `@search`
  - preconditions: none
  - test data: none
  - scenario data strategy: n/a
  - user steps:
    - open catalog page
    - wait for filters panel and product grid ready
    - verify search input/control is visible and enabled
  - expected visible outcome: search control can receive input
  - unique UI risk: control discoverability and basic operability
  - why API/schema is not sufficient: API cannot prove the control exists or is usable in the browser UI
  - recommended Page Object: `ProductsPage` (already owns catalog filters and results)
  - Page Object actions/readers:
    - `open()`
    - `waitForReady()`
    - `search.enterQuery(query)`
    - `search.submit()` or trigger (enter key / button)
    - `getVisibleProductNames()`
  - Component Object decision: evaluate `SearchComponent` (or `SearchFilterComponent`) only if search block has multiple related locators/actions (input + clear + submit) and reuse justifies; otherwise keep inside ProductsPage for now
  - locator discovery notes: search control lives inside `filtersPanel` (`[data-test="filters"]`); look for `data-test` containing "search" or input near "Search" heading; prefer getByRole/getByLabel or stable test id per locator strategy
  - assertions in spec: control visible + enabled
  - not covered in UI: backend predicate correctness and 404 contract (owned by API)

- scenario 2: successful search filters visible results
  - route/page: `/`
  - tags: `@ui`, `@smoke`, `@search`
  - preconditions: catalog ready with at least one known searchable product
  - test data: deterministic query string that matches live data (e.g. "hammer")
  - scenario data strategy: invariant check — every visible name contains the query (case-insensitive)
  - user steps:
    - open catalog
    - enter query
    - trigger search
    - wait for results to update (product list or network)
    - read visible names
  - expected visible outcome: product cards shown have names matching the query; count may be smaller
  - unique UI risk: wiring from search control through to rendered results in browser
  - why API/schema is not sufficient: only UI proves the end-to-end user action produces visible filtered cards
  - recommended Page Object: `ProductsPage`
  - Page Object actions/readers: search entry + submit + `getVisibleProductNames()`
  - Component Object decision: same as scenario 1; product list readers already exist on page
  - locator discovery notes: reuse product card locators already present; avoid index-based selection
  - assertions in spec: names.length >= 1 and all satisfy normalized includes(query)
  - not covered in UI: exact backend status codes, full response shape, 404 behavior

- scenario 3: no-match search shows empty state
  - route/page: `/`
  - tags: `@ui`, `@regression`, `@search`
  - preconditions: catalog ready
  - test data: non-matching query literal unlikely to ever match
  - scenario data strategy: fixed non-match literal
  - user steps:
    - open catalog
    - enter non-matching query
    - trigger search
    - wait for results update
  - expected visible outcome: no product cards, or a clear empty/no-results indicator is visible
  - unique UI risk: user-visible empty state feedback
  - why API/schema is not sufficient: UI must prove the user sees an empty or informative state (wording, layout, or absence)
  - recommended Page Object: `ProductsPage`
  - Page Object actions/readers: search + `getVisibleProductNames()` or `isResultsEmpty()`
  - Component Object decision: if an empty-state component or message area becomes reusable, extract later
  - locator discovery notes: may be absence of cards or presence of a "no products" / empty message locator
  - assertions in spec: visible product count is 0 or empty-state marker is visible
  - not covered in UI: the 404 status contract (API owns)

## Visual Checkpoints

### Planned now

- none (baseline approval not requested)

### Postponed

- target UI state: default catalog with search input visible and empty
  - screenshot scope: filters panel search section only (avoid full page and dynamic product grid)
  - reason visual coverage is useful: catches search control label, placeholder, alignment regressions
  - dynamic content risks: surrounding filter values, promo content
  - recommended tags: `@ui`, `@visual`, `@regression`, `@search`

- target UI state: catalog after a successful search (results present)
  - screenshot scope: search control + first few product cards area (mask prices/names if variable)
  - reason: layout of results after search action
  - dynamic content risks: live product data, images, prices
  - recommended tags: `@ui`, `@visual`, `@regression`, `@search`
  - note: only if stable deterministic data or strong masking is available

## Schema / Contract Checks

### Planned now

- checks:
  - `GET /products/search` response validates against paginated product envelope (`current_page`, `data`, `per_page`, `total` and related pagination fields)
  - each `data[]` item includes at minimum `id`, `name`, `price` (fields needed for search assertions)
- reason: protects the contract shape already used by other product flows; search reuses the same envelope
- dependencies:
  - reuse or generalize `paginatedProductSortingResponseSchema` (or create a shared `paginatedProductResponseSchema`)
  - feature assertion helper `expectPaginatedProductSearchResponse` (thin wrapper over shared Zod helper)

### Postponed

- checks:
  - strict shape of 404 (ItemNotFound) body for search no-match case
- reason postponed: if a reusable not-found error schema is not yet extracted, or if body shape for 404 on search is not critical beyond status

## Not Automated / Blockers

- missing or empty `q` parameter behavior (status + body) is not automated because the published contract for `/products/search` does not explicitly document the error response for required parameter violations (unlike some sibling search endpoints that reference 422). Clarify with contract owner before adding coverage.
- search combined with main-list filters (brand, category, price range, sort) is out of scope because `/products/search` only supports q + page; main list filtering uses a different endpoint.
- unsupported query characters, extreme length, or SQL-injection style inputs are not automated (no contract definition for sanitization or error behavior).
- visual checkpoints postponed pending explicit baseline approval request per visual rules.

## Recommended Next Commands (Manual)

- `/implement-api-batch` or `/implement-ui-batch`
  - Feature plan: `specs/product-search.md` (status and TMS scope)
  - Contract/brief detail: `specs/search.md` (API/UI Implementation Brief sections)
  - Note: core TMS intent is already implemented; see product-search plan before adding coverage

- `/review-generated`
  - Focus: `product-search` specs against `specs/product-search.md`

- `/heal-api-test`
  - When API owner clarifies 404 vs 200-empty for no-match (see both plans)

- `/implement-visual-checkpoint` (only after explicit baseline approval request)
  - Contract detail: `specs/search.md` (Visual Checkpoints)
  - Status/TMS: `specs/product-search.md`

- `/plan-from-tms` or `/align-plan-with-tms`
  - Update `specs/product-search.md` only

- Optional future: `/create-fixture` or builder only if reusable search query datasets or precondition search data become justified.

## Implementation Notes (for future agents)

- Prefer extending `ProductsPage` for search actions initially.
- Run UI component discovery (via skill) before extracting a `SearchComponent`.
- Reuse existing product list readers where possible.
- Use normalized case-insensitive contains checks for name matching.
- Do not add `waitForTimeout`.
- Keep assertions in specs or dedicated assertion helpers; never in Page Objects.
- Follow visual rules: functional assertions before any screenshot; scope narrowly; use `@visual` + `@regression`.
- After changes: run impacted specs + relevant quality gate.

## Done Criteria Checklist (self-verification)

- [x] Each behavior has a recommended primary test level
- [x] Scope boundary clearly defined (product search only)
- [x] Source of truth identified (live UI + published OpenAPI)
- [x] In-scope / out-of-scope explicit
- [x] UI scenarios include unique user-facing risk and why API/schema is not sufficient
- [x] API covers contract, predicate, pagination (success paths)
- [x] Documented negative (404 no-match) marked blocked — 404 vs 200 empty `data[]` needs API owner confirmation
- [x] Boundary (required q) marked blocked with explicit reason
- [x] Visual checkpoints recommended only for meaningful states and marked postponed
- [x] Duplicate coverage avoided via responsibility split
- [x] Smoke/regression split documented
- [x] API and UI ready-to-implement coverage clearly listed
- [x] Blocked/postponed items have clear blocker descriptions
- [x] Implementation briefs are actionable (endpoint, tags, data strategy, assertions, decisions, gaps)
- [x] Schema decision reuses existing paginated product shape
- [x] No implementation details listed as standalone scenarios
- [x] Plan written to `specs/search.md` (contract reference); TMS traceability in `specs/product-search.md`
