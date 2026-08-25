# Skill: Update Project Map

## Goal

Use this skill when repository structure, commands, aliases, tags, fixture entry points, rules, skills, or architectural conventions change and the project map must be updated.

The project map is the source of truth for AI agents.

---

## Related Rules

Follow these rules:

- Project Map Rules;
- Core / Project Boundary and Structure Rules;
- Agent Workflow;
- Examples Policy.

If this skill conflicts with a rule or existing project map convention, preserve the project map as the source of truth unless it violates a core architectural boundary.

---

## When To Use

Use this skill when:

- a new folder convention is introduced;
- a fixture entry point changes;
- a new path alias is added;
- a quality gate command changes;
- a test command changes;
- a new tag category or tag is introduced;
- a new rule is added;
- a new skill is added;
- API, UI, data, or fixture locations change;
- framework core and project layer boundaries are clarified;
- agents need a new source-of-truth entry.

---

## When NOT To Use

Do not use this skill when:

- no structural convention changed;
- only a single spec changed;
- only implementation changed inside an existing convention;
- the project map already contains the needed information;
- the change is experimental and not accepted as convention.

---

## Workflow

### 1. Identify What Changed

Identify the change type:

- folder;
- alias;
- command;
- fixture entry point;
- tag;
- rule;
- skill;
- layer boundary;
- test data location;
- API location;
- Page Object or Component location.

---

### 2. Check Existing Project Map

Before editing, check whether the entry already exists.

Do not duplicate existing entries.

Do not create conflicting names.

---

### 3. Update Only Relevant Sections

Update only the project map sections affected by the change.

Keep the update minimal.

Do not rewrite unrelated sections.

---

### 4. Preserve Source-of-Truth Quality

The project map entry should be:

- explicit;
- concise;
- stable;
- easy for AI agents to follow;
- aligned with actual repository structure.

Avoid vague entries such as:

- "use common folder";
- "follow existing style";
- "run usual checks".

Be specific.

---

### 5. Verify Consistency

Check that the updated project map matches:

- actual files;
- package scripts;
- tsconfig aliases;
- fixture exports;
- rule names;
- skill folder names;
- tag registry;
- quality gate command.

---

## Project Map Should Define

When applicable, project map should define:

- framework core location;
- project layer location;
- UI spec location;
- API spec location;
- Page Object location;
- Component Object location;
- fixture entry point;
- intermediate fixture layers;
- test data locations;
- API client locations;
- config locations;
- path aliases;
- tag registry;
- quality gate command;
- impacted test command format;
- rules location;
- skills location;
- auth provider entry point;
- Auth Strategy (API/UI modes, role registry / role matrix when multi-role, token placement, capture paths, session refresh strategy).

---

## Guardrails

Do not:

- invent paths;
- invent aliases;
- invent commands;
- duplicate existing entries;
- update project map for one-off implementation details;
- document experimental structure as stable convention;
- conflict with core/project boundary;
- add project-specific details to generic framework sections unless intended.

---

## Output Format

### Change Summary

- reason for project map update:
- sections updated:
- new or changed entries:

### Consistency Check

- files exist:
- aliases match:
- commands match:
- rules/skills match:
- no duplicates found:

### Follow-up

- additional updates needed:
- verification command:

---

## Done Criteria

This skill is complete when:

- project map reflects the accepted convention;
- no duplicate or conflicting entries were introduced;
- affected commands, aliases, and paths are consistent;
- update is minimal;
- agents can use the project map without guessing.

---

## Main Principle

Project map prevents architecture guessing.

Update it only when a real convention changes.