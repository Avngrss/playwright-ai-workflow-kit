# Todos — Todo list
- Ticket: none

## Coverage choice
- selected: ui
- reason: UI — every move stays in the browser (the list lives in localStorage, no requests on add, complete, filter or clear) · API — nothing of its own

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
- Level: UI · Tag: @regression @smoke · Role: none · TMS: —
- Needs: UI — the list and the counter on screen; no request
- Value: Core · Severity: Critical · Priority: P1
- Why: main scenario: write down what to do
- Status: ready to implement now
- Data: none — the test types its own todos in a fresh browser context
- Preconditions: none
- Steps:
  1. Add the todo "buy milk"
     - expect: the list shows "buy milk" and the counter "1 item left"
- Cleanup: none

### 2. A completed todo leaves the items-left counter
- Level: UI · Tag: @regression · Role: none · TMS: —
- Needs: UI — the completed mark and the counter on screen; no request
- Value: Core · Severity: Major · Priority: P1
- Why: main scenario: mark a todo done
- Status: ready to implement now
- Data: none — the test types its own todos in a fresh browser context
- Preconditions: none
- Steps:
  1. Add the todos "buy milk" and "walk the dog"
  2. Complete "buy milk"
     - expect: "buy milk" is shown completed and the counter says "1 item left"
- Cleanup: none

### 3. The Active and Completed filters show only their todos
- Level: UI · Tag: @regression · Role: none · TMS: —
- Needs: UI — the filtered list on screen; no request
- Value: Common · Severity: Major · Priority: P2
- Why: frequent scenario: see what is left
- Status: ready to implement now
- Data: none — the test types its own todos in a fresh browser context
- Preconditions: none
- Steps:
  1. Add "buy milk" and "walk the dog", complete "buy milk"
  2. Open Active
     - expect: only "walk the dog" is listed
  3. Open Completed
     - expect: only "buy milk" is listed
- Cleanup: none

### 4. Clear completed removes only the completed todos
- Level: UI · Tag: @regression · Role: none · TMS: —
- Needs: UI — the list on screen after the button; no request
- Value: Common · Severity: Major · Priority: P2
- Why: frequent scenario: tidy the list
- Status: ready to implement now
- Data: none — the test types its own todos in a fresh browser context
- Preconditions: none
- Steps:
  1. Add "buy milk" and "walk the dog", complete "buy milk"
  2. Clear completed
     - expect: only "walk the dog" is listed and the counter says "1 item left"
- Cleanup: none

### 5. A blank todo is not added
- Level: UI · Tag: @regression · Role: none · TMS: —
- Needs: UI — the list stays empty on screen; no request
- Value: Rare · Severity: Minor · Priority: P2
- Why: risk: empty rows in the list
- Status: ready to implement now
- Data: none — the test types into a fresh browser context
- Preconditions: none
- Steps:
  1. Submit a todo made only of spaces
     - expect: the list has no todos
- Cleanup: none

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

## UI brief
- page: the TodoMVC page `/`; actions: add a todo (type, Enter), complete (its checkbox), the filters All / Active / Completed, Clear completed; step names as the cases' steps
- Messages: none — the app shows no toasts; the counter `todo-count` ("1 item left", "2 items left") is the feedback
- Components: none — one page, the list and its footer
- Lands: none
- Locks: none — every test has its own browser context (localStorage), nothing is shared
