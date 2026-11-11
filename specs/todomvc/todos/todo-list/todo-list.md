# Todos — Todo list
- Ticket: none

## Owners
- this run: auto
- found: UI 5 · API 0 · E2E 0 — none: the app sends no request (adding, completing, filtering and clearing stay in the browser; the list lives in localStorage), so every result is on this screen

## Scope
- in: add a todo, complete it, the Active / Completed filters, Clear completed, a blank entry
- out: editing a todo, the list after a reload (Not now)

## Feature Targets (from specs/project-map.md)
- UI app: todomvc-web / env UI_BASE_URL
- API service: none

## Auth (from map)
- auth as: none · role: none

## Test cases

### 1. A typed todo appears in the list and in the counter
- Level: UI — the list and its counter on this screen · Tag: @regression @smoke · Role: none · TMS: —
- Route: no-request · screen list=value
- Value: Core · Severity: Critical · Priority: P1
- Why: main scenario: write down what to do
- Status: ready to implement now
- Data: none — the test types its own todo in a fresh browser context
- Preconditions: none
- Steps:
  1. Add the todo "buy milk"
     - expect: the list shows "buy milk" and the counter "1 item left"
- Cleanup: none — the list lives in the test's own browser context and goes with it

### 2. A completed todo leaves the items-left counter
- Level: UI — the mark and the counter on this screen · Tag: @regression · Role: none · TMS: —
- Route: no-request · screen list=value
- Value: Core · Severity: Major · Priority: P1
- Why: main scenario: mark a todo done
- Status: ready to implement now
- Data: UI setup — the test adds its own two todos first (no endpoint: the list lives in the browser)
- Preconditions: "buy milk" and "walk the dog" in the list, neither done
- Steps:
  1. Complete "buy milk"
     - expect: "buy milk" is shown completed and the counter says "1 item left"
- Cleanup: none — the list lives in the test's own browser context and goes with it

### 3. The Active and Completed filters show only their todos
- Level: UI — the filtered list on this screen · Tag: @regression · Role: none · TMS: —
- Route (step 1): no-request · screen list=value
- Route (step 2): no-request · screen list=value
- Value: Common · Severity: Major · Priority: P2
- Why: frequent scenario: see what is left
- Status: ready to implement now
- Data: UI setup — the test adds its own todos and completes one (no endpoint: the list lives in the browser); the same list as #4
- Preconditions: "buy milk" done and "walk the dog" still to do
- Steps:
  1. Open Active
     - expect: only "walk the dog" is listed, the counter says "1 item left"
  2. Open Completed
     - expect: only "buy milk" is listed, shown completed, the counter says "1 item left"
- Cleanup: none — the list lives in the test's own browser context and goes with it

### 4. Clear completed removes only the completed todos
- Level: UI — the list left on this screen · Tag: @regression · Role: none · TMS: —
- Route: no-request · screen list=value
- Value: Common · Severity: Major · Priority: P2
- Why: frequent scenario: tidy the list
- Status: ready to implement now
- Data: UI setup — the test adds its own todos and completes one (no endpoint: the list lives in the browser); the same list as #3
- Preconditions: "buy milk" done and "walk the dog" still to do
- Steps:
  1. Clear completed
     - expect: only "walk the dog" is listed and the counter says "1 item left"
- Cleanup: none — the list lives in the test's own browser context and goes with it

### 5. A blank todo is not added
- Level: UI — the field refuses it on this screen · Tag: @regression · Role: none · TMS: —
- Route: no-request · screen list=value
- Value: Rare · Severity: Minor · Priority: P2
- Why: risk: empty rows in the list
- Status: ready to implement now
- Data: none — the test types into a fresh browser context
- Preconditions: none
- Steps:
  1. Submit a todo made only of spaces
     - expect: the list has no todos
- Cleanup: none — the list lives in the test's own browser context and goes with it

## Browsers, phone, screenshots
- browsers: none — 0 date, time, file, colour, range, editable or draggable controls; the cases drive a text field, checkboxes, links and a button
- phone: none — at 393 px the new-todo field, the checkboxes, the filters, Clear completed and the counter stay visible and uncovered; the filters only wrap to a second row
- screenshots: none — one plain list with texts the tests type; the completed mark is asserted in #2 through its state; no form, dialog, empty or error state whose look matters

## Not now
- Editing a todo by double-click · TMS: — · Postponed since 2026-10-23 — P3, low risk
- The list survives a reload · TMS: — · Postponed since 2026-10-23 — P3, low risk

## Change log
- 2026-10-23 — new plan — cases affected: none, new plan
- 2026-10-29 — browsers, phone and screenshots decided from the probe of the live screen — cases affected: none
- 2026-11-06 — routed (the kit's layer routing, a rule change): `## Owners`, one owner and a `no-request` route per scenario — live, adding, completing, filtering and clearing send no request; the todos #2–#4 start from moved from their steps to Preconditions (`Data: UI setup`) — cases affected: #1–#5, their checks unchanged

## UI brief
- page: the TodoMVC page `/`; actions: add a todo (type, Enter), complete (its checkbox), the filters All / Active / Completed, Clear completed; step names as the cases' steps
- the `list` block of the routes: the titles shown, the completed ones among them and the counter — one reader
- Messages: none — the app shows no toasts; the counter `todo-count` ("1 item left", "2 items left") is the feedback
- Components: none — one page, the list and its footer
- Lands: none
- Locks: none — every test has its own browser context (localStorage), nothing is shared
