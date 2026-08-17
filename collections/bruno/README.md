# Bruno Collections

This folder is for curated team Bruno collections when a real project uses them. The clean starter does not require or include real collection files.

Organize collections by service or domain:

```text
collections/bruno/<service-or-domain>/
```

Keep personal and debug collections outside the repository. Never commit secrets, tokens, passwords, cookies, or production credentials.

Bruno entries are executable request and payload examples. They are not the API contract source of truth: use OpenAPI/Swagger when available. Use collections for planning and audits, not direct Playwright test generation.

See `docs/long-flow.md` (API collection section).
