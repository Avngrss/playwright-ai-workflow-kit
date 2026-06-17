# Sorting Items Feature Coverage Plan

## Feature / Area

- name: Sorting items (`/` catalog UI + `GET /products` API sorting query)
- scope: planning only; no implementation in this step
- UI target: [https://practicesoftwaretesting.com/](https://practicesoftwaretesting.com/)
- API contract source: [https://api.practicesoftwaretesting.com/api/documentation#/Product](https://api.practicesoftwaretesting.com/api/documentation#/Product)
- API contract JSON used for planning: [https://api.practicesoftwaretesting.com/docs?api-docs.json](https://api.practicesoftwaretesting.com/docs?api-docs.json)
- requirements/specs: none provided

## Coverage Matrix

- behavior: catalog page shows sorting control and it is interactable
  - risk: frontend interaction and discoverability regression
  - recommended level: UI
  - priority: smoke
  - reason: user must be able to access sorting from the browser UI
  - duplicate coverage risk: low
  - notes: assert stable control visibility and enabled state only

- behavior: sorting by `price,asc` orders visible product prices in non-decreasing order
  - risk: user-facing ranking logic
  - recommended level: UI
  - priority: smoke
  - reason: this is a core buyer-facing interaction and should be validated in browser context
  - duplicate coverage risk: medium
  - notes: UI verifies visible order; API verifies backend sort contract

- behavior: each visible sort option can be selected and maps to expected sort request/value
  - risk: user-facing control integration regression
  - recommended level: UI
  - priority: regression
  - reason: UI should prove dropdown interaction and browser request/value mapping without duplicating backend predicate matrix
  - duplicate coverage risk: low
  - notes: assert select value and matching `sort` query for each visible option

- behavior: `GET /products` supports documented `sort` values (`name,asc`, `name,desc`, `price,asc`, `price,desc`, `co2_rating,asc`, `co2_rating,desc`)
  - risk: backend contract and query behavior drift
  - recommended level: API
  - priority: smoke
  - reason: lowest reliable level for sort query behavior
  - duplicate coverage risk: low
  - notes: assert monotonic order in response `data[]`

- behavior: sorting remains consistent when combined with other documented query params (`by_brand`, `by_category`, `between`, `is_rental`)
  - risk: backend integration and query composition
  - recommended level: API
  - priority: regression
  - reason: backend behavior should be validated without browser-only noise
  - duplicate coverage risk: low
  - notes: treat as API-focused contract/integration coverage

- behavior: paginated product response contract remains stable for sorted requests
  - risk: schema/contract drift
  - recommended level: schema-contract
  - priority: smoke
  - reason: fast contract drift detection for fields used by sorting flows
  - duplicate coverage risk: low
  - notes: validate `current_page`, `data`, `per_page`, `total` and product item key fields

- behavior: invalid or unsupported `sort` value behavior
  - risk: undocumented negative contract assumptions
  - recommended level: not automated
  - priority: regression
  - reason: endpoint docs define `200/404/405` but do not define invalid-sort error contract
  - duplicate coverage risk: none
  - notes: postpone until contract owners clarify expected status/body

- behavior: visual stability of sorting UI states (control + sorted list header area)
  - risk: visual layout regression
  - recommended level: visual checkpoint
  - priority: regression
  - reason: sorting UI layout can regress without breaking functional assertions
  - duplicate coverage risk: low
  - notes: postpone baseline work until explicitly requested

## Smoke / Regression Split

- smoke:
  - UI: sorting control is visible and usable
  - UI: `price,asc` visibly sorts products in ascending price order
  - API: `GET /products` sorted request returns correctly ordered `data[]`
  - schema-contract: sorted response keeps paginated product response shape

- regression:
  - UI: each visible sort option is selectable and maps to expected request/value
  - API: sorting combined with filter/query parameters
  - visual checkpoint candidates for sort states
  - not automated: invalid `sort` behavior until contract clarification

## API Coverage Backlog

### First Batch

- scenarios:
  - `GET /products?sort=price,asc` monotonic ascending `price` in `data[]`
  - `GET /products?sort=name,asc` monotonic ascending `name` in `data[]`
  - parameterized extension in same suite for `price,desc`, `name,desc`, `co2_rating,asc`, and `co2_rating,desc`
- reason: highest-value documented sort contract with minimal setup
- dependencies:
  - stable API base URL from config
  - invariant helpers for numeric/string monotonic assertions
- blockers: none for documented success paths
- implementation decisions:
  - direct `request.get` in API specs is acceptable first
  - avoid asserting fixed products/counts from uncontrolled dataset

### Later Batch

- scenarios:
  - `sort=price,asc` + `between=price,min,max` still sorted by price
  - `sort=name,desc` + `by_brand=<id>` still sorted by name within filtered result
  - `sort=price,desc` + `is_rental=true` still sorted by price
- reason: validates composed-query behavior after baseline sort coverage
- dependencies:
  - deterministic query values that yield sufficient result size
  - optional seeded data strategy if environment data becomes sparse
- blockers:
  - some filter combinations may return too few comparable items to prove sorting
- implementation decisions:
  - mark case as inconclusive (not pass) when returned list has fewer than 2 comparable items

### Postponed

- scenarios:
  - invalid sort value contract (for example `sort=price,up`)
  - malformed sort format contract (for example `sort=unknown`)
- reason: contract does not explicitly document expected negative response behavior
- blocker or clarification needed:
  - expected status code(s) and response body for unsupported sort values

## UI Coverage Backlog

### First Batch

- scenarios:
  - scenario 1 (`@ui`, `@smoke`): sorting control visible and enabled on catalog page
  - scenario 2 (`@ui`, `@smoke`): apply `price,asc` and verify visible product prices are monotonic ascending
  - scenario 3 (`@ui`, `@regression`): each visible sort option is selectable and maps to expected selected value/request
- reason: best user-facing confidence for sorting with moderate implementation cost
- dependencies:
  - page object support for selecting sort option and reading visible names/prices
  - stable parsing of displayed price values
- blockers: none
- implementation decisions:
  - use invariant checks only (no fixed catalog snapshots)
  - keep sorting assertions in spec; page object exposes readers/actions only

### Later Batch

- scenarios:
  - scenario 4 (`@ui`, `@regression`): sorting persists/works after changing page in pagination
  - scenario 5 (`@ui`, `@regression`): sorting combined with category/brand filters from UI
- reason: important integration confidence after core sorting baseline
- dependencies:
  - deterministic route state for pagination/filter combinations
  - clear expected UX rule on whether sort should persist across interactions
- blockers:
  - persistence behavior across pagination/filter updates is not explicitly specified

### Postponed

- scenarios:
  - scenario 6 (`@ui`, `@regression`): sorting behavior for edge dataset states (very small result sets, ties-heavy sets)
- reason: unstable in shared live dataset; high flakiness risk without controlled data
- blocker or clarification needed:
  - approved data setup strategy for deterministic tie/edge-case scenarios

## Visual Checkpoints

### Planned Now

- none (baseline approval/update was not explicitly requested)

### Postponed

- target UI state: default catalog state with sort control visible
  - screenshot scope: sorting toolbar section only (avoid full page)
  - reason visual coverage is useful: catches alignment/label/control regressions in the sort area
  - dynamic content risks: promo banners, variable product cards, locale-dependent labels
  - recommended tags: `@ui`, `@visual`, `@regression`

- target UI state: catalog after selecting `price,desc`
  - screenshot scope: sorting toolbar + first row of product cards
  - reason visual coverage is useful: catches dropdown state and list-layout regressions after user action
  - dynamic content risks: live catalog content, price changes, asynchronous image loading
  - recommended tags: `@ui`, `@visual`, `@regression`

## Schema / Contract Checks

### Planned Now

- checks:
  - sorted `GET /products` response contains paginated envelope fields (`current_page`, `data`, `per_page`, `total`)
  - each `data[]` item includes core sortable fields used by tests (`name`, `price`)
- reason: protects essential response shape used by sorting scenarios
- dependencies:
  - schema assertion helper or direct typed assertions in API spec

### Postponed

- checks:
  - strict negative response contract for unsupported `sort` values
- reason postponed:
  - no explicit invalid-sort contract in published Product endpoint docs

## Not Automated / Blockers

- invalid `sort` negative behavior is not automated until API contract explicitly defines status/body for unsupported values.
- cross-page "global sorting guarantee" is not automated yet because API/UI docs do not explicitly define expected global semantics beyond current response/page.
- some filter+sort variants may be postponed per environment if result size is insufficient to prove monotonic order.

## API Implementation Brief

- scenario A: base sort contract (`price,asc`)
  - endpoint: `/products`
  - method: `GET`
  - tags: `@api`, `@smoke`
  - payload/query source: inline deterministic query param `sort=price,asc`
  - scenario data strategy: use live data; assert monotonic invariant only
  - expected status: `200`
  - response assertions:
    - `data` is an array with comparable `price` values
    - values are monotonic ascending
  - builder decision: no builder required
  - API client decision: direct request usage first batch
  - assertion helper decision: add reusable monotonic helpers if repeated
  - contract gaps/blockers: none for success path

- scenario B: base sort contract (`name,asc`)
  - endpoint: `/products`
  - method: `GET`
  - tags: `@api`, `@smoke`
  - payload/query source: inline deterministic query param `sort=name,asc`
  - scenario data strategy: normalize names (case/whitespace) before compare
  - expected status: `200`
  - response assertions:
    - `data` contains comparable `name` strings
    - values are monotonic ascending
  - builder decision: no builder required
  - API client decision: same as scenario A
  - assertion helper decision: reuse string monotonic helper
  - contract gaps/blockers: none for success path

- scenario C: documented sort variants parameterized (`price,desc`, `name,desc`, `co2_rating,asc`, `co2_rating,desc`)
  - endpoint: `/products`
  - method: `GET`
  - tags: `@api`, `@regression`
  - payload/query source: parameterized list of documented sort values
  - scenario data strategy: single table-driven suite
  - expected status: `200`
  - response assertions:
    - monotonic invariant by selected sortable field and direction (asc/desc)
  - builder decision: none
  - API client decision: same as first batch
  - assertion helper decision: shared comparator dispatcher by sort key
  - contract gaps/blockers: none

- scenario D: composed query sort + filters
  - endpoint: `/products`
  - method: `GET`
  - tags: `@api`, `@regression`
  - payload/query source: `sort` with one filter (`by_brand` / `between` / `is_rental`)
  - scenario data strategy: pick combinations with at least 2 comparable items
  - expected status: `200`
  - response assertions:
    - returned items satisfy chosen filter
    - selected sort invariant still holds
  - builder decision: none
  - API client decision: optional thin product client if query composition repeats
  - assertion helper decision: reuse sortable invariant + filter predicate assertions
  - contract gaps/blockers: deterministic data availability for some filter values

## UI Implementation Brief

- scenario 1: sorting control ready
  - route/page: `/`
  - tags: `@ui`, `@smoke`
  - preconditions: none
  - test data: none
  - scenario data strategy: n/a
  - user steps:
    - open catalog page
    - wait for product grid readiness marker
    - verify sorting control is visible and enabled
  - expected visible outcome: sorting control can be opened/selected
  - recommended Page Object: `HomePage` or `ProductsPage` (follow existing project naming)
  - Page Object actions/readers:
    - `open()`
    - `waitForReady()`
    - `sorting.selectByValue(value)`
    - readers for visible prices/names
  - Component Object decision: likely `SortComponent` if sorting UI has multiple related locators/actions
  - locator discovery notes: prefer semantic/test-id locators from current catalog toolbar
  - assertions in spec: control visible/enabled and not blocked
  - not covered in UI: backend response schema/status guarantees

- scenario 2: `price,asc` sorting from UI
  - route/page: `/`
  - tags: `@ui`, `@smoke`
  - preconditions: enough loaded products with comparable prices
  - test data: live catalog prices parsed from visible cards
  - scenario data strategy: invariant-based check only
  - user steps:
    - open catalog
    - select `price,asc`
    - read visible prices
  - expected visible outcome: visible prices are monotonic ascending
  - recommended Page Object: same page object as scenario 1
  - Page Object actions/readers: sort selection + `getVisiblePrices()`
  - Component Object decision: use sorting/product-list components only if they reduce duplication
  - locator discovery notes: avoid fragile CSS indexes for cards
  - assertions in spec: `prices.length > 1` and monotonic ascending
  - not covered in UI: API contract for query params and status codes

- scenario 3: verify each visible sort option selection and request/value mapping
  - route/page: `/`
  - tags: `@ui`, `@regression`
  - preconditions: catalog and sort dropdown are ready
  - test data: table-driven visible sort option values
  - scenario data strategy: one parameterized scenario for selectability + mapping behavior
  - user steps:
    - select sort option
    - wait for matching products request with expected `sort` query value
    - verify selected sort control value
  - expected visible outcome: dropdown remains usable and selected option maps to expected backend query
  - recommended Page Object: same catalog page object
  - Page Object actions/readers: `selectSort`
  - Component Object decision: `SortComponent` + `ProductListComponent` if page object grows too large
  - locator discovery notes: prefer stable sort control locator and deterministic request matching
  - assertions in spec: selected value + matching request mapping only
  - not covered in UI: per-option sorted-order predicate guarantees owned by API tests

- scenario 4: sorting with pagination/filter interaction (later batch)
  - route/page: `/`
  - tags: `@ui`, `@regression`
  - preconditions: pagination/filter controls available and stable
  - test data: selected filter values producing >1 results
  - scenario data strategy: start with one stable combination and expand later
  - user steps:
    - apply sort
    - paginate or apply filter
    - verify sorting invariant in resulting visible list
  - expected visible outcome: visible list still respects selected sort
  - recommended Page Object: catalog page object with pagination/filter composition
  - Page Object actions/readers: pagination/filter actions + sort/value readers
  - Component Object decision: extract components if reuse becomes clear
  - locator discovery notes: separate sorting assertions from filter predicate assertions
  - assertions in spec: selected behavior-specific invariant only
  - not covered in UI: full backend query contract matrix

## Recommended Next Commands (Manual)

- `/implement-api-batch`
  - Feature plan: `specs/sorting-items.md`
  - Batch: `First Batch`
  - API contract: `https://api.practicesoftwaretesting.com/api/documentation#/Product`

- `/implement-ui-batch`
  - Feature plan: `specs/sorting-items.md`
  - Batch: `First Batch`

- `/implement-api-batch`
  - Feature plan: `specs/sorting-items.md`
  - Batch: `Later Batch`

- `/implement-ui-batch`
  - Feature plan: `specs/sorting-items.md`
  - Batch: `Later Batch`

- `/implement-visual-checkpoint` (only after explicit baseline approval request)
  - Feature plan: `specs/sorting-items.md`
  - Section: `Visual Checkpoints -> Postponed`
