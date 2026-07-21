# Skill: Inspect API Collection

## Goal

Inspect API collection sources and summarize their API surface without modifying files or executing requests.

Bruno collections are planning and audit input. OpenAPI/Swagger remains the contract source of truth when available. This skill does not create plans, tests, or implementation code.

## Inputs

- collection path;
- optional OpenAPI/Swagger source;
- optional project map;
- optional target service or domain.

Primary source:

- `collections/bruno/**`

Future-compatible source locations:

- `collections/postman/**`;
- `collections/requestly/**`;
- `openapi/**`.

## Scope

- inspect only;
- do not modify files;
- do not create specs or tests;
- do not install dependencies;
- do not execute requests;
- do not call external APIs.

## Workflow

1. Confirm the collection path and identify its format.
2. Read collection files and group requests by service or domain when possible.
3. Inventory request names, methods, paths, bodies/examples, headers, auth hints, and variables/placeholders.
4. Identify target service and environment-variable hints against the project map.
5. Flag stateful or destructive candidates, including DELETE, payment, order creation, user mutation, and admin operations.
6. When an OpenAPI/Swagger source is supplied, compare documented method, path, status, schema, parameter, and auth information. Report drift; do not guess.
7. Report missing or unclear metadata and the smallest safe next step.

## Safety Rules

- Never print a real secret value.
- Treat committed tokens, cookies, passwords, or credentials as critical risks.
- Flag production-looking destructive requests.
- Flag environment names not registered in the project map.
- Do not infer undocumented contract behavior from a collection.

## Output Format

```text
## Summary

## Collection Sources

## Endpoint Inventory

## Variables And Auth

## Destructive / Stateful Requests

## OpenAPI / Contract Alignment

## Risks

## Recommended Next Step
```

Include OpenAPI / Contract Alignment only when an OpenAPI/Swagger source was provided.

## Done Criteria

- all supplied source paths are identified;
- request inventory distinguishes examples from contract authority;
- secrets are redacted;
- destructive requests and configuration gaps are explicit;
- no files or external state changed.
