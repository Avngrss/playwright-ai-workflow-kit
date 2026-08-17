# Skill: Plan From API Collection

## Goal

Create or update a feature API coverage plan from API collection input without implementing tests.

Bruno supplies executable request examples. OpenAPI/Swagger is the contract source of truth when available. `specs/<feature>/<feature>.md` is the automation source of truth.

## Inputs

- Bruno collection path under `collections/bruno/**`;
- optional OpenAPI/Swagger path;
- optional existing `specs/<feature>/<feature>.md`;
- optional TMS or requirements context;
- project map.

## Scope

- planning only;
- create or update `specs/<feature>/<feature>.md` only when explicitly requested;
- do not create tests or `src/test/**` files;
- do not install dependencies or execute requests;
- do not update Bruno, OpenAPI/Swagger, or TMS.

## Workflow

1. Inspect the collection and relevant sources without executing requests.
2. Identify service/domain ownership and registered environment-variable names from the project map.
3. Group requests into business capabilities instead of mapping each request one-to-one to a test.
4. Use OpenAPI/Swagger for contract decisions when available. If it conflicts with Bruno, document a drift/gap note and mark affected coverage blocked/postponed.
5. Choose API, schema/contract, UI, visual, or not-automated coverage by risk; do not duplicate coverage without distinct value.
6. Classify each candidate as `ready to implement now`, `blocked/postponed`, or `not automated`.
7. Define auth, data, cleanup/isolation, and destructive-request handling before marking stateful coverage ready.
8. Keep implementation recommendations separate from planned scenarios.

## Required Plan Sections

- Goal
- API Source Inputs
- Target Services / Environment Variables
- Bruno Collection Summary
- OpenAPI / Contract Source, if available
- API Coverage
- Schema / Contract Coverage
- Data Strategy
- Auth Strategy
- Cleanup / Isolation Strategy
- Destructive Requests
- Blocked / Postponed Coverage
- Collection-to-Plan Mapping
- Implementation Notes
- Status

## Planning Rules

- Do not generate tests directly from Bruno collections.
- Do not guess undocumented fields, statuses, schemas, parameters, or auth behavior.
- Make target API service and environment ownership explicit.
- Document Auth Strategy using modes registered in the project map. Missing auth for protected requests → blocked.
- Require a cleanup or isolation strategy for destructive/stateful requests.
- Treat secrets, tokens, passwords, and cookies as prohibited collection content.
- TMS or requirements context informs planning but is not modified.

## Output

Report:

- created or updated feature plan path;
- planned coverage summary;
- blocked/postponed items;
- contract drift or gap notes;
- recommended next command.

Recommended next commands are informational only. Stop after planning; do not implement tests.
