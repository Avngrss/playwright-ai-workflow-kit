# Auth strategy

How tests get a session.

Do **not** paste tokens, passwords, or session JSON into chat, plans, or git.

---

## Order

```text
1. Tell the agent how this app authenticates
2. Agent updates the project map (Auth Strategy)
3. Then /plan-feature — each feature picks a role
4. Then /implement-* — uses the map, does not invent login
```

The map remembers **how**.  
The feature plan remembers **who** in this test (which role).

---

## 1. Before features — fill the map

Say this to the agent once (or when auth changes):

```text
Update project map Auth Strategy.

Do not store tokens or passwords.

API: <path to our token helper, or "create users via this API">
UI:  <path to session files, or "same token then inject", or "create user then open app">
Roles we have: <names from this product>
Default: signed-in | not signed-in
```

Two valid inputs — pick what you actually have:

| You give | Agent does |
|----------|------------|
| Ready helper + role names | Registers that helper. Tests call it. |
| Data/API to create a user | Writes setup that creates a disposable user per role. |
| Session files per role (`state/<role>.json`, gitignored) | Tests load the file. You refresh the files. |

If the whole app sits behind login, set the map default to **signed-in**. Public pages and the login feature itself are the exceptions.

Fallback: you can say it during `/implement-*` for one suite. Then tell the agent to copy it into the map so the next feature does not ask again.

---

## 2. Feature plans — pick the case

`/plan-feature` copies the mechanism from the map and sets **this** scenario:

| Case | `auth as` | Meaning |
|------|-----------|---------|
| Public page / public API | `none` | No session |
| The test *is* login | `action` | Spec logs in itself |
| Already signed in | `precondition` | Spec uses the map helper/file + a **role** |

Example for a signed-in feature:

```md
## Auth Strategy

- required: yes
- auth as: precondition
- role: <one role from the project map>
- API mode: <from map>
- UI mode: <from map>
```

Different tests may use different roles. Do not lock the map to one person.

One E2E journey is usually one role. Two roles in one journey only if the story needs both.

If the map has no mechanism and the feature needs a session → **blocked**.

---

## 3. Implement

`/implement-api-batch` and `/implement-ui-batch` read the plan + map.

They must not:

- invent login;
- hardcode a token;
- UI-login in `beforeEach` unless the test is login;
- put one session on every UI project (login tests would skip login).

You may still say at implement time: “this spec uses role X”. That chooses the user. It does not replace the map.

---

## Commands

```text
# first, if you already know how auth works:
"Update project map Auth Strategy: ..."

/plan-feature
/plan-e2e-journey
/implement-api-batch
/implement-ui-batch
/implement-e2e-flow
```
