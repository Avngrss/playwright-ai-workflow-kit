# API Collection Integration

## Purpose

API client collections give teams a curated, git-native record of executable request examples while planning and auditing API automation. This kit starts with [Bruno](https://www.usebruno.com/) as the repository convention because its collections are file-based and reviewable in Git.

Collections complement, rather than replace, API contracts and automation plans:

```text
OpenAPI / Swagger      = contract source of truth
Bruno                  = executable request and payload examples
specs/<feature>.md     = reviewed automation plan
tests/api/**           = Playwright implementation
```

OpenAPI/Swagger remains authoritative for endpoints, schemas, status codes, parameters, and authentication when available. If a Bruno request conflicts with OpenAPI/Swagger, report source drift instead of guessing.

## Recommended Structure

```text
collections/
  bruno/
    README.md
    <service-or-domain>/
      ...
```

Use `collections/bruno/**` only for curated team collections. Keep personal and debug collections outside the repository. The clean starter ships without real collection requests.

## Practical Workflow

Use the collection workflows before API implementation:

```text
Bruno collection
-> inspect collection
-> create or update feature plan
-> implement reviewed API coverage
-> audit collection coverage
```

```text
/inspect-api-collection
collection path: collections/bruno/<service-or-domain>/**

/plan-from-api-collection
collection path: collections/bruno/<service-or-domain>/**
output feature plan: specs/<feature>.md

/audit-api-collection-coverage
collection path: collections/bruno/<service-or-domain>/**
feature plan path: specs/<feature>.md
API tests path: tests/api/**
```

The inspection and audit workflows are read-only. The planning workflow may create or update a feature plan only when requested. None of these workflows generate tests directly from a collection.

## Using Bruno In The Workflow

1. Add a curated Bruno collection for a real service or domain.
2. Inspect its requests, variables, example payloads, and request flows.
3. Create or update `specs/<feature>.md`, using the collection as planning input.
4. Implement only API coverage marked ready in the feature plan.
5. Audit collection requests, API contracts, plans, and `tests/api/**` for gaps or drift.

Do not generate Playwright tests directly from Bruno collections. A collection is evidence and context; the reviewed feature plan decides what is automated, blocked/postponed, or not automated.

Bruno is not contract authority. OpenAPI/Swagger is the contract source when available, `specs/<feature>.md` is the automation source of truth, and `tests/api/**` implements reviewed plan decisions.

## Environment And Secrets

Bruno variables must use environment names registered in `.cursor/rules/00-project-map.mdc`. Put real values only in local `.env`, GitHub Variables, or GitHub Secrets as appropriate.

Never commit collection environments with real tokens, passwords, cookies, production credentials, or other secrets. Register multi-target service environment names in the project map before using them.

## Stateful Requests

Treat DELETE, payment, order creation, user mutation, admin operations, and similar requests as destructive or stateful. Before automating them, the feature plan must define cleanup or isolation. Do not automate these requests directly from a collection without plan approval.

## Future Source Formats

Postman and Requestly may be considered later as additional collection source formats. Bruno is the initial git-native convention; it does not change the contract, planning, or test implementation hierarchy above.
