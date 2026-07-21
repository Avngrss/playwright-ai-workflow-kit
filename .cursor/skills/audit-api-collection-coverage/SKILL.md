# Skill: Audit API Collection Coverage

## Goal

Audit alignment among API collections, feature plans, implemented API tests, and optional OpenAPI/Swagger sources.

This is audit-only. It does not create or modify plans, collections, tests, OpenAPI sources, TMS entities, or external API state.

## Inputs

- `collections/bruno/**`;
- `specs/<feature>.md`;
- `tests/api/**`;
- optional OpenAPI/Swagger source;
- project map.

## Scope

- audit only;
- do not modify files;
- do not create tests;
- do not execute API requests;
- do not update Bruno, OpenAPI/Swagger, plans, or TMS.

## Workflow

1. Inventory collection requests by service/domain, method, path, statefulness, auth hints, and variables.
2. Extract planned API and schema/contract scenarios, their status, service/environment ownership, and cleanup requirements.
3. Inventory implemented API tests and map them to plan intent, not title similarity alone.
4. Compare collection requests, plans, tests, and OpenAPI/Swagger when provided.
5. Classify findings without guessing missing contracts, cleanup, or service ownership.

## Audit Categories

- collection request covered by plan;
- collection request covered by tests;
- collection request not planned;
- planned coverage missing tests;
- test exists without plan justification;
- endpoint in OpenAPI but not Bruno;
- endpoint in Bruno but not OpenAPI;
- OpenAPI/Bruno method, path, status, or schema drift;
- destructive request without cleanup/isolation;
- missing auth or environment mapping;
- tests using wrong service/environment target;
- stale collection requests;
- duplicate API coverage;
- blocked/postponed coverage implemented accidentally.

## Safety Rules

- Do not expose real secret values.
- Flag committed tokens, cookies, passwords, and credentials as critical.
- Flag destructive or production-looking requests without proven isolation.
- Do not treat Bruno as contract authority when OpenAPI/Swagger is available.
- Do not treat every collection request as a required test.

## Output Format

```text
## Summary

## Coverage Matrix

## Collection Requests Covered

## Planned But Missing Tests

## Bruno Requests Not Planned

## Tests Without Collection/Plan Reference

## OpenAPI / Bruno Drift

## Destructive Request Risks

## Env/Auth Mapping Issues

## Recommended Fix Batches

## Recommended Next Command
```

Omit OpenAPI / Bruno Drift when no OpenAPI/Swagger source was supplied. Recommended fix batches describe work only; they do not authorize changes.
