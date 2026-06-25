# Product Price Range Feature Coverage Plan

## Feature / Area

- name: Product price range slider (`/` catalog UI + `GET /products` `between` query)
- scope: price-range slider only; implementation synchronized with current API/UI specs
- UI target: [https://practicesoftwaretesting.com/](https://practicesoftwaretesting.com/)
- API contract source: [https://api.practicesoftwaretesting.com/api/documentation#/Product/getProducts](https://api.practicesoftwaretesting.com/api/documentation#/Product/getProducts)
- API contract JSON: [https://api.practicesoftwaretesting.com/docs?api-docs.json](https://api.practicesoftwaretesting.com/docs?api-docs.json)
- requirements/specs: none provided
- in scope: price-range slider behavior and `between=price,min,max` API mapping
- out of scope: brand/category/rental filters, sorting behavior, combined filter+sort coverage, unrelated catalog controls

## TMS Source

- provider: Qase (read-only)
- project code: `TOOLSSHOP`
- parent suite: `Products` (suite id 20)
- suite: **Range items** (suite id 5)
- suite case count: 4
- source type: UI / manual, risk-based
- preconditions (all cases): navigate to https://practicesoftwaretesting.com/

## TMS Mapping

| Qase case | Intent | Automation level | Playwright mapping | Status |
|---|---|---|---|---|
| **TOOLSSHOP-11** | Positive filtering 50–150 | UI + API | UI: covered by existing representative range tests (`20–80` smoke/regression); behavioral equivalence, not exact TMS values. API: optional `price,50,150` predicate (not added — existing positive API cases sufficient). | **Covered** (behavioral) |
| **TOOLSSHOP-12** | Empty results for range 0–1 | UI + API | UI: parameterized empty-range test (`price,0,1`). API: `GET /products?between=price,0,1` → 200 + empty `data[]`. | **Covered** |
| **TOOLSSHOP-13** | Empty results for range 200–200 | UI + API | UI: **blocked** — catalog slider `aria-valuemax` is below 200; handles cannot reach TMS values. API: `GET /products?between=price,200,200` → 200 + empty `data[]`. | **Partial** (API only) |
| **TOOLSSHOP-14** | Reverse range 150–50 normalizes to 50–150 | UI | Requires slider interaction with `min > max`; `ProductsPage.setPriceRange` rejects reversed bounds; API reversed-bound contract undocumented. | **Blocked/postponed** |

### TMS consolidation notes

- Do not assume 1 Qase case = 1 Playwright test.
- TOOLSSHOP-12 and TOOLSSHOP-13 share empty-catalog intent; UI parameterized test covers `0–1` only. TOOLSSHOP-13 UI blocked because slider max bound is below 200.
- TOOLSSHOP-11 positive filtering is already covered by existing smoke/regression tests with different constants; no duplicate TMS-value test added.
- Exact empty-state message text (*"There are no products found."*) is not asserted; zero visible product cards only (aligned with product search empty-state pattern).

### TMS blocked / postponed

| Case / behavior | Reason |
|---|---|
| **TOOLSSHOP-14** reverse range 150–50 UI auto-swap | No safe PO interaction path without new handle-level API; `setPriceRange` throws when `min > max`. Needs product-owner confirmation of expected UX before automation. |
| Malformed `between` API (non-numeric, reversed bounds via API) | OpenAPI documents format only; no status/body contract for invalid values. |
| **TOOLSSHOP-13** UI empty range 200–200 | Catalog slider max bound (~162) is below TMS target 200; `setPriceRange` cannot reach value. API empty path still covered. |
| Visual slider checkpoints | Baseline approval not requested. |
| Filter + sort/brand/category combinations | Out of scope for price-range baseline. |

## Coverage Matrix

- behavior: price-range slider control is visible and operable on catalog page
  - risk: frontend interaction and discoverability regression
  - recommended level: UI
  - priority: smoke
  - reason: user must access the filter control in the browser
  - duplicate coverage risk: low

- behavior: applying slider range sends `GET /products` with `between=price,min,max`
  - risk: UI-to-API wiring regression
  - recommended level: UI
  - priority: regression
  - reason: slider state to network query is UI integration behavior
  - duplicate coverage risk: low

- behavior: after applying range, visible product card prices satisfy `min <= price <= max`
  - risk: user-visible filtering correctness
  - recommended level: UI
  - priority: smoke
  - reason: confirms browser-rendered result set reflects selected range
  - duplicate coverage risk: medium (API covers backend predicate; UI covers visible outcome)

- behavior: `GET /products?between=price,min,max` returns only products with `price` inside range
  - risk: backend filter predicate drift
  - recommended level: API
  - priority: smoke
  - reason: lowest reliable level for price predicate contract
  - duplicate coverage risk: low

- behavior: ranged `/products` response keeps paginated product envelope and numeric `price` fields
  - risk: schema/contract drift breaking filter assertions
  - recommended level: schema-contract
  - priority: smoke
  - reason: fast contract guard for fields used by price-range tests
  - duplicate coverage risk: low

- behavior: empty `between` range returns no matching products (success path)
  - risk: empty-result contract drift for impossible ranges
  - recommended level: API + UI
  - priority: regression
  - reason: TMS TOOLSSHOP-12/13; documented success response with empty `data[]`
  - duplicate coverage risk: low
  - TMS: TOOLSSHOP-12, TOOLSSHOP-13

- behavior: reverse slider range auto-normalization (150–50 → 50–150)
  - risk: edge-case UX regression
  - recommended level: UI
  - priority: regression
  - reason: TMS TOOLSSHOP-14
  - duplicate coverage risk: none
  - notes: blocked/postponed — no safe PO path; API contract unclear
  - TMS: TOOLSSHOP-14 (blocked)

- behavior: malformed `between` input handling (non-numeric min/max, reversed bounds semantics)
  - risk: undocumented negative contract assumptions
  - recommended level: not automated
  - priority: regression
  - reason: OpenAPI documents `between` format but not expected status/body for invalid values
  - duplicate coverage risk: none

- behavior: slider visual layout/state after range selection
  - risk: visual layout regression
  - recommended level: visual checkpoint
  - priority: regression
  - reason: handle positions/labels can regress without breaking functional checks
  - duplicate coverage risk: low
  - notes: postponed until explicit baseline approval

## Smoke / Regression Split

- smoke:
  - UI: slider control is visible and actionable
  - UI: applying representative range filters visible cards to in-range prices
  - API: `between=price,min,max` returns only in-range prices
  - schema-contract: paginated envelope + numeric `price` for ranged response

- regression:
  - UI: slider state maps to expected `between` query in outbound request
  - UI: empty price range `0-1` shows no visible product cards (TOOLSSHOP-12)
  - UI: TOOLSSHOP-13 (`200-200`) blocked — slider bounds
  - API: empty `data[]` for `between=price,0,1` and `between=price,200,200`
  - blocked/postponed: reverse range UI (TOOLSSHOP-14)
  - visual checkpoint candidates for slider states (postponed)
  - not automated: malformed `between` behavior until contract clarification

## API Coverage

### Ready to implement now

- scenarios:
  - `GET /products?between=price,10,100` — all returned prices in `[10,100]`
  - `GET /products?between=price,20,80` — all returned prices in `[20,80]`
  - `GET /products?between=price,0,1` — empty `data[]` (TOOLSSHOP-12)
  - `GET /products?between=price,200,200` — empty `data[]` (TOOLSSHOP-13)
- reason: documented parameter with stable success-path behavior
- dependencies: API base URL config; `expectProductsWithinPriceRange` helper
- blockers: none for documented success paths
- implementation decisions:
  - direct `request.get` in spec
  - reuse paginated product schema via `expectPaginatedProductPriceRangeResponse`
  - invariant assertions only; no fixed counts or product lists

### Blocked or postponed

- scenarios:
  - `between=price,abc,100` (non-numeric min)
  - `between=price,10,abc` (non-numeric max)
  - `between=price,100,10` (reversed bounds via API)
  - `between=price,150,50` (reversed bounds via API — TOOLSSHOP-14 API side)
  - unsupported `between` field values beyond documented `price,min,max` format
- reason: API docs do not define expected status code or response body for malformed `between` values
- blocker or clarification needed: product/API owner confirmation of expected status and error body for invalid range queries

## UI Coverage

### Ready to implement now

- scenarios:
  - slider controls visible and focusable (`@ui`, `@filtering`, `@catalog`, `@smoke`)
  - representative range `20-80` filters visible card prices to in-range values (`@smoke`) — behavioral cover for TOOLSSHOP-11
  - selected range maps to `between=price,20,80` in products request (`@regression`)
  - empty range `0-1` shows no visible product cards (`@regression`; TOOLSSHOP-12)
  - TOOLSSHOP-13 UI (`200-200`) blocked — slider cannot reach 200
- reason: highest-value user-facing and UI-integration coverage for this feature
- dependencies: `ProductsPage` price-range locators/actions; `expectPricesWithinRange` UI helper
- blockers: none
- implementation decisions:
  - poll waits for visible products only; range predicate asserted via helper
  - assertions in spec/helpers; page object exposes actions/readers only

### Blocked or postponed

- scenarios:
  - reverse range 150–50 auto-normalizes to 50–150 (TOOLSSHOP-14)
  - slider accessibility/keyboard-only interaction matrix
  - cross-control interactions with sort/brand/category filters
- reason: TOOLSSHOP-14 blocked — `ProductsPage.setPriceRange` rejects `min > max`; needs handle-level interaction design. Other items out of scope for price-range baseline.
- blocker or clarification needed: product owner confirmation of reverse-range UX; explicit requirement if accessibility or combination coverage is needed later

## Visual Checkpoints

### Planned now

- none (baseline approval not requested)

### Postponed

- default slider state on catalog page (slider/filter area scope; tags: `@ui`, `@visual`, `@regression`)
- slider after applying non-default range (slider/filter area scope; tags: `@ui`, `@visual`, `@regression`)

## Schema / Contract Checks

### Planned now

- validate ranged `/products` response envelope (`current_page`, `data`, `per_page`, `total`, optional pagination fields)
- validate each `data[]` item includes numeric `price`
- implementation: reuse `paginatedProductSortingResponseSchema` through `expectPaginatedProductPriceRangeResponse`

### Postponed

- strict negative-schema expectations for malformed `between` responses

## Not Automated / Blockers

- **TOOLSSHOP-13** UI empty range 200–200: blocked — slider max bound below 200
- **TOOLSSHOP-14** reverse range UI (150–50 → 50–150): blocked — no safe PO interaction path without new methods
- malformed `between` negative behavior is not automated until API contract explicitly defines status/body
- exact empty-state message text is not automated (TMS example only)
- visual checkpoints postponed until explicit baseline approval
- filter+sort, filter+brand, filter+category combinations are intentionally out of scope

## Implemented Files

- API spec: `tests/api/products/product-price-range.api.spec.ts`
- UI spec: `tests/ui/products/product-price-range.ui.spec.ts`
- API assertions: `src/test/assertions/api/product-price-range-response.assertion.ts`
- UI assertions: `src/test/assertions/ui/product-price-range-ui.assertion.ts`
- Page Object: `src/test/pages/products.page.ts` (price-range locators and actions)

## Recommended Next Commands (Manual)

- `/implement-visual-checkpoint` (only after explicit baseline approval)
  - Feature plan: `specs/product-price-range.md`
  - Scope: Visual Checkpoints → Postponed
