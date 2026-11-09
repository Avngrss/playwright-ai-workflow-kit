# Layer Routing Algorithm

A layer routing algorithm for the tests an agent writes. In this kit it is **switched on**: the rules (`.cursor/rules/plans.mdc` §Layers and §Routes), the skills and the gate (`scripts/gate/routes.mjs`, `cases.mjs`, `repeats.mjs`) work by it, and the coverage report (`scripts/agent/suite-coverage.mjs`) counts by it. Below is the syntax in use; the document can be taken to another project and applied there (§15).

The examples with an order, a payment and a discount are neutral. They hold the formula and do not describe a product. A real manual case is worked through in §18.

## 1. What this solves

A manual case is almost always written as behaviour on the screen: a person clicked "Pay" and saw that the order is paid. In automation such a step has two different goals, and they need different tools:

| Goal | Question | Tool |
|---|---|---|
| Change the state | How does the user do it? | UI: a click, typing, a form |
| Confirm the data | What did the server compute and store? | The answer this gesture already caused |
| Confirm the rendering | Did the browser show a known value? | A locator, a text, a control's state |

The linear scheme "action → look at the screen" breaks when the agent is afraid to miss a check and proves the same outcome twice: by eye and by a separate request, often by a second spec as well. The result is a duplicate. Coverage does not grow: the second pass repeats the first.

The algorithm breaks this link. A case has one owner and one test. Inside the test each step goes down a tree: setup through the API, the gesture through the UI, the truth from this gesture's answer, the screen only as a reflection of data already known.

The short formula: the UI answers for "how". The expected values come from the case data. The intercepted answer proves that the server stored them. The screen proves that the browser rendered them. A separate API test exists only when the risk is not on this screen: a rule's matrix, access, the contract.

## 2. Why it is worth doing

The agent already sees the ban "do not check the same thing twice" and still writes a duplicate. As long as the system rewards the second tick, the agent will keep adding it. It makes sense to move the ban from the prompt into the plan's data and into the gate: a second spec for the same case and a "toast only" check become red, not "undesirable".

What it gives:

- One user scenario no longer lives in two files.
- The scenario's business fields are still checked — in the body of the answer the click produced. Dropping the `API+UI` layer does not throw out the data check.
- The screen is checked on its own, so the bug "the server stored it right, the browser showed the old value" is not lost.
- The rule matrix (other amounts, someone else's data, `403`) stays on the API and does not bloat the UI.
- The run is shorter and steadier: no second scenario in the browser and no extra GET "just in case".
- The coverage table stops lying. A dash in the API column of a UI case means "there is no twin", not "nobody looked at the data".

## 3. Why the agent duplicates although the rule already exists

Before the algorithm was switched on in this kit, the contradiction was built into the code. Look for the same pattern in another project, even when its files are named differently.

The prose said "each side once" and "a UI case checks the screen, not the stored data". Three other mechanisms were stronger:

1. **The gate required every layer of `Needs:`.** `scripts/gate/cases.mjs` failed when a ready case had API and UI in `Needs:` and one of them had no test with that id; the coverage report counted the case `automated` only with both ticks. The agent closed the gate with two tests of the same meaning.
2. **The plan itself gave one outcome two layers.** The rules line "a server rule the screen shows" demanded an API test for the rule and, separately, a UI test that the screen showed the answer. Next to it: an action with a message checks the exact text **and** what the action left. The second half read as "go and fetch the data once more".
3. **A second test for the same id was made legal by its title.** `repeats.mjs` counted as a duplicate only two tests with the same part after ` — `, and the rules taught to name the halves like this: `— the server stores it` / `— the account shows it`.

The planning order finished the job: first an API draft for the scenario, then the question "what does the UI prove beyond the API". The answer "the user sees it" produced a twin. And there was nothing to check the intercepted answer with: `expectJson` takes an API client's answer, not the browser's, so the agent went for a repeated GET.

A paragraph in the skill lost to these mechanisms. So they were removed, and the agent was given a tree and a tool: `answerTo` takes the gesture's answer and checks it right there (§5).

## 4. The idea

A case (a TMS case, an AC) splits into **scenarios** — obligations that fail separately (§18): "the address is saved and shown in the list" is one, "another customer cannot read it" is another. A scenario is a plan block and a test with its own title `TC-101 · S2 · <what it proves>`; a case of one obligation is one block without `S<n>`.

A scenario has one owner: `API`, `UI` or `E2E`. The owner is the `Level` field, with a reason: where the case looks for the result (`- Level: UI — the result is on the same screen`). No second field `Owner` is added — two fields would drift apart again.

| Where the case looks for the result | Owner |
|---|---|
| on the screen of the feature where the action happened | UI |
| somewhere else — another feature, role or app: the action here, the result there | E2E |
| on no screen: another input of a rule, access the screen does not try, the contract, a file's content, a refusal with no screen of its own | API |

`Needs:` is not written. Instead of a list of layers a scenario has a `Route:` line — where the proof comes from (several steps — a line per step, §7). The file's layer and the `Route` must agree:

- `Route` starts with `api` → the test lives in `tests/api`, `Level: API`.
- `Route` is `intercept`, `no-request` or `screen-only` → the test lives in `tests/ui` or, when the result is somewhere else, in `tests/e2e`.

A plan written before routing (`Needs:`, API + UI pairs) does not fail the gate but gets a warning, and the coverage report marks it `to rework`: such a feature is reworked whole at the first refresh of its plan.

E2E does not disappear and does not become "just UI". Only the decision to write one outcome twice disappears. Inside a journey the same tree works.

Data setup is not `Route`. It is still `Data:` and the preconditions. `Route` describes what proves the case.

## 5. The decision tree

The agent does not pick a layer by eye. For each step of the case there is one question.

### Setup

Is data needed before the user starts? Create it through the API or a fixture. Clicking through menus for setup is not allowed: it is slow and brittle, and it is not the case's scenario.

An exception the kit already has, and it must stay: there is no endpoint. Then `Data: UI setup` is an honest path; it goes up to the last save and does not count as a check of the case. Sign-in is a fixture, not steps, unless the case itself is about signing in.

### Action

What does the user do? That is UI: one Page Object method. The test passes this method to the `answerTo` fixture (`src/fixtures/pages.fixture.ts`) — it starts listening before the click, takes the answer the gesture caused and checks it right there:

```ts
const paid = await answerTo(payOf(order), () => ordersPage.pay(), { has: { status: "Paid", charged: order.total } });
```

`payOf` is an answer path declared in the app's API client next to its calls (``answerPath("POST", `api/orders/${id}/pay`, payment)`` — the method, the end of the path and the answer's schema), so the spec names neither the method, nor the path, nor the type. Several answers of one gesture — `answersTo([a, b], () => …, [{ … }, { … }])`. The spec listens, not the Page Object: a page object has no right to swallow the answer the case takes its truth from; `whenAnswered` stays with it only to wait for its own screen. No `waitForResponse` of its own is written. No polling loop is written in a spec — it is the same class of thing as a fixed wait.

The page's background requests are not collected "just in case". `Route` holds only the requests that carry the expected result.

When the case proves that the right request went out, not only that the answer holds the right fields (a filter by period, a key mask in a form), the proof is the request of the same gesture: `query:` — the URL parameters, `sent:` — the request body's fields. It is the same one intercept, not a second spec: `intercept GET /api/orders → query: from, to · items · screen table=value` and in the test `answerTo(…, { query: { from, to }, has: … })`. A failure here is a cause of its own in the report ("request did not match"): the frontend sent the wrong thing. "Nothing was created" is proven by an empty `captureRequests` list.

### Check

One question: what exactly is being proven now?

**Data truth.** The status became `Paid`, the amount was charged, the discount landed in its field. The proof is the named fields of the intercepted body, matched against the case data (the order the test made itself): `has:` in `answerTo`. Not the whole JSON: the full contract is a separate API case. Not parsing HTML: the text on the screen can look fine over broken data.

The truth comes in four kinds:

| Kind | When | The answer is checked by | The screen is compared with |
|---|---|---|---|
| case data | the test made it itself, the case named it beforehand, or these are the facts of an item kept only for the tests | `has: { … }` — the case's values | `shown…(case data)`; server fields (a new id, a date) — as the second argument |
| stand data | nobody knows it beforehand (a dashboard's figures) | `check: <rule>` — a named helper of `src/assertions/<app>/` that proves on the answer what the server could get wrong (the parts add up to the total, a period's bounds); with arguments — `check: paidAsInBilling(billing)` | `shown…(answer)` — only here, after the rule |
| screen only | the fact exists only on the screen (a card mask, a total the client computes) | — the network is not listened to | the screen's own expected value |
| no request | the browser decides alone (a disabled button, a search on the client) | — the network is not listened to | a control's state, a message; a list the browser searches or sorts — from the earlier answer, by the browser's rule |

A rule that only retells the answer ("the list has rows") proves nothing. Where the rule comes from is the plan's `- Rules:` line (the case, the PRD, a document); a rule nobody wrote down is a guess. The rule's oracle (another endpoint, a source system) is read by a fixture or the app's helper, not by a spec step.

**Reflection.** A message appeared, the button became disabled, the summary shows the same status and amount. The proof is a block's reader or the message's exact text. The expectation is built from the case data (`shownPaidSummary(order)`), the same object the body was matched against. The spec does not format money and dates and does not pull out `(await answer).status` — `scripts/gate/reading.mjs` already forbids that, and the new algorithm does not weaken it.

Fields that are not in the case data, because only the server issued them (a new id, an assigned courier), are passed to the display helper whole, as the second argument: `shownSummary(order, paid)`. Picking the field stays in `src/assertions/<app>/`. The spec does not become a parser.

A message after the action is still checked, and by itself it does not close the case. The truth is the fields from `Route`, the rendering is the `screen` tokens.

### Branches without which the tree lies

**The answer is not the new state.** `204`, `202`, a redirect, an echo of the sent body, a background job's id, an optimistic UI, a socket. The first body cannot be declared the truth. In the same test either the next answer the page requests by itself is taken (the second answer in `answersTo`), or exactly one GET of this resource through the client. This is written in `Route` as `read`. A second GET for the same fields is a duplicate.

**There is no request.** Client-side validation, a disabled button, a required field before submit. Only the screen: `disabled`, `aria-invalid`, the error text. `answerTo` would hang the test here. When the case also claims that the request did not go out, an empty `captureRequests` list proves it — in the kit this is the way to prove "nothing was created".

**The browser works on an earlier answer.** A search, a sort or paging on the client: the opening's answer is `→ input` (nothing is checked on it unless the case says something about it), the browser's step is `no-request`, and its screen is expected from that answer by the browser's rule (`shownTasks(answer, "Ivan")`), not by a stand-data rule that belongs elsewhere.

**A frontend cache.** The live check looks at whether the request goes out every time (the first open, a reopen, another period). `intercept` is only the one that goes out; a reopen with no request is `screen-only`.

**The fact exists only on the screen.** A card mask, a total the client computes, a text the JSON does not hold. The source of truth is the screen. These fields are not looked for in the answer's body.

**A rule's matrix.** Other discount combinations, a boundary, someone else's order, `401`/`403`, the answer's schema. Separate cases with `Level: API` and their own id. The UI keeps one pass of the screen plus a negative with behaviour of its own on the screen (a field highlighted, the form not sent). A negative that differs only by a number in the same formula is not copied into the UI.

Two different places of failure stay two cases. "The form does not let an empty email through" — `no-request`. "The server rejects an empty email" — `api` (or `intercept` with an error code, when the refusal shows on the same screen and this is the only such pass). This is not a duplicate: different things break.

The positive and the negative outcome of one mutation are also two cases when the contract describes the error. The negative does not become a second layer of the positive test.

`@visual`, `@cross-browser` and `@responsive` stay tags of a UI case, not layers and not kinds of `Route`. A screenshot does not replace the fields from `Route`.

A journey across pages, roles or apps gets its own id and its own `Route` for the final outcome. It does not reuse a screen case's id: otherwise the gate sees two tests for one id and is right.

## 6. What counts as a duplicate

A duplicate is a second scenario or a second predicate for the same expected result.

| A duplicate | Not a duplicate |
|---|---|
| A second spec with the same case id | A check of the body's fields and a check that the screen showed the same case data |
| A repeated GET for fields that were already in the intercepted body | Setup and cleanup through the API |
| Computing the formula again from the DOM's text | One `read`, written in `Route`, when the mutation's body is empty |
| The whole JSON inside a UI test "while we are at it" | Intercepting the GET the page itself makes next |
| The same happy path as a separate API test | A separate API case for another input of the same rule |
| A title with ` — ` as a way to split "the server" from "the screen" | Two cases with two different reasons to fail |
| A GET in a `Setup:` step whose result is then expected on the screen — it is a read, not setup | A `Setup:` step that creates data and registers its cleanup |

A client call in a UI or E2E test belongs only in `Setup:` / `Cleanup:` steps (create, change, delete data; find and check, by reading only, what the scenario stands on — `expectStandData`) or as the one `read` from `Route`. A call whose result an `expect` uses is a check, whatever the step is called. The oracle of a stand-data rule (§5) is not a spec call.

Comparing the body with `order` and comparing the screen with `shown…(order)` are two observations of one expectation. They catch different breakages. Comparing the screen with the answer's body (`shown…(paid)` without the case data) is weaker: the server and the screen can be wrong in the same way, and the test is green. So the screen helper must not get the answer's body alone when the fields were known beforehand.

## 7. The `Route` formula

One line per scenario; it is read by the plan, the gate (`scripts/gate/plans.mjs` `parseRoute`) and the coverage report. An agent finds its way around free text; around a formula it cannot. Parts are separated by ` · `.

```text
api <METHOD> <path> → <status>? <field>, <field>
api <METHOD> <path> → <status>? check: <rule>[(<args>)]
api <METHOD> <path> → input

intercept <METHOD> <path> → <status>? (sent: <field>, … ·)? (query: <name>, … ·)? <field>, <field> · screen <token>=<kind>, …
intercept <METHOD> <path> → <status>? (query: <name> ·)? check: <rule>[(<args>)] · screen <token>=value, …
intercept <METHOD> <path> → <status>? (sent: <field> ·)? empty · read <METHOD> <path> → <field>, <field> · screen <token>=<kind>
intercept <METHOD> <path> → empty · until <helper> → <field>, <field> · screen <token>=<kind>
intercept <METHOD> <path> → (query: <name>, … ·)? input · screen <token>=<kind>
intercept <METHOD> <path> → <status>

no-request · screen <token>=<kind>, …
screen-only · screen <token>=<kind>, …
```

A scenario of several steps has a line per step: `- Route (step <n>): …`, numbered as the case numbers its steps (a scenario split out of a case keeps the numbers: S1 — steps 1 and 4, S2 — 2 and 3). A step that waits for several answers has a line per answer under the same number (one `answersTo` takes them). Each step with a route is proven in its own `test.step`: the gate counts a check of each screen kind in each such step. Steps the test added (opening a page) have no route and do not shift the numbers; the opening request belongs to the first step of the case whose result it shows.

- `<METHOD>` matters: GET and PUT on one address are two requests; the client's `answerPath` carries the method.
- `<status>` is optional. When given (`201`, `400`, `204`), the test passes it: `answerTo(…, { status: 201 })`; an API test checks it in `expectJson` / `expectStatus`. When not given, it is `200`. A line of a status alone (`intercept GET /api/reports → 403`) is a refusal the page gets to its own request.
- `sent:` — the request body's fields the case expects (`answerTo(…, { sent })`); `query:` — its URL parameters (`answerTo(…, { query })`). This is what the frontend sent; `api` has neither — an API test builds the request itself.
- `<field>` — only the fields of the expected result (`error.code` — `code` inside `error`; `items.sku` — `sku` of each element of `items`). It is the contract of the author and the review, not what the gate reads out of a helper's source; in the test they are in `has:`.
- `check: <rule>` — stand data (§5): the proof is a named helper (`check: totalsAddUp`, with arguments — `check: paidAsInBilling(billing)`); no fields are listed. The test passes it in `answerTo(…, { check })`; an API test calls the rule on its answer.
- `input` — the answer only feeds the next step: the browser works on it (§5), the next step's `check:` rule uses it, or — in an API scenario — another answer is compared with it. Nothing is checked on it.
- `empty` without `read` or `until` is an unfinished line. An empty body does not prove a state. A non-empty one does not either when a reload disagrees with it (§10).
- `read` — one client call after the action that returns the state (usually a GET), or the next answer the page requests by itself — then it is the second answer of the same `answersTo`.
- `until <helper>` — the only way to wait for a state that does not appear in one answer. The app's named helper bounds the retries itself and returns the body on which the fields have already settled. A loop in the spec is forbidden.
- `<token>=<kind>` — what to look at on the screen and how. `value` — a block read by a reader, against `shown…` (a value the case names itself — `shown…()` without an argument). `text` — the exact words on the screen: a message, a label, a control's choice. `state` — disabled, hidden, checked, a count. `visible` — only the fact that it appeared, and only when the content is not part of the case's obligation. A token without a kind is not written: a visible `summary` does not prove that it holds the right fields.
- The path in `Route` is evidence of a live request, not a product promise. The promise is the route's kind, the fields and the screen tokens. The endpoint changed and the fields are the same: the path is updated in the same change as the answer path in the client and the test, like a locator. No new scenario is added for that. `{id}` is one path segment.
- Several answers of one gesture — a line for each, and only those that carry the expected result, never "everything the page loads". One request twice in a step (a list and its reload) — two lines; `answersTo([a, a])` takes the first and the second answer.

Examples:

```text
intercept POST /api/orders/{id}/pay → status, charged · screen summary=value, toast=text
intercept POST /api/orders/{id}/pay → 204 · empty · read GET /api/orders/{id} → status, charged · screen summary=value
intercept POST /api/orders/{id}/pay → empty · until orderPaid → status, charged · screen summary=value
intercept PUT /api/profile → sent: card.number · empty · read GET /api/profile → name · screen card=state, toast=text
intercept GET /api/reports/sales → query: from, to · check: totalsAddUp · screen summary=value
intercept GET /api/tasks → input · screen tasks=value
intercept POST /api/orders → 201 · id · screen list=value
no-request · screen Pay=state, error=text
screen-only · screen card=value
api POST /api/orders → discount, total
api POST /api/orders → 403 · error.code

- Route (step 1): intercept PUT /api/team/members/{id}/role → empty · read GET /api/team/members → role · screen role=text
- Route (step 2): intercept DELETE /api/team/members/{id} → 204 · empty · read GET /api/team/members → id · screen members=value
```

`Route` is filled from the live stand: the request list shows whether the gesture reached the server, what it sent and what body came back. A `no-request` line on a payment that sends a `POST` on the stand is a lie of the plan. It shows in the confirm table before the test is written. After the confirmation, implement has no right to swap the `Route`.

## 8. What it looks like

### The plan

```markdown
### 1. TC-401 · Customer pays for the order and sees it as paid
- Level: UI — the result is on the order's screen · Tag: @regression · Role: customer · TMS: TC-401
- Route: intercept POST /api/orders/{id}/pay → status, charged · screen summary=value, toast=text
- Why: the customer pays on this screen
- Data: API setup — an unpaid order
- Preconditions: an unpaid order for this customer
- Steps:
  1. Pay for the order
     - expect: the pay response has status Paid and the order total; the summary shows them; the success message is shown
- Cleanup: the order is removed

### 4. TC-410 · A discount never exceeds 20%
- Level: API — the cap has no screen of its own · Tag: @regression · Role: customer · TMS: TC-410
- Route: api POST /api/orders → discount, total
- Why: the cap is a server rule with no screen of its own
- Data: API setup — prices at the boundary
- Steps:
  1. Place an order whose raw discount would pass 20%
     - expect: discount is capped, total matches the cap
```

A user scenario does not get an API draft. An API case appears when what can break is a rule, access or a contract that this screen does not go through.

### The UI test

The expectation of both the body and the screen is the case data (`order`). The step is named in a person's words. The words request, locator, payload do not go into a step title.

```ts
test(
  "TC-401 · Customer pays for the order and sees it as paid",
  { tag: ["@ui", "@regression"], annotation: [severity.critical, tms(401)] },
  async ({ page, order, ordersPage, answerTo }) => {
    await test.step("Pay for the order and verify it is paid", async () => {
      await answerTo(payOf(order.id), () => ordersPage.pay(), { has: { status: "Paid", charged: order.total } });
      expect(await ordersPage.summary.read(), "Order summary").toEqual(shownPaidSummary(order));
      await expectToast(page, "Payment successful");
    });
  },
);
```

`answerTo` checks the browser's answer the way `expectJson` checks an API client's answer: the status (and `status:`), the schema of the fields the tests read (from the client's `answerPath`), `has:` / `check:` / `sent:` / `query:`; a miss names the request and starts with the words "The server's answer to the action —" (or "The request the action sent —"), by which the report sets the cause. The spec does not parse `response.json()` itself.

The Page Object in this gesture only clicks. `whenAnswered` inside a Page Object stays for opening a page, when the screen has nothing to show that the data arrived and the case does not take those fields as its truth.

The variant with an empty mutation body — one client call in the check step, the path from `read`:

```ts
await answerTo(payOf(order.id), () => ordersPage.pay(), { status: 204 });
expect(await expectJson(orders.get(order.id)), "Order").toEqual(expect.objectContaining({ status: "Paid", charged: order.total }));
expect(await ordersPage.summary.read(), "Order summary").toEqual(shownPaidSummary(order));
```

Client calls in `Setup:` and `Cleanup:` steps are always allowed. In a check step — only when `Route` has a `read`, and exactly one.

### The API matrix test

No browser. The fields are the same as in `Route`. It is not a retelling of TC-401.

```ts
test(
  "TC-410 · A discount never exceeds 20%",
  { tag: ["@api", "@regression"], annotation: [severity.major, tms(410)] },
  async ({ orders, cleanup }) => {
    const placed = await test.step("Place an order whose raw discount would pass 20%", async () => {
      const created = await expectJson(orders.create(orderOverCap.build()), 201);
      cleanup.add(() => orders.remove(created.id));
      return created;
    });

    await test.step("Verify the discount is capped", async () => {
      expect(placed, "Order").toEqual(expect.objectContaining({ discount: capped.discount, total: capped.total }));
    });
  },
);
```

### The coverage table

The `API+UI` column and the pair of ticks go away. `Route` is not copied into the report: it lives in the plan, and the same phrase "Network Intercept + DOM Render" on every UI row does not tell validation before submit from an intercept.

| Case | Owner | Run | Status |
|---|---|---|---|
| TC-401 Customer pays and sees the order as paid | UI | passed | automated |
| TC-410 A discount never exceeds 20% | API | passed | automated |

The statuses of `npm run suite:coverage`: **automated** — every scenario of the case has one hand-written test in its owner's folder; **to rework** — written before routing: the plan has no `Route`, or a scenario is proven by two tests (API and UI) — the second test is not "better coverage", it is merged into the owner's test when the plan is refreshed; **not automated** — there are no tests, the reason is in a *Not now* line or the plan's status; **inconsistent** — tests link a case the plan keeps in *Not now*, a scenario has no test, or a test lies outside its owner's folder: when part of the scenarios is written and the rest is not, a manual run of this case is still needed (the gate fails this too). One TMS id is not split into two layers. It is split into scenarios when it holds several independent obligations.

## 9. The gate

A prompt will not hold the tree. Below are the refusals of `qa:gate` (`scripts/gate/routes.mjs`, `cases.mjs`, `repeats.mjs`). A plan or a spec being written now (not committed on the branch) fails; one written before routing gets a warning — a "rework" list, without a red gate.

The plan (`checkPlanRoutes`, parsed by `parseRoute` in `plans.mjs`):

- A ready scenario has a `Level` and a `Route` line (several — each with `(step <n>)`). No `Route`, and `Needs:` names two layers — "one expected result proven twice: split it into scenarios".
- `Level: API` stands only with a `Route` that starts with `api`; `Level: UI` and `Level: E2E` — only with `intercept`, `no-request` or `screen-only`.
- The formula: the start is `api|intercept <METHOD> <path> →`, `no-request` or `screen-only`; `→ empty` without `read` / `until` is an error; `api` / `intercept` name at least a field, `check:`, a status, `sent:`, `query:`, `empty` or `input`; `no-request` and `screen-only` name neither fields nor a status, but name the screen; `api` has no `sent:` and no screen; `input` is only for `api` / `intercept`.
- Every `screen` token has a kind: `value`, `text`, `state` or `visible`. `visible` is forbidden when the line holds body fields the screen must show: for them, only `value`.

The test. The gate checks the structure, not the meaning of the fields. It does not read the helpers' sources and does not look for the name `status` in the body of `shownSummary`: nested objects, a shared helper, an alias and a rename give false failures, and refactoring turns into fixing the gate.

- One scenario — one hand-written test (`repeats.mjs`): the key is the app, the case id and `S<n>` from the title. The part of the title after ` — ` does not make a second test legal. Not counted as a second test: rows of one file built by a loop (the title holds `${`); the same test in another Playwright project (a browser, a shard); a repeated run; a screenshot in a separate `<feature>-visual.ui.spec.ts` with `@visual`. A case in two features is an error.
- The file's folder matches `Level`.
- `intercept`: the test has `answerTo` / `answersTo`; `check:`, `sent:`, `query:` and a status other than `200` from `Route` are passed in it (`{ check | sent | query | status }`).
- `no-request` and `screen-only` (all of the scenario's routes): the test has neither `answerTo` nor `whenAnswered`.
- Client reads (`expectJson`) in check steps — no more than the `read`s in the routes; `Setup:` and `Cleanup:` do not count. A `Setup:` step that reads (`expectJson`), registers nothing for cleanup, and whose result is then expected, is a check under another name.
- `shown…(answer)`, where the answer is the result of `answerTo`, without a `check:` route — the screen compared with the answer where the case knew the values: the expectation is built from the case data (`shown…(case data, answer)` for server fields).
- The screen kind is checked in each step with a route: `value` — `toEqual` / `toMatchObject` / `toContainEqual` with a call of `shown…`, or a named check; `text` — `toHaveText` / `toContainText` / `toHaveURL`, `expectToast` or a named check; `state` — `toBeDisabled`, `toBeEnabled`, `toBeHidden`, `toHaveCount`, `toHaveAttribute` and the like; `visible` — `toBeVisible`. One check for all the steps does not count.
- `api`: the `check:` rule is called on the answer; a status other than `200` is checked.
- A case is written whole (`cases.mjs`): a written case has a test for every ready scenario; a test does not link a case the plan keeps in *Not now* (except "Covered by …"); a `Blocked` line without a `· searched:` tail is a warning.
- A mock does not stand in for a mutation's truth: `mocked` shows a state the stand cannot honestly be brought to, and is never the answer of the action under check (`data-and-fixtures.mdc`).

The gate closes off a second test, a test without `answerTo` where `Route` intercepts, an extra GET, and a screen token without a check. It does not close off swapped fields and paths: `has:` with another set of names, or another `answerPath`, stays green until review sees it. The field names in `Route` are the contract of the author and the reviewer. There is no need to tie them to the helpers' AST.

Requiring `answerTo` in every UI test is wrong: the `no-request` branch would at once become a false alarm. A blanket ban on any client call breaks setup, cleanup and an honest `204`.

## 10. Refinements without which coverage has holes

They are easy to lose when the algorithm is carried over, because its first wording did not have them.

1. **Both observations are matched against the case data, not against each other.** The body confirms that the server stored the expected `status` and `charged`. The screen confirms that the displayed form of the same data was rendered. The mismatch "the server is right, the screen is stale" fails on the screen. "The server stored something else" fails on the body, even when the screen showed that something else faithfully.
2. **A non-empty body is not yet the saved state.** `intercept` is enough only when a live reload of the screen (or a GET of the same resource) matches the mutation's body on the case's fields. When they differ, the body is preliminary: a draft, a calculation, `{ accepted, jobId }`, an echo of the request. Then `Route` is `read` or `until`, even with `200` and a filled JSON. Empty `202` and `204` fall into the same bucket by themselves. The planner writes the decision down from the stand, not the agent in code.
3. **The UI checks the case's fields, not the contract.** The whole payload, the schema, paging are API cases. Otherwise the duplicate moves inside one file.
4. **A server field the test did not know beforehand is not pulled out in the spec.** It goes to the helper as the second argument. Otherwise `reading.mjs` (or its counterpart, "a spec reads as its case") and the algorithm conflict, and the agent starts breaking one of the two.
5. **One gesture — one step in a person's words.** Inside the step: the action, the body check and the screen check. A separate step "Verify the API" with forbidden words in its name is not added. The rule "a step proves one thing" holds: one outcome of the case is proven, by two observations.
6. **The Page Object does not listen to the answer the truth comes from.** Its method is passed to `answerTo`; if it took the answer itself, the spec would have nothing to check, and the agent would make a GET again.
7. **A mock does not count as the server's truth.**
8. **`Data: API setup` is not coverage of a rule.** Creating an order through the API and never checking the payment fields is a hole. The list of fields in `Route` closes it, not the fact that there was HTTP somewhere in the file.

## 11. What coverage remains

| Risk | Where it lives | What proves it |
|---|---|---|
| The user made a gesture and saw the result | One UI or E2E test | The `intercept` / `read` fields against the case data; the `screen` tokens |
| The browser does not let the action through | One UI test | `no-request` and the screen tokens |
| The screen holds a fact the JSON does not | One UI test | `screen-only` |
| Other inputs of a rule, permissions, the contract, a server refusal with no screen of its own | Separate API tests, each with its own id | `api` and the list of fields |
| A path across pages, roles or apps | One E2E test | The same `Route` for the journey's outcome |
| The stand is alive | As before: one smoke per feature | When the smoke is a UI scenario, it has the same `Route`; no API twin is added for the smoke |

The pyramid stays: many rules on the API, few screen passes, only a few journeys. Only the ownership of the user scenario changes. It is no longer copied into the API "because a request went out".

While the plan's source is a TMS folder, the set is already fixed by the kit's current rule: every case of the folder becomes a plan line. The matrix cannot be dropped during implementation — its ids would have no test, and the gate shows that.

When there is no TMS and the feature was described in words, a script does not know about a discount nobody named. That is closed by the plan's confirmation, not by a regular expression: every risk of the pass (access, rules, integrity, calculations, states, side effects) has either a case with its own `Route` or a *Not now* line with a reason. The gate then guards the confirmed list the same way as the cases from the TMS. A person still answers the question "this list is the scope". The algorithm answers another question: "this list cannot be implemented by half and cannot be implemented twice".

## 12. What the algorithm does not do

- It does not invent a business rule that is neither in the TMS nor in the plan's risks.
- It does not turn every variant of a formula into a UI test.
- It does not forbid API tests.
- It does not declare every network call a duplicate.
- It does not replace looking at the live request. The lie "the payment sends nothing" is caught by eye in the confirm table. The gate catches it only when the written test still listens to the network under `no-request`; it does not compare the answer path in the test with the path in `Route` — that is review.
- It does not turn on a compatible mode "the old way, for now". The old mode is exactly the reward for a duplicate. What was written before routing the gate does not fail, but does not count as coverage either: it lists it in a warning, the report sets `to rework`, and every new or changed test goes by the tree. No separate list of exceptions that allows two layers again is added.

## 13. What not to carry over from the draft checklist

Next to this idea there was an adoption checklist. Only what matched the kit's design was taken into the work.

| Proposal | Decision |
|---|---|
| A new field `Owner` | Do not add. The owner is the existing `Level`. In a project without `Level`, one owner field is added, not two |
| Markers `async_state_check`, `client_validation`, `visual_only_truth` | Do not add. The branch is seen from the kind of `Route` |
| A Verification Source column with one text for all UI rows | Do not add. `Route` in the plan tells the branches apart |
| Forbid any repeated GET by a static rule without looking at the step | Do not. Setup, cleanup and one `read` are allowed |
| Write `page.waitForResponse` and polling into the prompt | Do not. `answerTo` listens. Polling is the product's named helper (`until`), if there is one at all, not a loop in a spec |
| Regenerate 5–10 cases at once | Do not. A feature written before routing is marked "rework" by the gate and `to rework` by the report; it is reworked whole at the first refresh of its plan |
| Teach the agent with a paragraph and stop | Not enough. A paragraph already lost to the gate |

## 14. Where it lives in the kit

| Place | What it does |
|---|---|
| `.cursor/rules/plans.mdc` §Layers, §Routes, §A case is written whole or not at all | The scenario's owner and its reason, the `Route` line, a whole case; `Needs` and layer pairs are not written |
| `.cursor/rules/specs.mdc`, `code.mdc`, `ui.mdc`, `api.mdc` | One manual case — one test per scenario (`TC-101 · S2 · …`, without ` — `); the gesture's answer — `answerTo` in the spec; the Page Object does not listen to it; answer paths and schemas — in the client |
| `src/fixtures/pages.fixture.ts` | The `answerTo` / `answersTo` fixtures: the action, the answer, the checks `has` / `check` / `sent` / `query` / `status` |
| `src/assertions/shared/http.ts` | `answerPath` (method, path, answer schema), `expectAnswer` for the browser's answer next to `expectJson` for the client's answer |
| `src/setup/request-capture.ts` | `answersOf` — the listener behind `answerTo`; `whenAnswered` — the Page Object's wait for its own screen; `captureRequests` — "the request did not go out" |
| `src/reporting/failure-cause.ts` | The causes "request did not match" (the frontend sent the wrong thing) and "answer did not match" (the server answered the wrong thing) |
| `scripts/gate/plans.mjs` | `parseRoute`, `ownersOfRoute`, `scenarioOf`; a plan written before routing is read with its `Needs` |
| `scripts/gate/routes.mjs` | The rules of §9 for the plan and the test; what was written before routing — a warning |
| `scripts/gate/cases.mjs` | A case is closed by the tests of all its ready scenarios; a link to a case from *Not now*; the `searched:` tail of `Blocked` |
| `scripts/gate/repeats.mjs` | `checkCaseTwice`: the key is the app, the id and the scenario; the ` — ` suffix splits nothing |
| `scripts/agent/suite-coverage.mjs` | `automated` — every scenario has one test in its owner's folder; two tests of a scenario or a plan without `Route` — `to rework`; another owner's folder, a missing scenario, a link from *Not now* — `inconsistent` |
| `scripts/agent/plan-block.mjs`, `plan-draft.mjs` | A plan block in the template's shape with `Route:` lines (per step), from an empty call or from a saved TMS case or bug |
| `scripts/agent/spec-draft.mjs` | A test skeleton from a filled block: steps with the route and `expect` in comments; the gate fails a skeleton left as it is |
| `.cursor/skills/*`, `.cursor/commands/*` | Point to the rules and this document, never copy the grammar |
| The smoke `tests/smoke/sign-in.smoke.spec.ts` | Not touched: it is the sign-in template, not a case with a `Route` |

## 15. How to carry it to another project

File names will differ. The contract is carried over, not the folder tree.

1. Find the reward for a duplicate and switch it off. Usually it is one of: a gate or a report that demands both an API and a UI test for one id; a title template "the server's part / the screen's part"; an instruction "write the case whole on all layers"; the phrase "check the message and what the action left" with no word on where "left" is read from.
2. Keep one identifier of the case's owner. When such a field already exists, do not add a second one.
3. Bring in the `Route` line strictly as §7 says. Do not replace it with a paragraph and do not add parallel markers.
4. Give one tool that performs the action, takes its answer and checks it right there — the status, the fields, the rule, what was sent (in the kit, `answerTo`). The spec does not parse the body by hand when the local linter forbids it to transform data.
5. Teach the gate the refusals of §9. Until there is a gate, the agent will follow the tree only now and then.
6. Change the coverage report: one row — one owner — one last run. Two ticks for one case no longer mean "automated".
7. Take apart the pairs already written. The case "a person did X and saw Y" keeps the UI test and gets the intercept added to it. The case "formula Z for different inputs" keeps the API test. The second file is deleted, and its link to the id is removed. While both files hold one id, the new gate must be red — otherwise the migration is not visible.
8. Put the text of §16 into the agent's rules only together with the gate. The text alone brings things back to where they are today: the rule is there, the reward for a duplicate is stronger.

What to search the repository for when carrying it over:

```text
API+UI
Needs:
both layers
whole case
what the action left
the server stores
the screen shows
split over layers
```

Each hit is either a reward for a second test or a wording the agent reads as "check the data once more".

## 16. Text for the agent's rules

It makes sense to put it into a skill once the gate of §9 already fails on violations.

```text
One scenario id — one hand-written test. A second file with the same id is not written.
A data loop in the same file, another browser and a repeated run are not a second test.
One TMS id may give several scenarios when its obligations fail separately.
Owner UI or E2E when the scenario is about what a person does and sees.
Owner API when the scenario is about another input of a rule, access or the contract.
Inside UI and E2E:
- data needed before the gesture is created through the API when there is an endpoint;
- the gesture is a Page Object method passed to answerTo when Route starts with intercept
  and the mutation's body matches the reload: has — the case data, check — the stand-data
  rule, sent / query — what the page sent, status — when not 200;
- when the body is empty, preliminary or differs from the reload — one read
  or one named until, with no loop in the spec;
- the fields from Route are checked against the case data;
- the screen is checked as its token says: value through shown…, text by the exact string,
  state by the control's state. visible does not replace the value;
- shown… never gets the answer's body alone;
- under no-request and screen-only the network is not listened to;
- a check step holds no API client call except one read or one until from Route.
Proving the same fields again by a separate request or a separate file is an error, not caution.
```

## 17. Summary

The algorithm is worth building because a duplicate here is not a lapse of attention but a rational answer to the gate. As long as one case needs two ticks, the agent will write two tests and be right by the gate and wrong by coverage.

With the scheme switched on, the coverage of a user scenario is the fields of the answer that really holds the state plus the rendering of the same data on the screen, in one test. The coverage of rules is separate API scenarios. A duplicate is a second file for the same scenario id and an extra GET in a check step. The gate rejects this structure. It does not prove that the field names match the check: that is review against the `Route` contract. The cost is one shared parse of the `Route` line for the gate and the coverage report. The skills do not copy the grammar; they point to this document.

## 18. Working through a TMS case

A neutral example, not this repository's product. The manual case is overloaded on purpose: this is what an ordinary case in a TMS looks like.

The walkthrough below already allows for the limits without which the algorithm is too rigid:

| Risk | How this document closes it |
|---|---|
| A gate that looks for field names in the helpers' sources falls apart on nesting, shared helpers and renames | The gate checks the call's structure. Field names are a contract for review (§9) |
| The path in the plan has to change although the product's obligation is the same | The path is evidence, like a locator. The obligation is the fields and the kinds of the screen tokens (§7) |
| One `read` is not enough under eventual consistency | `until` — one named helper, no loop in the spec (§7, §9) |
| A non-empty mutation body may be a preliminary calculation | `intercept` only when the reload matches this body on the case's fields (§10) |
| One id in a TMS is often a bundle of obligations | It is cut into scenarios while planning. The TMS case is green when all its scenarios are green (§8, below) |
| One id — one test breaks parametrisation, browsers, retries and shards | A second test is a second hand-written test of the scenario. A loop in the same file, another Playwright project and a repeated run are not (§9) |
| A screen token checks visibility, not content | A token must have a kind: `value`, `text`, `state`, `visible`. `visible` does not replace fields (§7, §9) |
| The grammar, the parser, the gate, the report and the skills become a separate component | One parse of the line for the gate and coverage. The skills point here and do not copy the grammar (§17) |

**TC-220 · The owner manages the workspace's admins.** The case's steps: open the members, add a person by email, see them in the list with the Admin role, check that the new admin opens the settings, remove them, see that the row is gone and the settings are no longer open to them, add the same email again, try to remove the last owner, sign in as a member and make sure there is no "Add admin" button.

This is one id in the TMS and several independent obligations. A failure "a member does not get 403" does not make the check "the button is hidden" pointless, and the other way round. It must not be cut into API and UI layers: each piece is a separate scenario, a plan block and a test with its own `S<n>` (`TC-220 · S1 · Owner adds an admin and sees them listed`; `npm run plan:block -- <plan> --case state/sources/TC-220.json --scenario S1 --title "…" --take 1-3`). Case TC-220 is closed in the report only when each of its scenarios is closed. Until then a manual run of this case is still needed.

The live observation the planner writes down before the `Route` (here it is given as a condition of the example):

- `POST /api/workspaces/{id}/members` answers `201` with the member's body. A repeated GET of the list after a reload holds the same email and the same role. The mutation's body is the saved state; `intercept` is enough.
- `DELETE` answers `204`. The truth is the next answer with which the page re-reads the list by itself, or one GET when the page does not re-read the list.
- When the removal answers `202` and the row disappears later, one read is not enough: `until`.

| Scenario | Owner | Route | Why it is not a second layer of its neighbour |
|---|---|---|---|
| S1. The owner adds an admin and sees them in the list | UI | `intercept POST /api/workspaces/{id}/members → 201 · email, role · screen members=value, toast=text` | The gesture and the list's rendering. A separate API test of the same POST with the same email is not needed |
| S2. A member cannot make anyone an admin | API | `api POST /api/workspaces/{id}/members → 403 · error.code` | Other roles and someone else's workspace are rows of this same matrix, not a copy of S1 |
| S3. The last owner cannot be removed | API | `api DELETE /api/workspaces/{id}/members/{userId} → 409 · error.code` | A server rule. When the button also cannot be pressed before any request, that is a separate UI scenario `no-request · screen Remove=state`, not a second check of S3 |
| S4. The owner removes an admin, the row disappears | UI | `intercept DELETE /api/workspaces/{id}/members/{userId} → 204 · empty · read GET /api/workspaces/{id}/members → email · screen members=value` | `204` does not hold the list. `members=value` — the list equals the expected members without this email, not "the list is visible" |
| S5. A member does not see "Add admin" | UI | `no-request · screen Add admin=state` | No button, no request. It does not cover S2: a hidden button does not prove `403` |
| S6. The same admin's email added again | UI | `intercept POST /api/workspaces/{id}/members → 409 · error.code · screen error=text` | One pass of the screen with the refusal's text. Other malformed emails stay in the API matrix of S2 |

S1 in code is one test. The expectation of both the body and the list is the invited person from the case data.

```ts
await test.step("Add the admin and verify they appear", async () => {
  await answerTo(membersOf(workspace.id), () => membersPage.addAdmin(person.email), { status: 201, has: { email: person.email, role: "admin" } });
  expect(await membersPage.list.read(), "Members").toEqual(shownMembers(workspace.withAdmin(person)));
  await expectToast(page, "Admin added");
});
```

A second spec "POST member and the role is admin" is not written for S1. The fields `email` and `role` are already in the answer's check. The gate sees it as `answerTo` with `status: 201` and a check of each screen kind; that `has:` holds exactly these fields is for review to see against the `Route` line.

S4 does not claim "the list is visible". The token kind `value` demands `shownMembers` without the removed person. Otherwise a test that is formally green does not know who stayed in the list.

When the live `DELETE` behaves differently and the row disappears only after a background job, S4 changes not its owner but the tail of its `Route`: `until memberGone → email · screen members=value`. The helper `memberGone` is one per app; the spec calls it once and does not spin a loop of its own. As long as the reload does not match the `DELETE` body, `intercept` must not be left without `read`/`until`, even when the body is non-empty and already holds the email.

The path `/api/workspaces/{id}/members` in the line is evidence from the stand. A move to another URL with the same email and role updates the path and the test in one change. S1 does not become a new case because of it.

`@cross-browser` on S1, when the add control is a widget, is the same test in a second Playwright project, not a second file and not a second id. A table of roles in S2, built by a loop in one API file, is one scenario. Two hand-written files for S1 are a duplicate, and the gate is red.

Sign-up differs only in the tail, not in the scheme. "The form does not let an empty password through" — `no-request`. "The account is created and the person sees their dashboard" — `intercept`, or `read` when the sign-up answer is not what the dashboard shows after a reload. "The email with the link arrived" — an outside system: a *Not now* scenario until there is a mailbox. It is no reason to add an API twin for the same form.
